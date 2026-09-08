using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class PageConfiguration : SluggedEntityConfiguration<Page>
{
    protected override string TableName => "Pages";

    protected override void ConfigureEntity(EntityTypeBuilder<Page> builder)
    {
        // 網址的一段，因此跟 Slug 同一組規則：小寫英數與連字號、大小寫敏感定序。
        builder.Property(p => p.PathPrefix)
            .HasMaxLength(DbConventions.SlugMaxLength)
            .UseCollation(DbConventions.SlugCollation);

        builder.Property(p => p.LegacySourceKey).HasMaxLength(DbConventions.LegacySourceKeyMaxLength);

        builder.HasOne(p => p.ParentPage)
            .WithMany(p => p.Children)
            .HasForeignKey(p => p.ParentPageId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(p => p.HeroMediaAsset)
            .WithMany()
            .HasForeignKey(p => p.HeroMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(p => new { p.ParentPageId, p.SortOrder }, "IX_Pages_Parent");
        builder.HasIndex(p => p.LegacySourceKey, "UX_Pages_LegacySourceKey")
            .IsUnique()
            .HasFilter("[LegacySourceKey] IS NOT NULL");
    }
}

public class PageTranslationConfiguration : TranslationConfiguration<PageTranslation>
{
    protected override string TableName => "PageTranslations";
    protected override string OwnerIdProperty => nameof(PageTranslation.PageId);

    protected override void ConfigureTranslation(EntityTypeBuilder<PageTranslation> builder)
    {
        builder.Property(t => t.Title).HasMaxLength(300).IsRequired();
        builder.Property(t => t.Eyebrow).HasMaxLength(120);
        builder.Property(t => t.Subtitle).HasMaxLength(400);
        builder.Property(t => t.BannerTitle).HasMaxLength(300);
        builder.Property(t => t.BannerDescription).HasMaxLength(600);
        builder.Property(t => t.CtaEyebrow).HasMaxLength(120);
        builder.Property(t => t.CtaHeadline).HasMaxLength(300);
        builder.Property(t => t.CtaSubcopy).HasMaxLength(400);
        builder.Property(t => t.LastReviewedLabel).HasMaxLength(80);

        builder.HasOne(t => t.Page)
            .WithMany(p => p.Translations)
            .HasForeignKey(t => t.PageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ContentBlockConfiguration : ContentEntityConfiguration<ContentBlock>
{
    protected override string TableName => "ContentBlocks";

    protected override void ConfigureTable(TableBuilder<ContentBlock> table) =>
        table.HasCheckConstraint(
            "CK_ContentBlocks_SingleOwner",
            DbConventions.ExactlyOneOwner(
                nameof(ContentBlock.OwnerPageId),
                nameof(ContentBlock.OwnerSolutionId),
                nameof(ContentBlock.OwnerCategoryId)));

    protected override void ConfigureEntity(EntityTypeBuilder<ContentBlock> builder)
    {
        builder.Property(b => b.Anchor).HasMaxLength(64);

        builder.HasOne(b => b.OwnerPage)
            .WithMany(p => p.Blocks)
            .HasForeignKey(b => b.OwnerPageId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(b => b.OwnerSolution)
            .WithMany()
            .HasForeignKey(b => b.OwnerSolutionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(b => b.OwnerCategory)
            .WithMany()
            .HasForeignKey(b => b.OwnerCategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(b => b.MediaAsset)
            .WithMany()
            .HasForeignKey(b => b.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(b => new { b.OwnerPageId, b.SortOrder }, "IX_ContentBlocks_Page")
            .HasFilter("[OwnerPageId] IS NOT NULL");
        builder.HasIndex(b => new { b.OwnerSolutionId, b.SortOrder }, "IX_ContentBlocks_Solution")
            .HasFilter("[OwnerSolutionId] IS NOT NULL");
        builder.HasIndex(b => new { b.OwnerCategoryId, b.SortOrder }, "IX_ContentBlocks_Category")
            .HasFilter("[OwnerCategoryId] IS NOT NULL");

        // 同一頁不得有兩個 #core-processes。
        builder.HasIndex(b => new { b.OwnerPageId, b.Anchor }, "UX_ContentBlocks_PageAnchor")
            .IsUnique()
            .HasFilter("[Anchor] IS NOT NULL AND [OwnerPageId] IS NOT NULL");
    }
}

public class ContentBlockTranslationConfiguration : TranslationConfiguration<ContentBlockTranslation>
{
    protected override string TableName => "ContentBlockTranslations";
    protected override string OwnerIdProperty => nameof(ContentBlockTranslation.ContentBlockId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ContentBlockTranslation> builder)
    {
        builder.Property(t => t.Eyebrow).HasMaxLength(120);
        builder.Property(t => t.Title).HasMaxLength(300);
        builder.Property(t => t.Subtitle).HasMaxLength(400);
        builder.Property(t => t.CtaLabel).HasMaxLength(80);
        builder.Property(t => t.FootNote).HasMaxLength(600);

        builder.HasOne(t => t.ContentBlock)
            .WithMany(b => b.Translations)
            .HasForeignKey(t => t.ContentBlockId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ContentBlockItemConfiguration : IEntityTypeConfiguration<ContentBlockItem>
{
    public void Configure(EntityTypeBuilder<ContentBlockItem> builder)
    {
        builder.ToTable("ContentBlockItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.IconName).HasMaxLength(DbConventions.IconNameMaxLength);
        builder.Property(i => i.AccentColorHex).HasMaxLength(DbConventions.ColorHexMaxLength);
        builder.Property(i => i.Badge).HasMaxLength(32);
        builder.Property(i => i.LinkUrl).HasMaxLength(DbConventions.UrlMaxLength);
        builder.Property(i => i.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(i => i.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(i => i.ContentBlock)
            .WithMany(b => b.Items)
            .HasForeignKey(i => i.ContentBlockId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.MediaAsset).WithMany().HasForeignKey(i => i.MediaAssetId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.RefCategory).WithMany().HasForeignKey(i => i.RefCategoryId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.RefProduct).WithMany().HasForeignKey(i => i.RefProductId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.RefSolution).WithMany().HasForeignKey(i => i.RefSolutionId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.RefArticle).WithMany().HasForeignKey(i => i.RefArticleId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.RefDownload).WithMany().HasForeignKey(i => i.RefDownloadId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.RefPage).WithMany().HasForeignKey(i => i.RefPageId).OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(i => new { i.ContentBlockId, i.SortOrder }, "IX_ContentBlockItems_Block");
    }
}

public class ContentBlockItemTranslationConfiguration : TranslationConfiguration<ContentBlockItemTranslation>
{
    protected override string TableName => "ContentBlockItemTranslations";
    protected override string OwnerIdProperty => nameof(ContentBlockItemTranslation.ContentBlockItemId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ContentBlockItemTranslation> builder)
    {
        builder.Property(t => t.Title).HasMaxLength(300);
        builder.Property(t => t.Subtitle).HasMaxLength(300);
        builder.Property(t => t.LinkLabel).HasMaxLength(120);
        builder.Property(t => t.Value).HasMaxLength(100);

        builder.HasOne(t => t.ContentBlockItem)
            .WithMany(i => i.Translations)
            .HasForeignKey(t => t.ContentBlockItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
