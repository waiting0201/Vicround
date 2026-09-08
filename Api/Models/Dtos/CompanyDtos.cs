namespace VicRound.Api.Models.Dtos;

// database.md §08 的五張小表。它們**沒有獨立的 public 端點**——一律由頁面的
// reference block 解析後一併回傳，減少 SSR 往返（docs/cms-api.md）。

public sealed record MilestoneDto
{
    public required int Year { get; init; }
    public byte? Month { get; init; }
    public string? ImageUrl { get; init; }

    /// <summary><c>01 — Founding</c>。</summary>
    public string? Label { get; init; }

    public string? Title { get; init; }
    public string? Body { get; init; }
    public bool HasRequestedCulture { get; init; }
}

public sealed record LocationDto
{
    public required string Type { get; init; }
    public required string CountryCode { get; init; }
    public required string City { get; init; }
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public decimal? Latitude { get; init; }
    public decimal? Longitude { get; init; }
    public string? MapUrl { get; init; }
    public string? ImageUrl { get; init; }
    public string? Name { get; init; }
    public string? AddressLine { get; init; }
    public string? Note { get; init; }
    public string? OpeningHours { get; init; }
    public bool HasRequestedCulture { get; init; }
}

/// <summary>具名需客戶書面授權，因此 <see cref="AuthorName"/> 可能為 <c>null</c>（§08）。</summary>
public sealed record TestimonialDto
{
    public string? Quote { get; init; }
    public string? AuthorName { get; init; }
    public string? AuthorTitle { get; init; }
    public string? CompanyType { get; init; }
    public string? SolutionSlug { get; init; }
    public string? BrandName { get; init; }
    public string? AvatarUrl { get; init; }
    public bool HasRequestedCulture { get; init; }
}

public sealed record PartnerBrandDto
{
    public required string Slug { get; init; }
    public string? LogoUrl { get; init; }
    public string? WebsiteUrl { get; init; }
    public string? Name { get; init; }
    public string? Note { get; init; }
    public bool HasRequestedCulture { get; init; }
}

public sealed record ContactChannelDto
{
    public required string Slug { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }

    /// <summary>詢問單依這個值指派收件窗口（database.md §12）。</summary>
    public required string InquiryType { get; init; }

    public string? Label { get; init; }
    public string? Description { get; init; }
    public bool HasRequestedCulture { get; init; }
}
