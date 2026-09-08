using VicRound.Domain.Common;
using VicRound.Domain.Globalization;

namespace VicRound.Domain.Members;

/// <summary>
/// database.md §14。<b>前台</b>會員，與後台 <c>Users</c> 完全隔離（issuer <c>vicround-account</c>）。
/// 只有 <see cref="MemberStatus.Approved"/> 能取得 MemberOnly 下載與送出樣品申請。
/// </summary>
public class Member : IHasTimestamps
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;
    public string EmailNormalized { get; set; } = string.Empty;

    /// <summary>
    /// 計算欄位（PERSISTED）：<c>LOWER(SUBSTRING(Email, CHARINDEX('@', Email) + 1, 320))</c>。
    /// 供 <see cref="BusinessDomainRule"/> 比對與同公司彙整。
    /// </summary>
    public string EmailDomain { get; set; } = string.Empty;

    /// <summary>PHC 風格字串，格式與 <c>Users</c> 相同（§14.2）。</summary>
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime? PasswordChangedAt { get; set; }
    public bool MustChangePassword { get; set; }
    public Guid SecurityStamp { get; set; } = Guid.NewGuid();

    public string FullName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public MemberJobRole JobRole { get; set; }

    /// <summary><c>JobRole = Other</c> 時的自由輸入。</summary>
    public string? JobRoleOther { get; set; }

    public string? Phone { get; set; }
    public string? CountryCode { get; set; }

    public string PreferredCulture { get; set; } = CultureCodes.Default;
    public Culture? PreferredCultureRef { get; set; }

    public MemberStatus Status { get; set; } = MemberStatus.PendingEmailVerification;
    public DateTime? EmailVerifiedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }

    /// <summary>審核備註／拒絕理由——業務資料，不是稽核 log。</summary>
    public string? ReviewNote { get; set; }

    public DateTime ConsentedPrivacyAt { get; set; }
    public string ConsentPolicyVersion { get; set; } = string.Empty;
    public DateTime? MarketingOptInAt { get; set; }

    public byte FailedLoginCount { get; set; }
    public DateTime? LockoutEndsAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public ICollection<MemberRefreshToken> RefreshTokens { get; set; } = new List<MemberRefreshToken>();
    public ICollection<MemberToken> Tokens { get; set; } = new List<MemberToken>();
    public ICollection<SampleRequest> SampleRequests { get; set; } = new List<SampleRequest>();
}

public class MemberRefreshToken
{
    public Guid Id { get; set; }

    public Guid MemberId { get; set; }
    public Member? Member { get; set; }

    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>一表兩用（驗證信 / 重設密碼），避免兩張近乎相同的表。</summary>
public class MemberToken
{
    public Guid Id { get; set; }

    public Guid MemberId { get; set; }
    public Member? Member { get; set; }

    public MemberTokenPurpose Purpose { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? ConsumedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 「Accounts are verified against a business domain」。註冊時查此表：
/// Block → 400 不建帳號；AutoApprove → 驗證信點完即 Approved；其餘進後台審核佇列。
/// </summary>
public class BusinessDomainRuleEntry : IHasTimestamps
{
    public int Id { get; set; }

    /// <summary>小寫網域，如 <c>gmail.com</c>。</summary>
    public string Domain { get; set; } = string.Empty;

    public BusinessDomainRule Rule { get; set; }
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}
