using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class MemberConfiguration : IEntityTypeConfiguration<Member>
{
    public void Configure(EntityTypeBuilder<Member> builder)
    {
        builder.ToTable("Members");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(m => m.Email).HasMaxLength(DbConventions.EmailMaxLength).IsRequired();
        builder.Property(m => m.EmailNormalized).HasMaxLength(DbConventions.EmailMaxLength).IsRequired();

        // 計算欄位（PERSISTED）：供 BusinessDomainRules 比對與同公司彙整。
        builder.Property(m => m.EmailDomain)
            .HasMaxLength(DbConventions.EmailMaxLength)
            .HasComputedColumnSql("LOWER(SUBSTRING([Email], CHARINDEX('@', [Email]) + 1, 320))", stored: true);

        builder.Property(m => m.PasswordHash).HasMaxLength(256).IsRequired();
        builder.Property(m => m.FullName).HasMaxLength(160).IsRequired();
        builder.Property(m => m.CompanyName).HasMaxLength(200).IsRequired();
        builder.Property(m => m.JobRoleOther).HasMaxLength(120);
        builder.Property(m => m.Phone).HasMaxLength(40);
        builder.Property(m => m.CountryCode).HasMaxLength(2).IsFixedLength();
        builder.Property(m => m.PreferredCulture).HasMaxLength(DbConventions.CultureCodeMaxLength).IsRequired();
        builder.Property(m => m.ReviewNote).HasMaxLength(600);
        builder.Property(m => m.ConsentPolicyVersion).HasMaxLength(20).IsRequired();
        builder.Property(m => m.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(m => m.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(m => m.PreferredCultureRef)
            .WithMany()
            .HasForeignKey(m => m.PreferredCulture)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(m => m.EmailNormalized, "UX_Members_EmailNormalized").IsUnique();
        builder.HasIndex(m => new { m.Status, m.CreatedAt }, "IX_Members_Status").IsDescending(false, true);
        builder.HasIndex(m => m.EmailDomain, "IX_Members_EmailDomain");
    }
}

public class MemberRefreshTokenConfiguration : IEntityTypeConfiguration<MemberRefreshToken>
{
    public void Configure(EntityTypeBuilder<MemberRefreshToken> builder)
    {
        builder.ToTable("MemberRefreshTokens");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(t => t.TokenHash).HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(t => t.ReplacedByTokenHash).HasMaxLength(64).IsFixedLength();
        builder.Property(t => t.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(t => t.Member)
            .WithMany(m => m.RefreshTokens)
            .HasForeignKey(t => t.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.TokenHash, "UX_MemberRefreshTokens_TokenHash").IsUnique();
    }
}

public class MemberTokenConfiguration : IEntityTypeConfiguration<MemberToken>
{
    public void Configure(EntityTypeBuilder<MemberToken> builder)
    {
        builder.ToTable("MemberTokens");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(t => t.TokenHash).HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(t => t.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(t => t.Member)
            .WithMany(m => m.Tokens)
            .HasForeignKey(t => t.MemberId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.TokenHash, "UX_MemberTokens_TokenHash").IsUnique();

        // 只找還沒被用掉的 token。
        builder.HasIndex(t => new { t.MemberId, t.Purpose, t.ExpiresAt }, "IX_MemberTokens_Pending")
            .HasFilter("[ConsumedAt] IS NULL");
    }
}

public class BusinessDomainRuleConfiguration : IEntityTypeConfiguration<BusinessDomainRuleEntry>
{
    public void Configure(EntityTypeBuilder<BusinessDomainRuleEntry> builder)
    {
        builder.ToTable("BusinessDomainRules");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Domain).HasMaxLength(255).IsRequired();
        builder.Property(r => r.Note).HasMaxLength(300);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(r => r.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasIndex(r => r.Domain, "UX_BusinessDomainRules_Domain").IsUnique();
    }
}

public class SampleRequestConfiguration : IEntityTypeConfiguration<SampleRequest>
{
    public void Configure(EntityTypeBuilder<SampleRequest> builder)
    {
        builder.ToTable("SampleRequests");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(r => r.RequestNumber).HasMaxLength(24).IsRequired();
        builder.Property(r => r.ShipToName).HasMaxLength(160).IsRequired();
        builder.Property(r => r.ShipToCompany).HasMaxLength(200).IsRequired();
        builder.Property(r => r.ShipToAddressLine1).HasMaxLength(200).IsRequired();
        builder.Property(r => r.ShipToAddressLine2).HasMaxLength(200);
        builder.Property(r => r.ShipToCity).HasMaxLength(120).IsRequired();
        builder.Property(r => r.ShipToState).HasMaxLength(120);
        builder.Property(r => r.ShipToPostalCode).HasMaxLength(20).IsRequired();
        builder.Property(r => r.ShipToCountryCode).HasMaxLength(2).IsFixedLength().IsRequired();
        builder.Property(r => r.ShipToPhone).HasMaxLength(40).IsRequired();
        builder.Property(r => r.ProjectName).HasMaxLength(200);
        builder.Property(r => r.TargetApplication).HasMaxLength(500);
        builder.Property(r => r.MemberNote).HasMaxLength(2000);
        builder.Property(r => r.RejectionReason).HasMaxLength(600);
        builder.Property(r => r.Carrier).HasMaxLength(80);
        builder.Property(r => r.TrackingNumber).HasMaxLength(80);
        builder.Property(r => r.TrackingUrl).HasMaxLength(DbConventions.UrlMaxLength);
        builder.Property(r => r.ExternalOrderNumber).HasMaxLength(64);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(r => r.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        // NO ACTION：會員停權不得連帶刪除業務單據（§17.3）。
        builder.HasOne(r => r.Member)
            .WithMany(m => m.SampleRequests)
            .HasForeignKey(r => r.MemberId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(r => r.SourceSampleRequest)
            .WithMany()
            .HasForeignKey(r => r.SourceSampleRequestId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(r => r.RequestNumber, "UX_SampleRequests_RequestNumber").IsUnique();
        builder.HasIndex(r => new { r.MemberId, r.CreatedAt }, "IX_SampleRequests_Member").IsDescending(false, true);
        builder.HasIndex(r => new { r.Status, r.SubmittedAt }, "IX_SampleRequests_Status");
    }
}

public class SampleRequestItemConfiguration : IEntityTypeConfiguration<SampleRequestItem>
{
    public void Configure(EntityTypeBuilder<SampleRequestItem> builder)
    {
        builder.ToTable("SampleRequestItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.GradeCode).HasMaxLength(64);
        builder.Property(i => i.ProductNameSnapshot).HasMaxLength(200).IsRequired();
        builder.Property(i => i.RequestedSpec).HasMaxLength(1000);
        builder.Property(i => i.LotSpecReference).HasMaxLength(128);
        builder.Property(i => i.Unit).HasMaxLength(32).IsRequired();
        builder.Property(i => i.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(i => i.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(i => i.SampleRequest)
            .WithMany(r => r.Items)
            .HasForeignKey(i => i.SampleRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Product).WithMany().HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(i => i.Category).WithMany().HasForeignKey(i => i.CategoryId).OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(i => new { i.SampleRequestId, i.SortOrder }, "IX_SampleRequestItems_Request");
    }
}
