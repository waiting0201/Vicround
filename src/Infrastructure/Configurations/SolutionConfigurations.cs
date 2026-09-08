using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Domain.Solutions;

namespace VicRound.Infrastructure.Configurations;

public class SolutionConfiguration : SluggedEntityConfiguration<Solution>
{
    protected override string TableName => "Solutions";

    protected override void ConfigureEntity(EntityTypeBuilder<Solution> builder)
    {
        builder.Property(s => s.IconName).HasMaxLength(DbConventions.IconNameMaxLength);
        builder.Property(s => s.LegacySourceKey).HasMaxLength(DbConventions.LegacySourceKeyMaxLength);

        builder.HasOne(s => s.HeroMediaAsset)
            .WithMany()
            .HasForeignKey(s => s.HeroMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(s => new { s.Status, s.SortOrder }, "IX_Solutions_Status");
        builder.HasIndex(s => s.LegacySourceKey, "UX_Solutions_LegacySourceKey")
            .IsUnique()
            .HasFilter("[LegacySourceKey] IS NOT NULL");
    }
}

public class SolutionTranslationConfiguration : TranslationConfiguration<SolutionTranslation>
{
    protected override string TableName => "SolutionTranslations";
    protected override string OwnerIdProperty => nameof(SolutionTranslation.SolutionId);

    protected override void ConfigureTranslation(EntityTypeBuilder<SolutionTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.MenuNote).HasMaxLength(160);
        builder.Property(t => t.Summary).HasMaxLength(600);
        builder.Property(t => t.ChallengeTitle).HasMaxLength(300);
        builder.Property(t => t.CtaLabel).HasMaxLength(80);

        builder.HasOne(t => t.Solution)
            .WithMany(s => s.Translations)
            .HasForeignKey(t => t.SolutionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SolutionCategoryConfiguration : IEntityTypeConfiguration<SolutionCategory>
{
    public void Configure(EntityTypeBuilder<SolutionCategory> builder)
    {
        builder.ToTable("SolutionCategories");
        builder.HasKey(sc => new { sc.SolutionId, sc.CategoryId });

        builder.HasOne(sc => sc.Solution)
            .WithMany(s => s.SolutionCategories)
            .HasForeignKey(sc => sc.SolutionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(sc => sc.Category)
            .WithMany()
            .HasForeignKey(sc => sc.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(sc => new { sc.CategoryId, sc.SolutionId }, "IX_SolutionCategories_Reverse");
    }
}

public class ProductSolutionConfiguration : IEntityTypeConfiguration<ProductSolution>
{
    public void Configure(EntityTypeBuilder<ProductSolution> builder)
    {
        builder.ToTable("ProductSolutions");
        builder.HasKey(ps => new { ps.ProductId, ps.SolutionId });

        builder.HasOne(ps => ps.Product)
            .WithMany()
            .HasForeignKey(ps => ps.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ps => ps.Solution)
            .WithMany(s => s.ProductSolutions)
            .HasForeignKey(ps => ps.SolutionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ps => new { ps.SolutionId, ps.ProductId }, "IX_ProductSolutions_Reverse");
    }
}
