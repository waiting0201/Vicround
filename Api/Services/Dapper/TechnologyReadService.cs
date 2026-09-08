using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface ITechnologyReadService
{
    Task<TechnologiesDto> GetAsync(string culture, string? kind);
}

/// <summary>
/// Technologies 頁（database.md §04）。製程與法規符合表<b>一次帶出</b>——
/// 兩者在同一頁渲染，分兩支端點只會讓 SSR 多跑一趟。
/// </summary>
public sealed class TechnologyReadService(IDbConnection db) : ITechnologyReadService
{
    public async Task<TechnologiesDto> GetAsync(string culture, string? kind)
    {
        var kindValue = ParseKind(kind);

        var args = new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, Kind = kindValue };

        var flows = (await db.QueryAsync<FlowRow>(
            $"""
             SELECT e.Id, e.Slug, e.Kind, c.Slug AS CategorySlug,
                    {Sql.Coalesce("Title")}, {Sql.Coalesce("Subtitle")}, {Sql.Coalesce("Intro")},
                    {Sql.HasCulture}
             FROM ProcessFlows e
             LEFT JOIN Categories c ON c.Id = e.OwnerCategoryId
             {Sql.TranslationJoin("ProcessFlowTranslations", "ProcessFlowId")}
             WHERE e.Status = @Published AND (@Kind IS NULL OR e.Kind = @Kind)
             ORDER BY e.Kind, e.SortOrder, e.Id
             """, args)).ToList();

        var steps = flows.Count == 0
            ? Array.Empty<StepRow>().ToLookup(s => s.ProcessFlowId)
            : (await db.QueryAsync<StepRow>(
                $"""
                 SELECT e.ProcessFlowId, e.StepNumber, e.IconName, e.AccentColorHex,
                        CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS ImageUrl,
                        {Sql.Coalesce("Title")}, {Sql.Coalesce("Body")}
                 FROM ProcessSteps e
                 LEFT JOIN MediaAssets m ON m.Id = e.MediaAssetId AND m.IsArchived = 0
                 {Sql.TranslationJoin("ProcessStepTranslations", "ProcessStepId")}
                 WHERE e.Status = @Published AND e.ProcessFlowId IN @FlowIds
                 ORDER BY e.ProcessFlowId, e.StepNumber, e.SortOrder
                 """,
                new
                {
                    culture,
                    DefaultCulture = CultureCodes.Default,
                    Sql.Published,
                    FlowIds = flows.Select(f => f.Id).ToArray(),
                })).ToLookup(s => s.ProcessFlowId);

        return new TechnologiesDto
        {
            ProcessFlows = flows.Select(f => new ProcessFlowDto
            {
                Slug = f.Slug,
                Kind = ContentReaders.Camel(((ProcessFlowKind)f.Kind).ToString()),
                CategorySlug = f.CategorySlug,
                Title = f.Title,
                Subtitle = f.Subtitle,
                Intro = f.Intro,
                HasRequestedCulture = f.HasRequestedCulture,
                Steps = steps[f.Id].Select(s => new ProcessStepDto
                {
                    StepNumber = s.StepNumber,
                    IconName = s.IconName,
                    AccentColorHex = s.AccentColorHex,
                    ImageUrl = s.ImageUrl,
                    Title = s.Title,
                    Body = s.Body,
                }).ToList(),
            }).ToList(),
            Compliance = await CertificationReadService.ListAsync(
                db, culture, (byte)CertificationCategory.ProductCompliance),
        };
    }

    private static byte? ParseKind(string? kind) => kind switch
    {
        null or "" => null,
        _ when Enum.TryParse<ProcessFlowKind>(kind.Replace("-", string.Empty), ignoreCase: true, out var parsed)
            => (byte)parsed,
        _ => throw AppException.BadRequest(ErrorCodes.ValidationFormat,
            "kind 只能是 coreProcess、manufacturing、coDevelopment、oemOdm 或 inquiryFlow。"),
    };

    private sealed class FlowRow
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public byte Kind { get; set; }
        public string? CategorySlug { get; set; }
        public string? Title { get; set; }
        public string? Subtitle { get; set; }
        public string? Intro { get; set; }
        public bool HasRequestedCulture { get; set; }
    }

    private sealed class StepRow
    {
        public int ProcessFlowId { get; set; }
        public byte StepNumber { get; set; }
        public string? IconName { get; set; }
        public string? AccentColorHex { get; set; }
        public string? ImageUrl { get; set; }
        public string? Title { get; set; }
        public string? Body { get; set; }
    }
}
