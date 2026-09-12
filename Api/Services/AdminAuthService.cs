using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Common;
using VicRound.Api.Data;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services;

public interface IAdminAuthService
{
    Task<SignInResult> LoginAsync(string? username, string? password, CancellationToken cancellationToken);
    Task<SignInResult> RefreshAsync(string? refreshToken, CancellationToken cancellationToken);
    Task LogoutAsync(string? refreshToken, CancellationToken cancellationToken);
    Task<CurrentUserDto> GetCurrentAsync(ClaimsPrincipal principal, CancellationToken cancellationToken);
    Task ChangePasswordAsync(ClaimsPrincipal principal, string? current, string? next, CancellationToken cancellationToken);
}

/// <summary>
/// 後台身分（database.md §13、docs/cms.md）。
/// <para>
/// <b>Access token 短命、refresh token 可撤銷</b>：access token 只有 15 分鐘且不查 DB，
/// 所以「立刻停用某人」靠的是輪替 <c>SecurityStamp</c> 並撤銷他的 refresh token ——
/// 最多 15 分鐘後他就換不到新的 token。
/// </para>
/// </summary>
public sealed class AdminAuthService(
    VicRoundDbContext db,
    IJwtService jwt,
    IPasswordHasher hasher,
    ILogger<AdminAuthService> logger) : IAdminAuthService
{
    /// <summary>Access token 的壽命。短到就算外洩也很快失效，長到編輯者不會打字打到一半被登出。</summary>
    private static readonly TimeSpan AccessLifetime = TimeSpan.FromMinutes(15);

    private static readonly TimeSpan RefreshLifetime = TimeSpan.FromDays(14);

    /// <summary>連續失敗幾次就鎖，以及鎖多久。狀態存在 <c>Users</c>，不另建 log 表（§0.7）。</summary>
    private const int MaxFailedLogins = 5;

    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public async Task<SignInResult> LoginAsync(string? username, string? password, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請輸入帳號與密碼。");
        }

        // 這裡只正規化、不驗格式：格式錯的帳號也要走完「帳號或密碼不正確」那條路，
        // 否則錯誤訊息就成了「這個帳號長得像不像我們的帳號」的探測器。
        var normalized = Usernames.Normalize(username);

        var user = await db.Users
            .AsTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(r => r.Role)
            .SingleOrDefaultAsync(u => u.UsernameNormalized == normalized, cancellationToken);

        // 帳號不存在與密碼錯誤回同一個錯誤碼：不讓登入頁變成帳號存在與否的探測器。
        if (user is null)
        {
            throw new AppException(ErrorCodes.AuthInvalidCredentials, "帳號或密碼不正確。", 401);
        }

        if (!user.IsActive)
        {
            throw new AppException(ErrorCodes.AuthAccountInactive, "此帳號已停用。", 403);
        }

        if (user.LockoutEndsAt is { } until && until > Clock.UtcNow)
        {
            throw new AppException(
                ErrorCodes.AuthAccountInactive,
                $"嘗試次數過多，請於 {until:HH:mm} (UTC) 後再試。",
                423);
        }

        var (verified, needsRehash) = hasher.Verify(password, user.PasswordHash);

        if (!verified)
        {
            user.FailedLoginCount = (byte)Math.Min(user.FailedLoginCount + 1, byte.MaxValue);

            if (user.FailedLoginCount >= MaxFailedLogins)
            {
                user.LockoutEndsAt = Clock.UtcNow.Add(LockoutDuration);
                user.FailedLoginCount = 0;
                logger.LogWarning("帳號 {Username} 連續登入失敗，鎖定至 {Until}。", user.Username, user.LockoutEndsAt);
            }

            await db.SaveChangesAsync(cancellationToken);
            throw new AppException(ErrorCodes.AuthInvalidCredentials, "帳號或密碼不正確。", 401);
        }

        // 參數升級：驗證成功時順手以新參數重算，使用者無感（database.md §14.2）。
        if (needsRehash)
        {
            user.PasswordHash = hasher.Hash(password);
        }

        user.FailedLoginCount = 0;
        user.LockoutEndsAt = null;
        user.LastLoginAt = Clock.UtcNow;

        var result = await IssueAsync(user, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return result;
    }

    public async Task<SignInResult> RefreshAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw AppException.Unauthorized("缺少 refresh token。");
        }

        var hash = HashToken(refreshToken);

        var stored = await db.RefreshTokens
            .AsTracking()
            .Include(t => t.User)
            .ThenInclude(u => u!.UserRoles)
            .ThenInclude(r => r.Role)
            .SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

        if (stored?.User is null || stored.ExpiresAt <= Clock.UtcNow)
        {
            throw AppException.Unauthorized("refresh token 無效或已過期。");
        }

        if (stored.RevokedAt is not null)
        {
            // 已撤銷的 token 又被拿來用 = 可能被重放；把該使用者的 token 全部作廢。
            logger.LogWarning("偵測到已撤銷的 refresh token 被重複使用（user {UserId}）。", stored.UserId);
            await RevokeAllAsync(stored.UserId, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            throw AppException.Unauthorized("refresh token 已失效，請重新登入。");
        }

        if (!stored.User.IsActive)
        {
            throw new AppException(ErrorCodes.AuthAccountInactive, "此帳號已停用。", 403);
        }

        var result = await IssueAsync(stored.User, cancellationToken);

        stored.RevokedAt = Clock.UtcNow;
        stored.ReplacedByTokenHash = HashToken(result.RefreshToken);

        await db.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var hash = HashToken(refreshToken);
        var stored = await db.RefreshTokens.AsTracking().SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

        if (stored is { RevokedAt: null })
        {
            stored.RevokedAt = Clock.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<CurrentUserDto> GetCurrentAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var id = UserId(principal);

        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(r => r.Role)
            .SingleOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw AppException.Unauthorized("找不到這個帳號。");

        return new CurrentUserDto(
            user.Id.ToString(),
            user.Username,
            user.DisplayName,
            user.UserRoles.Select(r => r.Role?.Name ?? string.Empty).Where(name => name.Length > 0).ToArray());
    }

    public async Task ChangePasswordAsync(
        ClaimsPrincipal principal, string? current, string? next, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(next) || next.Length < 12)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "新密碼至少 12 個字元。");
        }

        var id = UserId(principal);
        var user = await db.Users.AsTracking().SingleOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw AppException.Unauthorized("找不到這個帳號。");

        if (!hasher.Verify(current ?? string.Empty, user.PasswordHash).Verified)
        {
            throw new AppException(ErrorCodes.AuthInvalidCredentials, "目前的密碼不正確。", 401);
        }

        user.PasswordHash = hasher.Hash(next);
        user.PasswordChangedAt = Clock.UtcNow;
        user.MustChangePassword = false;

        // 改密碼＝輪替 SecurityStamp 並撤銷全部 refresh token，讓其他裝置上的
        // 既有工作階段立刻失效（docs/cms.md）。
        user.SecurityStamp = Guid.NewGuid();
        await RevokeAllAsync(user.Id, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>簽一顆 access token 並建立一筆新的 refresh token（不 SaveChanges，由呼叫端一起存）。</summary>
    private async Task<SignInResult> IssueAsync(User user, CancellationToken cancellationToken)
    {
        var roles = user.UserRoles
            .Select(r => r.Role?.Name)
            .Where(name => !string.IsNullOrEmpty(name))
            .Select(name => name!)
            .ToArray();

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Username),
            new("name", user.DisplayName),
            // SecurityStamp 進 token：日後要「立刻失效」時比對這一欄即可，不必查 DB 撤銷清單。
            new("security_stamp", user.SecurityStamp.ToString()),
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        if (AdminPermissions.IsSuperAdmin(roles))
        {
            claims.Add(new Claim("is_superadmin", "true"));
        }

        var access = jwt.CreateToken(TokenAudiences.Admin, user.Id.ToString(), claims, AccessLifetime);

        var refresh = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var expiresAt = Clock.UtcNow.Add(RefreshLifetime);

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(refresh),
            ExpiresAt = expiresAt,
        });

        // 順手清掉這個使用者已經過期的列，免得表無限成長。
        var stale = await db.RefreshTokens
            .Where(t => t.UserId == user.Id && t.ExpiresAt < Clock.UtcNow)
            .ToListAsync(cancellationToken);

        db.RefreshTokens.RemoveRange(stale);

        return new SignInResult(
            new AccessTokenDto(access, (int)AccessLifetime.TotalSeconds, user.MustChangePassword),
            refresh,
            expiresAt);
    }

    private async Task RevokeAllAsync(Guid userId, CancellationToken cancellationToken)
    {
        var tokens = await db.RefreshTokens
            .AsTracking()
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.RevokedAt = Clock.UtcNow;
        }
    }

    /// <summary>只存雜湊：資料庫外洩時，裡面的字串換不到任何工作階段。</summary>
    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static Guid UserId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirst("sub")?.Value ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id)
            ? id
            : throw AppException.Unauthorized("token 缺少使用者識別。");
}
