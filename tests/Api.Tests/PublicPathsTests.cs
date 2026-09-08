using VicRound.Api.Common;
using VicRound.Api.Models.Entities;
using Xunit;

namespace VicRound.Api.Tests;

/// <summary>
/// 公開網址的組裝（docs/sitemap.md）。導覽、FAQ 的延伸連結與文章卡都吃這一組規則，
/// 改錯了會讓已被索引的網址整批失效，因此逐條釘住。
/// </summary>
public class PublicPathsTests
{
    [Theory]
    [InlineData(ArticleType.CompanyNews, "/news/taoyuan-expansion")]
    [InlineData(ArticleType.ProductNews, "/news/taoyuan-expansion")]
    [InlineData(ArticleType.Exhibition, "/news/taoyuan-expansion")]
    [InlineData(ArticleType.CertificationNews, "/news/taoyuan-expansion")]
    [InlineData(ArticleType.Insight, "/insights/taoyuan-expansion")]
    [InlineData(ArticleType.TechnicalArticle, "/blog/taoyuan-expansion")]
    public void 文章前綴由Type決定(ArticleType type, string expected) =>
        Assert.Equal(expected, PublicPaths.Article(type, "taoyuan-expansion"));

    [Fact]
    public void 首頁的slug不出現在網址裡() => Assert.Equal("/", PublicPaths.Page("home"));

    [Fact]
    public void 其餘頁面就是斜線加slug() => Assert.Equal("/about", PublicPaths.Page("about"));

    [Fact]
    public void 產品線與產品各自的層級()
    {
        Assert.Equal("/products/optical-film", PublicPaths.Category("optical-film"));
        Assert.Equal("/products/optical-film/ag-90", PublicPaths.Product("optical-film", "ag-90"));
    }

    [Fact]
    public void 產業頁() => Assert.Equal("/solutions/automotive", PublicPaths.Solution("automotive"));

    /// <summary>Downloads 是 Addressable——只有清單頁的錨點，沒有自己的頁面（database.md §0.1）。</summary>
    [Fact]
    public void 下載只有錨點而不是獨立網址() =>
        Assert.Equal("/resources/downloads#tds-ag90", PublicPaths.Download("tds-ag90"));

    [Fact]
    public void 需索取的文件導到詢問表單() =>
        Assert.Equal("/contact?download=tds-ag90", PublicPaths.DownloadRequest("tds-ag90"));
}
