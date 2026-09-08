namespace VicRound.Api.Models.Entities;

// database.md §16 Enum 總表。
// 鐵則：既有數值永不重排，新值一律往後加；刪除的值保留註解為 retired。
// SQL 存 tinyint（HasConversion<byte>），API 以 JsonStringEnumConverter 輸出 camelCase 字串。

public enum ContentStatus : byte
{
    Draft = 0,
    Published = 1,
    Archived = 2,
}

public enum CategoryType : byte
{
    OpticalFilm = 1,
    TextileFoam = 2,
    Acoustic = 3,
}

public enum PageTemplate : byte
{
    Standard = 0,
    Home = 1,
    About = 2,
    Sustainability = 3,
    Partnership = 4,
    Technologies = 5,
    Contact = 6,
    Legal = 7,
    ResourcesHub = 8,
    ProductsHub = 9,
    SolutionsHub = 10,
    MemberGateway = 11,
}

/// <summary>
/// 0–99 為 Content block（自帶文字，資料在 ContentBlockItems）；
/// 100 起為 Reference block（只帶查詢參數，資料來自強型別表）。
/// </summary>
public enum BlockType : byte
{
    RichText = 0,
    Hero = 1,
    Gallery = 2,
    FeatureGrid = 3,
    StepList = 4,
    StatBand = 5,
    MediaTextSplit = 6,
    Quote = 7,
    Cta = 8,
    Accordion = 9,
    SpecTable = 10,
    OfferingGrid = 11,
    LogoWall = 12,

    CertificationList = 100,
    MilestoneTimeline = 101,
    LocationList = 102,
    TestimonialList = 103,
    ProcessFlowRef = 104,
    FaqList = 105,
    ExhibitionList = 106,
    DownloadList = 107,
    SolutionGrid = 108,
    CategoryGrid = 109,
    ArticleList = 110,
    PartnerBrandWall = 111,
    ProductGrid = 112,
    ContactChannelList = 113,
}

public enum BlockTone : byte
{
    Dark = 0,
    Light = 1,
}

/// <summary>Type 決定 URL 前綴（/news、/insights、/blog），因此變更 Type 必須寫 301。</summary>
public enum ArticleType : byte
{
    CompanyNews = 1,
    ProductNews = 2,
    Exhibition = 3,
    CertificationNews = 4,
    Insight = 5,
    TechnicalArticle = 6,
}

public enum CertificationCategory : byte
{
    CompanyFactory = 1,
    Sustainability = 2,
    ProductCompliance = 3,
}

public enum ProcessFlowKind : byte
{
    CoreProcess = 1,
    Manufacturing = 2,
    CoDevelopment = 3,
    OemOdm = 4,
    InquiryFlow = 5,
}

public enum LocationType : byte
{
    Headquarters = 1,
    Production = 2,
    Sales = 3,
    ResearchAndDevelopment = 4,
}

public enum DownloadKind : byte
{
    SpecSheet = 1,
    WhitePaper = 2,
    Catalogue = 3,
    ComplianceDocument = 4,
    Certificate = 5,
    TestReport = 6,
    TrendReport = 7,
    Other = 99,
}

public enum DownloadAccessLevel : byte
{
    Public = 0,
    MemberOnly = 1,
    OnRequest = 2,
}

public enum MediaAssetType : byte
{
    Image = 1,
    Video = 2,
    Document = 3,
    Other = 99,
}

public enum InquiryType : byte
{
    General = 0,
    Sales = 1,
    Technical = 2,
    Partnership = 3,
    SampleRequest = 4,
    DocumentRequest = 5,
}

public enum InquiryStatus : byte
{
    New = 0,
    InProgress = 1,
    Responded = 2,
    Closed = 3,
    Spam = 4,
}

public enum MemberStatus : byte
{
    PendingEmailVerification = 0,
    PendingApproval = 1,
    Approved = 2,
    Rejected = 3,
    Suspended = 4,
}

public enum MemberJobRole : byte
{
    EngineeringRnd = 1,
    Procurement = 2,
    ProductManagement = 3,
    Quality = 4,
    Other = 99,
}

public enum MemberTokenPurpose : byte
{
    EmailVerification = 1,
    PasswordReset = 2,
}

public enum BusinessDomainRule : byte
{
    ManualReview = 0,
    AutoApprove = 1,
    Block = 2,
}

public enum SampleRequestStatus : byte
{
    Draft = 0,
    Submitted = 1,
    UnderReview = 2,
    Approved = 3,
    Shipped = 4,
    Delivered = 5,
    Rejected = 6,
    Cancelled = 7,
}

public enum NavigationLocation : byte
{
    Header = 1,
    Footer = 2,
    FooterLegal = 3,
    Social = 4,
    SearchChip = 5,
}

public enum LinkTargetType : byte
{
    Internal = 0,
    External = 1,
    Anchor = 2,
    EntityRef = 3,
    ContactModal = 4,
}

public enum SettingValueKind : byte
{
    Text = 0,
    Html = 1,
    Url = 2,
    Number = 3,
    Boolean = 4,
    Json = 5,
}
