
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §03。7 個產業解決方案，由舊的 <c>Applications</c> 收斂而來
/// （<c>/application</c> 的 301 見 §18）。URL：<c>/{locale}/solutions/{slug}</c>。
/// 頁面的「What we bring」「Why us」等敘事區塊走 ContentBlocks(OwnerSolutionId)。
/// </summary>
public class Solution : SluggedEntity, IRoutable
{
    public string? IconName { get; set; }

    /// <summary>索引卡的 "New" badge（Acoustic Solutions）。</summary>
    public bool IsNew { get; set; }

    public int? HeroMediaAssetId { get; set; }
    public MediaAsset? HeroMediaAsset { get; set; }

    public string? LegacySourceKey { get; set; }

    public ICollection<SolutionTranslation> Translations { get; set; } = new List<SolutionTranslation>();
    public ICollection<SolutionCategory> SolutionCategories { get; set; } = new List<SolutionCategory>();
    public ICollection<ProductSolution> ProductSolutions { get; set; } = new List<ProductSolution>();
    public ICollection<SpecificationRow> SpecificationRows { get; set; } = new List<SpecificationRow>();
}

public class SolutionTranslation : SeoTranslation
{
    public int SolutionId { get; set; }
    public Solution? Solution { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>mega menu 子項說明。</summary>
    public string? MenuNote { get; set; }

    /// <summary>索引卡摘要。</summary>
    public string? Summary { get; set; }

    public string? ChallengeTitle { get; set; }
    public string? ChallengeBody { get; set; }
    public string? Description { get; set; }
    public string? CtaLabel { get; set; }
}

/// <summary>索引卡的產品線 chip、Solution 頁底部的產品線連結。</summary>
public class SolutionCategory
{
    public int SolutionId { get; set; }
    public Solution? Solution { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public int SortOrder { get; set; }
}

/// <summary>產品線頁「Where it is used」、Solution 頁的關聯產品。</summary>
public class ProductSolution
{
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int SolutionId { get; set; }
    public Solution? Solution { get; set; }

    public int SortOrder { get; set; }
}
