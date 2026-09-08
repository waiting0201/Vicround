using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using VicRound.Api.Common;

namespace VicRound.Api.Services;

/// <summary>
/// 兩套身分共用同一支服務，但**簽章金鑰、issuer、audience 各自獨立**
/// （docs/database.md §14.1）：拿後台 token 打會員端點、或反過來，都會驗不過。
/// </summary>
public sealed class JwtService(IConfiguration configuration) : IJwtService
{
    private static readonly JwtSecurityTokenHandler Handler = new() { MapInboundClaims = false };

    public ClaimsPrincipal? ValidateRequest(HttpRequest request, string audience)
    {
        var header = request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var token = header["Bearer ".Length..].Trim();
        if (token.Length == 0)
        {
            return null;
        }

        try
        {
            return Handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = IssuerFor(audience),
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = SigningKey(audience),
                ClockSkew = TimeSpan.FromSeconds(30),
            }, out _);
        }
        catch (Exception e) when (e is SecurityTokenException or ArgumentException)
        {
            // 驗證失敗不讓例外冒出——由呼叫端統一轉 401。
            return null;
        }
    }

    public string CreateToken(string audience, string subject, IEnumerable<Claim> claims, TimeSpan lifetime)
    {
        var now = Clock.UtcNow;
        var all = new List<Claim>(claims) { new(JwtRegisteredClaimNames.Sub, subject) };

        var token = new JwtSecurityToken(
            issuer: IssuerFor(audience),
            audience: audience,
            claims: all,
            notBefore: now,
            expires: now.Add(lifetime),
            signingCredentials: new SigningCredentials(SigningKey(audience), SecurityAlgorithms.HmacSha256));

        return Handler.WriteToken(token);
    }

    private static string IssuerFor(string audience) =>
        audience == TokenAudiences.Admin ? TokenIssuers.Admin : TokenIssuers.Member;

    /// <summary>正式環境的金鑰放 Key Vault：<c>Jwt--Admin--SigningKey</c> / <c>Jwt--Member--SigningKey</c>。</summary>
    private SymmetricSecurityKey SigningKey(string audience)
    {
        var section = audience == TokenAudiences.Admin ? "Admin" : "Member";
        var secret = configuration[$"Jwt:{section}:SigningKey"]
            ?? throw new InvalidOperationException($"缺少設定 Jwt:{section}:SigningKey。");

        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }
}
