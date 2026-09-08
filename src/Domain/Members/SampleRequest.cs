using VicRound.Domain.Catalog;
using VicRound.Domain.Common;

namespace VicRound.Domain.Members;

/// <summary>
/// database.md §14.4。業務資料，保留。狀態歷程用<b>每階段一個時間戳</b>表達，
/// 不建 <c>SampleRequestStatusHistory</c>（§0.7）。
/// </summary>
public class SampleRequest : IHasTimestamps
{
    public Guid Id { get; set; }

    /// <summary>對外顯示的業務編號：<c>SR-2026-000123</c>。</summary>
    public string RequestNumber { get; set; } = string.Empty;

    public Guid MemberId { get; set; }
    public Member? Member { get; set; }

    /// <summary>「重下同批規格」時指向來源單。</summary>
    public Guid? SourceSampleRequestId { get; set; }
    public SampleRequest? SourceSampleRequest { get; set; }

    public SampleRequestStatus Status { get; set; } = SampleRequestStatus.Draft;

    public string ShipToName { get; set; } = string.Empty;
    public string ShipToCompany { get; set; } = string.Empty;
    public string ShipToAddressLine1 { get; set; } = string.Empty;
    public string? ShipToAddressLine2 { get; set; }
    public string ShipToCity { get; set; } = string.Empty;
    public string? ShipToState { get; set; }
    public string ShipToPostalCode { get; set; } = string.Empty;
    public string ShipToCountryCode { get; set; } = string.Empty;
    public string ShipToPhone { get; set; } = string.Empty;

    public string? ProjectName { get; set; }
    public string? TargetApplication { get; set; }
    public string? MemberNote { get; set; }
    public string? InternalNote { get; set; }

    // 每個狀態一個時間戳（取代歷程表）
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectionReason { get; set; }

    public string? Carrier { get; set; }
    public string? TrackingNumber { get; set; }
    public string? TrackingUrl { get; set; }

    /// <summary>預留給未來 ERP 對接。</summary>
    public string? ExternalOrderNumber { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public ICollection<SampleRequestItem> Items { get; set; } = new List<SampleRequestItem>();
}

public class SampleRequestItem : IHasTimestamps
{
    public int Id { get; set; }

    public Guid SampleRequestId { get; set; }
    public SampleRequest? SampleRequest { get; set; }

    public int? ProductId { get; set; }
    public Product? Product { get; set; }

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    /// <summary><c>VR-AC 360-A</c>——產品被 archive 也留得住。</summary>
    public string? GradeCode { get; set; }

    /// <summary>送出當下的名稱快照。</summary>
    public string ProductNameSnapshot { get; set; } = string.Empty;

    public string? RequestedSpec { get; set; }

    /// <summary>實際出貨批號，支援「重下同批規格」。</summary>
    public string? LotSpecReference { get; set; }

    public int Quantity { get; set; }

    /// <summary><c>sheets</c> / <c>m²</c> / <c>pcs</c>。</summary>
    public string Unit { get; set; } = string.Empty;

    public int? ShippedQuantity { get; set; }
    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
