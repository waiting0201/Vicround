using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Services.Dapper;

namespace VicRound.Api.Handlers;

public sealed class NavigationHandler(INavigationReadService navigation)
{
    public async Task<IActionResult> ListAsync(HttpRequest req)
    {
        var groups = await navigation.ListAsync(LangResolver.Resolve(req), req.Query["location"]);

        // 導覽每頁都要，且只有編輯者改動時才會變——快取比其他內容再長一點。
        CacheControl.Public(req.HttpContext.Response, 900);
        return new OkObjectResult(ApiResponse.Ok(groups));
    }
}
