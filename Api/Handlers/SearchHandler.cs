using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Services.Dapper;

namespace VicRound.Api.Handlers;

/// <summary>
/// <c>GET /api/v1/search?q=&amp;limit=</c>。Header 的搜尋面板與 <c>/{locale}/search</c> 都打這一支。
/// <para>
/// <b>可以快取</b>：結果只由 <c>q</c> 與語系決定，不含任何個人化，和其他 Content API 一樣公開。
/// </para>
/// </summary>
public sealed class SearchHandler(ISearchReadService search)
{
    public async Task<IActionResult> SearchAsync(HttpRequest req)
    {
        var limit = int.TryParse(req.Query["limit"], out var parsed) ? parsed : 0;
        var data = await search.SearchAsync(LangResolver.Resolve(req), req.Query["q"], limit);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(data));
    }
}
