using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface ISolutionReadService
{
    Task<IReadOnlyList<SolutionListItemDto>> ListAsync(string culture);
    Task<SolutionDetailDto?> GetAsync(string culture, string slug);
}

/// <summary>產業解決方案（database.md §03）。</summary>
public sealed class SolutionReadService(IDbConnection db) : ISolutionReadService
{
    public Task<IReadOnlyList<SolutionListItemDto>> ListAsync(string culture) => ListAsync(db, culture);

    /// <summary>
    /// 頁面的 <c>SolutionGrid</c> reference block 也要這一份。做成 static 是為了避開
    /// DI 循環——版塊解析器若注入本服務，而本服務又會讀版塊，容器就組不起來。
    /// </summary>
    internal static async Task<IReadOnlyList<SolutionListItemDto>> ListAsync(IDbConnection db, string culture)
    {
        var rows = (await db.QueryAsync<SolutionRow>(
            """
            SELECT e.Id, e.Slug, e.IconName, e.IsNew,
                   COALESCE(t.Name, f.Name) AS Name,
                   COALESCE(t.MenuNote, f.MenuNote) AS MenuNote,
                   COALESCE(t.Summary, f.Summary) AS Summary,
                   CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
            FROM Solutions e
            LEFT JOIN SolutionTranslations t ON t.SolutionId = e.Id AND t.Culture = @Culture
            LEFT JOIN SolutionTranslations f ON f.SolutionId = e.Id AND f.Culture = @DefaultCulture
            WHERE e.Status = @Published
            ORDER BY e.SortOrder
            """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published })).ToList();

        // 產業卡上的產品線 chip。確認稿的卡片上就有它，而它已經是 SolutionCategories 的關聯，
        // 不該在版塊裡再抄一份文字（database.md §09 的判準）。
        var chips = await CategoryChipsAsync(db, culture, rows.Select(r => r.Id).ToArray());

        return rows.Select(r => new SolutionListItemDto
        {
            Slug = r.Slug,
            IconName = r.IconName,
            IsNew = r.IsNew,
            Name = r.Name,
            MenuNote = r.MenuNote,
            Summary = r.Summary,
            Categories = chips[r.Id].ToList(),
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();
    }

    private static async Task<ILookup<int, ChipDto>> CategoryChipsAsync(
        IDbConnection db, string culture, int[] solutionIds)
    {
        if (solutionIds.Length == 0)
        {
            return Array.Empty<(int, ChipDto)>().ToLookup(x => x.Item1, x => x.Item2);
        }

        var rows = await db.QueryAsync<SolutionCategoryChip>(
            """
            SELECT sc.SolutionId, c.Slug, COALESCE(t.Name, f.Name) AS Name
            FROM SolutionCategories sc
            INNER JOIN Categories c ON c.Id = sc.CategoryId AND c.Status = @Published
            LEFT JOIN CategoryTranslations t ON t.CategoryId = c.Id AND t.Culture = @Culture
            LEFT JOIN CategoryTranslations f ON f.CategoryId = c.Id AND f.Culture = @DefaultCulture
            WHERE sc.SolutionId IN @Ids
            ORDER BY sc.SortOrder
            """,
            new { Ids = solutionIds, culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        return rows.ToLookup(r => r.SolutionId, r => new ChipDto(r.Slug, r.Name, PublicPaths.Category(r.Slug)));
    }

    public async Task<SolutionDetailDto?> GetAsync(string culture, string slug)
    {
        var row = await db.QuerySingleOrDefaultAsync<SolutionDetailRow>(
            """
            SELECT e.Id, e.Slug, e.IconName, e.IsNew,
                   t.Name, t.Summary, t.ChallengeTitle, t.ChallengeBody, t.Description,
                   t.SeoTitle, t.SeoDescription, t.SeoKeywords
            FROM Solutions e
            INNER JOIN SolutionTranslations t ON t.SolutionId = e.Id AND t.Culture = @Culture
            WHERE e.Slug = @Slug AND e.Status = @Published
            """,
            new { culture, Slug = slug, Sql.Published });

        if (row is null)
        {
            return null;
        }

        var categories = await db.QueryAsync<CategoryChip>(
            """
            SELECT c.Slug, c.Type, c.AccentColorHex, c.IconName,
                   COALESCE(t.Name, f.Name) AS Name,
                   COALESCE(t.ShortName, f.ShortName) AS ShortName,
                   CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
            FROM SolutionCategories sc
            INNER JOIN Categories c ON c.Id = sc.CategoryId AND c.Status = @Published
            LEFT JOIN CategoryTranslations t ON t.CategoryId = c.Id AND t.Culture = @Culture
            LEFT JOIN CategoryTranslations f ON f.CategoryId = c.Id AND f.Culture = @DefaultCulture
            WHERE sc.SolutionId = @Id
            ORDER BY sc.SortOrder
            """,
            new { row.Id, culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        return new SolutionDetailDto
        {
            Slug = row.Slug,
            IconName = row.IconName,
            IsNew = row.IsNew,
            Name = row.Name,
            Summary = row.Summary,
            ChallengeTitle = row.ChallengeTitle,
            ChallengeBody = row.ChallengeBody,
            Description = row.Description,
            Seo = new SeoDto(row.SeoTitle, row.SeoDescription, row.SeoKeywords),
            Specifications = await ContentReaders.SpecificationsAsync(db, "OwnerSolutionId", row.Id, culture),
            Blocks = await ContentReaders.BlocksAsync(db, "OwnerSolutionId", row.Id, culture),
            Categories = categories.Select(c => new CategoryListItemDto
            {
                Slug = c.Slug,
                Type = ContentReaders.Camel(((CategoryType)c.Type).ToString()),
                AccentColorHex = c.AccentColorHex,
                IconName = c.IconName,
                Name = c.Name,
                ShortName = c.ShortName,
                HasRequestedCulture = c.HasRequestedCulture,
            }).ToList(),
        };
    }

    private sealed record SolutionRow(
        int Id, string Slug, string? IconName, bool IsNew,
        string? Name, string? MenuNote, string? Summary, bool HasRequestedCulture);

    private sealed record SolutionCategoryChip(int SolutionId, string Slug, string? Name);

    private sealed record SolutionDetailRow(
        int Id, string Slug, string? IconName, bool IsNew,
        string? Name, string? Summary, string? ChallengeTitle, string? ChallengeBody, string? Description,
        string? SeoTitle, string? SeoDescription, string? SeoKeywords);

    private sealed record CategoryChip(
        string Slug, byte Type, string? AccentColorHex, string? IconName,
        string? Name, string? ShortName, bool HasRequestedCulture);
}
