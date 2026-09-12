namespace VicRound.Api.Models.Dtos;

// 後台的請求／回應形狀。與 `apps/admin/src/lib/api.ts` 的契約逐項對應。

public sealed class LoginRequest
{
    /// <summary>登入帳號（<c>Users.Username</c>），<b>不是 Email</b>。</summary>
    public string? Username { get; set; }

    public string? Password { get; set; }
}

/// <summary>
/// 登入與換 token 的回應。**只回 access token**——refresh token 走 httpOnly cookie，
/// 前端讀不到也存不進 localStorage（docs/cms.md「Rules」）。
/// </summary>
public sealed record AccessTokenDto(string AccessToken, int ExpiresInSeconds, bool MustChangePassword);

public sealed record CurrentUserDto(string Id, string Username, string DisplayName, string[] Roles);

public sealed class ChangePasswordRequest
{
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
}

/// <summary>登入結果：成功時帶 access token 與要寫進 cookie 的 refresh token。</summary>
public sealed record SignInResult(AccessTokenDto Token, string RefreshToken, DateTime RefreshExpiresAt);
