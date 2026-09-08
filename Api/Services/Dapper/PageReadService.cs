using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface IPageReadService
{
    Task<PageDetailDto?> GetAsync(string culture, string slug);
    Task<IReadOnlyList<SitemapEntryDto>> SitemapAsync();
}

/// <summary>敘事型頁面與 sitemap（database.md §09、§10）。</summary>
public sealed class PageReadService(IDbConnection db) : IPageReadService
{
    public async Task<PageDetailDto?> GetAsync(string culture, string slug)
    {
        var row = await db.QuerySingleOrDefaultAsync<PageRow>(
            """
            SELECT e.Id, e.Slug, e.Template, e.PathPrefix, p.Slug AS ParentSlug,
                   CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS BannerImageUrl,
                   t.Title, t.Eyebrow, t.Subtitle, t.BannerTitle, t.BannerDescription,
                   t.CtaEyebrow, t.CtaHeadline, t.CtaSubcopy, t.Body, t.LastReviewedLabel,
                   t.SeoTitle, t.SeoDescription, t.SeoKeywords
            FROM Pages e
            LEFT JOIN Pages p ON p.Id = e.ParentPageId
            LEFT JOIN MediaAssets m ON m.Id = e.HeroMediaAssetId AND m.IsArchived = 0
            INNER JOIN PageTranslations t ON t.PageId = e.Id AND t.Culture = @Culture
            WHERE e.Slug = @Slug AND e.Status = @Published
            """,
            new { culture, Slug = slug, Sql.Published });

        return row is null ? null : new PageDetailDto
        {
            Slug = row.Slug,
            Path = PublicPaths.Page(row.Slug, row.PathPrefix),
            BannerImageUrl = row.BannerImageUrl,
            Template = ContentReaders.Camel(((PageTemplate)row.Template).ToString()),
            ParentSlug = row.ParentSlug,
            Title = row.Title,
            Eyebrow = row.Eyebrow,
            Subtitle = row.Subtitle,
            BannerTitle = row.BannerTitle,
            BannerDescription = row.BannerDescription,
            CtaEyebrow = row.CtaEyebrow,
            CtaHeadline = row.CtaHeadline,
            CtaSubcopy = row.CtaSubcopy,
            Body = row.Body,
            LastReviewedLabel = row.LastReviewedLabel,
            Seo = new SeoDto(row.SeoTitle, row.SeoDescription, row.SeoKeywords),
            Blocks = await ContentReaders.BlocksAsync(db, "OwnerPageId", row.Id, culture),
        };
    }

    /// <summary>
    /// sitemap 的資料來源。**只收 Routable 實體**——Addressable（認證、FAQ、展會）只有錨點，
    /// 沒有自己的網址，不進 sitemap（database.md §0.1）。
    /// <para>
    /// 每一列附上「真的有翻譯的語系」，前台據此決定 hreflang 要宣告哪幾個——
    /// 沒有翻譯的語系不該出現在 sitemap 的 alternate 裡。
    /// </para>
    /// </summary>
    public async Task<IReadOnlyList<SitemapEntryDto>> SitemapAsync()
    {
        const string Query = """
            SELECT COALESCE('/' + e.PathPrefix, '') + '/' + e.Slug AS Path, e.UpdatedAt, t.Culture
            FROM Pages e INNER JOIN PageTranslations t ON t.PageId = e.Id
            WHERE e.Status = @Published AND e.Slug <> 'home'
            UNION ALL
            SELECT '/products/' + e.Slug, e.UpdatedAt, t.Culture
            FROM Categories e INNER JOIN CategoryTranslations t ON t.CategoryId = e.Id
            WHERE e.Status = @Published
            UNION ALL
            SELECT '/products/' + c.Slug + '/' + e.Slug, e.UpdatedAt, t.Culture
            FROM Products e
            INNER JOIN Categories c ON c.Id = e.CategoryId
            INNER JOIN ProductTranslations t ON t.ProductId = e.Id
            WHERE e.Status = @Published AND e.ParentProductId IS NULL
            UNION ALL
            SELECT '/solutions/' + e.Slug, e.UpdatedAt, t.Culture
            FROM Solutions e INNER JOIN SolutionTranslations t ON t.SolutionId = e.Id
            WHERE e.Status = @Published
            UNION ALL
            SELECT CASE e.Type
                     WHEN 5 THEN '/insights/' WHEN 6 THEN '/blog/' ELSE '/news/' END + e.Slug,
                   e.UpdatedAt, t.Culture
            FROM Articles e INNER JOIN ArticleTranslations t ON t.ArticleId = e.Id
            WHERE e.Status = @Published AND e.PublishedAt <= SYSUTCDATETIME()
            """;

        var rows = await db.QueryAsync<SitemapRow>(Query, new { Sql.Published });

        // 首頁不是由 Pages.Slug 組出來的（它就是 /），另外補一列。
        return rows
            .GroupBy(r => r.Path)
            .Select(g => new SitemapEntryDto(
                g.Key,
                g.Max(r => r.UpdatedAt),
                g.Select(r => r.Culture).Distinct().OrderBy(c => c).ToArray()))
            .Prepend(new SitemapEntryDto("/", DateTime.UtcNow, CultureCodes.All))
            .OrderBy(e => e.Path, StringComparer.Ordinal)
            .ToList();
    }

    private sealed record SitemapRow(string Path, DateTime UpdatedAt, string Culture);

    private sealed record PageRow(
        int Id, string Slug, byte Template, string? PathPrefix, string? ParentSlug, string? BannerImageUrl,
        string? Title, string? Eyebrow, string? Subtitle, string? BannerTitle, string? BannerDescription,
        string? CtaEyebrow, string? CtaHeadline, string? CtaSubcopy, string? Body, string? LastReviewedLabel,
        string? SeoTitle, string? SeoDescription, string? SeoKeywords);
}
