using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class CategoryConfiguration : SluggedEntityConfiguration<Category>
{
    protected override string TableName => "Categories";

    protected override void ConfigureEntity(EntityTypeBuilder<Category> builder)
    {
        builder.Property(c => c.AccentColorHex).HasMaxLength(DbConventions.ColorHexMaxLength).IsRequired();
        builder.Property(c => c.IconName).HasMaxLength(DbConventions.IconNameMaxLength);

        // SQL Server 不允許 self-ref cascade（§17.3）。
        builder.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(c => c.HeroMediaAsset)
            .WithMany()
            .HasForeignKey(c => c.HeroMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(c => new { c.ParentId, c.Type, c.SortOrder }, "IX_Categories_Parent");
        builder.HasIndex(c => new { c.Type, c.Status, c.SortOrder }, "IX_Categories_Type");
    }
}

public class CategoryTranslationConfiguration : TranslationConfiguration<CategoryTranslation>
{
    protected override string TableName => "CategoryTranslations";
    protected override string OwnerIdProperty => nameof(CategoryTranslation.CategoryId);

    protected override void ConfigureTranslation(EntityTypeBuilder<CategoryTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.ShortName).HasMaxLength(80);
        builder.Property(t => t.MenuNote).HasMaxLength(160);
        builder.Property(t => t.Summary).HasMaxLength(600);

        builder.HasOne(t => t.Category)
            .WithMany(c => c.Translations)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductConfiguration : SluggedEntityConfiguration<Product>
{
    protected override string TableName => "Products";

    protected override void ConfigureEntity(EntityTypeBuilder<Product> builder)
    {
        builder.Property(p => p.Code).HasMaxLength(32);
        builder.Property(p => p.Brand).HasMaxLength(80);
        builder.Property(p => p.LegacySourceKey).HasMaxLength(DbConventions.LegacySourceKeyMaxLength);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(p => p.ParentProduct)
            .WithMany(p => p.Variants)
            .HasForeignKey(p => p.ParentProductId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(p => p.HeroMediaAsset)
            .WithMany()
            .HasForeignKey(p => p.HeroMediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        // 產品線頁的主查詢：一次取完卡片需要的欄位，免回表。
        builder.HasIndex(p => new { p.CategoryId, p.Status, p.SortOrder }, "IX_Products_Category")
            .IncludeProperties(p => new { p.Slug, p.IsFeatured, p.HeroMediaAssetId });

        builder.HasIndex(p => new { p.ParentProductId, p.SortOrder }, "IX_Products_ParentProduct");

        builder.HasIndex(p => new { p.IsFeatured, p.Status }, "IX_Products_Featured")
            .HasFilter("[IsFeatured] = 1");

        builder.HasIndex(p => p.LegacySourceKey, "UX_Products_LegacySourceKey")
            .IsUnique()
            .HasFilter("[LegacySourceKey] IS NOT NULL");
    }
}

public class ProductTranslationConfiguration : TranslationConfiguration<ProductTranslation>
{
    protected override string TableName => "ProductTranslations";
    protected override string OwnerIdProperty => nameof(ProductTranslation.ProductId);

    protected override void ConfigureTranslation(EntityTypeBuilder<ProductTranslation> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Summary).HasMaxLength(600);
        builder.Property(t => t.ApplicationNote).HasMaxLength(600);

        builder.HasOne(t => t.Product)
            .WithMany(p => p.Translations)
            .HasForeignKey(t => t.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("ProductImages");
        builder.HasKey(pi => new { pi.ProductId, pi.MediaAssetId });

        builder.HasOne(pi => pi.Product)
            .WithMany(p => p.Images)
            .HasForeignKey(pi => pi.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pi => pi.MediaAsset)
            .WithMany()
            .HasForeignKey(pi => pi.MediaAssetId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(pi => new { pi.MediaAssetId, pi.ProductId }, "IX_ProductImages_Reverse");
    }
}

public class SpecificationRowConfiguration : ContentEntityConfiguration<SpecificationRow>
{
    protected override string TableName => "SpecificationRows";

    protected override void ConfigureTable(TableBuilder<SpecificationRow> table) =>
        table.HasCheckConstraint(
            "CK_SpecificationRows_SingleOwner",
            DbConventions.ExactlyOneOwner(
                nameof(SpecificationRow.OwnerProductId),
                nameof(SpecificationRow.OwnerCategoryId),
                nameof(SpecificationRow.OwnerSolutionId)));

    protected override void ConfigureEntity(EntityTypeBuilder<SpecificationRow> builder)
    {
        builder.HasOne(s => s.OwnerProduct)
            .WithMany(p => p.SpecificationRows)
            .HasForeignKey(s => s.OwnerProductId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(s => s.OwnerCategory)
            .WithMany()
            .HasForeignKey(s => s.OwnerCategoryId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(s => s.OwnerSolution)
            .WithMany(s => s.SpecificationRows)
            .HasForeignKey(s => s.OwnerSolutionId)
            .OnDelete(DeleteBehavior.NoAction);

        // Owner triple 的代價：查詢一定要帶 owner 條件，因此每個 owner 一條 filtered index。
        builder.HasIndex(s => new { s.OwnerProductId, s.SortOrder }, "IX_SpecificationRows_Product")
            .HasFilter("[OwnerProductId] IS NOT NULL");
        builder.HasIndex(s => new { s.OwnerCategoryId, s.SortOrder }, "IX_SpecificationRows_Category")
            .HasFilter("[OwnerCategoryId] IS NOT NULL");
        builder.HasIndex(s => new { s.OwnerSolutionId, s.SortOrder }, "IX_SpecificationRows_Solution")
            .HasFilter("[OwnerSolutionId] IS NOT NULL");
    }
}

public class SpecificationRowTranslationConfiguration : TranslationConfiguration<SpecificationRowTranslation>
{
    protected override string TableName => "SpecificationRowTranslations";
    protected override string OwnerIdProperty => nameof(SpecificationRowTranslation.SpecificationRowId);

    protected override void ConfigureTranslation(EntityTypeBuilder<SpecificationRowTranslation> builder)
    {
        builder.Property(t => t.Label).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Value).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Note).HasMaxLength(400);

        builder.HasOne(t => t.SpecificationRow)
            .WithMany(s => s.Translations)
            .HasForeignKey(t => t.SpecificationRowId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
