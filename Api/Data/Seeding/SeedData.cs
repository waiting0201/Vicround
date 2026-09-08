using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Seeding;

/// <summary>雙語文字；<c>en</c> 逐字取自客戶確認稿，<c>zh-Hant</c> 為暫譯（待客戶校稿）。</summary>
internal sealed record Text(string En, string Zh);

internal sealed record CategorySeed(string Slug, CategoryType Type, string AccentColorHex, Text Name, Text ShortName, Text MenuNote);

internal sealed record SolutionSeed(string Slug, bool IsNew, Text Name, Text MenuNote);

internal sealed record PageSeed(
    string Slug, PageTemplate Template, string? ParentSlug, Text Title, string? PathPrefix = null);

internal sealed record LocationSeed(LocationType Type, string CountryCode, string City, string Phone, Text Name, Text AddressLine);

internal sealed record ContactChannelSeed(string Slug, string Email, InquiryType InquiryType, Text Label, Text Description);

internal sealed record SettingSeed(string Key, SettingValueKind ValueKind, bool IsLocalized, string? Value, Text? LocalizedValue);

internal sealed record NavSeed(
    NavigationLocation Location,
    LinkTargetType LinkType,
    Text Label,
    Text? Note = null,
    Text? MenuTitle = null,
    string? Url = null,
    string? RefPageSlug = null,
    string? RefCategorySlug = null,
    string? RefSolutionSlug = null,
    NavSeed[]? Children = null);

/// <summary>
/// database.md §18.3 的上線內容。**只放結構與導覽**——頁面長文、FAQ 題目、認證明細與製程步驟
/// 屬於 C 層（舊站匯入）與編輯者的工作，不在此硬編。
/// </summary>
internal static class SeedData
{
    /// <summary>色值取自 CIS 手冊 p.8。</summary>
    public static readonly CategorySeed[] Categories =
    [
        new("optical-film", CategoryType.OpticalFilm, "#71d6e0",
            new Text("Optical Film", "光學膜"),
            new Text("Optical Film", "光學膜"),
            new Text("Eight coated surface families", "八大塗佈表面系列")),
        new("textile-foam", CategoryType.TextileFoam, "#e7004b",
            new Text("Textile & Foam", "紡織與泡棉"),
            new Text("Textile & Foam", "紡織與泡棉"),
            new Text("Cushioning, sealing and shielding", "緩衝、密封與遮蔽")),
        new("acoustic", CategoryType.Acoustic, "#cfcfcd",
            new Text("Acoustic", "聲學材料"),
            new Text("Acoustic", "聲學材料"),
            new Text("Four IP-rated mesh grades", "四種 IP 等級網布")),
    ];

    public static readonly SolutionSeed[] Solutions =
    [
        new("consumer-electronics", false, new Text("Consumer Electronics", "消費性電子"), new Text("Phones, tablets, laptops, wearables", "手機、平板、筆電、穿戴裝置")),
        new("automotive", false, new Text("Automotive", "車用"), new Text("Cockpit displays and sensor windows", "座艙顯示器與感測器視窗")),
        new("smart-healthcare", false, new Text("Smart Healthcare", "智慧醫療"), new Text("Antimicrobial and privacy surfaces", "抗菌與防窺表面")),
        new("renewable-energy", false, new Text("Renewable Energy", "再生能源"), new Text("PV modules and storage enclosures", "太陽能模組與儲能機櫃")),
        new("acoustic-solutions", true, new Text("Acoustic Solutions", "聲學解決方案"), new Text("IP-rated speaker and mic protection", "IP 等級喇叭與麥克風防護")),
        new("e-paper", false, new Text("E-Paper", "電子紙"), new Text("Paper-feel and front-light film", "紙感表面與前光膜")),
        new("sports-eyewear", false, new Text("Sports Eye-Wear", "運動眼鏡"), new Text("Anti-fog, polarised and comfort foam", "防霧、偏光與舒適泡棉")),
    ];

