using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Services.Dapper;

namespace VicRound.Api.Handlers;

public sealed class PageHandler(IPageReadService pages)
{
    public async Task<IActionResult> GetAsync(HttpRequest req, string slug)
    {
        var culture = LangResolver.Resolve(req);
        var page = await pages.GetAsync(culture, slug)
            ?? throw AppException.NotFound($"頁面 {slug}（{culture}）");

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(page));
    }

    /// <summary>
    /// 轉址表。middleware 在每個未命中的請求前都會用到它，因此整份回傳並讓前台自己快取。
    /// </summary>
    public async Task<IActionResult> RedirectsAsync(HttpRequest req)
    {
        var rules = await pages.RedirectsAsync();

        CacheControl.Public(req.HttpContext.Response, 300);
        return new OkObjectResult(ApiResponse.Ok(new { Items = rules }));
    }

    /// <summary>sitemap 的資料；XML 由 Next.js 的 app/sitemap.ts 產生。</summary>
    public async Task<IActionResult> SitemapAsync(HttpRequest req)
    {
        var entries = await pages.SitemapAsync();

        CacheControl.Public(req.HttpContext.Response, 900);
        return new OkObjectResult(ApiResponse.Ok(entries));
    }
}
