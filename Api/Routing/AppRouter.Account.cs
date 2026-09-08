using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace VicRound.Api.Routing;

public sealed partial class AppRouter
{
    /// <summary>
    /// 會員端點（<c>/v1/account/**</c>）。身分驗證已在 <see cref="RouteAsync"/> 完成，
    /// 這裡只做分派。Handler 尚未實作，因此目前一律回 null 讓 Router 落到 404。
    /// </summary>
    private Task<IActionResult?> RouteAccountAsync(HttpRequest req, string method, string[] segments) =>
        Task.FromResult<IActionResult?>(null);
}
