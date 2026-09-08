
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §09。所有敘事型頁面。<c>Template</c> ↔ 可用 <c>BlockType</c> 的白名單寫在程式碼的
/// <c>PageTemplateRegistry</c>，<b>不進 DB</b>——它是編輯 UI 的規則，不是資料。
/// </summary>
public class Page : SluggedEntity, IRoutable
{
    public PageTemplate Template { get; set; }

    /// <summary><c>/resources/faq</c>、sustainability → about 的層級。</summary>
    public int? ParentPageId { get; set; }
    public Page? ParentPage { get; set; }

    /// <summary>系統頁不可刪（home / privacy / contact…）。</summary>
    public bool IsSystemPage { get; set; }

    public int? HeroMediaAssetId { get; set; }
    public MediaAsset? HeroMediaAsset { get; set; }

    public string? LegacySourceKey { get; set; }

    public ICollection<Page> Children { get; set; } = new List<Page>();
    public ICollection<PageTranslation> Translations { get; set; } = new List<PageTranslation>();
    public ICollection<ContentBlock> Blocks { get; set; } = new List<ContentBlock>();
}

public class PageTranslation : SeoTranslation
{
    public int PageId { get; set; }
    public Page? Page { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Eyebrow { get; set; }
    public string? Subtitle { get; set; }

    // PageBanner 共用元件
    public string? BannerTitle { get; set; }
    public string? BannerDescription { get; set; }

    // PageCTA 共用元件
    public string? CtaEyebrow { get; set; }
    public string? CtaHeadline { get; set; }
    public string? CtaSubcopy { get; set; }

    /// <summary>privacy 這類純長文可不用 block。</summary>
    public string? Body { get; set; }

    /// <summary><c>Last updated: June 1, 2026</c>。</summary>
    public string? LastReviewedLabel { get; set; }
}
