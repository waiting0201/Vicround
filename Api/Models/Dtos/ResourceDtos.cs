namespace VicRound.Api.Models.Dtos;

// 資源中心（文章／展會／FAQ／認證／下載）、導覽與技術頁的公開回傳形狀。
// 與 ContentDtos.cs 同一組規則：只帶該語系的文字 + slug + 已解析好的公開路徑，
// 不外流 Status、Id 或任何內部欄位（docs/cms-api.md）。

/// <summary>導覽的一個節點。<c>Path</c> 已由 <c>Ref*Id</c> 解析完成，前台只需補語系前綴。</summary>
public sealed record NavigationNodeDto
{
    public required string LinkType { get; init; }

    /// <summary>站內路徑或外部網址；<c>contactModal</c> 這類沒有目的地的項目為 <c>null</c>。</summary>
    public string? Path { get; init; }

    public bool IsExternal { get; init; }
    public bool OpenInNewTab { get; init; }
    public string? IconName { get; init; }
    public string? Label { get; init; }
    public string? Note { get; init; }
    public string? MenuTitle { get; init; }
    public string? AriaLabel { get; init; }
    public bool HasRequestedCulture { get; init; }
    public IReadOnlyList<NavigationNodeDto> Children { get; init; } = [];
}

/// <summary>一個導覽位置（header／footer／legal／social／search-chip）與它的節點。</summary>
public sealed record NavigationGroupDto(string Location, IReadOnlyList<NavigationNodeDto> Items);

public sealed record AuthorDto(string Slug, string? Name, string? JobTitle, string? Initials, string? AvatarUrl);

public sealed record ChipDto(string Slug, string? Name, string Path);

public sealed record ArticleListItemDto
{
    public required string Slug { get; init; }
    public required string Type { get; init; }

    /// <summary>已含前綴的公開路徑（<c>/news/…</c>、<c>/insights/…</c>、<c>/blog/…</c>）。</summary>
    public required string Path { get; init; }

    public DateTime? PublishedAt { get; init; }
    public byte? ReadingMinutes { get; init; }
    public bool IsFeatured { get; init; }
    public string? HeroImageUrl { get; init; }
    public string? Title { get; init; }
    public string? Excerpt { get; init; }
    public AuthorDto? Author { get; init; }
    public IReadOnlyList<ChipDto> Categories { get; init; } = [];
    public IReadOnlyList<ChipDto> Solutions { get; init; } = [];
    public IReadOnlyList<ChipDto> Tags { get; init; } = [];
    public bool HasRequestedCulture { get; init; }
}

public sealed record ArticleDetailDto
{
    public required string Slug { get; init; }
    public required string Type { get; init; }
    public required string Path { get; init; }
    public DateTime? PublishedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public byte? ReadingMinutes { get; init; }
    public string? HeroImageUrl { get; init; }
    public string? Title { get; init; }
    public string? Excerpt { get; init; }
    public string? Lead { get; init; }
    public string? Body { get; init; }
    public string? PullQuote { get; init; }
    public string? PullQuoteAttribution { get; init; }
    public AuthorDto? Author { get; init; }
    public SeoDto? Seo { get; init; }
    public IReadOnlyList<ChipDto> Categories { get; init; } = [];
    public IReadOnlyList<ChipDto> Solutions { get; init; } = [];
    public IReadOnlyList<ChipDto> Tags { get; init; } = [];

    /// <summary><c>Type = Exhibition</c> 時的展會資訊側欄。</summary>
    public ExhibitionDto? Exhibition { get; init; }

    /// <summary>同 Type 內、依發佈時間相鄰的前後篇；沒有則為 <c>null</c>。</summary>
    public ArticleLinkDto? Previous { get; init; }
    public ArticleLinkDto? Next { get; init; }
}

public sealed record ArticleLinkDto(string Slug, string Path, string? Title);

public sealed record ExhibitionDto
{
    public required string Slug { get; init; }
    public required DateOnly StartDate { get; init; }
    public required DateOnly EndDate { get; init; }

    /// <summary>今日仍在檔期內或尚未開始。前台的「Next exhibition」卡只取這一類。</summary>
    public bool IsUpcoming { get; init; }

    public string? BoothNumber { get; init; }
    public string? City { get; init; }
    public string? CountryCode { get; init; }
    public string? WebsiteUrl { get; init; }
    public string? MeetingUrl { get; init; }
    public string? HeroImageUrl { get; init; }
    public string? Name { get; init; }
    public string? VenueName { get; init; }
    public string? Summary { get; init; }
    public string? Description { get; init; }
    public string? OnBoothNote { get; init; }
    public string? CtaLabel { get; init; }
    public bool HasRequestedCulture { get; init; }
}

