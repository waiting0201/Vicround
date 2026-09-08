using Microsoft.AspNetCore.Http;
using VicRound.Api.Common;
using VicRound.Api.Models.Entities;
using Xunit;

namespace VicRound.Api.Tests;

/// <summary>
/// 語系解析（database.md §0.2）：<b>網址是真相來源</b>，<c>Accept-Language</c> 只是 fallback。
/// 這條規則錯了會讓整站的 hreflang 與 canonical 跟著錯，因此值得釘住。
/// </summary>
public class LangResolverTests
{
    private static HttpRequest Request(string? culture = null, string? acceptLanguage = null)
    {
        var context = new DefaultHttpContext();

        if (culture is not null)
        {
            context.Request.QueryString = new QueryString($"?culture={culture}");
        }

        if (acceptLanguage is not null)
        {
            context.Request.Headers.AcceptLanguage = acceptLanguage;
        }

        return context.Request;
    }

    [Theory]
    [InlineData("en", CultureCodes.English)]
    [InlineData("zh-Hant", CultureCodes.TraditionalChinese)]
    [InlineData("ZH-HANT", CultureCodes.TraditionalChinese)]
    public void 參數指定的語系優先(string requested, string expected) =>
        Assert.Equal(expected, LangResolver.Resolve(Request(requested)));

    [Fact]
    public void 參數勝過AcceptLanguage()
    {
        // 網址說 en 就是 en，即使瀏覽器偏好中文——否則同一個網址會回兩種內容。
        var request = Request("en", "zh-Hant,zh;q=0.9");

        Assert.Equal(CultureCodes.English, LangResolver.Resolve(request));
    }

    [Fact]
    public void 沒有參數時才看AcceptLanguage() =>
        Assert.Equal(CultureCodes.TraditionalChinese,
            LangResolver.Resolve(Request(acceptLanguage: "zh-Hant;q=0.9,en;q=0.8")));

    [Theory]
    [InlineData("ja")]
    [InlineData("")]
    [InlineData("zh-Hans")]
    public void 不支援的語系退回預設(string requested) =>
        Assert.Equal(CultureCodes.Default, LangResolver.Resolve(Request(requested)));

    [Fact]
    public void 什麼都沒帶時退回預設() =>
        Assert.Equal(CultureCodes.Default, LangResolver.Resolve(Request()));
}

public class PagingTests
{
    private static HttpRequest Request(string query)
    {
        var context = new DefaultHttpContext();
        context.Request.QueryString = new QueryString(query);
        return context.Request;
    }

    [Fact]
    public void 預設是第一頁()
    {
        var (page, size) = Paging.From(Request(string.Empty));

        Assert.Equal(1, page);
        Assert.Equal(Paging.DefaultPageSize, size);
    }

    [Theory]
    [InlineData("?page=0")]
    [InlineData("?page=-3")]
    [InlineData("?page=abc")]
    public void 非法頁碼視為第一頁(string query) => Assert.Equal(1, Paging.From(Request(query)).Page);

    [Fact]
    public void 每頁筆數有上限()
    {
        // 公開端點不該讓人一次撈走整個目錄。
        var (_, size) = Paging.From(Request("?pageSize=100000"));

        Assert.Equal(Paging.MaxPageSize, size);
    }
}
