using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace VicRound.Api.Services;

/// <summary>
/// 自簽 JWT（HS256）。<b>不接 <c>AddAuthentication().AddJwtBearer()</c></b>——
/// isolated worker 的 middleware pipeline 與 ASP.NET Core 不同，自己驗證比接管線可控。
/// </summary>
public interface IJwtService
{
    /// <summary>驗證 <c>Authorization: Bearer</c>；失敗一律回 <c>null</c>，由呼叫端轉 401。</summary>
    ClaimsPrincipal? ValidateRequest(HttpRequest request, string audience);

    string CreateToken(string audience, string subject, IEnumerable<Claim> claims, TimeSpan lifetime);
}