    /// <summary>14 個系統頁（<c>IsSystemPage = 1</c>，不可刪）。</summary>
    public static readonly PageSeed[] Pages =
    [
        new("home", PageTemplate.Home, null, new Text("Home", "首頁")),
        new("products", PageTemplate.ProductsHub, null, new Text("Products", "產品")),
        new("solutions", PageTemplate.SolutionsHub, null, new Text("Solutions", "應用解決方案")),
        new("technologies", PageTemplate.Technologies, null, new Text("Technologies", "技術與製程")),
        new("about", PageTemplate.About, null, new Text("About Us", "關於我們")),
        new("sustainability", PageTemplate.Sustainability, "about", new Text("Sustainability", "永續發展")),
        new("partnership", PageTemplate.Partnership, "about", new Text("Partnership", "合作夥伴")),
        new("resources", PageTemplate.ResourcesHub, null, new Text("Resources", "資源中心")),
        new("contact", PageTemplate.Contact, null, new Text("Contact Us", "聯絡我們")),
        new("privacy", PageTemplate.Legal, null, new Text("Privacy & Legal", "隱私權與法律聲明")),
        new("member", PageTemplate.MemberGateway, null, new Text("Member Area", "會員專區")),

        // Resources 底下的兩個可索引子頁。FAQ 的網址是 /resources/faq，因此帶 PathPrefix；
        // News 掛在 Resources 之下（IA），網址卻是 /news —— 兩者的差別正是 PathPrefix 存在的理由。
        new("faq", PageTemplate.Standard, "resources", new Text("FAQ", "常見問題"), "resources"),
        new("downloads", PageTemplate.Standard, "resources", new Text("Downloads", "技術規格下載"), "resources"),
        new("news", PageTemplate.Standard, "resources", new Text("News & Exhibitions", "新聞與展會")),
    ];

    /// <summary>地址與電話沿用確認稿的佔位值（含 <c>000</c>），待客戶提供後由編輯者於後台更正。</summary>
    public static readonly LocationSeed[] Locations =
    [
        new(LocationType.Headquarters, "TW", "Taichung", "+886 4 2359 0000",
            new Text("Taichung, Taiwan", "台灣台中"),
            new Text("No. 000, Sec. 0, Taiwan Blvd., Xitun Dist., Taichung City 407, Taiwan", "407 台中市西屯區台灣大道 0 段 000 號")),
        new(LocationType.Production, "CN", "Suzhou", "+86 512 0000 0000",
            new Text("Suzhou, China", "中國蘇州"),
            new Text("Coating and converting lines serving mainland China assembly partners.", "塗佈與加工產線，服務中國大陸的組裝夥伴。")),
        new(LocationType.Production, "VN", "Bac Ninh", "+84 222 000 0000",
            new Text("Bac Ninh, Vietnam", "越南北寧"),
            new Text("Die-cutting and assembly capacity for Southeast Asia programs.", "模切與組裝產能，服務東南亞專案。")),
    ];

    public static readonly ContactChannelSeed[] ContactChannels =
    [
        new("sales", "sales@vicround.com", InquiryType.Sales,
            new Text("Sales & quotations", "業務與報價"),
            new Text("Pricing, lead times, sample orders.", "價格、交期、樣品訂單。")),
        new("engineering", "engineering@vicround.com", InquiryType.Technical,
            new Text("Technical & engineering", "技術與工程"),
            new Text("Spec review, material selection, testing data.", "規格檢視、材料選定、測試數據。")),
        new("partners", "partners@vicround.com", InquiryType.Partnership,
            new Text("Partnership & distribution", "合作與經銷"),
            new Text("OEM/ODM programs and regional distribution.", "OEM／ODM 專案與區域經銷。")),
    ];

    /// <summary>
    /// 一律 <c>Block</c>：個人信箱與拋棄式網域不得註冊會員（member.dc.html 的
    /// 「Accounts are verified against a business domain」）。
    /// </summary>
    public static readonly string[] BlockedEmailDomains =
    [
        "gmail.com", "googlemail.com", "yahoo.com", "yahoo.com.tw", "hotmail.com", "outlook.com",
        "live.com", "msn.com", "icloud.com", "me.com", "qq.com", "163.com", "126.com", "sina.com",
        "proton.me", "protonmail.com", "gmx.com", "mail.ru", "naver.com", "daum.net",
        "mailinator.com", "guerrillamail.com", "10minutemail.com", "yopmail.com",
        "sharklasers.com", "dispostable.com", "throwawaymail.com",
    ];

