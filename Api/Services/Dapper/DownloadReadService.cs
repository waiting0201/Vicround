using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface IDownloadReadService
{
    Task<IReadOnlyList<DownloadDto>> ListAsync(
        string culture, string? kind, string? productSlug, string? categorySlug, string? solutionSlug);
}

/// <summary>
/// 下載中心（database.md §06）。
/// <para>
/// <b>公開端永不回 <c>MemberOnly</c> 檔案的真實網址</b>——那些檔案存在 private container，
/// 只能透過 Account API 換 10 分鐘的 SAS（docs/cms-api.md）。這條規則寫在
/// <see cref="DownloadReaders.ToDto"/> 一處，任何回傳下載的端點都走它。
/// </para>
/// </summary>
public sealed class DownloadReadService(IDbConnection db) : IDownloadReadService
{
    public Task<IReadOnlyList<DownloadDto>> ListAsync(
        string culture, string? kind, string? productSlug, string? categorySlug, string? solutionSlug) =>
        ListAsync(db, culture, ParseKind(kind), productSlug, categorySlug, solutionSlug);

    /// <summary>頁面的 <c>DownloadList</c> reference block 也要這一份（static 的理由同 SolutionReadService）。</summary>
    internal static async Task<IReadOnlyList<DownloadDto>> ListAsync(
        IDbConnection db, string culture, byte? kindValue,
        string? productSlug, string? categorySlug, string? solutionSlug)
    {
        var filters = new List<string> { DownloadReaders.Visible };

        if (kindValue is not null)
        {
            filters.Add("e.Kind = @Kind");
        }

        if (!string.IsNullOrWhiteSpace(productSlug))
        {
            filters.Add("""
                EXISTS (SELECT 1 FROM DownloadProducts x
                        INNER JOIN Products p ON p.Id = x.ProductId
                        WHERE x.DownloadId = e.Id AND p.Slug = @ProductSlug)
                """);
        }

        if (!string.IsNullOrWhiteSpace(categorySlug))
        {
            filters.Add("""
                EXISTS (SELECT 1 FROM DownloadCategories x
                        INNER JOIN Categories c ON c.Id = x.CategoryId
                        WHERE x.DownloadId = e.Id AND c.Slug = @CategorySlug)
                """);
        }

        if (!string.IsNullOrWhiteSpace(solutionSlug))
        {
            filters.Add("""
                EXISTS (SELECT 1 FROM DownloadSolutions x
                        INNER JOIN Solutions s ON s.Id = x.SolutionId
                        WHERE x.DownloadId = e.Id AND s.Slug = @SolutionSlug)
                """);
        }

        var rows = await db.QueryAsync<DownloadReaders.DownloadRow>(
            $"""
             {DownloadReaders.Select}
             WHERE {string.Join("\n  AND ", filters)}
             ORDER BY e.SortOrder, e.Id
             """,
            new
            {
                culture,
                DefaultCulture = CultureCodes.Default,
                Sql.Published,
                DownloadReaders.Today,
                Kind = kindValue,
                ProductSlug = productSlug,
                CategorySlug = categorySlug,
                SolutionSlug = solutionSlug,
            });

        return rows.Select(DownloadReaders.ToDto).ToList();
    }

    internal static byte? ParseKind(string? kind) => kind switch
    {
        null or "" => null,
        _ when Enum.TryParse<DownloadKind>(kind.Replace("-", string.Empty), ignoreCase: true, out var parsed)
            => (byte)parsed,
        _ => throw AppException.BadRequest(ErrorCodes.ValidationFormat,
            "kind 只能是 specSheet、whitePaper、catalogue、complianceDocument、certificate、testReport、trendReport 或 other。"),
    };
}

/// <summary>下載的可見性規則與 DTO 對映。證書的 PDF 也走這裡，兩處不會各寫一套。</summary>
internal static class DownloadReaders
{
    /// <summary>已發佈且未過期。<c>ValidUntil</c> 到期的文件自動不列出（§06）。</summary>
    public const string Visible = "e.Status = @Published AND (e.ValidUntil IS NULL OR e.ValidUntil >= @Today)";

    public const string Select = """
        SELECT e.Id, e.Slug, e.Kind, e.AccessLevel, e.Version, e.DocumentDate, e.ValidUntil,
               e.FileExtension, e.FileSizeBytes, e.DocumentCulture,
               CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS FileUrl,
               CASE WHEN th.IsPrivate = 1 THEN NULL ELSE th.Url END AS ThumbnailUrl,
               COALESCE(t.Title, f.Title) AS Title,
               COALESCE(t.Description, f.Description) AS Description,
               CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
        FROM Downloads e
        LEFT JOIN MediaAssets m ON m.Id = e.MediaAssetId AND m.IsArchived = 0
        LEFT JOIN MediaAssets th ON th.Id = e.ThumbnailMediaAssetId AND th.IsArchived = 0
        LEFT JOIN DownloadTranslations t ON t.DownloadId = e.Id AND t.Culture = @Culture
        LEFT JOIN DownloadTranslations f ON f.DownloadId = e.Id AND f.Culture = @DefaultCulture
        """;

    public static DateTime Today => DateTime.UtcNow.Date;

    /// <summary>
    /// <c>AccessLevel</c> 決定回什麼（docs/cms-api.md 的對照表）：
    /// <c>public</c> 才有 <c>fileUrl</c>；<c>memberOnly</c> 只回 metadata 與 <c>requiresSignIn</c>；
    /// <c>onRequest</c> 回索取用的 <c>requestUrl</c>。
    /// </summary>
    public static DownloadDto ToDto(DownloadRow r)
    {
        var access = (DownloadAccessLevel)r.AccessLevel;

        return new DownloadDto
        {
            Slug = r.Slug,
            Kind = ContentReaders.Camel(((DownloadKind)r.Kind).ToString()),
            AccessLevel = ContentReaders.Camel(access.ToString()),
            FileUrl = access == DownloadAccessLevel.Public ? r.FileUrl : null,
            RequiresSignIn = access == DownloadAccessLevel.MemberOnly,
            RequestUrl = access == DownloadAccessLevel.OnRequest ? PublicPaths.DownloadRequest(r.Slug) : null,
            Version = r.Version,
            DocumentDate = ToDateOnly(r.DocumentDate),
            ValidUntil = ToDateOnly(r.ValidUntil),
            FileExtension = r.FileExtension,
            FileSizeBytes = r.FileSizeBytes,
            DocumentCulture = r.DocumentCulture,
            ThumbnailUrl = r.ThumbnailUrl,
            Title = r.Title,
            Description = r.Description,
            HasRequestedCulture = r.HasRequestedCulture,
        };
    }

    private static DateOnly? ToDateOnly(DateTime? value) => value is null ? null : DateOnly.FromDateTime(value.Value);

    public sealed class DownloadRow
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public byte Kind { get; set; }
        public byte AccessLevel { get; set; }
        public string? Version { get; set; }
        public DateTime? DocumentDate { get; set; }
        public DateTime? ValidUntil { get; set; }
        public string FileExtension { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string? DocumentCulture { get; set; }
        public string? FileUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public bool HasRequestedCulture { get; set; }
    }
}
