using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Services.Dapper;

namespace VicRound.Api.Handlers;

/// <summary>資源中心裡不分頁的幾份清單：展會、FAQ、認證、下載（docs/cms-api.md）。</summary>
public sealed class ResourceHandler(
    IExhibitionReadService exhibitions,
    IFaqReadService faq,
    ICertificationReadService certifications,
    IDownloadReadService downloads)
{
    public async Task<IActionResult> ListExhibitionsAsync(HttpRequest req)
    {
        bool? upcoming = bool.TryParse(req.Query["upcoming"], out var value) ? value : null;
        var items = await exhibitions.ListAsync(LangResolver.Resolve(req), upcoming);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(items));
    }

    public async Task<IActionResult> ListFaqAsync(HttpRequest req)
    {
        var items = await faq.ListAsync(LangResolver.Resolve(req), req.Query["category"]);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(items));
    }

    public async Task<IActionResult> ListCertificationsAsync(HttpRequest req)
    {
        var items = await certifications.ListAsync(LangResolver.Resolve(req), req.Query["category"]);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(items));
    }

    public async Task<IActionResult> ListDownloadsAsync(HttpRequest req)
    {
        var items = await downloads.ListAsync(
            LangResolver.Resolve(req),
            req.Query["kind"],
            req.Query["product"],
            req.Query["category"],
            req.Query["solution"]);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(items));
    }
}
