using VicRound.Domain.Catalog;
using VicRound.Domain.Common;
using VicRound.Domain.Downloads;
using VicRound.Domain.Media;
using VicRound.Domain.Resources;
using VicRound.Domain.Solutions;

namespace VicRound.Domain.Pages;

/// <summary>
/// database.md §09。兩種 block：<b>Content block</b>（自帶文字，資料在 <see cref="ContentBlockItem"/>）
/// 與 <b>Reference block</b>（只帶查詢參數，資料來自強型別表，<see cref="BlockType"/> ≥ 100）。
/// Owner triple 同 §0.6：三個 Owner 恰一非 NULL。
/// </summary>
public class ContentBlock : ContentEntity
{
    public BlockType BlockType { get; set; }

    public int? OwnerPageId { get; set; }
    public Page? OwnerPage { get; set; }

    public int? OwnerSolutionId { get; set; }
    public Solution? OwnerSolution { get; set; }

    public int? OwnerCategoryId { get; set; }
    public Category? OwnerCategory { get; set; }

    /// <summary><c>core-processes</c> / <c>esg</c>；在同一 owner 內唯一。</summary>
    public string? Anchor { get; set; }

    /// <summary>mockup 的深淺交錯。</summary>
    public BlockTone Tone { get; set; } = BlockTone.Light;

    /// <summary>
    /// <b>僅 Reference block 使用</b>，存查詢參數。這是全庫唯一允許的 JSON 欄位，
    /// 且必須 culture-neutral、不得含任何本地化文字。
    /// </summary>
    public string? SettingsJson { get; set; }

    public int? MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public ICollection<ContentBlockTranslation> Translations { get; set; } = new List<ContentBlockTranslation>();
    public ICollection<ContentBlockItem> Items { get; set; } = new List<ContentBlockItem>();
}

public class ContentBlockTranslation : Translation
{
    public int ContentBlockId { get; set; }
    public ContentBlock? ContentBlock { get; set; }

    public string? Eyebrow { get; set; }
    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Body { get; set; }
    public string? CtaLabel { get; set; }
    public string? FootNote { get; set; }
}

/// <summary>Content block 的子項（feature 卡、step、stat…）。</summary>
public class ContentBlockItem : IHasTimestamps
{
    public int Id { get; set; }

    public int ContentBlockId { get; set; }
    public ContentBlock? ContentBlock { get; set; }

    public int SortOrder { get; set; }

    public int? MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public string? IconName { get; set; }
    public string? AccentColorHex { get; set; }
    public string? Badge { get; set; }

    public LinkTargetType LinkType { get; set; } = LinkTargetType.Internal;
    public string? LinkUrl { get; set; }

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
    public int? RefPageId { get; set; }
    public Page? RefPage { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public ICollection<ContentBlockItemTranslation> Translations { get; set; } = new List<ContentBlockItemTranslation>();
}

public class ContentBlockItemTranslation : Translation
{
    public int ContentBlockItemId { get; set; }
    public ContentBlockItem? ContentBlockItem { get; set; }

    public string? Title { get; set; }
    public string? Subtitle { get; set; }
    public string? Body { get; set; }
    public string? LinkLabel { get; set; }

    /// <summary>StatBand 的 <c>± 0.05 mm</c>。</summary>
    public string? Value { get; set; }
}
