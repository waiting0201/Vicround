using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using VicRound.Api.Routing;

namespace VicRound.Api.Functions;

/// <summary>
/// 唯一的 HTTP entry point。<c>Route = "{*route}"</c> 捕捉所有 <c>/api/*</c> 請求，
/// 交由 <see cref="AppRouter"/> 分派。這一層只做 trigger binding，不放任何邏輯。
/// </summary>
public sealed class RouterFunction(AppRouter router)
{
    [Function("Router")]
    public Task<IActionResult> Run(
        [HttpTrigger(
            AuthorizationLevel.Anonymous,
            "get", "head", "post", "put", "patch", "delete", "options",
            Route = "{*route}")] HttpRequest req,
        string? route)
        => router.RouteAsync(req, route ?? string.Empty);
}
