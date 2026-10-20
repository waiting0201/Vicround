namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §02.1。客戶案例：需求（Challenge）→ 解法（Solution）→ 成果（Result）三段。
/// <para>
/// 不併入 <see cref="Testimonial"/>：見證是一句引言，案例是有結構的三段敘事，而且要同時掛在
/// 產品頁與產業頁——符合 §09 的判準 1（跨頁重用）。Addressable（<c>#case-{slug}</c> 錨點），
/// 目前沒有自己的網址。
/// </para>
/// </summary>
public class CaseStudy : SluggedEntity
{
    /// <summary>實品照或案例海報。不得出現客戶的品牌、Logo 或圖案（OEM／ODM 成品照一律不用）。</summary>
    public int? MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public ICollection<CaseStudyTranslation> Translations { get; set; } = new List<CaseStudyTranslation>();
    public ICollection<CaseStudyProduct> CaseStudyProducts { get; set; } = new List<CaseStudyProduct>();
    public ICollection<CaseStudySolution> CaseStudySolutions { get; set; } = new List<CaseStudySolution>();
}

public class CaseStudyTranslation : SeoTranslation
{
    public int CaseStudyId { get; set; }
    public CaseStudy? CaseStudy { get; set; }

    /// <summary>
    /// 客戶類型（「國際電競品牌」「電子紙模組製造商」）。<b>不放客戶名稱</b>：VicRound 對 OEM／ODM
    /// 客戶有保密義務，案例一律不具名（2026-10-20 決定，取代原本的 <c>ClientName</c>）。
    /// </summary>
    public string? ClientProfile { get; set; }
    public string? ProjectName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Challenge { get; set; } = string.Empty;
    public string Solution { get; set; } = string.Empty;

    /// <summary>成果與反饋；客戶尚未提供實品照與回饋時為 null。</summary>
    public string? Result { get; set; }
}

public class CaseStudyProduct
{
    public int CaseStudyId { get; set; }
    public CaseStudy? CaseStudy { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int SortOrder { get; set; }
}

public class CaseStudySolution
{
    public int CaseStudyId { get; set; }
    public CaseStudy? CaseStudy { get; set; }
    public int SolutionId { get; set; }
    public Solution? Solution { get; set; }
    public int SortOrder { get; set; }
}
