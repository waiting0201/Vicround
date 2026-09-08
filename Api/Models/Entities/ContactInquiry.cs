
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §12。Contact 頁與 Header 的 contact drawer 是同一個表單、同一個端點。
/// <b>不存 IP 位址</b>——rate-limit 在 Functions middleware 處理，不落 DB，避免它變成事實上的
/// log 表並降低 GDPR 責任。PK 用 GUID：Id 會出現在回信連結與支援對話中，不可被枚舉。
/// </summary>
public class ContactInquiry : IHasTimestamps
{
    public Guid Id { get; set; }

    /// <summary>對外顯示的業務編號：<c>INQ-2026-000431</c>。</summary>
    public string ReferenceNumber { get; set; } = string.Empty;

    public InquiryType Type { get; set; }

    public string Name { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }

    /// <summary>表單的 Product Line 下拉。</summary>
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    /// <summary>選 Other 時的自由輸入。</summary>
    public string? ProductLineOther { get; set; }

    /// <summary>從產品頁「Request a sample」帶入。</summary>
    public int? RefProductId { get; set; }
    public Product? RefProduct { get; set; }

    /// <summary><c>AccessLevel = OnRequest</c> 的文件索取。</summary>
    public int? RefDownloadId { get; set; }
    public Download? RefDownload { get; set; }

    public string? ApplicationText { get; set; }
    public string? TargetSpec { get; set; }
    public string? Message { get; set; }

    public string SourceUrl { get; set; } = string.Empty;
    public string Culture { get; set; } = CultureCodes.Default;
    public Culture? CultureRef { get; set; }

    /// <summary>已登入會員送出時帶入。</summary>
    public Guid? MemberId { get; set; }
    public Member? Member { get; set; }

    public DateTime ConsentedAt { get; set; }
    public string ConsentPolicyVersion { get; set; } = string.Empty;

    public InquiryStatus Status { get; set; } = InquiryStatus.New;

    public int? AssignedChannelId { get; set; }
    public ContactChannel? AssignedChannel { get; set; }

    public string? InternalNote { get; set; }
    public DateTime? RespondedAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}
