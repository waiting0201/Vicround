
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §10。Header／Footer／社群／Header 的 Frequent searches chip 共用一張表。
/// 站內連結一律用 <c>Ref*Id</c> 而非硬編 URL——實體改 slug 時導覽自動跟著改，
/// 不會出現「導覽指向已被 301 的舊路徑」。
/// </summary>
public class NavigationItem : ContentEntity
{
    public int? ParentId { get; set; }
    public NavigationItem? Parent { get; set; }

    public NavigationLocation Location { get; set; }
    public LinkTargetType LinkType { get; set; }

    /// <summary>只有 External / Anchor 使用。</summary>
    public string? Url { get; set; }

    public int? RefPageId { get; set; }
    public Page? RefPage { get; set; }
    public int? RefCategoryId { get; set; }
    public Category? RefCategory { get; set; }
    public int? RefProductId { get; set; }
    public Product? RefProduct { get; set; }
    public int? RefSolutionId { get; set; }
    public Solution? RefSolution { get; set; }
    public int? RefArticleId { get; set; }
    public Article? RefArticle { get; set; }
    public int? RefDownloadId { get; set; }
    public Download? RefDownload { get; set; }

    /// <summary>Footer 社群 icon。</summary>
    public string? IconName { get; set; }
    public bool OpenInNewTab { get; set; }

    public ICollection<NavigationItem> Children { get; set; } = new List<NavigationItem>();
    public ICollection<NavigationItemTranslation> Translations { get; set; } = new List<NavigationItemTranslation>();
}

public class NavigationItemTranslation : Translation
{
    public int NavigationItemId { get; set; }
    public NavigationItem? NavigationItem { get; set; }

    public string Label { get; set; } = string.Empty;

    /// <summary>mega menu 子項的 <c>Eight coated surface families</c>。</summary>
    public string? Note { get; set; }

    /// <summary>mega menu 面板標題 <c>Products — what we make</c>。</summary>
    public string? MenuTitle { get; set; }

    public string? AriaLabel { get; set; }
}
