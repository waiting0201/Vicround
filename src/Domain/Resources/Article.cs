using VicRound.Domain.Catalog;
using VicRound.Domain.Common;
using VicRound.Domain.Media;
using VicRound.Domain.Solutions;

namespace VicRound.Domain.Resources;

/// <summary>
/// database.md §05。News / Insights / Blog 共用一張表 + <see cref="Type"/>（欄位重疊約 95%）。
/// <b><see cref="Type"/> 決定 URL 前綴，所以變更 Type 等同變更 URL，必須寫 301。</b>
/// <c>PublishedAt</c> 在此表<b>參與可見性與排序</b>（§0.1）。
/// </summary>
public class Article : SluggedEntity, IRoutable
{
    public ArticleType Type { get; set; }

    public int? AuthorId { get; set; }
    public Author? Author { get; set; }

    /// <summary><c>Type = Exhibition</c> 時連到展會實體。</summary>
    public int? ExhibitionId { get; set; }
    public Exhibition? Exhibition { get; set; }

    public int? HeroMediaAssetId { get; set; }
    public MediaAsset? HeroMediaAsset { get; set; }

    /// <summary>"9 min read"。</summary>
    public byte? ReadingMinutes { get; set; }

    /// <summary>Resources 首頁置頂。</summary>
    public bool IsFeatured { get; set; }

    /// <summary>舊站 <c>blog_post</c> 匯入的冪等鍵。</summary>
    public string? LegacySourceKey { get; set; }

    public ICollection<ArticleTranslation> Translations { get; set; } = new List<ArticleTranslation>();
    public ICollection<ArticleTagLink> TagLinks { get; set; } = new List<ArticleTagLink>();
    public ICollection<ArticleCategory> ArticleCategories { get; set; } = new List<ArticleCategory>();
    public ICollection<ArticleSolution> ArticleSolutions { get; set; } = new List<ArticleSolution>();
    public ICollection<ArticleProduct> ArticleProducts { get; set; } = new List<ArticleProduct>();
}

public class ArticleTranslation : SeoTranslation
{
    public int ArticleId { get; set; }
    public Article? Article { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Excerpt { get; set; }

    /// <summary>大字導言。</summary>
    public string? Lead { get; set; }

    /// <summary>HTML，含 TOC 用的 h2 錨點。</summary>
    public string? Body { get; set; }

    public string? PullQuote { get; set; }
    public string? PullQuoteAttribution { get; set; }
}

/// <summary>Embedded：作者只在文章內出現。</summary>
public class Author : SluggedEntity
{
    /// <summary>無頭像時的縮寫圓標。</summary>
    public string? Initials { get; set; }

    public int? MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public ICollection<AuthorTranslation> Translations { get; set; } = new List<AuthorTranslation>();
    public ICollection<Article> Articles { get; set; } = new List<Article>();
}

public class AuthorTranslation : Translation
{
    public int AuthorId { get; set; }
    public Author? Author { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? JobTitle { get; set; }
    public string? Bio { get; set; }
}

/// <summary>
/// 自由標籤（舊站的 knowledge / activity）。產品線與產業標籤<b>不放這裡</b>——
/// 它們走 <see cref="ArticleCategory"/> / <see cref="ArticleSolution"/>，以免與既有實體不同步。
/// </summary>
public class ArticleTag : SluggedEntity
{
    /// <summary>系統標籤不可由編輯者刪除。</summary>
    public bool IsSystem { get; set; }

    public ICollection<ArticleTagTranslation> Translations { get; set; } = new List<ArticleTagTranslation>();
    public ICollection<ArticleTagLink> TagLinks { get; set; } = new List<ArticleTagLink>();
}

public class ArticleTagTranslation : SeoTranslation
{
    public int ArticleTagId { get; set; }
    public ArticleTag? ArticleTag { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class ArticleTagLink
{
    public int ArticleId { get; set; }
    public Article? Article { get; set; }

    public int ArticleTagId { get; set; }
    public ArticleTag? ArticleTag { get; set; }
}

/// <summary>文章卡的產品線 chip。</summary>
public class ArticleCategory
{
    public int ArticleId { get; set; }
    public Article? Article { get; set; }

    public int CategoryId { get; set; }
    public Category? Category { get; set; }
}

/// <summary>文章卡的產業 chip。</summary>
public class ArticleSolution
{
    public int ArticleId { get; set; }
    public Article? Article { get; set; }

    public int SolutionId { get; set; }
    public Solution? Solution { get; set; }
}

/// <summary>產品頁的相關文章。</summary>
public class ArticleProduct
{
    public int ArticleId { get; set; }
    public Article? Article { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }
}
