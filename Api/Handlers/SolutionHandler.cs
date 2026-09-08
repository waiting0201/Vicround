using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Services.Dapper;

namespace VicRound.Api.Handlers;

public sealed class SolutionHandler(ISolutionReadService solutions)
{
    public async Task<IActionResult> ListAsync(HttpRequest req)
    {
        var items = await solutions.ListAsync(LangResolver.Resolve(req));

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(items));
    }

    public async Task<IActionResult> GetAsync(HttpRequest req, string slug)
    {
        var culture = LangResolver.Resolve(req);
        var solution = await solutions.GetAsync(culture, slug)
            ?? throw AppException.NotFound($"產業解決方案 {slug}（{culture}）");

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(solution));
    }
}
