using Microsoft.EntityFrameworkCore;
using VicRound.Domain.Catalog;
using VicRound.Domain.Certifications;
using VicRound.Infrastructure.Configurations;
using VicRound.Domain.Company;
using VicRound.Domain.Downloads;
using VicRound.Domain.Globalization;
using VicRound.Domain.Identity;
using VicRound.Domain.Inquiries;
using VicRound.Domain.Media;
using VicRound.Domain.Members;
using VicRound.Domain.Navigation;
using VicRound.Domain.Pages;
using VicRound.Domain.Resources;
using VicRound.Domain.Solutions;
using VicRound.Domain.Technologies;

namespace VicRound.Infrastructure;

/// <summary>
/// 全庫的 <see cref="DbContext"/>，由 <c>fn-public</c> 與 <c>fn-admin</c> 共用。
/// 會員 API 之後會另注入只 map 會員相關表的 <c>IAccountDbContext</c>（architecture.md §14.1），
/// 使 <c>fn-public</c> 在型別層面就碰不到內容表。
/// </summary>
public class VicRoundDbContext(DbContextOptions<VicRoundDbContext> options) : DbContext(options)
{
    // 00 全域
    public DbSet<Culture> Cultures => Set<Culture>();

    // 02 產品目錄
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryTranslation> CategoryTranslations => Set<CategoryTranslation>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductTranslation> ProductTranslations => Set<ProductTranslation>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<SpecificationRow> SpecificationRows => Set<SpecificationRow>();
    public DbSet<SpecificationRowTranslation> SpecificationRowTranslations => Set<SpecificationRowTranslation>();

    // 03 產業解決方案
    public DbSet<Solution> Solutions => Set<Solution>();
    public DbSet<SolutionTranslation> SolutionTranslations => Set<SolutionTranslation>();
    public DbSet<SolutionCategory> SolutionCategories => Set<SolutionCategory>();
    public DbSet<ProductSolution> ProductSolutions => Set<ProductSolution>();

    // 04 技術與製程
    public DbSet<ProcessFlow> ProcessFlows => Set<ProcessFlow>();
    public DbSet<ProcessFlowTranslation> ProcessFlowTranslations => Set<ProcessFlowTranslation>();
    public DbSet<ProcessStep> ProcessSteps => Set<ProcessStep>();
    public DbSet<ProcessStepTranslation> ProcessStepTranslations => Set<ProcessStepTranslation>();

    // 05 資源中心
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<ArticleTranslation> ArticleTranslations => Set<ArticleTranslation>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<AuthorTranslation> AuthorTranslations => Set<AuthorTranslation>();
    public DbSet<ArticleTag> ArticleTags => Set<ArticleTag>();
    public DbSet<ArticleTagTranslation> ArticleTagTranslations => Set<ArticleTagTranslation>();
    public DbSet<ArticleTagLink> ArticleTagLinks => Set<ArticleTagLink>();
    public DbSet<ArticleCategory> ArticleCategories => Set<ArticleCategory>();
    public DbSet<ArticleSolution> ArticleSolutions => Set<ArticleSolution>();
    public DbSet<ArticleProduct> ArticleProducts => Set<ArticleProduct>();
    public DbSet<Exhibition> Exhibitions => Set<Exhibition>();
    public DbSet<ExhibitionTranslation> ExhibitionTranslations => Set<ExhibitionTranslation>();
    public DbSet<FaqCategory> FaqCategories => Set<FaqCategory>();
    public DbSet<FaqCategoryTranslation> FaqCategoryTranslations => Set<FaqCategoryTranslation>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();
    public DbSet<FaqItemTranslation> FaqItemTranslations => Set<FaqItemTranslation>();

    // 06 下載中心
    public DbSet<Download> Downloads => Set<Download>();
    public DbSet<DownloadTranslation> DownloadTranslations => Set<DownloadTranslation>();
    public DbSet<DownloadProduct> DownloadProducts => Set<DownloadProduct>();
    public DbSet<DownloadCategory> DownloadCategories => Set<DownloadCategory>();
    public DbSet<DownloadSolution> DownloadSolutions => Set<DownloadSolution>();
    public DbSet<DownloadCertification> DownloadCertifications => Set<DownloadCertification>();
    public DbSet<DownloadArticle> DownloadArticles => Set<DownloadArticle>();

    // 07 永續與認證
    public DbSet<Certification> Certifications => Set<Certification>();
    public DbSet<CertificationTranslation> CertificationTranslations => Set<CertificationTranslation>();
    public DbSet<CertificationProduct> CertificationProducts => Set<CertificationProduct>();
    public DbSet<CertificationCategoryLink> CertificationCategories => Set<CertificationCategoryLink>();

    // 08 合作夥伴與公司資訊
    public DbSet<Milestone> Milestones => Set<Milestone>();
    public DbSet<MilestoneTranslation> MilestoneTranslations => Set<MilestoneTranslation>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<LocationTranslation> LocationTranslations => Set<LocationTranslation>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<TestimonialTranslation> TestimonialTranslations => Set<TestimonialTranslation>();
    public DbSet<PartnerBrand> PartnerBrands => Set<PartnerBrand>();
    public DbSet<PartnerBrandTranslation> PartnerBrandTranslations => Set<PartnerBrandTranslation>();
    public DbSet<ContactChannel> ContactChannels => Set<ContactChannel>();
    public DbSet<ContactChannelTranslation> ContactChannelTranslations => Set<ContactChannelTranslation>();

    // 09 頁面與版塊
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<PageTranslation> PageTranslations => Set<PageTranslation>();
    public DbSet<ContentBlock> ContentBlocks => Set<ContentBlock>();
    public DbSet<ContentBlockTranslation> ContentBlockTranslations => Set<ContentBlockTranslation>();
    public DbSet<ContentBlockItem> ContentBlockItems => Set<ContentBlockItem>();
    public DbSet<ContentBlockItemTranslation> ContentBlockItemTranslations => Set<ContentBlockItemTranslation>();

    // 10 導覽、SEO 與轉址
    public DbSet<NavigationItem> NavigationItems => Set<NavigationItem>();
    public DbSet<NavigationItemTranslation> NavigationItemTranslations => Set<NavigationItemTranslation>();
    public DbSet<Redirect> Redirects => Set<Redirect>();
    public DbSet<SiteSetting> SiteSettings => Set<SiteSetting>();
    public DbSet<SiteSettingTranslation> SiteSettingTranslations => Set<SiteSettingTranslation>();

    // 11 媒體資產
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<MediaAssetTranslation> MediaAssetTranslations => Set<MediaAssetTranslation>();

    // 12 詢問與名單
    public DbSet<ContactInquiry> ContactInquiries => Set<ContactInquiry>();

    // 13 後台身分
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // 14 前台會員
    public DbSet<Member> Members => Set<Member>();
    public DbSet<MemberRefreshToken> MemberRefreshTokens => Set<MemberRefreshToken>();
    public DbSet<MemberToken> MemberTokens => Set<MemberToken>();
    public DbSet<BusinessDomainRuleEntry> BusinessDomainRules => Set<BusinessDomainRuleEntry>();
    public DbSet<SampleRequest> SampleRequests => Set<SampleRequest>();
    public DbSet<SampleRequestItem> SampleRequestItems => Set<SampleRequestItem>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // §0.4：時間一律 datetime2(3) 且為 UTC。
        configurationBuilder.Properties<DateTime>().HaveColumnType(DbConventions.DateTimeType);

        // enum 的底層型別都是 byte，EF 因此自動對應到 tinyint（§16），不需 HasConversion。
        base.ConfigureConventions(configurationBuilder);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(VicRoundDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
