using VicRound.Domain.Catalog;
using VicRound.Domain.Common;
using VicRound.Domain.Downloads;
using VicRound.Domain.Pages;
using VicRound.Domain.Solutions;

namespace VicRound.Domain.Resources;

/// <summary>database.md §05。FAQ 需輸出 <c>FAQPage</c> JSON-LD，故必須強型別。</summary>
public class FaqCategory : SluggedEntity
{
    public ICollection<FaqCategoryTranslation> Translations { get; set; } = new List<FaqCategoryTranslation>();
    public ICollection<FaqItem> Items { get; set; } = new List<FaqItem>();
}

public class FaqCategoryTranslation : Translation
{
    public int FaqCategoryId { get; set; }
    public FaqCategory? FaqCategory { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

/// <summary>
/// Addressable：Slug 供 <c>#faq-anti-glare-vs-ar</c> 錨點。每題底部的延伸連結用 nullable FK
/// 而非裸 URL，目標實體改 slug 時連結自動跟著走。
/// </summary>
public class FaqItem : SluggedEntity
{
    public int FaqCategoryId { get; set; }
    public FaqCategory? FaqCategory { get; set; }

    public int? RefProductId { get; set; }
    public Product? RefProduct { get; set; }

    public int? RefCategoryId { get; set; }
    public Category? RefCategory { get; set; }

    public int? RefSolutionId { get; set; }
    public Solution? RefSolution { get; set; }

    public int? RefPageId { get; set; }
    public Page? RefPage { get; set; }

    public int? RefDownloadId { get; set; }
    public Download? RefDownload { get; set; }

    /// <summary>外部連結（沒有對應站內實體時）。</summary>
    public string? ExternalUrl { get; set; }

    /// <summary>Resources hub 只顯示前幾題。</summary>
    public bool IsFeatured { get; set; }

    public ICollection<FaqItemTranslation> Translations { get; set; } = new List<FaqItemTranslation>();
}

public class FaqItemTranslation : Translation
{
    public int FaqItemId { get; set; }
    public FaqItem? FaqItem { get; set; }

    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? LinkLabel { get; set; }
}
