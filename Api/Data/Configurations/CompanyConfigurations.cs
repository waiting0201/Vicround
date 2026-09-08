using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class MilestoneConfiguration : ContentEntityConfiguration<Milestone>
{
    protected override string TableName => "Milestones";

    protected override void ConfigureEntity(EntityTypeBuilder<Milestone> builder)
    {
        builder.HasOne(m => m.MediaAsset)
            .WithMany()
            .HasForeignKey(m => m.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(m => new { m.Year, m.SortOrder }, "IX_Milestones_Year");
    }
}

public class MilestoneTranslationConfiguration : TranslationConfiguration<MilestoneTranslation>
{
    protected override string TableName => "MilestoneTranslations";
    protected override string OwnerIdProperty => nameof(MilestoneTranslation.MilestoneId);

    protected override void ConfigureTranslation(EntityTypeBuilder<MilestoneTranslation> builder)
    {
        builder.Property(t => t.Label).HasMaxLength(80);
        builder.Property(t => t.Title).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Body).HasMaxLength(1000);

        builder.HasOne(t => t.Milestone)
            .WithMany(m => m.Translations)
            .HasForeignKey(t => t.MilestoneId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class LocationConfiguration : ContentEntityConfiguration<Location>
{
    protected override string TableName => "Locations";

    protected override void ConfigureEntity(EntityTypeBuilder<Location> builder)
    {
        builder.Property(l => l.CountryCode).HasMaxLength(2).IsFixedLength().IsRequired();
        builder.Property(l => l.City).HasMaxLength(80).IsRequired();
        builder.Property(l => l.Phone).HasMaxLength(40);
        builder.Property(l => l.Email).HasMaxLength(DbConventions.EmailMaxLength);
        builder.Property(l => l.Latitude).HasPrecision(9, 6);
        builder.Property(l => l.Longitude).HasPrecision(9, 6);
        builder.Property(l => l.MapUrl).HasMaxLength(DbConventions.UrlMaxLength);

        builder.HasOne(l => l.MediaAsset)
            .WithMany()
            .HasForeignKey(l => l.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(l => new { l.Type, l.Status, l.SortOrder }, "IX_Locations_Type");
    }
}

public class LocationTranslationConfiguration : TranslationConfiguration<LocationTranslation>
{
    protected override string TableName => "LocationTranslations";
    protected override string OwnerIdProperty => nameof(LocationTranslation.LocationId);

    protected override void ConfigureTranslation(EntityTypeBuilder<LocationTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.AddressLine).HasMaxLength(400);
        builder.Property(t => t.Note).HasMaxLength(600);
        builder.Property(t => t.OpeningHours).HasMaxLength(200);

        builder.HasOne(t => t.Location)
            .WithMany(l => l.Translations)
            .HasForeignKey(t => t.LocationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TestimonialConfiguration : ContentEntityConfiguration<Testimonial>
{
    protected override string TableName => "Testimonials";

    protected override void ConfigureEntity(EntityTypeBuilder<Testimonial> builder)
    {
        builder.HasOne(t => t.PartnerBrand)
            .WithMany(p => p.Testimonials)
            .HasForeignKey(t => t.PartnerBrandId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(t => t.Solution)
            .WithMany()
            .HasForeignKey(t => t.SolutionId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(t => t.MediaAsset)
            .WithMany()
            .HasForeignKey(t => t.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(t => new { t.SolutionId, t.Status, t.SortOrder }, "IX_Testimonials_Solution");
    }
}

public class TestimonialTranslationConfiguration : TranslationConfiguration<TestimonialTranslation>
{
    protected override string TableName => "TestimonialTranslations";
    protected override string OwnerIdProperty => nameof(TestimonialTranslation.TestimonialId);

    protected override void ConfigureTranslation(EntityTypeBuilder<TestimonialTranslation> builder)
    {
        builder.Property(t => t.Quote).HasMaxLength(1000).IsRequired();
        builder.Property(t => t.AuthorName).HasMaxLength(120);
        builder.Property(t => t.AuthorTitle).HasMaxLength(160);
        builder.Property(t => t.CompanyType).HasMaxLength(160);

        builder.HasOne(t => t.Testimonial)
            .WithMany(x => x.Translations)
            .HasForeignKey(t => t.TestimonialId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PartnerBrandConfiguration : SluggedEntityConfiguration<PartnerBrand>
{
    protected override string TableName => "PartnerBrands";

    protected override void ConfigureEntity(EntityTypeBuilder<PartnerBrand> builder)
    {
        builder.Property(p => p.WebsiteUrl).HasMaxLength(DbConventions.UrlMaxLength);

        builder.HasOne(p => p.LogoMediaAsset)
            .WithMany()
            .HasForeignKey(p => p.LogoMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(p => new { p.IsLogoWallVisible, p.Status, p.SortOrder }, "IX_PartnerBrands_LogoWall");
    }
}

public class PartnerBrandTranslationConfiguration : TranslationConfiguration<PartnerBrandTranslation>
{
    protected override string TableName => "PartnerBrandTranslations";
    protected override string OwnerIdProperty => nameof(PartnerBrandTranslation.PartnerBrandId);

    protected override void ConfigureTranslation(EntityTypeBuilder<PartnerBrandTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Note).HasMaxLength(400);

        builder.HasOne(t => t.PartnerBrand)
            .WithMany(p => p.Translations)
            .HasForeignKey(t => t.PartnerBrandId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ContactChannelConfiguration : SluggedEntityConfiguration<ContactChannel>
{
    protected override string TableName => "ContactChannels";

    protected override void ConfigureEntity(EntityTypeBuilder<ContactChannel> builder)
    {
        builder.Property(c => c.Email).HasMaxLength(DbConventions.EmailMaxLength).IsRequired();
        builder.Property(c => c.Phone).HasMaxLength(40);

        builder.HasIndex(c => new { c.InquiryType, c.Status }, "IX_ContactChannels_InquiryType");
    }
}

public class ContactChannelTranslationConfiguration : TranslationConfiguration<ContactChannelTranslation>
{
    protected override string TableName => "ContactChannelTranslations";
    protected override string OwnerIdProperty => nameof(ContactChannelTranslation.ContactChannelId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ContactChannelTranslation> builder)
    {
        builder.Property(t => t.Label).HasMaxLength(120).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(400);

        builder.HasOne(t => t.ContactChannel)
            .WithMany(c => c.Translations)
            .HasForeignKey(t => t.ContactChannelId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
