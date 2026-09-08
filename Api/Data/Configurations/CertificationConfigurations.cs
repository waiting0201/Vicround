using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class CertificationConfiguration : SluggedEntityConfiguration<Certification>
{
    protected override string TableName => "Certifications";

    protected override void ConfigureEntity(EntityTypeBuilder<Certification> builder)
    {
        builder.Property(c => c.CertificateNumber).HasMaxLength(120);

        // NO ACTION：證書 PDF 被刪不該連帶刪掉證書本身。
        builder.HasOne(c => c.Download)
            .WithMany()
            .HasForeignKey(c => c.DownloadId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(c => c.LogoMediaAsset)
            .WithMany()
            .HasForeignKey(c => c.LogoMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(c => new { c.Category, c.Status, c.SortOrder }, "IX_Certifications_Category");
    }
}

public class CertificationTranslationConfiguration : TranslationConfiguration<CertificationTranslation>
{
    protected override string TableName => "CertificationTranslations";
    protected override string OwnerIdProperty => nameof(CertificationTranslation.CertificationId);

    protected override void ConfigureTranslation(EntityTypeBuilder<CertificationTranslation> builder)
    {
        builder.Property(t => t.Title).HasMaxLength(200).IsRequired();
        builder.Property(t => t.ShortNote).HasMaxLength(200);
        builder.Property(t => t.Summary).HasMaxLength(1000);
        builder.Property(t => t.IssuerName).HasMaxLength(200);
        builder.Property(t => t.ValidityText).HasMaxLength(200);
        builder.Property(t => t.ScopeText).HasMaxLength(400);
        builder.Property(t => t.SitesText).HasMaxLength(400);
        builder.Property(t => t.DocumentationLabel).HasMaxLength(120);

        builder.HasOne(t => t.Certification)
            .WithMany(c => c.Translations)
            .HasForeignKey(t => t.CertificationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CertificationProductConfiguration : IEntityTypeConfiguration<CertificationProduct>
{
    public void Configure(EntityTypeBuilder<CertificationProduct> builder)
    {
        builder.ToTable("CertificationProducts");
        builder.HasKey(x => new { x.CertificationId, x.ProductId });
        builder.HasOne(x => x.Certification).WithMany(c => c.CertificationProducts).HasForeignKey(x => x.CertificationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.ProductId, x.CertificationId }, "IX_CertificationProducts_Reverse");
    }
}

public class CertificationCategoryLinkConfiguration : IEntityTypeConfiguration<CertificationCategoryLink>
{
    public void Configure(EntityTypeBuilder<CertificationCategoryLink> builder)
    {
        builder.ToTable("CertificationCategories");
        builder.HasKey(x => new { x.CertificationId, x.CategoryId });
        builder.HasOne(x => x.Certification).WithMany(c => c.CertificationCategories).HasForeignKey(x => x.CertificationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.CategoryId, x.CertificationId }, "IX_CertificationCategories_Reverse");
    }
}
