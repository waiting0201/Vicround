
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §02。同時支援 mockup 的 family 卡片（AG、VR-AC 110）與舊站的細分型號（AG16、AG34）：
/// 卡片查詢＝<c>ParentProductId IS NULL</c>。URL：<c>/{locale}/products/{category}/{slug}</c>。
/// </summary>
public class Product : SluggedEntity, IRoutable
{
    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    /// <summary>型號掛在 family 之下。</summary>
    public int? ParentProductId { get; set; }
    public Product? ParentProduct { get; set; }

    /// <summary>卡片短碼：<c>AG</c> / <c>VR-AC 360-A</c>。</summary>
    public string? Code { get; set; }

    /// <summary>如 <c>FlexCore™</c>。</summary>
    public string? Brand { get; set; }

    public bool IsFeatured { get; set; }

    /// <summary>卡片的 "New" badge。</summary>
    public bool IsNew { get; set; }

    public int? HeroMediaAssetId { get; set; }
    public MediaAsset? HeroMediaAsset { get; set; }

    /// <summary>舊站匯入的冪等鍵，如 <c>weebly:page:1234</c>。</summary>
    public string? LegacySourceKey { get; set; }

    public ICollection<Product> Variants { get; set; } = new List<Product>();
    public ICollection<ProductTranslation> Translations { get; set; } = new List<ProductTranslation>();
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<SpecificationRow> SpecificationRows { get; set; } = new List<SpecificationRow>();
}

public class ProductTranslation : SeoTranslation
{
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Summary { get; set; }

    /// <summary>HTML。</summary>
    public string? Description { get; set; }
    public string? ApplicationNote { get; set; }
}

/// <summary>產品圖庫（join）。</summary>
public class ProductImage
{
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public int SortOrder { get; set; }
}
