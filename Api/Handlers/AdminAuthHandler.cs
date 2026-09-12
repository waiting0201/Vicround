using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Services;

namespace VicRound.Api.Handlers;

/// <summary>
/// 後台登入（docs/cms.md「Authentication」）。
/// <para>
/// HTTP 這一層只負責 cookie：<b>refresh token 只以 httpOnly cookie 進出</b>，
/// access token 回在 body 讓 SPA 放在記憶體。兩者都不會進 localStorage。
/// </para>
/// </summary>
public sealed class AdminAuthHandler(IAdminAuthService auth)
{
    /// <summary>Cookie 的路徑收斂到 auth 端點：其他 API 呼叫根本不會帶到它。</summary>
    private const string RefreshCookie = "vr_admin_rt";

    private const string CookiePath = "/api/admin/auth";

    public async Task<IActionResult> LoginAsync(HttpRequest req)
    {
        var request = await ReadAsync<LoginRequest>(req);
        var result = await auth.LoginAsync(request.Username, request.Password, req.HttpContext.RequestAborted);

        WriteRefreshCookie(req.HttpContext.Response, result.RefreshToken, result.RefreshExpiresAt);
        return Ok(req, result.Token);
    }

    public async Task<IActionResult> RefreshAsync(HttpRequest req)
    {
        var token = req.Cookies[RefreshCookie];
        var result = await auth.RefreshAsync(token, req.HttpContext.RequestAborted);

        WriteRefreshCookie(req.HttpContext.Response, result.RefreshToken, result.RefreshExpiresAt);
        return Ok(req, result.Token);
    }

    public async Task<IActionResult> LogoutAsync(HttpRequest req)
    {
        await auth.LogoutAsync(req.Cookies[RefreshCookie], req.HttpContext.RequestAborted);

        req.HttpContext.Response.Cookies.Delete(RefreshCookie, new CookieOptions
        {
            Path = CookiePath,
            Secure = req.IsHttps,
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
        });

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok("已登出。"));
    }

    public async Task<IActionResult> MeAsync(HttpRequest req)
    {
        var user = await auth.GetCurrentAsync(req.HttpContext.User, req.HttpContext.RequestAborted);
        return Ok(req, user);
    }

    public async Task<IActionResult> ChangePasswordAsync(HttpRequest req)
    {
        var request = await ReadAsync<ChangePasswordRequest>(req);

        await auth.ChangePasswordAsync(
            req.HttpContext.User, request.CurrentPassword, request.NewPassword, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok("密碼已更新，其他裝置上的工作階段已登出。"));
    }

    /// <summary>
    /// <c>Secure</c> 跟著連線走：正式站一律 https，因此永遠是 true；
    /// 本機用 http 跑 Functions host 時若強制 Secure，瀏覽器根本不會存這個 cookie，
    /// 後台就永遠換不到 token。
    /// </summary>
    private static void WriteRefreshCookie(HttpResponse response, string token, DateTime expiresAt) =>
        response.Cookies.Append(RefreshCookie, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = response.HttpContext.Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Path = CookiePath,
            Expires = expiresAt,
        });

    private static IActionResult Ok<T>(HttpRequest req, T data)
    {
        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(data));
    }

    private static async Task<T> ReadAsync<T>(HttpRequest req)
        where T : new()
    {
        try
        {
            return await req.ReadFromJsonAsync<T>() ?? new T();
        }
        catch (System.Text.Json.JsonException)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "請求主體必須是合法的 JSON。");
        }
    }
}
