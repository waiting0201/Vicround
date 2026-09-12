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
public sealed class AccountAuthHandler(IAccountAuthService auth, IRateLimiter rateLimiter)
{
    private const string RefreshCookie = "vr_member_rt";

    /// <summary>
    /// 會寄信的三支端點（註冊、重寄驗證信、忘記密碼）的額度。
    ///
    /// <para>
    /// <b>兩個鍵都要擋</b>：以 IP 為鍵擋住同一台機器的連打，以 <b>Email</b> 為鍵擋住
    /// 「拿別人的信箱來洗」——換 IP 就能繞過前者，但受害者的信箱要靠後者才保得住。
    /// Email 的額度刻意更緊：正常人重送一兩次驗證信就夠了。
    /// </para>
    ///
    /// <para>
    /// 回 <c>429</c> 不會洩漏帳號是否存在：計數對所有 Email 一視同仁，
    /// 不存在的信箱一樣會被擋（帳號探測的防線見各端點的一律 202）。
    /// </para>
    /// </summary>
    private const int MaxPerIp = 10;
    private const int MaxPerEmail = 3;

    /// <summary>
    /// 登入的額度單獨放寬：公司內網是一個對外 IP，十幾個人同時上班就會互相排擠，
    /// 而登入本身不寄信、也另有帳號鎖定擋暴力破解。
    /// </summary>
    private const int MaxLoginPerIp = 30;

    private static readonly TimeSpan Window = TimeSpan.FromMinutes(15);

    /// <summary>
    /// 收斂到 account 端點。前台其他請求（內容 API）不會帶到它，
    /// 也就不會把會員憑證送進可快取的回應路徑。
    /// </summary>
    private const string CookiePath = "/api/v1/account";

    public async Task<IActionResult> RegisterAsync(HttpRequest req)
    {
        var request = await ReadAsync<RegisterRequest>(req);

        RequireQuota(req, "register", request.Email);

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

        // 登入**只以 IP 為鍵**：以 Email 計數等於給攻擊者一個把人鎖在門外的開關。
        // 針對單一帳號的暴力破解由 AccountAuthService 的 FailedLoginCount 擋（5 次鎖 15 分鐘），
        // 這一層擋的是拿一堆帳號輪流試的那種。
        RequireQuota(req, "login", email: null, maxPerIp: MaxLoginPerIp);

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

        RequireQuota(req, "resend-verification", request.Email);
        await auth.ResendVerificationAsync(request.Email, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok("若這個 Email 待驗證，我們已重新寄出驗證信。")) { StatusCode = 202 };
    }

    /// <summary>忘記密碼。同樣一律回 202，理由同上。</summary>
    public async Task<IActionResult> ForgotPasswordAsync(HttpRequest req)
    {
        var request = await ReadAsync<MemberTokenRequest>(req);

        RequireQuota(req, "forgot-password", request.Email);
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

    /// <summary>
    /// 寄信端點的額度檢查。<b>在做任何事之前呼叫</b>——被擋下的請求不該先查一次資料庫。
    /// </summary>
    private void RequireQuota(HttpRequest req, string endpoint, string? email, int? maxPerIp = null)
    {
        var ip = ClientIp.Of(req);

        // Email 正規化後才當鍵，否則大小寫不同就是另一個額度。
        // 這個值只活在記憶體的限流表裡，不落 DB（同 Api/Common/ClientIp.cs 的取捨）。
        var normalized = email?.Trim().ToUpperInvariant();

        // 用 & 而不是 &&：兩個額度都要計到這一次，短路會讓其中一個漏記。
        var allowed =
            rateLimiter.TryAcquire($"{endpoint}:ip:{ip}", maxPerIp ?? MaxPerIp, Window)
            & (string.IsNullOrEmpty(normalized)
               || rateLimiter.TryAcquire($"{endpoint}:email:{normalized}", MaxPerEmail, Window));

        if (!allowed)
        {
            throw new AppException(ErrorCodes.RateLimited, "嘗試次數過多，請稍後再試。", 429);
        }
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
