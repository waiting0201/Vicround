using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class CaseStudyConfiguration : SluggedEntityConfiguration<CaseStudy>
{
    protected override string TableName => "CaseStudies";

    protected override void ConfigureEntity(EntityTypeBuilder<CaseStudy> builder)
    {
        builder.HasOne(c => c.MediaAsset)
            .WithMany()
            .HasForeignKey(c => c.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(c => new { c.Status, c.SortOrder }, "IX_CaseStudies_Status");
    }
}

public class CaseStudyTranslationConfiguration : TranslationConfiguration<CaseStudyTranslation>
{
    protected override string TableName => "CaseStudyTranslations";
    protected override string OwnerIdProperty => nameof(CaseStudyTranslation.CaseStudyId);

    protected override void ConfigureTranslation(EntityTypeBuilder<CaseStudyTranslation> builder)
    {
        builder.Property(t => t.ClientName).HasMaxLength(160);
        builder.Property(t => t.ProjectName).HasMaxLength(200);
        builder.Property(t => t.Title).HasMaxLength(300).IsRequired();
        builder.Property(t => t.Challenge).HasMaxLength(2000).IsRequired();
        builder.Property(t => t.Solution).HasMaxLength(2000).IsRequired();
        builder.Property(t => t.Result).HasMaxLength(2000);

        builder.HasOne(t => t.CaseStudy)
            .WithMany(c => c.Translations)
            .HasForeignKey(t => t.CaseStudyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CaseStudyProductConfiguration : IEntityTypeConfiguration<CaseStudyProduct>
{
    public void Configure(EntityTypeBuilder<CaseStudyProduct> builder)
    {
        builder.ToTable("CaseStudyProducts");
        builder.HasKey(x => new { x.CaseStudyId, x.ProductId });
        builder.HasOne(x => x.CaseStudy).WithMany(c => c.CaseStudyProducts).HasForeignKey(x => x.CaseStudyId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.ProductId, x.CaseStudyId }, "IX_CaseStudyProducts_Reverse");
    }
}

public class CaseStudySolutionConfiguration : IEntityTypeConfiguration<CaseStudySolution>
{
    public void Configure(EntityTypeBuilder<CaseStudySolution> builder)
    {
        builder.ToTable("CaseStudySolutions");
        builder.HasKey(x => new { x.CaseStudyId, x.SolutionId });
        builder.HasOne(x => x.CaseStudy).WithMany(c => c.CaseStudySolutions).HasForeignKey(x => x.CaseStudyId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Solution).WithMany().HasForeignKey(x => x.SolutionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => new { x.SolutionId, x.CaseStudyId }, "IX_CaseStudySolutions_Reverse");
    }
}
