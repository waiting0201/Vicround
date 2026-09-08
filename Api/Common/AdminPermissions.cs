using System.Reflection;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Common;

/// <summary>
/// 角色 → 權限碼。
/// <para>
/// <b>Token 只帶角色，不帶 81 個權限碼</b>——展開放在伺服器端，token 才不會為了權限清單
/// 膨脹成好幾 KB，而且改權限不必等所有人重新登入。
/// </para>
/// <para>
/// 分工照 docs/cms.md：<c>Editor</c> 管內容，<c>Admin</c> 另外管使用者、轉址與站台設定
/// （也就是後台 `resources.ts` 標了 <c>adminOnly</c> 的那幾個單元，加上轉址）。
/// </para>
/// </summary>
public static class AdminPermissions
{
    /// <summary>Editor 碰不到的單元；其餘一律可讀可寫。</summary>
    private static readonly string[] AdminOnlyResources = ["users", "site-settings", "redirects", "business-domains"];

    private static readonly string[] All = typeof(PermissionCodes)
        .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
        .Where(field => field is { IsLiteral: true, IsInitOnly: false })
        .Select(field => (string)field.GetRawConstantValue()!)
        .ToArray();

    private static readonly HashSet<string> EditorPermissions = All
        .Where(code => !AdminOnlyResources.Contains(code[..code.LastIndexOf('.')]))
        .ToHashSet(StringComparer.Ordinal);

    /// <summary>Admin 是超級使用者（<c>is_superadmin</c>），不逐條列權限。</summary>
    public static bool IsSuperAdmin(IEnumerable<string> roles) =>
        roles.Contains(RoleNames.Admin, StringComparer.OrdinalIgnoreCase);

    public static bool Allows(IEnumerable<string> roles, string permissionCode) =>
        IsSuperAdmin(roles)
        || (roles.Contains(RoleNames.Editor, StringComparer.OrdinalIgnoreCase)
            && EditorPermissions.Contains(permissionCode));
}
