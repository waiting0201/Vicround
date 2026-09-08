namespace VicRound.Api.Models.Dtos;

// 公開 Content API 的回傳形狀。只帶「該語系的文字 + slug + SEO」，
// 不外流 Status、內部備註或任何 Id 以外的內部欄位（docs/cms-api.md）。

/// <summary>
/// 每個內容 DTO 都帶這一欄：<c>false</c> 表示這一列在該語系沒有翻譯、回的是預設語系的內容。
/// 前台據此決定<b>要不要宣告該語系的 hreflang</b>——回退內容不該被當成該語系的正式版本
/// （database.md §0.2）。
/// </summary>
public interface ITranslatedDto
{
    bool HasRequestedCulture { get; init; }
}

public sealed record SeoDto(string? Title, string? Description, string? Keywords);

public sealed record CategoryListItemDto
{
    public required string Slug { get; init; }
    public required string Type { get; init; }
    public string? AccentColorHex { get; init; }
    public string? IconName { get; init; }
    public string? Name { get; init; }
    public string? ShortName { get; init; }
    public string? MenuNote { get; init; }
    public string? Summary { get; init; }
    public bool HasRequestedCulture { get; init; }
}

public sealed record CategoryDetailDto
{
    public required string Slug { get; init; }
    public required string Type { get; init; }
    public string? AccentColorHex { get; init; }
    public string? IconName { get; init; }
    public string? Name { get; init; }
    public string? Summary { get; init; }
    public string? Intro { get; init; }
    public string? Description { get; init; }
    public SeoDto? Seo { get; init; }
    public IReadOnlyList<SpecificationRowDto> Specifications { get; init; } = [];
    public IReadOnlyList<ContentBlockDto> Blocks { get; init; } = [];
    public IReadOnlyList<ProductListItemDto> Products { get; init; } = [];
    public IReadOnlyList<SolutionListItemDto> Solutions { get; init; } = [];
}

public sealed record ProductListItemDto
{
    public required string Slug { get; init; }
    public required string CategorySlug { get; init; }
    public string? Code { get; init; }
    public string? Brand { get; init; }
    public bool IsFeatured { get; init; }
    public bool IsNew { get; init; }
    public string? Name { get; init; }
    public string? Summary { get; init; }
    public bool HasRequestedCulture { get; init; }
}

public sealed record ProductDetailDto
{
    public required string Slug { get; init; }
    public required string CategorySlug { get; init; }
    public string? Code { get; init; }
    public string? Brand { get; init; }
    public string? Name { get; init; }
    public string? Summary { get; init; }
    public string? Description { get; init; }
    public string? ApplicationNote { get; init; }
    public SeoDto? Seo { get; init; }
    public IReadOnlyList<SpecificationRowDto> Specifications { get; init; } = [];
}

public sealed record SolutionListItemDto
{
    public required string Slug { get; init; }
    public string? IconName { get; init; }
    public bool IsNew { get; init; }
    public string? Name { get; init; }
    public string? MenuNote { get; init; }
    public string? Summary { get; init; }
    public bool HasRequestedCulture { get; init; }
}

public sealed record SolutionDetailDto
{
    public required string Slug { get; init; }
    public string? IconName { get; init; }
    public bool IsNew { get; init; }
    public string? Name { get; init; }
    public string? Summary { get; init; }
    public string? ChallengeTitle { get; init; }
    public string? ChallengeBody { get; init; }
    public string? Description { get; init; }
    public SeoDto? Seo { get; init; }
    public IReadOnlyList<SpecificationRowDto> Specifications { get; init; } = [];
    public IReadOnlyList<ContentBlockDto> Blocks { get; init; } = [];
    public IReadOnlyList<CategoryListItemDto> Categories { get; init; } = [];
}

public sealed record SpecificationRowDto(string Label, string Value, string? Note, bool IsHighlighted);

public sealed record ContentBlockDto
{
    public required string BlockType { get; init; }
    public string? Anchor { get; init; }
    public required string Tone { get; init; }
    public string? Eyebrow { get; init; }
    public string? Title { get; init; }
    public string? Subtitle { get; init; }
    public string? Body { get; init; }
    public string? CtaLabel { get; init; }
    public string? FootNote { get; init; }

    /// <summary>Reference block 的查詢參數；Content block 為 <c>null</c>。</summary>
    public string? Settings { get; init; }

    public IReadOnlyList<ContentBlockItemDto> Items { get; init; } = [];
}

public sealed record ContentBlockItemDto
{
    public string? IconName { get; init; }
    public string? AccentColorHex { get; init; }
    public string? Badge { get; init; }
    public string? LinkUrl { get; init; }
    public string? Title { get; init; }
    public string? Subtitle { get; init; }
    public string? Body { get; init; }
    public string? LinkLabel { get; init; }
    public string? Value { get; init; }
}

public sealed record PageDetailDto
{
    public required string Slug { get; init; }
    public required string Template { get; init; }
    public string? ParentSlug { get; init; }
    public string? Title { get; init; }
    public string? Eyebrow { get; init; }
    public string? Subtitle { get; init; }
    public string? BannerTitle { get; init; }
    public string? BannerDescription { get; init; }
    public string? CtaEyebrow { get; init; }
    public string? CtaHeadline { get; init; }
    public string? CtaSubcopy { get; init; }
    public string? Body { get; init; }
    public string? LastReviewedLabel { get; init; }
    public SeoDto? Seo { get; init; }
    public IReadOnlyList<ContentBlockDto> Blocks { get; init; } = [];
}

/// <summary>`sitemap.xml` 的資料來源——只給路徑與 lastmod，XML 由 Next.js 產生。</summary>
public sealed record SitemapEntryDto(string Path, DateTime LastModified, string[] Cultures);
