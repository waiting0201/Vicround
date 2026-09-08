
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §02。產品線與其子分類；<c>Application</c> 值已移除（收斂為 Solutions，見 §03）。
/// URL：<c>/{locale}/products/{slug}</c>。
/// </summary>
public class Category : SluggedEntity, IRoutable
{
    /// <summary>產品線為 <c>null</c>；子分類指向產品線。</summary>
    public int? ParentId { get; set; }
    public Category? Parent { get; set; }

    public CategoryType Type { get; set; }

    /// <summary>CIS 手冊 p.8 的產品色：#71d6e0 / #e7004b / #cfcfcd。</summary>
    public string AccentColorHex { get; set; } = string.Empty;
    public string? IconName { get; set; }

    public int? HeroMediaAssetId { get; set; }
    public MediaAsset? HeroMediaAsset { get; set; }

    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<CategoryTranslation> Translations { get; set; } = new List<CategoryTranslation>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class CategoryTranslation : SeoTranslation
{
    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>選單用短名。</summary>
    public string? ShortName { get; set; }

    /// <summary>mega menu 的一行說明。</summary>
    public string? MenuNote { get; set; }
    public string? Summary { get; set; }

    /// <summary>產品線頁開場。</summary>
    public string? Intro { get; set; }
    public string? Description { get; set; }
}
