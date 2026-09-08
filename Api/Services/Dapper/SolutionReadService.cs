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
    public async Task<IReadOnlyList<SolutionListItemDto>> ListAsync(string culture)
    {
        var rows = await db.QueryAsync<SolutionRow>(
            """
            SELECT e.Slug, e.IconName, e.IsNew,
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
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        return rows.Select(r => new SolutionListItemDto
        {
            Slug = r.Slug,
            IconName = r.IconName,
            IsNew = r.IsNew,
            Name = r.Name,
            MenuNote = r.MenuNote,
            Summary = r.Summary,
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();
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
        string Slug, string? IconName, bool IsNew,
        string? Name, string? MenuNote, string? Summary, bool HasRequestedCulture);

    private sealed record SolutionDetailRow(
        int Id, string Slug, string? IconName, bool IsNew,
        string? Name, string? Summary, string? ChallengeTitle, string? ChallengeBody, string? Description,
        string? SeoTitle, string? SeoDescription, string? SeoKeywords);

    private sealed record CategoryChip(
        string Slug, byte Type, string? AccentColorHex, string? IconName,
        string? Name, string? ShortName, bool HasRequestedCulture);
}
