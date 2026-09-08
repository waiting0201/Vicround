
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §07。被 4 個頁面觸發的 CertificationDialog（<c>?cert={slug}</c> 深連結）。
/// Technologies 的 Product Compliance 表<b>不另建表</b>，直接查
/// <c>Category = ProductCompliance</c>——否則 RoHS/REACH 會在兩處各存一份、內容不同步。
/// </summary>
public class Certification : SluggedEntity
{
    public CertificationCategory Category { get; set; }
    public string? CertificateNumber { get; set; }
    public DateOnly? IssuedOn { get; set; }

    /// <summary>供程式判定過期並自動隱藏。顯示用的敘述在 <c>ValidityText</c>。</summary>
    public DateOnly? ValidUntil { get; set; }

    /// <summary>mockup 的「[Pending client input]」虛線卡。</summary>
    public bool IsPlaceholder { get; set; }

    /// <summary>證書 PDF——重用 Downloads，不另建表。</summary>
    public int? DownloadId { get; set; }
    public Download? Download { get; set; }

    public int? LogoMediaAssetId { get; set; }
    public MediaAsset? LogoMediaAsset { get; set; }

    public ICollection<CertificationTranslation> Translations { get; set; } = new List<CertificationTranslation>();
    public ICollection<CertificationProduct> CertificationProducts { get; set; } = new List<CertificationProduct>();
    public ICollection<CertificationCategoryLink> CertificationCategories { get; set; } = new List<CertificationCategoryLink>();
}

public class CertificationTranslation : SeoTranslation
{
    public int CertificationId { get; set; }
    public Certification? Certification { get; set; }

    /// <summary><c>ISO 14001</c>。</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>卡片上的一行說明。</summary>
    public string? ShortNote { get; set; }

    /// <summary>dialog 的敘述段。</summary>
    public string? Summary { get; set; }
    public string? IssuerName { get; set; }

    /// <summary><c>Per test report</c> 這類非日期敘述；與 <c>ValidUntil</c> 並存，兩者都要。</summary>
    public string? ValidityText { get; set; }

    public string? ScopeText { get; set; }
    public string? SitesText { get; set; }

    /// <summary>Technologies 合規表的 <c>Declaration</c> / <c>Test report</c>。</summary>
    public string? DocumentationLabel { get; set; }
}

public class CertificationProduct
{
    public int CertificationId { get; set; }
    public Certification? Certification { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
}

/// <summary>證書涵蓋哪條產品線（表名 <c>CertificationCategories</c>）。</summary>
public class CertificationCategoryLink
{
    public int CertificationId { get; set; }
    public Certification? Certification { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
}
