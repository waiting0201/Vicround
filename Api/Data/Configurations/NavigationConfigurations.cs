using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class NavigationItemConfiguration : ContentEntityConfiguration<NavigationItem>
{
    protected override string TableName => "NavigationItems";

    protected override void ConfigureEntity(EntityTypeBuilder<NavigationItem> builder)
    {
        builder.Property(n => n.Url).HasMaxLength(DbConventions.UrlMaxLength);
        builder.Property(n => n.IconName).HasMaxLength(DbConventions.IconNameMaxLength);

        builder.HasOne(n => n.Parent)
            .WithMany(n => n.Children)
            .HasForeignKey(n => n.ParentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(n => n.RefPage).WithMany().HasForeignKey(n => n.RefPageId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(n => n.RefCategory).WithMany().HasForeignKey(n => n.RefCategoryId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(n => n.RefProduct).WithMany().HasForeignKey(n => n.RefProductId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(n => n.RefSolution).WithMany().HasForeignKey(n => n.RefSolutionId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(n => n.RefArticle).WithMany().HasForeignKey(n => n.RefArticleId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(n => n.RefDownload).WithMany().HasForeignKey(n => n.RefDownloadId).OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(n => new { n.Location, n.ParentId, n.SortOrder }, "IX_NavigationItems_Location");
    }
}

public class NavigationItemTranslationConfiguration : TranslationConfiguration<NavigationItemTranslation>
{
    protected override string TableName => "NavigationItemTranslations";
    protected override string OwnerIdProperty => nameof(NavigationItemTranslation.NavigationItemId);

    protected override void ConfigureTranslation(EntityTypeBuilder<NavigationItemTranslation> builder)
    {
        builder.Property(t => t.Label).HasMaxLength(120).IsRequired();
        builder.Property(t => t.Note).HasMaxLength(200);
        builder.Property(t => t.MenuTitle).HasMaxLength(200);
        builder.Property(t => t.AriaLabel).HasMaxLength(200);

        builder.HasOne(t => t.NavigationItem)
            .WithMany(n => n.Translations)
            .HasForeignKey(t => t.NavigationItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RedirectConfiguration : IEntityTypeConfiguration<Redirect>
{
    public void Configure(EntityTypeBuilder<Redirect> builder)
    {
        builder.ToTable("Redirects");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.FromPath).HasMaxLength(DbConventions.UrlMaxLength).IsRequired();
        builder.Property(r => r.ToPath).HasMaxLength(DbConventions.UrlMaxLength).IsRequired();
        builder.Property(r => r.TargetCulture).HasMaxLength(DbConventions.CultureCodeMaxLength);
        builder.Property(r => r.Notes).HasMaxLength(400);
        builder.Property(r => r.LegacySourceKey).HasMaxLength(DbConventions.LegacySourceKeyMaxLength);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(r => r.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(r => r.TargetCultureRef)
            .WithMany()
            .HasForeignKey(r => r.TargetCulture)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(r => r.FromPath, "UX_Redirects_FromPath").IsUnique();

        // middleware 的熱路徑：命中即可拿到目標，免回表。
        builder.HasIndex(r => r.FromPath, "IX_Redirects_Enabled")
            .HasFilter("[IsEnabled] = 1")
            .IncludeProperties(r => new { r.ToPath, r.StatusCode, r.TargetCulture });
    }
}

public class SiteSettingConfiguration : IEntityTypeConfiguration<SiteSetting>
{
    public void Configure(EntityTypeBuilder<SiteSetting> builder)
    {
        builder.ToTable("SiteSettings");
        builder.HasKey(s => s.Key);

        builder.Property(s => s.Key).HasMaxLength(100);
        builder.Property(s => s.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(s => s.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);
    }
}

public class SiteSettingTranslationConfiguration : TranslationConfiguration<SiteSettingTranslation>
{
    protected override string TableName => "SiteSettingTranslations";
    protected override string OwnerIdProperty => nameof(SiteSettingTranslation.SettingKey);

    protected override void ConfigureTranslation(EntityTypeBuilder<SiteSettingTranslation> builder)
    {
        builder.Property(t => t.SettingKey).HasMaxLength(100);

        builder.HasOne(t => t.Setting)
            .WithMany(s => s.Translations)
            .HasForeignKey(t => t.SettingKey)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
