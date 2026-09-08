using VicRound.Api.Models.Entities;

namespace VicRound.Api.Common;

/// <summary>
/// 公開網址的組裝規則。<b>不含 <c>[locale]</c> 前綴</b>——語系由前台的路由段補上
/// （CLAUDE.md「Locale lives in the URL」）。
/// <para>
/// 集中在這裡是因為同一組規則出現在三個地方：導覽的 <c>Ref*Id</c>、FAQ 每題的延伸連結、
/// 文章列表的卡片連結。散開寫的話，某天改了文章前綴只會改到其中一處。
/// </para>
/// </summary>
public static class PublicPaths
{
    /// <summary>文章的 <c>Type</c> 決定前綴——改 Type 等同改網址（database.md §05）。</summary>
    public static string Article(ArticleType type, string slug) => type switch
    {
        ArticleType.Insight => $"/insights/{slug}",
        ArticleType.TechnicalArticle => $"/blog/{slug}",
        _ => $"/news/{slug}",
    };

    /// <summary>首頁的 slug 是 <c>home</c>，但網址是 <c>/</c>（sitemap 也照這條規則）。</summary>
    public static string Page(string slug) => slug == "home" ? "/" : $"/{slug}";

    public static string Category(string slug) => $"/products/{slug}";

    public static string Product(string categorySlug, string slug) => $"/products/{categorySlug}/{slug}";

    public static string Solution(string slug) => $"/solutions/{slug}";

    /// <summary>Downloads 是 Addressable——只有清單頁的錨點，沒有自己的頁面。</summary>
    public static string Download(string slug) => $"/resources/downloads#{slug}";

    /// <summary><c>AccessLevel = OnRequest</c> 的文件走詢問表單索取（docs/cms-api.md）。</summary>
    public static string DownloadRequest(string slug) => $"/contact?download={slug}";
}
