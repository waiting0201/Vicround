using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface IFaqReadService
{
    Task<IReadOnlyList<FaqCategoryDto>> ListAsync(string culture, string? categorySlug);
}

/// <summary>
/// FAQ（database.md §05）。回的是「分類 + 其下題目」的巢狀結構——前台的分類軌與
/// <c>FAQPage</c> JSON-LD 都要整份，拆成兩支端點只會讓 SSR 多跑一趟。
/// </summary>
public sealed class FaqReadService(IDbConnection db) : IFaqReadService
{
    public Task<IReadOnlyList<FaqCategoryDto>> ListAsync(string culture, string? categorySlug) =>
        ListAsync(db, culture, categorySlug);

    /// <summary>頁面的 <c>FaqList</c> reference block 也要這一份（static 的理由同 SolutionReadService）。</summary>
    internal static async Task<IReadOnlyList<FaqCategoryDto>> ListAsync(
        IDbConnection db, string culture, string? categorySlug)
    {
        var args = new
        {
            culture,
            DefaultCulture = CultureCodes.Default,
            Sql.Published,
            CategorySlug = string.IsNullOrWhiteSpace(categorySlug) ? null : categorySlug,
        };

        var categories = (await db.QueryAsync<FaqCategoryRow>(
            $"""
             SELECT e.Id, e.Slug, {Sql.Coalesce("Name")}, {Sql.Coalesce("Description")}, {Sql.HasCulture}
             FROM FaqCategories e
             {Sql.TranslationJoin("FaqCategoryTranslations", "FaqCategoryId")}
             WHERE e.Status = @Published AND (@CategorySlug IS NULL OR e.Slug = @CategorySlug)
             ORDER BY e.SortOrder, e.Id
             """, args)).ToList();

        if (categories.Count == 0)
        {
            return [];
        }

        // 每題的延伸連結存成 Ref*Id 而非裸 URL，目標實體改 slug 時連結自動跟著走（§05）。
        var items = (await db.QueryAsync<FaqItemRow>(
            $"""
             SELECT e.Id, e.FaqCategoryId, e.Slug, e.IsFeatured, e.ExternalUrl,
                    p.Slug AS PageSlug, c.Slug AS CategorySlug, s.Slug AS SolutionSlug,
                    pr.Slug AS ProductSlug, prc.Slug AS ProductCategorySlug, d.Slug AS DownloadSlug,
                    {Sql.Coalesce("Question")}, {Sql.Coalesce("Answer")}, {Sql.Coalesce("LinkLabel")},
                    {Sql.HasCulture}
             FROM FaqItems e
             INNER JOIN FaqCategories fc ON fc.Id = e.FaqCategoryId AND fc.Status = @Published
             LEFT JOIN Pages p ON p.Id = e.RefPageId AND p.Status = @Published
             LEFT JOIN Categories c ON c.Id = e.RefCategoryId AND c.Status = @Published
             LEFT JOIN Solutions s ON s.Id = e.RefSolutionId AND s.Status = @Published
             LEFT JOIN Products pr ON pr.Id = e.RefProductId AND pr.Status = @Published
             LEFT JOIN Categories prc ON prc.Id = pr.CategoryId
             LEFT JOIN Downloads d ON d.Id = e.RefDownloadId AND d.Status = @Published
             {Sql.TranslationJoin("FaqItemTranslations", "FaqItemId")}
             WHERE e.Status = @Published AND (@CategorySlug IS NULL OR fc.Slug = @CategorySlug)
             ORDER BY e.SortOrder, e.Id
             """, args)).ToLookup(i => i.FaqCategoryId);

        return categories.Select(c => new FaqCategoryDto
        {
            Slug = c.Slug,
            Name = c.Name,
            Description = c.Description,
            HasRequestedCulture = c.HasRequestedCulture,
            Items = items[c.Id].Select(i => new FaqItemDto
            {
                Slug = i.Slug,
                CategorySlug = c.Slug,
                IsFeatured = i.IsFeatured,
                Question = i.Question,
                Answer = i.Answer,
                LinkLabel = i.LinkLabel,
                LinkPath = ResolveLink(i),
                HasRequestedCulture = i.HasRequestedCulture,
            }).ToList(),
        }).ToList();
    }

    private static string? ResolveLink(FaqItemRow row) => row switch
    {
        { PageSlug: { } page } => PublicPaths.Page(page),
        { CategorySlug: { } category } => PublicPaths.Category(category),
        { SolutionSlug: { } solution } => PublicPaths.Solution(solution),
        { ProductSlug: { } product, ProductCategorySlug: { } category } => PublicPaths.Product(category, product),
        { DownloadSlug: { } download } => PublicPaths.Download(download),
        _ => row.ExternalUrl,
    };

    private sealed class FaqCategoryRow
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool HasRequestedCulture { get; set; }
    }

    private sealed class FaqItemRow
    {
        public int Id { get; set; }
        public int FaqCategoryId { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsFeatured { get; set; }
        public string? ExternalUrl { get; set; }
        public string? PageSlug { get; set; }
        public string? CategorySlug { get; set; }
        public string? SolutionSlug { get; set; }
        public string? ProductSlug { get; set; }
        public string? ProductCategorySlug { get; set; }
        public string? DownloadSlug { get; set; }
        public string? Question { get; set; }
        public string? Answer { get; set; }
        public string? LinkLabel { get; set; }
        public bool HasRequestedCulture { get; set; }
    }
}