public sealed record FaqCategoryDto
{
    public required string Slug { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
    public bool HasRequestedCulture { get; init; }
    public IReadOnlyList<FaqItemDto> Items { get; init; } = [];
}

/// <summary>
/// FAQ 需輸出 <c>FAQPage</c> JSON-LD，因此 <c>Answer</c> 一律是完整答案，
/// 不做摘要截斷（爬蟲讀的是這一段）。
/// </summary>
public sealed record FaqItemDto
{
    public required string Slug { get; init; }
    public required string CategorySlug { get; init; }
    public bool IsFeatured { get; init; }
    public string? Question { get; init; }
    public string? Answer { get; init; }
    public string? LinkLabel { get; init; }

    /// <summary>延伸連結：站內以 <c>Ref*Id</c> 解析，外部則為原始網址。</summary>
    public string? LinkPath { get; init; }

    public bool HasRequestedCulture { get; init; }
}

public sealed record CertificationDto
{
    public required string Slug { get; init; }
    public required string Category { get; init; }
    public string? CertificateNumber { get; init; }
    public DateOnly? IssuedOn { get; init; }
    public DateOnly? ValidUntil { get; init; }

    /// <summary>mockup 的「[Pending client input]」虛線卡——內容待客戶提供。</summary>
    public bool IsPlaceholder { get; init; }

    public string? LogoUrl { get; init; }
    public string? Title { get; init; }
    public string? ShortNote { get; init; }
    public string? Summary { get; init; }
    public string? IssuerName { get; init; }
    public string? ValidityText { get; init; }
    public string? ScopeText { get; init; }
    public string? SitesText { get; init; }
    public string? DocumentationLabel { get; init; }

    /// <summary>證書 PDF；<c>MemberOnly</c> / <c>OnRequest</c> 一樣不回真實網址。</summary>
    public DownloadDto? Document { get; init; }

    public IReadOnlyList<ChipDto> Categories { get; init; } = [];
    public bool HasRequestedCulture { get; init; }
}

/// <summary>
/// 依 <c>AccessLevel</c> 回不同內容（docs/cms-api.md）：
/// <c>public</c> 才有 <see cref="FileUrl"/>；<c>memberOnly</c> 回
/// <see cref="RequiresSignIn"/>，實際檔案只能經 Account API 換 SAS；
/// <c>onRequest</c> 回 <see cref="RequestUrl"/>。
/// </summary>
public sealed record DownloadDto
{
    public required string Slug { get; init; }
    public required string Kind { get; init; }
    public required string AccessLevel { get; init; }
    public string? FileUrl { get; init; }
    public bool RequiresSignIn { get; init; }
    public string? RequestUrl { get; init; }
    public string? Version { get; init; }
    public DateOnly? DocumentDate { get; init; }
    public DateOnly? ValidUntil { get; init; }
    public required string FileExtension { get; init; }
    public long FileSizeBytes { get; init; }
    public string? DocumentCulture { get; init; }
    public string? ThumbnailUrl { get; init; }
    public string? Title { get; init; }
    public string? Description { get; init; }
    public bool HasRequestedCulture { get; init; }
}

public sealed record ProcessStepDto
{
    public byte StepNumber { get; init; }
    public string? IconName { get; init; }
    public string? AccentColorHex { get; init; }
    public string? ImageUrl { get; init; }
    public string? Title { get; init; }
    public string? Body { get; init; }
}

public sealed record ProcessFlowDto
{
    public required string Slug { get; init; }
    public required string Kind { get; init; }

    /// <summary>產品線專屬的「How it is made」；其餘 flow 為 <c>null</c>。</summary>
    public string? CategorySlug { get; init; }

    public string? Title { get; init; }
    public string? Subtitle { get; init; }
    public string? Intro { get; init; }
    public bool HasRequestedCulture { get; init; }
    public IReadOnlyList<ProcessStepDto> Steps { get; init; } = [];
}

/// <summary>
/// Technologies 頁一次帶出製程與法規符合表。
/// <c>Compliance</c> 就是 <c>Certifications</c> 裡 <c>Category = ProductCompliance</c> 那幾列——
/// <b>刻意不另建表</b>，否則 RoHS/REACH 會在兩處各存一份（database.md §07）。
/// </summary>
public sealed record TechnologiesDto
{
    public IReadOnlyList<ProcessFlowDto> ProcessFlows { get; init; } = [];
    public IReadOnlyList<CertificationDto> Compliance { get; init; } = [];
}