    public static readonly SettingSeed[] SiteSettings =
    [
        new("seo.titleTemplate", SettingValueKind.Text, true, null, new Text("{page} | VicRound", "{page}｜盈絲實業")),
        new("seo.defaultDescription", SettingValueKind.Text, true, null,
            new Text("VicRound engineers optical film, textile & foam and acoustic materials for consumer electronics, automotive and healthcare assemblies.",
                     "盈絲實業為消費性電子、車用與醫療組裝提供光學膜、紡織泡棉與聲學材料。")),
        new("org.legalName", SettingValueKind.Text, true, null, new Text("VicRound Industrial Co., Ltd.", "盈絲實業有限公司")),
        new("org.foundingYear", SettingValueKind.Number, false, "", null),
        new("org.logoUrl", SettingValueKind.Url, false, "", null),
        new("seo.defaultOgImageUrl", SettingValueKind.Url, false, "", null),
        new("analytics.gtmId", SettingValueKind.Text, false, "", null),
        new("revalidate.webhookUrl", SettingValueKind.Url, false, "", null),
        new("privacy.policyVersion", SettingValueKind.Text, false, "2026.1", null),
    ];

    /// <summary>
    /// 依 Sitemap-0819 與已實作的 <c>Header.dc.html</c> / <c>Footer.dc.html</c>。
    /// <b>Social（LinkedIn / YouTube）刻意不 seed</b>——網址待客戶提供（§19.9），
    /// 由編輯者於後台新增，這裡不放假網址。
    /// </summary>
    public static readonly NavSeed[] Navigation =
    [
        new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Products", "產品"),
            MenuTitle: new Text("Products — what we make", "產品 — 我們製造什麼"),
            RefPageSlug: "products",
            Children:
            [
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Optical Film", "光學膜"), new Text("Eight coated surface families", "八大塗佈表面系列"), RefCategorySlug: "optical-film"),
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Textile & Foam", "紡織與泡棉"), new Text("Cushioning, sealing and shielding", "緩衝、密封與遮蔽"), RefCategorySlug: "textile-foam"),
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Acoustic", "聲學材料"), new Text("Four IP-rated mesh grades", "四種 IP 等級網布"), RefCategorySlug: "acoustic"),
            ]),
        new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Solutions", "應用解決方案"),
            MenuTitle: new Text("Solutions — what problems we solve", "解決方案 — 我們解決什麼問題"),
            RefPageSlug: "solutions",
            Children:
            [
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Consumer Electronics", "消費性電子"), new Text("Phones, tablets, laptops, wearables", "手機、平板、筆電、穿戴裝置"), RefSolutionSlug: "consumer-electronics"),
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Automotive", "車用"), new Text("Cockpit displays and sensor windows", "座艙顯示器與感測器視窗"), RefSolutionSlug: "automotive"),
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Smart Healthcare", "智慧醫療"), new Text("Antimicrobial and privacy surfaces", "抗菌與防窺表面"), RefSolutionSlug: "smart-healthcare"),
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Renewable Energy", "再生能源"), new Text("PV modules and storage enclosures", "太陽能模組與儲能機櫃"), RefSolutionSlug: "renewable-energy"),
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Acoustic Solutions", "聲學解決方案"), new Text("IP-rated speaker and mic protection", "IP 等級喇叭與麥克風防護"), RefSolutionSlug: "acoustic-solutions"),
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("E-Paper", "電子紙"), new Text("Paper-feel and front-light film", "紙感表面與前光膜"), RefSolutionSlug: "e-paper"),
                new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Sports Eye-Wear", "運動眼鏡"), new Text("Anti-fog, polarised and comfort foam", "防霧、偏光與舒適泡棉"), RefSolutionSlug: "sports-eyewear"),
            ]),
        new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Technologies", "技術與製程"),
            MenuTitle: new Text("Technical capabilities", "技術能力"),
            RefPageSlug: "technologies",
            Children:
            [
                new(NavigationLocation.Header, LinkTargetType.Anchor, new Text("Core Processes", "核心製程"), new Text("Coating, laminating, die-cutting, QC", "塗佈、貼合、模切、品管"), Url: "/technologies#core-processes"),
                new(NavigationLocation.Header, LinkTargetType.Anchor, new Text("R&D / Material Innovation", "研發與材料創新"), new Text("Formulation through pilot line", "從配方到試產線"), Url: "/technologies#innovation"),
                new(NavigationLocation.Header, LinkTargetType.Anchor, new Text("Product Compliance", "產品法規符合"), new Text("RoHS, REACH, IEC and OEM protocols", "RoHS、REACH、IEC 與客戶規範"), Url: "/technologies#compliance"),
            ]),
        new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("About Us", "關於我們"), RefPageSlug: "about"),
        new(NavigationLocation.Header, LinkTargetType.EntityRef, new Text("Resources", "資源中心"),
            MenuTitle: new Text("Resources", "資源中心"),
            RefPageSlug: "resources",
            Children:
            [
                new(NavigationLocation.Header, LinkTargetType.Internal, new Text("News & Exhibitions", "新聞與展會"), new Text("Meet us on the show floor", "展場與我們見面"), Url: "/news"),
                new(NavigationLocation.Header, LinkTargetType.Internal, new Text("FAQ", "常見問題"), new Text("Specification, ordering, compliance", "規格、下單與法規符合"), Url: "/resources/faq"),
                new(NavigationLocation.Header, LinkTargetType.Anchor, new Text("Industry Insights", "產業洞察"), new Text("Sector reads and trend reports", "產業觀察與趨勢報告"), Url: "/resources#insights"),
                new(NavigationLocation.Header, LinkTargetType.Internal, new Text("Downloads", "技術文件下載"), new Text("Spec sheets, catalogues, white papers", "規格書、型錄、白皮書"), Url: "/resources/downloads"),
            ]),

        new(NavigationLocation.Footer, LinkTargetType.EntityRef, new Text("About Us", "關於我們"), RefPageSlug: "about"),
        new(NavigationLocation.Footer, LinkTargetType.EntityRef, new Text("Products", "產品"), RefPageSlug: "products"),
        new(NavigationLocation.Footer, LinkTargetType.EntityRef, new Text("Solutions", "應用解決方案"), RefPageSlug: "solutions"),
        new(NavigationLocation.Footer, LinkTargetType.EntityRef, new Text("Technologies", "技術與製程"), RefPageSlug: "technologies"),
        new(NavigationLocation.Footer, LinkTargetType.Internal, new Text("FAQ", "常見問題"), Url: "/resources/faq"),
        new(NavigationLocation.Footer, LinkTargetType.Internal, new Text("Downloads", "技術文件下載"), Url: "/resources/downloads"),
        new(NavigationLocation.Footer, LinkTargetType.Internal, new Text("News & Exhibitions", "新聞與展會"), Url: "/news"),
        new(NavigationLocation.Footer, LinkTargetType.EntityRef, new Text("Contact Us", "聯絡我們"), RefPageSlug: "contact"),

        new(NavigationLocation.FooterLegal, LinkTargetType.EntityRef, new Text("Privacy & Legal", "隱私權與法律聲明"), RefPageSlug: "privacy"),

        new(NavigationLocation.SearchChip, LinkTargetType.EntityRef, new Text("Anti-glare film", "抗眩光膜"), RefCategorySlug: "optical-film"),
        new(NavigationLocation.SearchChip, LinkTargetType.EntityRef, new Text("EMI shielding foam", "EMI 遮蔽泡棉"), RefCategorySlug: "textile-foam"),
        new(NavigationLocation.SearchChip, LinkTargetType.EntityRef, new Text("IP67 acoustic mesh", "IP67 聲學網布"), RefCategorySlug: "acoustic"),
        new(NavigationLocation.SearchChip, LinkTargetType.EntityRef, new Text("ISO 14001 certificate", "ISO 14001 證書"), RefPageSlug: "sustainability"),
        new(NavigationLocation.SearchChip, LinkTargetType.Internal, new Text("Spec sheet download", "規格書下載"), Url: "/resources/downloads"),
    ];
}
