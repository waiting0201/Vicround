using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> builder)
    {
        builder.ToTable("MediaAssets");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Container).HasMaxLength(64).IsRequired();
        builder.Property(m => m.BlobPath).HasMaxLength(DbConventions.UrlMaxLength).IsRequired();
        builder.Property(m => m.Url).HasMaxLength(1024);
        builder.Property(m => m.MimeType).HasMaxLength(120).IsRequired();
        builder.Property(m => m.FileName).HasMaxLength(260).IsRequired();
        builder.Property(m => m.Sha256).HasMaxLength(64).IsFixedLength();
        builder.Property(m => m.FocalPointX).HasPrecision(5, 4);
        builder.Property(m => m.FocalPointY).HasPrecision(5, 4);
        builder.Property(m => m.LegacySourceKey).HasMaxLength(DbConventions.LegacySourceKeyMaxLength);

        builder.Property(m => m.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(m => m.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        // 去重提示，刻意非唯一：同一份檔案可能被合法地上傳兩次（不同用途）。
        builder.HasIndex(m => m.Sha256, "IX_MediaAssets_Sha256").HasFilter("[Sha256] IS NOT NULL");
        builder.HasIndex(m => new { m.Container, m.IsPrivate, m.IsArchived }, "IX_MediaAssets_Container");
        builder.HasIndex(m => m.LegacySourceKey, "UX_MediaAssets_LegacySourceKey")
            .IsUnique()
            .HasFilter("[LegacySourceKey] IS NOT NULL");
    }
}

public class MediaAssetTranslationConfiguration : TranslationConfiguration<MediaAssetTranslation>
{
    protected override string TableName => "MediaAssetTranslations";
    protected override string OwnerIdProperty => nameof(MediaAssetTranslation.MediaAssetId);

    protected override void ConfigureTranslation(EntityTypeBuilder<MediaAssetTranslation> builder)
    {
        builder.Property(t => t.AltText).HasMaxLength(300);
        builder.Property(t => t.Caption).HasMaxLength(600);
        builder.Property(t => t.Title).HasMaxLength(200);

        builder.HasOne(t => t.MediaAsset)
            .WithMany(m => m.Translations)
            .HasForeignKey(t => t.MediaAssetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
