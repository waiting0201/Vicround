using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using VicRound.Api.Common;
using VicRound.Api.Handlers;
using VicRound.Api.Services;

namespace VicRound.Api.Routing;

/// <summary>
/// 集中式路由分派器。收 (method, route) → 拆 segments → 驗 JWT → 檢查權限 → list pattern 分派。
/// <para>
/// VicRound 有<b>三個 API surface</b>（docs/cms-api.md），因此路由表拆成三個 partial：
/// <c>AppRouter.Public.cs</c>（<c>/v1/**</c> 匿名唯讀）、
/// <c>AppRouter.Account.cs</c>（<c>/v1/account/**</c> 會員 JWT）、
/// <c>AppRouter.Admin.cs</c>（<c>/admin/**</c> 後台 JWT + 權限表）。
/// </para>
/// </summary>
public sealed partial class AppRouter(
    ILogger<AppRouter> logger,
    IJwtService jwt,
    HealthHandler health,
    CatalogHandler catalog,
    SolutionHandler solutions,
    PageHandler pages,
    NavigationHandler navigation,
    AdminAuthHandler adminAuth,
    AdminContentHandler adminContent,
    AdminMediaHandler adminMedia,
    AdminActionHandler adminAction,
    ArticleHandler articles,
    ResourceHandler resources,
    TechnologyHandler technologies,
    ContactHandler contact,
    AccountAuthHandler accountAuth,
    AccountDownloadsHandler accountDownloads,
    AccountSampleRequestsHandler accountSamples)
{
    /// <summary>
    /// <see cref="GetRequiredPermission"/> 的預設回傳值：<b>未列在權限表的 <c>/admin/*</c> 一律拒絕</b>。
    /// 新增端點忘了補權限表就會直接 403，而不是靜默放行。
    /// </summary>
    private const string DenySentinel = "__DENY__";

    public async Task<IActionResult> RouteAsync(HttpRequest req, string route)
    {
        var method = req.Method.ToUpperInvariant();
        var segments = route.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);

        logger.LogDebug("Router: method={Method} route={Route}", method, route);

        // CORS preflight：實際 allow-list 在平台層，程式內只放行 OPTIONS。
        if (method == "OPTIONS")
        {
            return new OkResult();
        }

        // HEAD 當 GET 走：CDN 與監控會用 HEAD 探測，不對應的話它們拿到 404。
        if (method == "HEAD")
        {
            method = "GET";
        }

        switch (segments)
        {
            // 會員的「還沒有 token」端點：註冊、登入、換發、驗證信與重設密碼。
            // 仍然 no-store——回應裡有 token 與帳號狀態，不該進任何快取。
            case ["v1", "account", "register"]
                or ["v1", "account", "login"]
                or ["v1", "account", "refresh"]
                or ["v1", "account", "logout"]
                or ["v1", "account", "verify-email"]
                or ["v1", "account", "resend-verification"]
                or ["v1", "account", "forgot-password"]
                or ["v1", "account", "reset-password"]:
                req.HttpContext.Response.Headers.CacheControl = "no-store";
                break;

            // 會員專區：只收 member audience，且一律 no-store（docs/cms-api.md）。
            case ["v1", "account", ..]:
                req.HttpContext.User = jwt.ValidateRequest(req, TokenAudiences.Member)
                    ?? throw AppException.Unauthorized("缺少或無效的會員憑證。");
                req.HttpContext.Response.Headers.CacheControl = "no-store";
                break;

            // 登入與換 token 本來就還沒有 access token；refresh 靠 httpOnly cookie。
            case ["admin", "auth", "login"] or ["admin", "auth", "refresh"] or ["admin", "auth", "logout"]:
                break;

            // 後台：只收 admin audience，會員 token 打 /admin/* 一律擋下。
            case ["admin", ..]:
                var principal = jwt.ValidateRequest(req, TokenAudiences.Admin)
                    ?? throw AppException.Unauthorized("缺少或無效的後台憑證。");
                RequirePermission(principal, GetRequiredPermission(method, segments));
                req.HttpContext.User = principal;
                break;

            // 公開內容 API：匿名唯讀。白名單是列舉式——沒登記的一律 404，
            // 新端點忘了補會在開發階段就暴露，不會靜悄悄變成公開端點。
            default:
                if (!IsPublicRoute(method, segments))
                {
                    return NotFound(method, route);
                }

                break;
        }

        return await RoutePublicAsync(req, method, segments)
            ?? await RouteAccountAsync(req, method, segments)
            ?? await RouteAdminAsync(req, method, segments)
            ?? NotFound(method, route);
    }

    /// <summary>
    /// 權限檢查。<c>is_superadmin</c> 直接通過；其餘先看 token 上逐條列出的
    /// <c>permissions</c>（保留給日後的個別授權），再看角色展開出來的權限
    /// （<see cref="AdminPermissions"/>）。
    /// </summary>
    private static void RequirePermission(ClaimsPrincipal principal, string? permissionCode)
    {
        if (permissionCode is null)
        {
            return;
        }

        if (permissionCode == DenySentinel)
        {
            throw AppException.Forbidden("此端點未登記於權限表。");
        }

        if (principal.FindFirst("is_superadmin")?.Value == "true")
        {
            return;
        }

        if (principal.FindAll("permissions").Any(c => c.Value == permissionCode))
        {
            return;
        }

        var roles = principal.FindAll(ClaimTypes.Role).Concat(principal.FindAll("role"))
            .Select(c => c.Value)
            .ToArray();

        if (!AdminPermissions.Allows(roles, permissionCode))
        {
            throw AppException.Forbidden($"缺少所需權限：{permissionCode}");
        }
    }

    private static IActionResult NotFound(string method, string route) =>
        new NotFoundObjectResult(ApiResponse.Fail(
            ErrorCodes.NotFound,
            "端點不存在。",
            $"Route '/api/{route}' with method {method} does not exist."));
}
