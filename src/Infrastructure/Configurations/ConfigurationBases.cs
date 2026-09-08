using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Domain.Common;
using VicRound.Domain.Globalization;
using VicRound.Domain.Media;

namespace VicRound.Infrastructure.Configurations;

/// <summary>database.md §0.4 的型別與定序慣例，集中於此以免各處寫法漂移。</summary>
public static class DbConventions
{
    public const string UtcNow = "SYSUTCDATETIME()";
    public const string DateTimeType = "datetime2(3)";

    /// <summary>
    /// Slug 用大小寫敏感定序：避免 <c>/Anti-Fog</c> 與 <c>/anti-fog</c> 在 CI 定序下被視為同一列，
    /// 但在 URL 上其實是兩個頁面。
    /// </summary>
    public const string SlugCollation = "Latin1_General_100_CS_AS";

    public const int SlugMaxLength = 200;
    public const int CultureCodeMaxLength = 10;
    public const int EmailMaxLength = 320;
    public const int IconNameMaxLength = 64;
    public const int ColorHexMaxLength = 7;
    public const int UrlMaxLength = 512;
    public const int LegacySourceKeyMaxLength = 128;

    /// <summary>Archived（=2）不參與唯一性，讓 slug 可被重用（§17.1）。</summary>
    public const string NotArchivedFilter = "[Status] <> 2";

    /// <summary>Slug 只能是小寫英數與連字號（§0.4）。</summary>
    public const string SlugCheckSql = "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'";

    /// <summary>Owner triple 的「恰一個非 NULL」CHECK（§0.6）。</summary>
    public static string ExactlyOneOwner(params string[] columns) =>
        string.Join(" + ", columns.Select(c => $"CASE WHEN [{c}] IS NULL THEN 0 ELSE 1 END")) + " = 1";
}

/// <summary>Embedded 實體（Id + Status + SortOrder + 三時間戳）的共同組態。</summary>
public abstract class ContentEntityConfiguration<T> : IEntityTypeConfiguration<T>
    where T : ContentEntity
{
    protected abstract string TableName { get; }

    public void Configure(EntityTypeBuilder<T> builder)
    {
        builder.ToTable(TableName, t => ConfigureTable(t));
        builder.HasKey(e => e.Id);

        builder.Property(e => e.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(e => e.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        ConfigureSlug(builder);
        ConfigureEntity(builder);
    }

    protected virtual void ConfigureTable(TableBuilder<T> table) { }

    protected virtual void ConfigureSlug(EntityTypeBuilder<T> builder) { }

    protected abstract void ConfigureEntity(EntityTypeBuilder<T> builder);
}

/// <summary>
/// Routable / Addressable 實體：加上 slug 的長度、定序、CHECK 與兩條索引
/// （filtered unique 供唯一性、非唯一全量供 Admin 的碰撞檢查，§17.1）。
/// </summary>
public abstract class SluggedEntityConfiguration<T> : ContentEntityConfiguration<T>
    where T : SluggedEntity
{
    protected override void ConfigureTable(TableBuilder<T> table) =>
        table.HasCheckConstraint($"CK_{TableName}_Slug", DbConventions.SlugCheckSql);

    protected override void ConfigureSlug(EntityTypeBuilder<T> builder)
    {
        builder.Property(e => e.Slug)
            .HasMaxLength(DbConventions.SlugMaxLength)
            .UseCollation(DbConventions.SlugCollation)
            .IsRequired();

        builder.HasIndex(e => e.Slug, $"UX_{TableName}_Slug")
            .IsUnique()
            .HasFilter(DbConventions.NotArchivedFilter);

        builder.HasIndex(e => e.Slug, $"IX_{TableName}_Slug_All");
    }
}

/// <summary>
/// 翻譯表的共同組態（§0.2）：PK = (擁有者 Id, Culture)、Culture FK → Cultures（NO ACTION）、
/// 以及 Routable/Addressable 才有的 SEO 四欄。
/// </summary>
public abstract class TranslationConfiguration<T> : IEntityTypeConfiguration<T>
    where T : Translation
{
    protected abstract string TableName { get; }

    /// <summary>擁有者的外鍵屬性名，如 <c>ProductId</c>。</summary>
    protected abstract string OwnerIdProperty { get; }

    public void Configure(EntityTypeBuilder<T> builder)
    {
        builder.ToTable(TableName);
        builder.HasKey(OwnerIdProperty, nameof(Translation.Culture));

        builder.Property(t => t.Culture)
            .HasMaxLength(DbConventions.CultureCodeMaxLength)
            .IsRequired();

        builder.HasOne<Culture>()
            .WithMany()
            .HasForeignKey(nameof(Translation.Culture))
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(nameof(Translation.Culture)).HasDatabaseName($"IX_{TableName}_Culture");

        if (typeof(SeoTranslation).IsAssignableFrom(typeof(T)))
        {
            builder.Property(nameof(SeoTranslation.SeoTitle)).HasMaxLength(200);
            builder.Property(nameof(SeoTranslation.SeoDescription)).HasMaxLength(400);
            builder.Property(nameof(SeoTranslation.SeoKeywords)).HasMaxLength(400);
            builder.HasOne<MediaAsset>()
                .WithMany()
                .HasForeignKey(nameof(SeoTranslation.OgImageMediaAssetId))
                .OnDelete(DeleteBehavior.NoAction);
        }

        ConfigureTranslation(builder);
    }

    protected abstract void ConfigureTranslation(EntityTypeBuilder<T> builder);
}
