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

    /// <summary>
    /// 系列卡的 chip（<c>IsHighlighted</c>）與等級比較表的欄位，都在這裡。
    /// 列表也帶規格是刻意的——確認稿的卡片上就有它們，讓前台再打一次 API 只會多跑往返。
    /// </summary>
    public IReadOnlyList<SpecificationRowDto> Specifications { get; init; } = [];

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

    /// <summary>產業卡上的產品線 chip（<c>SolutionCategories</c>）。</summary>
    public IReadOnlyList<ChipDto> Categories { get; init; } = [];

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

/// <summary>
/// 規格列。<c>Label</c> 可為 <c>null</c>——系列卡的 chip 有些只有值，
/// 前台顯示時把兩者串起來即可（database.md §02）。
/// </summary>
public sealed record SpecificationRowDto(string? Label, string Value, string? Note, bool IsHighlighted);

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

    /// <summary>
    /// Reference block（<c>BlockType</c> ≥ 100）解析出來的強型別資料；Content block 為 <c>null</c>。
    /// 只有對應那一種清單會有值——版塊型別已經決定要讀哪一個（database.md §09）。
    /// </summary>
    public BlockReferenceDto? Reference { get; init; }
}

/// <summary>
/// Reference block 的資料。<b>編輯者存的是查詢參數，不是內容本身</b>——
/// 認證、據點、製程這些都活在自己的強型別表裡，這裡只是把查詢結果帶出來，
/// 因此頁面永遠跟著實體一起更新，不會出現「版塊裡抄了一份舊的 ISO 14001」。
/// </summary>
public sealed record BlockReferenceDto
{
    public IReadOnlyList<CategoryListItemDto>? Categories { get; init; }
    public IReadOnlyList<SolutionListItemDto>? Solutions { get; init; }
    public IReadOnlyList<ProductListItemDto>? Products { get; init; }
    public IReadOnlyList<ArticleListItemDto>? Articles { get; init; }
    public IReadOnlyList<ExhibitionDto>? Exhibitions { get; init; }
    public IReadOnlyList<FaqCategoryDto>? FaqCategories { get; init; }
    public IReadOnlyList<DownloadDto>? Downloads { get; init; }
    public IReadOnlyList<CertificationDto>? Certifications { get; init; }
    public IReadOnlyList<ProcessFlowDto>? ProcessFlows { get; init; }
    public IReadOnlyList<MilestoneDto>? Milestones { get; init; }
    public IReadOnlyList<LocationDto>? Locations { get; init; }
    public IReadOnlyList<TestimonialDto>? Testimonials { get; init; }
    public IReadOnlyList<PartnerBrandDto>? PartnerBrands { get; init; }
    public IReadOnlyList<ContactChannelDto>? ContactChannels { get; init; }
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

    /// <summary>已組好的公開路徑（不含語系前綴），例如 <c>/resources/faq</c>。</summary>
    public required string Path { get; init; }

    public required string Template { get; init; }

    /// <summary>資訊架構上的父頁；<b>不是網址的一部分</b>（見 <see cref="Path"/>）。</summary>
    public string? ParentSlug { get; init; }

    /// <summary>頁首 banner 圖（<c>Pages.HeroMediaAssetId</c>）。尚未指定時前台自己退回佔位樣式。</summary>
    public string? BannerImageUrl { get; init; }
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

/// <summary>
/// 一條轉址規則。<c>from</c> 已經 normalize（小寫、去尾斜線），
/// middleware 直接拿來比對（database.md §10）。
/// </summary>
public sealed record RedirectRuleDto(string From, string To, short StatusCode, string? TargetCulture);

/// <summary>`sitemap.xml` 的資料來源——只給路徑與 lastmod，XML 由 Next.js 產生。</summary>
public sealed record SitemapEntryDto(string Path, DateTime LastModified, string[] Cultures);
