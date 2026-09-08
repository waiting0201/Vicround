using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Admin;

/// <summary>
/// 27 個後台單元的登記表。<b>slug 與 `apps/admin/src/lib/resources.ts` 逐字對應</b>——
/// 後台畫面、權限碼與這裡是同一組字串，不做單複數轉換。
/// </summary>
public static class AdminResources
{
    private static readonly AdminResource[] Registry =
    [
        // ── 內容 ────────────────────────────────────────────────────────────
        new("categories", typeof(Category), typeof(CategoryTranslation), "CategoryId",
            SearchColumns: ["Slug"],
            TranslationSearchColumns: ["Name", "Summary"],
            Children:
            [
                new("specifications", typeof(SpecificationRow), "OwnerCategoryId",
                    typeof(SpecificationRowTranslation), "SpecificationRowId"),
                new("blocks", typeof(ContentBlock), "OwnerCategoryId",
                    typeof(ContentBlockTranslation), "ContentBlockId"),
            ],
            RoutePrefix: "/products"),

        new("products", typeof(Product), typeof(ProductTranslation), "ProductId",
            SearchColumns: ["Slug", "Code", "Brand"],
            TranslationSearchColumns: ["Name", "Summary"],
            Links:
            [
                new("solutionIds", typeof(ProductSolution), "ProductId", "SolutionId", HasSortOrder: true),
            ],
            Children:
            [
                new("specifications", typeof(SpecificationRow), "OwnerProductId",
                    typeof(SpecificationRowTranslation), "SpecificationRowId"),
            ]),

        new("solutions", typeof(Solution), typeof(SolutionTranslation), "SolutionId",
            SearchColumns: ["Slug"],
            TranslationSearchColumns: ["Name", "Summary"],
            Links:
            [
                new("categoryIds", typeof(SolutionCategory), "SolutionId", "CategoryId", HasSortOrder: true),
            ],
            Children:
            [
                new("specifications", typeof(SpecificationRow), "OwnerSolutionId",
                    typeof(SpecificationRowTranslation), "SpecificationRowId"),
                new("blocks", typeof(ContentBlock), "OwnerSolutionId",
                    typeof(ContentBlockTranslation), "ContentBlockId"),
            ],
            RoutePrefix: "/solutions"),

        new("articles", typeof(Article), typeof(ArticleTranslation), "ArticleId",
            OrderBy: "PublishedAt DESC, Id DESC",
            SearchColumns: ["Slug"],
            TranslationSearchColumns: ["Title", "Excerpt"],
            Links:
            [
                new("tagIds", typeof(ArticleTagLink), "ArticleId", "ArticleTagId"),
                new("categoryIds", typeof(ArticleCategory), "ArticleId", "CategoryId"),
                new("solutionIds", typeof(ArticleSolution), "ArticleId", "SolutionId"),
                new("productIds", typeof(ArticleProduct), "ArticleId", "ProductId"),
            ]),

        new("pages", typeof(Page), typeof(PageTranslation), "PageId",
            SearchColumns: ["Slug"],
            TranslationSearchColumns: ["Title"],
            Children:
            [
                new("blocks", typeof(ContentBlock), "OwnerPageId",
                    typeof(ContentBlockTranslation), "ContentBlockId"),
            ]),

        // ── 資源 ────────────────────────────────────────────────────────────
        new("exhibitions", typeof(Exhibition), typeof(ExhibitionTranslation), "ExhibitionId",
            OrderBy: "StartDate DESC",
            SearchColumns: ["Slug", "City", "BoothNumber"],
            TranslationSearchColumns: ["Name", "VenueName"]),

        new("faq-categories", typeof(FaqCategory), typeof(FaqCategoryTranslation), "FaqCategoryId",
            SearchColumns: ["Slug"],
            TranslationSearchColumns: ["Name"]),

        new("faq-items", typeof(FaqItem), typeof(FaqItemTranslation), "FaqItemId",
            SearchColumns: ["Slug"],
            TranslationSearchColumns: ["Question", "Answer"]),

        new("downloads", typeof(Download), typeof(DownloadTranslation), "DownloadId",
            SearchColumns: ["Slug", "Version", "FileExtension"],
            TranslationSearchColumns: ["Title", "Description"],
            Links:
            [
                new("productIds", typeof(DownloadProduct), "DownloadId", "ProductId", HasSortOrder: true),
                new("categoryIds", typeof(DownloadCategory), "DownloadId", "CategoryId", HasSortOrder: true),
                new("solutionIds", typeof(DownloadSolution), "DownloadId", "SolutionId", HasSortOrder: true),
            ],
            RoutePrefix: "/resources/downloads"),

        new("article-tags", typeof(ArticleTag), typeof(ArticleTagTranslation), "ArticleTagId",
            SearchColumns: ["Slug"],
            TranslationSearchColumns: ["Name"]),

        new("authors", typeof(Author), typeof(AuthorTranslation), "AuthorId",
            SearchColumns: ["Slug", "Initials"],
            TranslationSearchColumns: ["Name", "JobTitle"]),

        // ── 永續 ────────────────────────────────────────────────────────────
        new("certifications", typeof(Certification), typeof(CertificationTranslation), "CertificationId",
            SearchColumns: ["Slug", "CertificateNumber"],
            TranslationSearchColumns: ["Title", "IssuerName"],
            Links:
            [
                new("productIds", typeof(CertificationProduct), "CertificationId", "ProductId"),
                new("categoryIds", typeof(CertificationCategoryLink), "CertificationId", "CategoryId"),
            ]),

        // ── 公司 ────────────────────────────────────────────────────────────
        new("milestones", typeof(Milestone), typeof(MilestoneTranslation), "MilestoneId",
            OrderBy: "Year, SortOrder",
            TranslationSearchColumns: ["Title", "Body"]),

        new("locations", typeof(Location), typeof(LocationTranslation), "LocationId",
            SearchColumns: ["City", "CountryCode", "Email"],
            TranslationSearchColumns: ["Name", "AddressLine"]),

        new("testimonials", typeof(Testimonial), typeof(TestimonialTranslation), "TestimonialId",
            TranslationSearchColumns: ["Quote", "AuthorName"]),

        new("partner-brands", typeof(PartnerBrand), typeof(PartnerBrandTranslation), "PartnerBrandId",
            SearchColumns: ["Slug", "WebsiteUrl"],
            TranslationSearchColumns: ["Name"]),

        new("contact-channels", typeof(ContactChannel), typeof(ContactChannelTranslation), "ContactChannelId",
            SearchColumns: ["Slug", "Email"],
            TranslationSearchColumns: ["Label"]),

        new("process-flows", typeof(ProcessFlow), typeof(ProcessFlowTranslation), "ProcessFlowId",
            SearchColumns: ["Slug"],
            TranslationSearchColumns: ["Title"],
            Children:
            [
                new("steps", typeof(ProcessStep), "ProcessFlowId",
                    typeof(ProcessStepTranslation), "ProcessStepId"),
            ]),

        // ── 營運（沒有翻譯列）────────────────────────────────────────────────
        new("members", typeof(Member), OrderBy: "CreatedAt DESC",
            SearchColumns: ["Email", "FullName", "CompanyName"]),

        new("sample-requests", typeof(SampleRequest), OrderBy: "CreatedAt DESC",
            SearchColumns: ["RequestNumber", "ShipToCompany", "ProjectName"],
            Children:
            [
                new("items", typeof(SampleRequestItem), "SampleRequestId"),
            ]),

        new("contact-inquiries", typeof(ContactInquiry), OrderBy: "CreatedAt DESC",
            SearchColumns: ["ReferenceNumber", "Name", "CompanyName", "Email"]),

        new("business-domains", typeof(BusinessDomainRuleEntry), OrderBy: "Domain",
            SearchColumns: ["Domain"]),

        // ── 站台 ────────────────────────────────────────────────────────────
        new("navigation", typeof(NavigationItem), typeof(NavigationItemTranslation), "NavigationItemId",
            OrderBy: "Location, ParentId, SortOrder",
            SearchColumns: ["Url", "IconName"],
            TranslationSearchColumns: ["Label"]),

        new("redirects", typeof(Redirect), OrderBy: "FromPath",
            SearchColumns: ["FromPath", "ToPath", "Notes"]),

        new("site-settings", typeof(SiteSetting), typeof(SiteSettingTranslation), "SettingKey",
            OrderBy: "[Key]",
            SearchColumns: ["Key", "Value"],
            TranslationSearchColumns: ["Value"]),

        new("media", typeof(MediaAsset), typeof(MediaAssetTranslation), "MediaAssetId",
            OrderBy: "CreatedAt DESC",
            SearchColumns: ["FileName", "BlobPath", "MimeType"],
            TranslationSearchColumns: ["AltText", "Caption"]),

        new("users", typeof(User), OrderBy: "DisplayName",
            SearchColumns: ["Email", "DisplayName"]),
    ];

    private static readonly Dictionary<string, AdminResource> BySlug =
        Registry.ToDictionary(resource => resource.Slug, StringComparer.Ordinal);

    public static AdminResource? Find(string slug) => BySlug.GetValueOrDefault(slug);

    public static IReadOnlyList<AdminResource> All => Registry;
}
