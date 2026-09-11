using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Services;

namespace VicRound.Api.Handlers;

/// <summary>
/// 會員登入與帳號維護（docs/cms-api.md「Account API」）。
///
/// <para>
/// 與 <see cref="AdminAuthHandler"/> 同樣的 cookie 策略，但**是另一個 cookie**：
/// 名稱、路徑都不同，後台與前台的工作階段不會互相覆蓋，也不會在同一個瀏覽器裡打架。
/// </para>
/// </summary>
public sealed class AccountAuthHandler(IAccountAuthService auth)
{
    private const string RefreshCookie = "vr_member_rt";

    /// <summary>
    /// 收斂到 account 端點。前台其他請求（內容 API）不會帶到它，
    /// 也就不會把會員憑證送進可快取的回應路徑。
    /// </summary>
    private const string CookiePath = "/api/v1/account";

    public async Task<IActionResult> RegisterAsync(HttpRequest req)
    {
        var request = await ReadAsync<RegisterRequest>(req);

        // 沒帶 culture 時用請求本身的語系——前台是 locale-prefixed 路由，
        // 這裡拿到的就是使用者當下在看的那個語系。
        request.Culture ??= LangResolver.Resolve(req);

        var result = await auth.RegisterAsync(request, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok(result)) { StatusCode = 202 };
    }

    public async Task<IActionResult> LoginAsync(HttpRequest req)
    {
        var request = await ReadAsync<MemberLoginRequest>(req);
        var result = await auth.LoginAsync(request.Email, request.Password, req.HttpContext.RequestAborted);

        WriteRefreshCookie(req.HttpContext.Response, result.RefreshToken, result.RefreshExpiresAt);
        return Ok(req, result.Token);
    }

    public async Task<IActionResult> RefreshAsync(HttpRequest req)
    {
        var result = await auth.RefreshAsync(req.Cookies[RefreshCookie], req.HttpContext.RequestAborted);

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

    public async Task<IActionResult> MeAsync(HttpRequest req) =>
        Ok(req, await auth.GetCurrentAsync(req.HttpContext.User, req.HttpContext.RequestAborted));

    public async Task<IActionResult> UpdateMeAsync(HttpRequest req)
    {
        var request = await ReadAsync<MemberProfileUpdateRequest>(req);
        var profile = await auth.UpdateProfileAsync(req.HttpContext.User, request, req.HttpContext.RequestAborted);

        return Ok(req, profile);
    }

    public async Task<IActionResult> ChangePasswordAsync(HttpRequest req)
    {
        var request = await ReadAsync<MemberChangePasswordRequest>(req);

        await auth.ChangePasswordAsync(
            req.HttpContext.User, request.CurrentPassword, request.NewPassword, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok("密碼已更新，其他裝置上的工作階段已登出。"));
    }

    public async Task<IActionResult> VerifyEmailAsync(HttpRequest req)
    {
        var request = await ReadAsync<MemberTokenRequest>(req);
        var result = await auth.VerifyEmailAsync(request.Token, req.HttpContext.RequestAborted);

        return Ok(req, result);
    }

    /// <summary>
    /// 重寄驗證信。<b>不論 Email 是否存在都回同一個 202</b>——這支端點若誠實回答
    /// 「查無此人」，就等於提供一個免登入的帳號探測器。
    /// </summary>
    public async Task<IActionResult> ResendVerificationAsync(HttpRequest req)
    {
        var request = await ReadAsync<MemberTokenRequest>(req);
        await auth.ResendVerificationAsync(request.Email, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok("若這個 Email 待驗證，我們已重新寄出驗證信。")) { StatusCode = 202 };
    }

    /// <summary>忘記密碼。同樣一律回 202，理由同上。</summary>
    public async Task<IActionResult> ForgotPasswordAsync(HttpRequest req)
    {
        var request = await ReadAsync<MemberTokenRequest>(req);
        await auth.ForgotPasswordAsync(request.Email, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok("若這個 Email 已註冊，我們已寄出重設密碼的連結。")) { StatusCode = 202 };
    }

    public async Task<IActionResult> ResetPasswordAsync(HttpRequest req)
    {
        var request = await ReadAsync<MemberTokenRequest>(req);

        await auth.ResetPasswordAsync(request.Token, request.NewPassword, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok("密碼已重設，請用新密碼登入。"));
    }

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
