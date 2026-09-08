using VicRound.Domain.Common;
using VicRound.Domain.Solutions;

namespace VicRound.Domain.Catalog;

/// <summary>
/// database.md §02。mockup 三處同形的規格表（產品線 Common specifications、產品卡片亮點、
/// Solution 頁 Key specifications）共用一張表，以 <b>owner triple</b> 表達（§0.6）：
/// 三個 nullable FK 恰一非 NULL，每個 owner 一條 filtered index。
/// </summary>
public class SpecificationRow : ContentEntity
{
    public int? OwnerProductId { get; set; }
    public Product? OwnerProduct { get; set; }

    public int? OwnerCategoryId { get; set; }
    public Category? OwnerCategory { get; set; }

    public int? OwnerSolutionId { get; set; }
    public Solution? OwnerSolution { get; set; }

    /// <summary>產品卡片的亮點 chip。</summary>
    public bool IsHighlighted { get; set; }

    public ICollection<SpecificationRowTranslation> Translations { get; set; } = new List<SpecificationRowTranslation>();
}

/// <summary>Embedded 實體的翻譯，<b>無 SEO 欄位</b>。</summary>
public class SpecificationRowTranslation : Translation
{
    public int SpecificationRowId { get; set; }
    public SpecificationRow? SpecificationRow { get; set; }

    /// <summary>Property。</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Typical value。</summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>Method / note。</summary>
    public string? Note { get; set; }
}
