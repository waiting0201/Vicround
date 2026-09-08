
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §13。<b>後台</b>身分，與前台會員（<c>Members</c>）完全隔離：不同表、不同 token
/// （issuer <c>vicround-admin</c>）、不同 API surface。一方的 token 在另一方一律 401。
/// </summary>
public class User : IHasTimestamps
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    /// <summary><c>UPPER(TRIM(Email))</c>；unique index 建在這裡而非 <c>Email</c>。</summary>
    public string EmailNormalized { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    /// <summary>PHC 風格字串：<c>$pbkdf2-sha256$i=600000$&lt;salt&gt;$&lt;hash&gt;</c>（§14.2）。</summary>
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime? PasswordChangedAt { get; set; }
    public bool MustChangePassword { get; set; }

    /// <summary>改密碼／停用時輪替，令既有 token 失效。</summary>
    public Guid SecurityStamp { get; set; } = Guid.NewGuid();

    public bool IsActive { get; set; } = true;

    // 以下三個是狀態欄位，不是 log 表（§0.7 明確允許保留）。
    public byte FailedLoginCount { get; set; }
    public DateTime? LockoutEndsAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public string? PreferredCulture { get; set; }
    public Culture? PreferredCultureRef { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

/// <summary>角色值可由 Admin 新增，故不做 enum；JWT 的 <c>role</c> claim 輸出字串陣列。</summary>
public class Role : IHasTimestamps
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

/// <summary>M2M 而非 <c>Users.RoleId</c>：一人可同時是 Admin + Editor，日後加角色不必改 schema。</summary>
public class UserRole
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public int RoleId { get; set; }
    public Role? Role { get; set; }
}

/// <summary>只存 SHA-256(token)，不存 token 本身。</summary>
public class RefreshToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    /// <summary>輪替時指向接手的 token，用於偵測重放。</summary>
    public string? ReplacedByTokenHash { get; set; }

    public DateTime CreatedAt { get; set; }
}

public static class RoleNames
{
    public const string Admin = "Admin";
    public const string Editor = "Editor";
}
