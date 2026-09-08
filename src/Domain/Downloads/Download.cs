using VicRound.Domain.Catalog;
using VicRound.Domain.Certifications;
using VicRound.Domain.Common;
using VicRound.Domain.Globalization;
using VicRound.Domain.Media;
using VicRound.Domain.Resources;
using VicRound.Domain.Solutions;

namespace VicRound.Domain.Downloads;

/// <summary>
/// database.md §06。<b>刻意獨立於 MediaAssets</b>：MediaAssets 是檔案倉庫，Download 是可發佈的
/// 內容實體（有翻譯、版本、效期、存取層級與自己的列表頁）。
/// URL：<c>/{locale}/resources/downloads#{slug}</c>。
/// </summary>
public class Download : SluggedEntity, IRoutable
{
    /// <summary>實際檔案。<c>MemberOnly</c> 的檔案必須存在 private container。</summary>
    public int MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public DownloadKind Kind { get; set; }
    public DownloadAccessLevel AccessLevel { get; set; }

    /// <summary><c>Rev. C</c> / <c>2026.1</c>。</summary>
    public string? Version { get; set; }
    public DateOnly? DocumentDate { get; set; }

    /// <summary>證書效期，過期自動不列出。</summary>
    public DateOnly? ValidUntil { get; set; }

    /// <summary>冗餘存放，列表 UI 免 join。</summary>
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    /// <summary>檔案本身的語言；<c>null</c> = 語言中立。</summary>
    public string? DocumentCulture { get; set; }
    public Culture? DocumentCultureRef { get; set; }

    public int? ThumbnailMediaAssetId { get; set; }
    public MediaAsset? ThumbnailMediaAsset { get; set; }

    public ICollection<DownloadTranslation> Translations { get; set; } = new List<DownloadTranslation>();
    public ICollection<DownloadProduct> DownloadProducts { get; set; } = new List<DownloadProduct>();
    public ICollection<DownloadCategory> DownloadCategories { get; set; } = new List<DownloadCategory>();
    public ICollection<DownloadSolution> DownloadSolutions { get; set; } = new List<DownloadSolution>();
    public ICollection<DownloadCertification> DownloadCertifications { get; set; } = new List<DownloadCertification>();
    public ICollection<DownloadArticle> DownloadArticles { get; set; } = new List<DownloadArticle>();
}

public class DownloadTranslation : SeoTranslation
{
    public int DownloadId { get; set; }
    public Download? Download { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class DownloadProduct
{
    public int DownloadId { get; set; }
    public Download? Download { get; set; }
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    public int SortOrder { get; set; }
}

public class DownloadCategory
{
    public int DownloadId { get; set; }
    public Download? Download { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public int SortOrder { get; set; }
}

public class DownloadSolution
{
    public int DownloadId { get; set; }
    public Download? Download { get; set; }
    public int SolutionId { get; set; }
    public Solution? Solution { get; set; }
    public int SortOrder { get; set; }
}

public class DownloadCertification
{
    public int DownloadId { get; set; }
    public Download? Download { get; set; }
    public int CertificationId { get; set; }
    public Certification? Certification { get; set; }
}

public class DownloadArticle
{
    public int DownloadId { get; set; }
    public Download? Download { get; set; }
    public int ArticleId { get; set; }
    public Article? Article { get; set; }
}
