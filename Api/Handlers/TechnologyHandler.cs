using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Services.Dapper;

namespace VicRound.Api.Handlers;

public sealed class TechnologyHandler(ITechnologyReadService technologies)
{
    public async Task<IActionResult> GetAsync(HttpRequest req)
    {
        var data = await technologies.GetAsync(LangResolver.Resolve(req), req.Query["kind"]);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(data));
    }
}
