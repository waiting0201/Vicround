using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Admin;

/// <summary>
/// 後台的一個資源（＝ `apps/admin/src/lib/resources.ts` 的一個單元、`/api/admin/{slug}`）。
///
/// <para>
/// 後台是<b>資料驅動</b>的：27 個單元共用同一組 CRUD，差別只在這張表登記的東西
/// （哪張實體表、翻譯表怎麼接、哪些欄位是關聯、有沒有子項）。這樣新增一個單元是加一列，
/// 不是複製一份 handler ——後者保證會有幾支忘了加權限檢查或忘了寫 301。
/// </para>
/// </summary>
public sealed record AdminResource(
    string Slug,
    Type Entity,
    Type? Translation = null,
    string? TranslationFk = null,
    string OrderBy = "SortOrder, Id",
    AdminLink[]? Links = null,
    AdminChild[]? Children = null,
    string[]? SearchColumns = null,
    string[]? TranslationSearchColumns = null,
    string? RoutePrefix = null)
{
    public AdminLink[] LinkFields => Links ?? [];

    public AdminChild[] ChildFields => Children ?? [];

    /// <summary>有 <c>Status</c> 就有草稿／發布／封存，也才有 publish 系列動作。</summary>
    public bool HasStatus => typeof(ContentEntity).IsAssignableFrom(Entity);

    public bool HasSlug => typeof(SluggedEntity).IsAssignableFrom(Entity);

    /// <summary>有自己的公開網址 → 改 slug（301）或刪除（410）都必須寫轉址（database.md §0.5）。</summary>
    public bool IsRoutable => typeof(IRoutable).IsAssignableFrom(Entity);
}

/// <summary>
/// 多對多欄位：後台送一組 id 陣列（<c>categoryIds</c>），對應一張連結表。
/// 儲存時整組換掉——後台的 UI 就是「選一組」，逐筆 diff 只會多出中間狀態。
/// </summary>
public sealed record AdminLink(string Field, Type LinkEntity, string OwnerFk, string OtherFk, bool HasSortOrder = false);

/// <summary>
/// 子項集合：規格列、版塊、製程步驟。跟著母體一起送出（`ChildCollection.tsx` 的註解說明了理由），
/// 因此這裡也是整組換掉。
/// </summary>
public sealed record AdminChild(
    string Field,
    Type Entity,
    string OwnerFk,
    Type? Translation = null,
    string? TranslationFk = null);
