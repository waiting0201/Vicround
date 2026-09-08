namespace VicRound.Api.Models.Entities;

/// <summary>由 <c>AuditingSaveChangesInterceptor</c> 寫入時間戳的實體。</summary>
public interface IHasTimestamps
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}

/// <summary>
/// 「Embedded」類實體的共同欄位（database.md §0.1）。只在母體頁面內出現，無獨立 URL。
/// </summary>
public abstract class ContentEntity : IHasTimestamps
{
    public int Id { get; set; }
    public ContentStatus Status { get; set; } = ContentStatus.Draft;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// 首次發佈時間。<b>僅 <c>Articles</c> 與 <c>Exhibitions</c> 參與可見性與排序</b>；
    /// 其餘實體的可見性只看 <see cref="Status"/>（database.md §0.1）。
    /// </summary>
    public DateTime? PublishedAt { get; set; }
}

/// <summary>有 <c>Slug</c> 的實體：Routable（有自己的 URL）與 Addressable（只作錨點／查詢參數）。</summary>
public abstract class SluggedEntity : ContentEntity
{
    public string Slug { get; set; } = string.Empty;
}

/// <summary>
/// 標記介面：這個實體有自己的 <c>/{locale}/...</c> URL，<b>要進 sitemap 與 hreflang</b>。
/// Addressable 實體（Certifications、FaqItems…）雖有 Slug 但不實作此介面。
/// </summary>
public interface IRoutable
{
    string Slug { get; }
}

/// <summary>每 culture 一列的翻譯實體；PK = (擁有者 Id, Culture)。</summary>
public interface ITranslation
{
    string Culture { get; set; }
}

/// <summary>不需 SEO 欄位的翻譯（Embedded 實體的翻譯）。</summary>
public abstract class Translation : ITranslation
{
    public string Culture { get; set; } = string.Empty;
}

/// <summary>Routable / Addressable 實體的翻譯，帶 database.md §0.2 的 SEO 四欄。</summary>
public abstract class SeoTranslation : Translation
{
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public string? SeoKeywords { get; set; }
    public int? OgImageMediaAssetId { get; set; }
}
