using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace VicRound.Api.Routing;

public sealed partial class AppRouter
{
    /// <summary>
    /// 公開唯讀端點的白名單，對應 docs/cms-api.md 的 Content API。
    /// <b>列舉式</b>：新增前台端點必須補進來，否則直接 404。
    /// </summary>
    private static bool IsPublicRoute(string method, string[] segments) =>
        (method, segments) switch
        {
            ("GET", ["v1", "health"]) => true,
            _ => false,
        };

    private Task<IActionResult?> RoutePublicAsync(HttpRequest req, string method, string[] segments) =>
        Task.FromResult<IActionResult?>((method, segments) switch
        {
            ("GET", ["v1", "health"]) => health.Get(),
            _ => null,
        });
}
