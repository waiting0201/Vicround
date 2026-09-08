using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Domain.Resources;

namespace VicRound.Infrastructure.Configurations;

public class ArticleConfiguration : SluggedEntityConfiguration<Article>
{
    protected override string TableName => "Articles";

    protected override void ConfigureEntity(EntityTypeBuilder<Article> builder)
    {
        builder.Property(a => a.LegacySourceKey).HasMaxLength(DbConventions.LegacySourceKeyMaxLength);

        builder.HasOne(a => a.Author)
            .WithMany(a => a.Articles)
            .HasForeignKey(a => a.AuthorId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(a => a.Exhibition)
            .WithMany(e => e.Articles)
            .HasForeignKey(a => a.ExhibitionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(a => a.HeroMediaAsset)
            .WithMany()
            .HasForeignKey(a => a.HeroMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        // /news、/insights、/blog 三個列表頁的主查詢。
        builder.HasIndex(a => new { a.Type, a.Status, a.PublishedAt }, "IX_Articles_Type_Published")
            .IsDescending(false, false, true)
            .IncludeProperties(a => new { a.Slug, a.HeroMediaAssetId });

        builder.HasIndex(a => a.PublishedAt, "IX_Articles_Published")
            .IsDescending(true)
            .HasFilter("[Status] = 1");

        builder.HasIndex(a => a.ExhibitionId, "IX_Articles_Exhibition")
            .HasFilter("[ExhibitionId] IS NOT NULL");

        builder.HasIndex(a => a.LegacySourceKey, "UX_Articles_LegacySourceKey")
            .IsUnique()
            .HasFilter("[LegacySourceKey] IS NOT NULL");
    }
}

public class ArticleTranslationConfiguration : TranslationConfiguration<ArticleTranslation>
{
    protected override string TableName => "ArticleTranslations";
    protected override string OwnerIdProperty => nameof(ArticleTranslation.ArticleId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ArticleTranslation> builder)
    {
        builder.Property(t => t.Title).HasMaxLength(300).IsRequired();
        builder.Property(t => t.Excerpt).HasMaxLength(600);
        builder.Property(t => t.Lead).HasMaxLength(1000);
        builder.Property(t => t.PullQuote).HasMaxLength(600);
        builder.Property(t => t.PullQuoteAttribution).HasMaxLength(160);

        builder.HasOne(t => t.Article)
            .WithMany(a => a.Translations)
            .HasForeignKey(t => t.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AuthorConfiguration : SluggedEntityConfiguration<Author>
{
    protected override string TableName => "Authors";

    protected override void ConfigureEntity(EntityTypeBuilder<Author> builder)
    {
        builder.Property(a => a.Initials).HasMaxLength(4);

        builder.HasOne(a => a.MediaAsset)
            .WithMany()
            .HasForeignKey(a => a.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

public class AuthorTranslationConfiguration : TranslationConfiguration<AuthorTranslation>
{
    protected override string TableName => "AuthorTranslations";
    protected override string OwnerIdProperty => nameof(AuthorTranslation.AuthorId);

    protected override void ConfigureTranslation(EntityTypeBuilder<AuthorTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(160).IsRequired();
        builder.Property(t => t.JobTitle).HasMaxLength(160);
        builder.Property(t => t.Bio).HasMaxLength(1000);

        builder.HasOne(t => t.Author)
            .WithMany(a => a.Translations)
            .HasForeignKey(t => t.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ArticleTagConfiguration : SluggedEntityConfiguration<ArticleTag>
{
    protected override string TableName => "ArticleTags";

    protected override void ConfigureEntity(EntityTypeBuilder<ArticleTag> builder)
    {
    }
}

public class ArticleTagTranslationConfiguration : TranslationConfiguration<ArticleTagTranslation>
{
    protected override string TableName => "ArticleTagTranslations";
    protected override string OwnerIdProperty => nameof(ArticleTagTranslation.ArticleTagId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ArticleTagTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(120).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(400);

        builder.HasOne(t => t.ArticleTag)
            .WithMany(a => a.Translations)
            .HasForeignKey(t => t.ArticleTagId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ArticleTagLinkConfiguration : IEntityTypeConfiguration<ArticleTagLink>
{
    public void Configure(EntityTypeBuilder<ArticleTagLink> builder)
    {
        builder.ToTable("ArticleTagLinks");
        builder.HasKey(l => new { l.ArticleId, l.ArticleTagId });

        builder.HasOne(l => l.Article)
            .WithMany(a => a.TagLinks)
            .HasForeignKey(l => l.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.ArticleTag)
            .WithMany(t => t.TagLinks)
            .HasForeignKey(l => l.ArticleTagId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => new { l.ArticleTagId, l.ArticleId }, "IX_ArticleTagLinks_Reverse");
    }
}

public class ArticleCategoryConfiguration : IEntityTypeConfiguration<ArticleCategory>
{
    public void Configure(EntityTypeBuilder<ArticleCategory> builder)
    {
        builder.ToTable("ArticleCategories");
        builder.HasKey(x => new { x.ArticleId, x.CategoryId });

        builder.HasOne(x => x.Article)
            .WithMany(a => a.ArticleCategories)
            .HasForeignKey(x => x.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.CategoryId, x.ArticleId }, "IX_ArticleCategories_Reverse");
    }
}

public class ArticleSolutionConfiguration : IEntityTypeConfiguration<ArticleSolution>
{
    public void Configure(EntityTypeBuilder<ArticleSolution> builder)
    {
        builder.ToTable("ArticleSolutions");
        builder.HasKey(x => new { x.ArticleId, x.SolutionId });

        builder.HasOne(x => x.Article)
            .WithMany(a => a.ArticleSolutions)
            .HasForeignKey(x => x.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Solution)
            .WithMany()
            .HasForeignKey(x => x.SolutionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.SolutionId, x.ArticleId }, "IX_ArticleSolutions_Reverse");
    }
}

public class ArticleProductConfiguration : IEntityTypeConfiguration<ArticleProduct>
{
    public void Configure(EntityTypeBuilder<ArticleProduct> builder)
    {
        builder.ToTable("ArticleProducts");
        builder.HasKey(x => new { x.ArticleId, x.ProductId });

        builder.HasOne(x => x.Article)
            .WithMany(a => a.ArticleProducts)
            .HasForeignKey(x => x.ArticleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.ProductId, x.ArticleId }, "IX_ArticleProducts_Reverse");
    }
}

public class ExhibitionConfiguration : SluggedEntityConfiguration<Exhibition>
{
    protected override string TableName => "Exhibitions";

    protected override void ConfigureEntity(EntityTypeBuilder<Exhibition> builder)
    {
        builder.Property(e => e.BoothNumber).HasMaxLength(32);
        builder.Property(e => e.City).HasMaxLength(80);
        builder.Property(e => e.CountryCode).HasMaxLength(2).IsFixedLength();
        builder.Property(e => e.WebsiteUrl).HasMaxLength(DbConventions.UrlMaxLength);
        builder.Property(e => e.MeetingUrl).HasMaxLength(DbConventions.UrlMaxLength);

        builder.HasOne(e => e.HeroMediaAsset)
            .WithMany()
            .HasForeignKey(e => e.HeroMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        // 「下一場展會」與「Exhibition Records」都由日期決定，故索引以日期為主。
        builder.HasIndex(e => new { e.EndDate, e.StartDate }, "IX_Exhibitions_Dates")
            .IsDescending(true, false)
            .HasFilter("[Status] = 1");
    }
}

public class ExhibitionTranslationConfiguration : TranslationConfiguration<ExhibitionTranslation>
{
    protected override string TableName => "ExhibitionTranslations";
    protected override string OwnerIdProperty => nameof(ExhibitionTranslation.ExhibitionId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ExhibitionTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(300).IsRequired();
        builder.Property(t => t.VenueName).HasMaxLength(200);
        builder.Property(t => t.Summary).HasMaxLength(600);
        builder.Property(t => t.OnBoothNote).HasMaxLength(600);
        builder.Property(t => t.CtaLabel).HasMaxLength(80);

        builder.HasOne(t => t.Exhibition)
            .WithMany(e => e.Translations)
            .HasForeignKey(t => t.ExhibitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FaqCategoryConfiguration : SluggedEntityConfiguration<FaqCategory>
{
    protected override string TableName => "FaqCategories";

    protected override void ConfigureEntity(EntityTypeBuilder<FaqCategory> builder)
    {
    }
}

public class FaqCategoryTranslationConfiguration : TranslationConfiguration<FaqCategoryTranslation>
{
    protected override string TableName => "FaqCategoryTranslations";
    protected override string OwnerIdProperty => nameof(FaqCategoryTranslation.FaqCategoryId);

    protected override void ConfigureTranslation(EntityTypeBuilder<FaqCategoryTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(160).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(400);

        builder.HasOne(t => t.FaqCategory)
            .WithMany(c => c.Translations)
            .HasForeignKey(t => t.FaqCategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class FaqItemConfiguration : SluggedEntityConfiguration<FaqItem>
{
    protected override string TableName => "FaqItems";

    protected override void ConfigureEntity(EntityTypeBuilder<FaqItem> builder)
    {
        builder.Property(f => f.ExternalUrl).HasMaxLength(DbConventions.UrlMaxLength);

        builder.HasOne(f => f.FaqCategory)
            .WithMany(c => c.Items)
            .HasForeignKey(f => f.FaqCategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(f => f.RefProduct).WithMany().HasForeignKey(f => f.RefProductId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(f => f.RefCategory).WithMany().HasForeignKey(f => f.RefCategoryId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(f => f.RefSolution).WithMany().HasForeignKey(f => f.RefSolutionId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(f => f.RefPage).WithMany().HasForeignKey(f => f.RefPageId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(f => f.RefDownload).WithMany().HasForeignKey(f => f.RefDownloadId).OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(f => new { f.FaqCategoryId, f.Status, f.SortOrder }, "IX_FaqItems_Category");
    }
}

public class FaqItemTranslationConfiguration : TranslationConfiguration<FaqItemTranslation>
{
    protected override string TableName => "FaqItemTranslations";
    protected override string OwnerIdProperty => nameof(FaqItemTranslation.FaqItemId);

    protected override void ConfigureTranslation(EntityTypeBuilder<FaqItemTranslation> builder)
    {
        builder.Property(t => t.Question).HasMaxLength(500).IsRequired();
        builder.Property(t => t.Answer).IsRequired();
        builder.Property(t => t.LinkLabel).HasMaxLength(120);

        builder.HasOne(t => t.FaqItem)
            .WithMany(f => f.Translations)
            .HasForeignKey(t => t.FaqItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
