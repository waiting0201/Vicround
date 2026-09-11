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

public interface IAccountAuthService
{
    Task<RegisterResultDto> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<MemberSignInResult> LoginAsync(string? email, string? password, CancellationToken cancellationToken);
    Task<MemberSignInResult> RefreshAsync(string? refreshToken, CancellationToken cancellationToken);
    Task LogoutAsync(string? refreshToken, CancellationToken cancellationToken);
    Task<MemberProfileDto> GetCurrentAsync(ClaimsPrincipal principal, CancellationToken cancellationToken);
    Task<MemberProfileDto> UpdateProfileAsync(
        ClaimsPrincipal principal, MemberProfileUpdateRequest request, CancellationToken cancellationToken);
    Task ChangePasswordAsync(
        ClaimsPrincipal principal, string? current, string? next, CancellationToken cancellationToken);
    Task<RegisterResultDto> VerifyEmailAsync(string? token, CancellationToken cancellationToken);
    Task ResendVerificationAsync(string? email, CancellationToken cancellationToken);
    Task ForgotPasswordAsync(string? email, CancellationToken cancellationToken);
    Task ResetPasswordAsync(string? token, string? newPassword, CancellationToken cancellationToken);
}

/// <summary>
/// 前台會員身分（database.md §14、docs/cms-api.md「Account API」）。
///
/// <para>
/// 形狀刻意對齊 <see cref="AdminAuthService"/>（短命 access token + 可撤銷 refresh token +
/// SecurityStamp），但**兩者是兩套身分**：不同的 issuer／audience／簽章金鑰／cookie，
/// 一邊的 token 打到另一邊永遠是 401。共用一支服務的那天，就是某個會員拿到後台權限的那天。
/// </para>
///
/// <para>
/// <b>狀態機</b>（§14.3）：註冊 → <c>PendingEmailVerification</c> → 點驗證信 →
/// 網域規則是 <c>AutoApprove</c> 就直接 <c>Approved</c>，否則 <c>PendingApproval</c> 等後台審核。
/// <c>Block</c> 網域在註冊當下就回 400，不建帳號。
/// </para>
/// </summary>
public sealed class AccountAuthService(
    VicRoundDbContext db,
    IJwtService jwt,
    IPasswordHasher hasher,
    IMemberNotifier notifier,
    ILogger<AccountAuthService> logger) : IAccountAuthService
{
    private static readonly TimeSpan AccessLifetime = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan RefreshLifetime = TimeSpan.FromDays(14);

    /// <summary>驗證信與重設密碼信的有效期。短到外流也沒用，長到使用者隔天才看信也還來得及。</summary>
    private static readonly TimeSpan VerificationLifetime = TimeSpan.FromDays(3);
    private static readonly TimeSpan ResetLifetime = TimeSpan.FromHours(2);

    private const int MaxFailedLogins = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    /// <summary>與後台同一條規則（§14.2）。密碼長度是這裡唯一的硬性要求。</summary>
    private const int MinPasswordLength = 12;

    public async Task<RegisterResultDto> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email?.Trim() ?? string.Empty;

        if (email.Length == 0 || string.IsNullOrWhiteSpace(request.Password))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請填寫 Email 與密碼。");
        }

        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.CompanyName))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請填寫姓名與公司名稱。");
        }

        if (!email.Contains('@') || email.Length > 320)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "Email 格式不正確。");
        }

        if (request.Password.Length < MinPasswordLength)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, $"密碼至少 {MinPasswordLength} 個字元。");
        }

        // 同意隱私政策是法遵欄位，沒勾就不建帳號。
        if (!request.Consent)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請先同意隱私權政策。");
        }

        var normalized = email.ToUpperInvariant();
        var domain = email[(email.IndexOf('@') + 1)..].ToLowerInvariant();

        var rule = await db.BusinessDomainRules
            .Where(r => r.Domain == domain)
            .Select(r => (BusinessDomainRule?)r.Rule)
            .FirstOrDefaultAsync(cancellationToken);

        if (rule == BusinessDomainRule.Block)
        {
            throw AppException.BadRequest(
                ErrorCodes.ValidationFormat, "請改用公司的電子郵件信箱註冊。");
        }

        // 已註冊時不告訴對方「這個 email 已存在」——那會讓註冊頁變成帳號探測器。
        // 照樣回同一句話，但不建立第二個帳號，也不重寄信給已核准的人。
        var existing = await db.Members
            .AsTracking()
            .SingleOrDefaultAsync(m => m.EmailNormalized == normalized, cancellationToken);

        if (existing is not null)
        {
            if (existing.Status == MemberStatus.PendingEmailVerification)
            {
                await IssueVerificationAsync(existing, cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
            }

            return new RegisterResultDto(
                MemberEnumNames.Status(MemberStatus.PendingEmailVerification),
                "若這個 Email 可以註冊，我們已經寄出一封驗證信。");
        }

        var policyVersion = await db.SiteSettings
            .Where(s => s.Key == "privacy.policyVersion")
            .Select(s => s.Value)
            .FirstOrDefaultAsync(cancellationToken);

        var member = new Member
        {
            Email = email,
            EmailNormalized = normalized,
            PasswordHash = hasher.Hash(request.Password),
            PasswordChangedAt = Clock.UtcNow,
            FullName = request.FullName.Trim(),
            CompanyName = request.CompanyName.Trim(),
            JobRole = MemberEnumNames.ParseJobRole(request.JobRole),
            JobRoleOther = request.JobRole == "other" ? request.JobRoleOther?.Trim() : null,
            Phone = request.Phone?.Trim(),
            CountryCode = request.CountryCode?.Trim(),
            PreferredCulture = LangResolver.NormalizeOrDefault(request.Culture),
            Status = MemberStatus.PendingEmailVerification,
            ConsentedPrivacyAt = Clock.UtcNow,
            ConsentPolicyVersion = policyVersion ?? string.Empty,
            MarketingOptInAt = request.MarketingOptIn ? Clock.UtcNow : null,
        };

        db.Members.Add(member);
        await IssueVerificationAsync(member, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation("新會員註冊 {Email}（網域規則 {Rule}）。", member.Email, rule?.ToString() ?? "none");

        return new RegisterResultDto(
            MemberEnumNames.Status(MemberStatus.PendingEmailVerification),
            "若這個 Email 可以註冊，我們已經寄出一封驗證信。");
    }

    public async Task<MemberSignInResult> LoginAsync(string? email, string? password, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請輸入 Email 與密碼。");
        }

        var normalized = email.Trim().ToUpperInvariant();

        var member = await db.Members
            .AsTracking()
            .SingleOrDefaultAsync(m => m.EmailNormalized == normalized, cancellationToken);

        if (member is null)
        {
            throw new AppException(ErrorCodes.AuthInvalidCredentials, "Email 或密碼不正確。", 401);
        }

        if (member.LockoutEndsAt is { } until && until > Clock.UtcNow)
        {
            throw new AppException(
                ErrorCodes.AuthAccountInactive, $"嘗試次數過多，請於 {until:HH:mm} (UTC) 後再試。", 423);
        }

        var (verified, needsRehash) = hasher.Verify(password, member.PasswordHash);

        if (!verified)
        {
            member.FailedLoginCount = (byte)Math.Min(member.FailedLoginCount + 1, byte.MaxValue);

            if (member.FailedLoginCount >= MaxFailedLogins)
            {
                member.LockoutEndsAt = Clock.UtcNow.Add(LockoutDuration);
                member.FailedLoginCount = 0;
            }

            await db.SaveChangesAsync(cancellationToken);
            throw new AppException(ErrorCodes.AuthInvalidCredentials, "Email 或密碼不正確。", 401);
        }

        // 被拒絕或停權的帳號連 token 都不發；待驗證／待審核仍然發，
        // 因為會員專區本來就要讓他們登入看到「目前卡在哪一關」。
        if (member.Status is MemberStatus.Rejected or MemberStatus.Suspended)
        {
            throw new AppException(
                ErrorCodes.AuthAccountInactive,
                member.Status == MemberStatus.Rejected ? "此申請未通過審核。" : "此帳號已停權。",
                403);
        }

        if (needsRehash)
        {
            member.PasswordHash = hasher.Hash(password);
        }

        member.FailedLoginCount = 0;
        member.LockoutEndsAt = null;
        member.LastLoginAt = Clock.UtcNow;

        var result = Issue(member);
        await db.SaveChangesAsync(cancellationToken);

        return result;
    }

    public async Task<MemberSignInResult> RefreshAsync(string? refreshToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw AppException.Unauthorized("缺少 refresh token。");
        }

        var hash = HashToken(refreshToken);

        var stored = await db.MemberRefreshTokens
            .AsTracking()
            .Include(t => t.Member)
            .SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

        if (stored?.Member is null || stored.ExpiresAt <= Clock.UtcNow)
        {
            throw AppException.Unauthorized("refresh token 無效或已過期。");
        }

        if (stored.RevokedAt is not null)
        {
            logger.LogWarning("偵測到已撤銷的會員 refresh token 被重複使用（member {MemberId}）。", stored.MemberId);
            await RevokeAllAsync(stored.MemberId, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            throw AppException.Unauthorized("refresh token 已失效，請重新登入。");
        }

        if (stored.Member.Status is MemberStatus.Rejected or MemberStatus.Suspended)
        {
            throw new AppException(ErrorCodes.AuthAccountInactive, "此帳號無法使用。", 403);
        }

        var result = Issue(stored.Member);

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
        var stored = await db.MemberRefreshTokens
            .AsTracking()
            .SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);

        if (stored is { RevokedAt: null })
        {
            stored.RevokedAt = Clock.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<MemberProfileDto> GetCurrentAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var member = await LoadAsync(principal, tracking: false, cancellationToken);
        return Profile(member);
    }

    public async Task<MemberProfileDto> UpdateProfileAsync(
        ClaimsPrincipal principal, MemberProfileUpdateRequest request, CancellationToken cancellationToken)
    {
        var member = await LoadAsync(principal, tracking: true, cancellationToken);

        // Email 不在可改欄位裡：它是帳號識別，也是審核時比對公司網域的依據，
        // 要換信箱等於換一個帳號。
        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            member.FullName = request.FullName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.CompanyName))
        {
            member.CompanyName = request.CompanyName.Trim();
        }

        if (request.JobRole is not null)
        {
            member.JobRole = MemberEnumNames.ParseJobRole(request.JobRole);
            member.JobRoleOther = request.JobRole == "other" ? request.JobRoleOther?.Trim() : null;
        }

        member.Phone = request.Phone?.Trim();
        member.CountryCode = request.CountryCode?.Trim();

        if (!string.IsNullOrWhiteSpace(request.PreferredCulture))
        {
            member.PreferredCulture = LangResolver.NormalizeOrDefault(request.PreferredCulture);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Profile(member);
    }

    public async Task ChangePasswordAsync(
        ClaimsPrincipal principal, string? current, string? next, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(next) || next.Length < MinPasswordLength)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, $"新密碼至少 {MinPasswordLength} 個字元。");
        }

        var member = await LoadAsync(principal, tracking: true, cancellationToken);

        if (!hasher.Verify(current ?? string.Empty, member.PasswordHash).Verified)
        {
            throw new AppException(ErrorCodes.AuthInvalidCredentials, "目前的密碼不正確。", 401);
        }

        member.PasswordHash = hasher.Hash(next);
        member.PasswordChangedAt = Clock.UtcNow;
        member.MustChangePassword = false;
        member.SecurityStamp = Guid.NewGuid();

        await RevokeAllAsync(member.Id, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<RegisterResultDto> VerifyEmailAsync(string? token, CancellationToken cancellationToken)
    {
        var stored = await ConsumeTokenAsync(token, MemberTokenPurpose.EmailVerification, cancellationToken);
        var member = stored.Member!;

        if (member.Status == MemberStatus.PendingEmailVerification)
        {
            member.EmailVerifiedAt = Clock.UtcNow;

            // 驗證完才查網域規則：AutoApprove 直接放行，其餘進後台審核佇列。
            var rule = await db.BusinessDomainRules
                .Where(r => r.Domain == member.EmailDomain)
                .Select(r => (BusinessDomainRule?)r.Rule)
                .FirstOrDefaultAsync(cancellationToken);

            if (rule == BusinessDomainRule.AutoApprove)
            {
                member.Status = MemberStatus.Approved;
                member.ApprovedAt = Clock.UtcNow;
            }
            else
            {
                member.Status = MemberStatus.PendingApproval;
            }
        }

        await db.SaveChangesAsync(cancellationToken);

        return new RegisterResultDto(
            MemberEnumNames.Status(member.Status),
            member.Status == MemberStatus.Approved
                ? "Email 已驗證，帳號可以使用了。"
                : "Email 已驗證，申請進入審核，通常一個工作天內完成。");
    }

    public async Task ResendVerificationAsync(string? email, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請輸入 Email。");
        }

        var normalized = email.Trim().ToUpperInvariant();
        var member = await db.Members
            .AsTracking()
            .SingleOrDefaultAsync(m => m.EmailNormalized == normalized, cancellationToken);

        // 查無此人也照樣回 204：不讓這支端點變成帳號探測器。
        if (member is { Status: MemberStatus.PendingEmailVerification })
        {
            await IssueVerificationAsync(member, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task ForgotPasswordAsync(string? email, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請輸入 Email。");
        }

        var normalized = email.Trim().ToUpperInvariant();
        var member = await db.Members
            .AsTracking()
            .SingleOrDefaultAsync(m => m.EmailNormalized == normalized, cancellationToken);

        if (member is not null && member.Status is not (MemberStatus.Rejected or MemberStatus.Suspended))
        {
            var raw = NewToken();

            db.MemberTokens.Add(new MemberToken
            {
                MemberId = member.Id,
                Purpose = MemberTokenPurpose.PasswordReset,
                TokenHash = HashToken(raw),
                ExpiresAt = Clock.UtcNow.Add(ResetLifetime),
            });

            await db.SaveChangesAsync(cancellationToken);
            await notifier.SendPasswordResetAsync(member, raw, cancellationToken);
        }
    }

    public async Task ResetPasswordAsync(string? token, string? newPassword, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < MinPasswordLength)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, $"新密碼至少 {MinPasswordLength} 個字元。");
        }

        var stored = await ConsumeTokenAsync(token, MemberTokenPurpose.PasswordReset, cancellationToken);
        var member = stored.Member!;

        member.PasswordHash = hasher.Hash(newPassword);
        member.PasswordChangedAt = Clock.UtcNow;
        member.MustChangePassword = false;
        member.SecurityStamp = Guid.NewGuid();
        member.FailedLoginCount = 0;
        member.LockoutEndsAt = null;

        // 重設密碼等於「我懷疑帳號被盜」，所以其他裝置上的工作階段一律作廢。
        await RevokeAllAsync(member.Id, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    /// <summary>建一顆一次性 token 並請 notifier 寄出。呼叫端負責 SaveChanges。</summary>
    private async Task IssueVerificationAsync(Member member, CancellationToken cancellationToken)
    {
        var raw = NewToken();

        db.MemberTokens.Add(new MemberToken
        {
            MemberId = member.Id,
            Purpose = MemberTokenPurpose.EmailVerification,
            TokenHash = HashToken(raw),
            ExpiresAt = Clock.UtcNow.Add(VerificationLifetime),
        });

        await notifier.SendEmailVerificationAsync(member, raw, cancellationToken);
    }

    /// <summary>驗證並「用掉」一顆一次性 token。過期、用過、不存在都是同一個錯誤。</summary>
    private async Task<MemberToken> ConsumeTokenAsync(
        string? token, MemberTokenPurpose purpose, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "缺少驗證碼。");
        }

        var hash = HashToken(token);

        var stored = await db.MemberTokens
            .AsTracking()
            .Include(t => t.Member)
            .SingleOrDefaultAsync(t => t.TokenHash == hash && t.Purpose == purpose, cancellationToken);

        if (stored?.Member is null || stored.ConsumedAt is not null || stored.ExpiresAt <= Clock.UtcNow)
        {
            throw new AppException(ErrorCodes.AuthTokenInvalid, "這個連結無效或已過期，請重新申請。", 400);
        }

        stored.ConsumedAt = Clock.UtcNow;
        return stored;
    }

    /// <summary>簽 access token 並建一筆 refresh token（不 SaveChanges，由呼叫端一起存）。</summary>
    private MemberSignInResult Issue(Member member)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, member.Email),
            new("name", member.FullName),
            new("company", member.CompanyName),
            // 狀態進 token，讓端點不必為了判斷「能不能下載」多查一次 DB；
            // 狀態改變時後台會撤銷 refresh token，最多 15 分鐘後就跟著失效。
            new("member_status", MemberEnumNames.Status(member.Status)),
            new("security_stamp", member.SecurityStamp.ToString()),
        };

        var access = jwt.CreateToken(TokenAudiences.Member, member.Id.ToString(), claims, AccessLifetime);

        var refresh = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var expiresAt = Clock.UtcNow.Add(RefreshLifetime);

        db.MemberRefreshTokens.Add(new MemberRefreshToken
        {
            MemberId = member.Id,
            TokenHash = HashToken(refresh),
            ExpiresAt = expiresAt,
        });

        return new MemberSignInResult(
            new MemberTokenDto(access, (int)AccessLifetime.TotalSeconds),
            refresh,
            expiresAt);
    }

    private async Task<Member> LoadAsync(ClaimsPrincipal principal, bool tracking, CancellationToken cancellationToken)
    {
        var id = MemberId(principal);
        var query = tracking ? db.Members.AsTracking() : db.Members;

        return await query.SingleOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw AppException.Unauthorized("找不到這個帳號。");
    }

    private async Task RevokeAllAsync(Guid memberId, CancellationToken cancellationToken)
    {
        var tokens = await db.MemberRefreshTokens
            .AsTracking()
            .Where(t => t.MemberId == memberId && t.RevokedAt == null)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.RevokedAt = Clock.UtcNow;
        }
    }

    private static MemberProfileDto Profile(Member member) => new(
        member.Id.ToString(),
        member.Email,
        member.FullName,
        member.CompanyName,
        MemberEnumNames.JobRole(member.JobRole),
        member.JobRoleOther,
        member.Phone,
        member.CountryCode,
        member.PreferredCulture,
        MemberEnumNames.Status(member.Status),
        member.ApprovedAt,
        member.MustChangePassword);

    private static string NewToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public static Guid MemberId(ClaimsPrincipal principal) =>
        Guid.TryParse(
            principal.FindFirst("sub")?.Value ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            out var id)
            ? id
            : throw AppException.Unauthorized("token 缺少會員識別。");
}
