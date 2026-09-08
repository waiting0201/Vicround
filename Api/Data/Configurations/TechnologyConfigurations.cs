using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class ProcessFlowConfiguration : SluggedEntityConfiguration<ProcessFlow>
{
    protected override string TableName => "ProcessFlows";

    protected override void ConfigureEntity(EntityTypeBuilder<ProcessFlow> builder)
    {
        builder.HasOne(f => f.OwnerCategory)
            .WithMany()
            .HasForeignKey(f => f.OwnerCategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(f => new { f.Kind, f.Status, f.SortOrder }, "IX_ProcessFlows_Kind");
        builder.HasIndex(f => f.OwnerCategoryId, "IX_ProcessFlows_OwnerCategory")
            .HasFilter("[OwnerCategoryId] IS NOT NULL");
    }
}

public class ProcessFlowTranslationConfiguration : TranslationConfiguration<ProcessFlowTranslation>
{
    protected override string TableName => "ProcessFlowTranslations";
    protected override string OwnerIdProperty => nameof(ProcessFlowTranslation.ProcessFlowId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ProcessFlowTranslation> builder)
    {
        builder.Property(t => t.Title).HasMaxLength(300).IsRequired();
        builder.Property(t => t.Subtitle).HasMaxLength(400);

        builder.HasOne(t => t.ProcessFlow)
            .WithMany(f => f.Translations)
            .HasForeignKey(t => t.ProcessFlowId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProcessStepConfiguration : ContentEntityConfiguration<ProcessStep>
{
    protected override string TableName => "ProcessSteps";

    protected override void ConfigureEntity(EntityTypeBuilder<ProcessStep> builder)
    {
        builder.Property(s => s.IconName).HasMaxLength(DbConventions.IconNameMaxLength);
        builder.Property(s => s.AccentColorHex).HasMaxLength(DbConventions.ColorHexMaxLength);

        builder.HasOne(s => s.ProcessFlow)
            .WithMany(f => f.Steps)
            .HasForeignKey(s => s.ProcessFlowId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.MediaAsset)
            .WithMany()
            .HasForeignKey(s => s.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(s => new { s.ProcessFlowId, s.SortOrder }, "IX_ProcessSteps_Flow");
    }
}

public class ProcessStepTranslationConfiguration : TranslationConfiguration<ProcessStepTranslation>
{
    protected override string TableName => "ProcessStepTranslations";
    protected override string OwnerIdProperty => nameof(ProcessStepTranslation.ProcessStepId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ProcessStepTranslation> builder)
    {
        builder.Property(t => t.Title).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Body).HasMaxLength(1000);

        builder.HasOne(t => t.ProcessStep)
            .WithMany(s => s.Translations)
            .HasForeignKey(t => t.ProcessStepId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
