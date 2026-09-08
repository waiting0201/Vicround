using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface INavigationReadService
{
    Task<IReadOnlyList<NavigationGroupDto>> ListAsync(string culture, string? location);
}

/// <summary>
/// 導覽（database.md §10）。站內連結存的是 <c>Ref*Id</c> 而非硬編 URL，
/// 因此<b>路徑在這一層解析</b>——實體改 slug 時導覽自動跟著改，
/// 不會出現「選單指向已被 301 的舊路徑」。
/// </summary>
public sealed class NavigationReadService(IDbConnection db) : INavigationReadService
{
    public async Task<IReadOnlyList<NavigationGroupDto>> ListAsync(string culture, string? location)
    {
        var locationValue = ParseLocation(location);

        var rows = (await db.QueryAsync<NavRow>(
            $"""
             SELECT e.Id, e.ParentId, e.Location, e.LinkType, e.Url, e.IconName, e.OpenInNewTab,
                    p.Slug AS PageSlug, c.Slug AS CategorySlug, s.Slug AS SolutionSlug,
                    pr.Slug AS ProductSlug, prc.Slug AS ProductCategorySlug,
                    a.Slug AS ArticleSlug, a.Type AS ArticleType, d.Slug AS DownloadSlug,
                    {Sql.Coalesce("Label")}, {Sql.Coalesce("Note")},
                    {Sql.Coalesce("MenuTitle")}, {Sql.Coalesce("AriaLabel")},
                    {Sql.HasCulture}
             FROM NavigationItems e
             LEFT JOIN Pages p ON p.Id = e.RefPageId AND p.Status = @Published
             LEFT JOIN Categories c ON c.Id = e.RefCategoryId AND c.Status = @Published
             LEFT JOIN Solutions s ON s.Id = e.RefSolutionId AND s.Status = @Published
             LEFT JOIN Products pr ON pr.Id = e.RefProductId AND pr.Status = @Published
             LEFT JOIN Categories prc ON prc.Id = pr.CategoryId
             LEFT JOIN Articles a ON a.Id = e.RefArticleId AND a.Status = @Published
             LEFT JOIN Downloads d ON d.Id = e.RefDownloadId AND d.Status = @Published
             {Sql.TranslationJoin("NavigationItemTranslations", "NavigationItemId")}
             WHERE e.Status = @Published AND (@Location IS NULL OR e.Location = @Location)
             ORDER BY e.Location, e.SortOrder, e.Id
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, Location = locationValue }))
            .ToList();

        var childrenByParent = rows.Where(r => r.ParentId is not null).ToLookup(r => r.ParentId!.Value);

        return rows
            .Where(r => r.ParentId is null)
            .GroupBy(r => r.Location)
            .Select(g => new NavigationGroupDto(
                ContentReaders.Camel(((NavigationLocation)g.Key).ToString()),
                g.Select(r => ToNode(r, childrenByParent)).ToList()))
            .ToList();
    }

    private static NavigationNodeDto ToNode(NavRow row, ILookup<int, NavRow> childrenByParent)
    {
        var linkType = (LinkTargetType)row.LinkType;
        var path = ResolvePath(row, linkType);

        return new NavigationNodeDto
        {
            LinkType = ContentReaders.Camel(linkType.ToString()),
            Path = path,
            IsExternal = linkType == LinkTargetType.External,
            OpenInNewTab = row.OpenInNewTab,
            IconName = row.IconName,
            Label = row.Label,
            Note = row.Note,
            MenuTitle = row.MenuTitle,
            AriaLabel = row.AriaLabel,
            HasRequestedCulture = row.HasRequestedCulture,
            Children = childrenByParent[row.Id].Select(c => ToNode(c, childrenByParent)).ToList(),
        };
    }

    /// <summary>
    /// <c>Ref*</c> 指向的實體若已下架，這裡的 JOIN 會落空、<c>Path</c> 回 <c>null</c>——
    /// 前台據此不渲染該項，而不是連到一個 404。
    /// </summary>
    private static string? ResolvePath(NavRow row, LinkTargetType linkType)
    {
        if (linkType is LinkTargetType.External or LinkTargetType.Anchor or LinkTargetType.Internal)
        {
            return row.Url;
        }

        if (linkType == LinkTargetType.ContactModal)
        {
            return null;
        }

        return row switch
        {
            { PageSlug: { } page } => PublicPaths.Page(page),
            { CategorySlug: { } category } => PublicPaths.Category(category),
            { SolutionSlug: { } solution } => PublicPaths.Solution(solution),
            { ProductSlug: { } product, ProductCategorySlug: { } category } => PublicPaths.Product(category, product),
            { ArticleSlug: { } article, ArticleType: { } type } => PublicPaths.Article((ArticleType)type, article),
            { DownloadSlug: { } download } => PublicPaths.Download(download),
            _ => null,
        };
    }

    /// <summary>docs/cms-api.md 用的是 kebab-case；enum 名稱也一併接受。</summary>
    private static byte? ParseLocation(string? location) => location switch
    {
        null or "" => null,
        "header" => (byte)NavigationLocation.Header,
        "footer" => (byte)NavigationLocation.Footer,
        "legal" or "footer-legal" or "footerLegal" => (byte)NavigationLocation.FooterLegal,
        "social" => (byte)NavigationLocation.Social,
        "search-chip" or "searchChip" => (byte)NavigationLocation.SearchChip,
        _ => throw AppException.BadRequest(ErrorCodes.ValidationFormat,
            "location 只能是 header、footer、legal、social 或 search-chip。"),
    };

    private sealed class NavRow
    {
        public int Id { get; set; }
        public int? ParentId { get; set; }
        public byte Location { get; set; }
        public byte LinkType { get; set; }
        public string? Url { get; set; }
        public string? IconName { get; set; }
        public bool OpenInNewTab { get; set; }
        public string? PageSlug { get; set; }
        public string? CategorySlug { get; set; }
        public string? SolutionSlug { get; set; }
        public string? ProductSlug { get; set; }
        public string? ProductCategorySlug { get; set; }
        public string? ArticleSlug { get; set; }
        public byte? ArticleType { get; set; }
        public string? DownloadSlug { get; set; }
        public string? Label { get; set; }
        public string? Note { get; set; }
        public string? MenuTitle { get; set; }
        public string? AriaLabel { get; set; }
        public bool HasRequestedCulture { get; set; }
    }
}
