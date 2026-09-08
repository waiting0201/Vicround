using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class CultureConfiguration : IEntityTypeConfiguration<Culture>
{
    public void Configure(EntityTypeBuilder<Culture> builder)
    {
        builder.ToTable("Cultures");
        builder.HasKey(c => c.Code);

        builder.Property(c => c.Code).HasMaxLength(DbConventions.CultureCodeMaxLength);
        builder.Property(c => c.DisplayName).HasMaxLength(50).IsRequired();
        builder.Property(c => c.NativeName).HasMaxLength(50).IsRequired();

        // 只能有一個預設語系。
        builder.HasIndex(c => c.IsDefault, "UX_Cultures_IsDefault")
            .IsUnique()
            .HasFilter("[IsDefault] = 1");

        // §18.1 A 層：永不變、無隨機值的參照資料才用 HasData。
        builder.HasData(
            new Culture { Code = CultureCodes.English, DisplayName = "English", NativeName = "English", IsDefault = true, IsEnabled = true, SortOrder = 1 },
            new Culture { Code = CultureCodes.TraditionalChinese, DisplayName = "Chinese (Traditional)", NativeName = "繁體中文", IsDefault = false, IsEnabled = true, SortOrder = 2 });
    }
}
