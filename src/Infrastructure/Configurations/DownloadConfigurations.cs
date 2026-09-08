using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Domain.Downloads;

namespace VicRound.Infrastructure.Configurations;

public class DownloadConfiguration : SluggedEntityConfiguration<Download>
{
    protected override string TableName => "Downloads";

    protected override void ConfigureEntity(EntityTypeBuilder<Download> builder)
    {
        builder.Property(d => d.Version).HasMaxLength(32);
        builder.Property(d => d.FileExtension).HasMaxLength(16).IsRequired();
        builder.Property(d => d.DocumentCulture).HasMaxLength(DbConventions.CultureCodeMaxLength);

        builder.HasOne(d => d.MediaAsset)
            .WithMany()
            .HasForeignKey(d => d.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(d => d.ThumbnailMediaAsset)
            .WithMany()
            .HasForeignKey(d => d.ThumbnailMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(d => d.DocumentCultureRef)
            .WithMany()
            .HasForeignKey(d => d.DocumentCulture)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(d => new { d.AccessLevel, d.Kind, d.Status, d.SortOrder }, "IX_Downloads_Access");
        builder.HasIndex(d => d.ValidUntil, "IX_Downloads_ValidUntil")
            .HasFilter("[ValidUntil] IS NOT NULL");
    }
}

public class DownloadTranslationConfiguration : TranslationConfiguration<DownloadTranslation>
{
    protected override string TableName => "DownloadTranslations";
    protected override string OwnerIdProperty => nameof(DownloadTranslation.DownloadId);

    protected override void ConfigureTranslation(EntityTypeBuilder<DownloadTranslation> builder)
    {
        builder.Property(t => t.Title).HasMaxLength(300).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(1000);

        builder.HasOne(t => t.Download)
            .WithMany(d => d.Translations)
            .HasForeignKey(t => t.DownloadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class DownloadProductConfiguration : IEntityTypeConfiguration<DownloadProduct>
{
    public void Configure(EntityTypeBuilder<DownloadProduct> builder)
    {
        builder.ToTable("DownloadProducts");
        builder.HasKey(x => new { x.DownloadId, x.ProductId });
        builder.HasOne(x => x.Download).WithMany(d => d.DownloadProducts).HasForeignKey(x => x.DownloadId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.ProductId, x.DownloadId }, "IX_DownloadProducts_Reverse");
    }
}

public class DownloadCategoryConfiguration : IEntityTypeConfiguration<DownloadCategory>
{
    public void Configure(EntityTypeBuilder<DownloadCategory> builder)
    {
        builder.ToTable("DownloadCategories");
        builder.HasKey(x => new { x.DownloadId, x.CategoryId });
        builder.HasOne(x => x.Download).WithMany(d => d.DownloadCategories).HasForeignKey(x => x.DownloadId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.CategoryId, x.DownloadId }, "IX_DownloadCategories_Reverse");
    }
}

public class DownloadSolutionConfiguration : IEntityTypeConfiguration<DownloadSolution>
{
    public void Configure(EntityTypeBuilder<DownloadSolution> builder)
    {
        builder.ToTable("DownloadSolutions");
        builder.HasKey(x => new { x.DownloadId, x.SolutionId });
        builder.HasOne(x => x.Download).WithMany(d => d.DownloadSolutions).HasForeignKey(x => x.DownloadId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Solution).WithMany().HasForeignKey(x => x.SolutionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.SolutionId, x.DownloadId }, "IX_DownloadSolutions_Reverse");
    }
}

public class DownloadCertificationConfiguration : IEntityTypeConfiguration<DownloadCertification>
{
    public void Configure(EntityTypeBuilder<DownloadCertification> builder)
    {
        builder.ToTable("DownloadCertifications");
        builder.HasKey(x => new { x.DownloadId, x.CertificationId });
        builder.HasOne(x => x.Download).WithMany(d => d.DownloadCertifications).HasForeignKey(x => x.DownloadId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Certification).WithMany().HasForeignKey(x => x.CertificationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.CertificationId, x.DownloadId }, "IX_DownloadCertifications_Reverse");
    }
}

public class DownloadArticleConfiguration : IEntityTypeConfiguration<DownloadArticle>
{
    public void Configure(EntityTypeBuilder<DownloadArticle> builder)
    {
        builder.ToTable("DownloadArticles");
        builder.HasKey(x => new { x.DownloadId, x.ArticleId });
        builder.HasOne(x => x.Download).WithMany(d => d.DownloadArticles).HasForeignKey(x => x.DownloadId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Article).WithMany().HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.ArticleId, x.DownloadId }, "IX_DownloadArticles_Reverse");
    }
}
