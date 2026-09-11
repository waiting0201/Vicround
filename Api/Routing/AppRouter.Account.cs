using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace VicRound.Api.Routing;

public sealed partial class AppRouter
{
    /// <summary>
    /// 會員端點（<c>/v1/account/**</c>，docs/cms-api.md「Account API」）。
    ///
    /// <para>
    /// 身分驗證與 <c>no-store</c> 都已在 <see cref="RouteAsync"/> 做掉，這裡只做分派。
    /// <b>但登入前的那幾支例外</b>：註冊、登入、refresh、驗證信、忘記／重設密碼
    /// 本來就還沒有 token，它們在 <c>RouteAsync</c> 的白名單裡跳過驗證。
    /// </para>
    /// </summary>
    private Task<IActionResult?> RouteAccountAsync(HttpRequest req, string method, string[] segments) =>
        (method, segments) switch
        {
            ("POST", ["v1", "account", "register"]) => Nullable(accountAuth.RegisterAsync(req)),
            ("POST", ["v1", "account", "login"]) => Nullable(accountAuth.LoginAsync(req)),
            ("POST", ["v1", "account", "refresh"]) => Nullable(accountAuth.RefreshAsync(req)),
            ("POST", ["v1", "account", "logout"]) => Nullable(accountAuth.LogoutAsync(req)),

            ("POST", ["v1", "account", "verify-email"]) => Nullable(accountAuth.VerifyEmailAsync(req)),
            ("POST", ["v1", "account", "resend-verification"]) => Nullable(accountAuth.ResendVerificationAsync(req)),
            ("POST", ["v1", "account", "forgot-password"]) => Nullable(accountAuth.ForgotPasswordAsync(req)),
            ("POST", ["v1", "account", "reset-password"]) => Nullable(accountAuth.ResetPasswordAsync(req)),
            ("POST", ["v1", "account", "change-password"]) => Nullable(accountAuth.ChangePasswordAsync(req)),

            ("GET", ["v1", "account", "me"]) => Nullable(accountAuth.MeAsync(req)),
            ("PUT" or "PATCH", ["v1", "account", "me"]) => Nullable(accountAuth.UpdateMeAsync(req)),

            ("GET", ["v1", "account", "downloads"]) => Nullable(accountDownloads.ListAsync(req)),
            ("POST", ["v1", "account", "downloads", var slug, "link"]) =>
                Nullable(accountDownloads.CreateLinkAsync(req, slug)),

            ("GET", ["v1", "account", "sample-requests"]) => Nullable(accountSamples.ListAsync(req)),
            ("POST", ["v1", "account", "sample-requests"]) => Nullable(accountSamples.CreateAsync(req)),
            ("GET", ["v1", "account", "sample-requests", var number]) => Nullable(accountSamples.GetAsync(req, number)),
            ("POST", ["v1", "account", "sample-requests", var number, "reorder"]) =>
                Nullable(accountSamples.ReorderAsync(req, number)),

            _ => Task.FromResult<IActionResult?>(null),
        };
}
