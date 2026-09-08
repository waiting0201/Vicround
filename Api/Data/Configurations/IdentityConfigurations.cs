using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(u => u.Email).HasMaxLength(DbConventions.EmailMaxLength).IsRequired();
        builder.Property(u => u.EmailNormalized).HasMaxLength(DbConventions.EmailMaxLength).IsRequired();
        builder.Property(u => u.DisplayName).HasMaxLength(160).IsRequired();
        builder.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();
        builder.Property(u => u.PreferredCulture).HasMaxLength(DbConventions.CultureCodeMaxLength);
        builder.Property(u => u.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(u => u.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(u => u.PreferredCultureRef)
            .WithMany()
            .HasForeignKey(u => u.PreferredCulture)
            .OnDelete(DeleteBehavior.NoAction);

        // unique 建在 normalized 欄位上，不是 Email（§0.4）。
        builder.HasIndex(u => u.EmailNormalized, "UX_Users_EmailNormalized").IsUnique();
    }
}

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name).HasMaxLength(50).IsRequired();
        builder.Property(r => r.Description).HasMaxLength(200);
        builder.Property(r => r.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);
        builder.Property(r => r.UpdatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasIndex(r => r.Name, "UX_Roles_Name").IsUnique();

        // §18.1 A 層：Roles 是永不變的參照資料。
        builder.HasData(
            new Role { Id = 1, Name = RoleNames.Admin, Description = "Full access to every admin screen and setting." },
            new Role { Id = 2, Name = RoleNames.Editor, Description = "Content editing; no user, settings or redirect management." });
    }
}

public class UserRoleConfiguration : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable("UserRoles");
        builder.HasKey(ur => new { ur.UserId, ur.RoleId });

        builder.HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ur => new { ur.RoleId, ur.UserId }, "IX_UserRoles_Reverse");
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("NEWSEQUENTIALID()");

        builder.Property(t => t.TokenHash).HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(t => t.ReplacedByTokenHash).HasMaxLength(64).IsFixedLength();
        builder.Property(t => t.CreatedAt).HasDefaultValueSql(DbConventions.UtcNow);

        builder.HasOne(t => t.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.TokenHash, "UX_RefreshTokens_TokenHash").IsUnique();
        builder.HasIndex(t => new { t.UserId, t.ExpiresAt }, "IX_RefreshTokens_User");
    }
}
