using VicRound.Api.Models.Entities;

namespace VicRound.Api.Models.Dtos;

/// <summary>
/// 會員專區的傳輸物件（docs/cms-api.md「Account API」）。
///
/// <para>
/// 與 <see cref="AdminDtos"/> 分開的理由不是排版，是**這兩組身分永遠不該共用型別**：
/// 共用一個 <c>CurrentUserDto</c> 的那一天，就是某個欄位在其中一邊多回了東西的那一天。
/// </para>
/// </summary>
public sealed record MemberTokenDto(string AccessToken, int ExpiresInSeconds);

/// <param name="Status">
/// 前台要靠它決定畫面：<c>pendingEmailVerification</c> 顯示「請收驗證信」、
/// <c>pendingApproval</c> 顯示「審核中」、<c>approved</c> 才放行下載與樣品申請。
/// </param>
public sealed record MemberProfileDto(
    string Id,
    string Email,
    string FullName,
    string CompanyName,
    string JobRole,
    string? JobRoleOther,
    string? Phone,
    string? CountryCode,
    string PreferredCulture,
    string Status,
    DateTime? ApprovedAt,
    bool MustChangePassword);

public sealed record MemberSignInResult(MemberTokenDto Token, string RefreshToken, DateTime RefreshExpiresAt);

/// <summary>註冊的結果。<c>Status</c> 決定前台顯示哪一段說明。</summary>
public sealed record RegisterResultDto(string Status, string Message);

public sealed class RegisterRequest
{
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? FullName { get; set; }
    public string? CompanyName { get; set; }
    public string? JobRole { get; set; }
    public string? JobRoleOther { get; set; }
    public string? Phone { get; set; }
    public string? CountryCode { get; set; }
    public string? Culture { get; set; }

    /// <summary>隱私政策同意。沒有勾就不建帳號——這是法遵欄位，不是 UI 裝飾。</summary>
    public bool Consent { get; set; }

    public bool MarketingOptIn { get; set; }
}

public sealed class MemberLoginRequest
{
    public string? Email { get; set; }
    public string? Password { get; set; }
}

public sealed class MemberProfileUpdateRequest
{
    public string? FullName { get; set; }
    public string? CompanyName { get; set; }
    public string? JobRole { get; set; }
    public string? JobRoleOther { get; set; }
    public string? Phone { get; set; }
    public string? CountryCode { get; set; }
    public string? PreferredCulture { get; set; }
}

public sealed class MemberTokenRequest
{
    /// <summary>驗證信／重設密碼信裡的那一串。</summary>
    public string? Token { get; set; }

    public string? Email { get; set; }
    public string? NewPassword { get; set; }
}

public sealed class MemberChangePasswordRequest
{
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
}

/// <summary>會員可見的下載項目。<c>FileUrl</c> 一律為 null——真實網址要另外換 SAS。</summary>
public sealed record MemberDownloadDto(
    string Slug,
    string Title,
    string? Description,
    string Kind,
    string AccessLevel,
    string? Version,
    DateTime? DocumentDate,
    DateTime? ValidUntil,
    string? FileName,
    long? FileSizeBytes,
    string? MimeType,
    bool CanDownload);

public sealed record DownloadLinkDto(string Url, DateTime ExpiresAt);

public sealed record SampleRequestItemDto(
    string? ProductSlug,
    string ProductName,
    string? GradeCode,
    string? RequestedSpec,
    int Quantity,
    string Unit,
    int? ShippedQuantity);

public sealed record ShippingAddressDto(
    string Name,
    string Company,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string? State,
    string PostalCode,
    string CountryCode,
    string Phone);

public sealed record SampleRequestDto(
    string RequestNumber,
    string Status,
    DateTime CreatedAt,
    DateTime? SubmittedAt,
    DateTime? ApprovedAt,
    DateTime? ShippedAt,
    DateTime? DeliveredAt,
    string? RejectionReason,
    string? Carrier,
    string? TrackingNumber,
    string? TrackingUrl,
    string? ProjectName,
    string? TargetApplication,
    string? MemberNote,
    ShippingAddressDto ShipTo,
    IReadOnlyList<SampleRequestItemDto> Items);

/// <summary>清單用的精簡版。列表不需要整份地址與每一個品項。</summary>
public sealed record SampleRequestSummaryDto(
    string RequestNumber,
    string Status,
    DateTime CreatedAt,
    DateTime? SubmittedAt,
    DateTime? ShippedAt,
    string? TrackingNumber,
    int ItemCount);

public sealed class SampleRequestCreateRequest
{
    public string? ShipToName { get; set; }
    public string? ShipToCompany { get; set; }
    public string? ShipToAddressLine1 { get; set; }
    public string? ShipToAddressLine2 { get; set; }
    public string? ShipToCity { get; set; }
    public string? ShipToState { get; set; }
    public string? ShipToPostalCode { get; set; }
    public string? ShipToCountryCode { get; set; }
    public string? ShipToPhone { get; set; }

    public string? ProjectName { get; set; }
    public string? TargetApplication { get; set; }
    public string? MemberNote { get; set; }

    public List<SampleRequestItemInput> Items { get; set; } = [];
}

public sealed class SampleRequestItemInput
{
    public string? ProductSlug { get; set; }
    public string? GradeCode { get; set; }
    public string? RequestedSpec { get; set; }
    public int Quantity { get; set; } = 1;
    public string? Unit { get; set; }
}

/// <summary>列舉值 ⇄ 對外字串。對外一律 camelCase，不把 byte 值洩到 API 上。</summary>
public static class MemberEnumNames
{
    public static string Status(MemberStatus status) => status switch
    {
        MemberStatus.PendingEmailVerification => "pendingEmailVerification",
        MemberStatus.PendingApproval => "pendingApproval",
        MemberStatus.Approved => "approved",
        MemberStatus.Rejected => "rejected",
        MemberStatus.Suspended => "suspended",
        _ => "unknown",
    };

    public static string JobRole(MemberJobRole role) => role switch
    {
        MemberJobRole.EngineeringRnd => "engineeringRnd",
        MemberJobRole.Procurement => "procurement",
        MemberJobRole.ProductManagement => "productManagement",
        MemberJobRole.Quality => "quality",
        _ => "other",
    };

    public static MemberJobRole ParseJobRole(string? value) => value switch
    {
        "engineeringRnd" => MemberJobRole.EngineeringRnd,
        "procurement" => MemberJobRole.Procurement,
        "productManagement" => MemberJobRole.ProductManagement,
        "quality" => MemberJobRole.Quality,
        _ => MemberJobRole.Other,
    };

    public static string SampleStatus(SampleRequestStatus status) => status switch
    {
        SampleRequestStatus.Draft => "draft",
        SampleRequestStatus.Submitted => "submitted",
        SampleRequestStatus.UnderReview => "underReview",
        SampleRequestStatus.Approved => "approved",
        SampleRequestStatus.Shipped => "shipped",
        SampleRequestStatus.Delivered => "delivered",
        SampleRequestStatus.Rejected => "rejected",
        SampleRequestStatus.Cancelled => "cancelled",
        _ => "unknown",
    };
}
