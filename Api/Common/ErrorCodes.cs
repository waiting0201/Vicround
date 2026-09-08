namespace VicRound.Api.Common;

/// <summary>
/// 錯誤碼值域。新增時同步更新 docs/cms-api.md 的對照表。
/// <para>VicRound 相對 NTI 多了會員身分，因此增加 <see cref="AuthMemberNotApproved"/>。</para>
/// </summary>
public static class ErrorCodes
{
    public const string ValidationRequired = "VALIDATION_REQUIRED";
    public const string ValidationFormat = "VALIDATION_FORMAT";
    public const string ValidationRange = "VALIDATION_RANGE";

    public const string AuthInvalidCredentials = "AUTH_INVALID_CREDENTIALS";
    public const string AuthTokenInvalid = "AUTH_TOKEN_INVALID";
    public const string AuthMustChangePassword = "AUTH_MUST_CHANGE_PASSWORD";
    public const string AuthAccountInactive = "AUTH_ACCOUNT_INACTIVE";

    /// <summary>會員尚未通過審核（<c>Members.Status != Approved</c>），不得取得 MemberOnly 下載。</summary>
    public const string AuthMemberNotApproved = "AUTH_MEMBER_NOT_APPROVED";

    public const string Forbidden = "FORBIDDEN";
    public const string NotFound = "NOT_FOUND";
    public const string ConflictDuplicate = "CONFLICT_DUPLICATE";
    public const string ConflictState = "CONFLICT_STATE";
    public const string UploadType = "UPLOAD_TYPE";
    public const string UploadSize = "UPLOAD_SIZE";
    public const string RateLimited = "RATE_LIMITED";
    public const string BotCheckFailed = "BOT_CHECK_FAILED";
    public const string Internal = "INTERNAL";
}
