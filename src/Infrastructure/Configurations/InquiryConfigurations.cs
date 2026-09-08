using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Domain.Inquiries;

namespace VicRound.Infrastructure.Configurations;

public class ContactInquiryConfiguration : IEntityTypeConfiguration<ContactInquiry>
{
    public void Configure(EntityTypeBuilder<ContactInquiry> builder)
    {
        builder.ToTable("ContactInquiries");
        builder.HasKey(i => i.Id);

        // GUID PK：Id 會出現在回信連結，遞增整數可被枚舉（§0.3）。
        builder.Property(i => i.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(i => i.ReferenceNumber).HasMaxLength(24).IsRequired();
        builder.Property(i => i.Name).HasMaxLength(160).IsRequired();
        builder.Property(i => i.CompanyName).HasMaxLength(200).IsRequired();
        builder.Property(i => i.Email).HasMaxLength(DbConventions.EmailMaxLength).IsRequired();
        builder.Property(i => i.Phone).HasMaxLength(40);
        builder.Property(i => i.ProductLineOther).HasMaxLength(100);
        builder.Property(i => i.ApplicationText).HasMaxLength(500);
        builder.Property(i => i.TargetSpec).HasMaxLength(2000);
        builder.Property(i => i.Message).HasMaxLength(4000);
        builder.Property(i => i.SourceUrl).HasMaxLength(DbConventions.UrlMaxLength).IsRequired();
        builder.Property(i => i.Culture).HasMaxLength(DbConventions.CultureCodeMaxLength).IsRequired();
        builder.Property(i => i.ConsentPolicyVersion).HasMaxLength(20).IsRequired();
        builder.Property(i => i.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(i => i.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(i => i.Category).WithMany().HasForeignKey(i => i.CategoryId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.RefProduct).WithMany().HasForeignKey(i => i.RefProductId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.RefDownload).WithMany().HasForeignKey(i => i.RefDownloadId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.CultureRef).WithMany().HasForeignKey(i => i.Culture).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.Member).WithMany().HasForeignKey(i => i.MemberId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.AssignedChannel).WithMany().HasForeignKey(i => i.AssignedChannelId).OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(i => i.ReferenceNumber, "UX_ContactInquiries_ReferenceNumber").IsUnique();
        builder.HasIndex(i => new { i.Status, i.CreatedAt }, "IX_ContactInquiries_Status").IsDescending(false, true);
    }
}
