using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Admin;

/// <summary>
/// 後台的一個資源（＝ `apps/admin/src/lib/resources.ts` 的一個單元、`/api/admin/{slug}`）。
///
/// <para>
/// 後台是<b>資料驅動</b>的：28 個單元共用同一組 CRUD，差別只在這張表登記的東西
/// （哪張實體表、翻譯表怎麼接、哪些欄位是關聯、有沒有子項）。這樣新增一個單元是加一列，
/// 不是複製一份 handler ——後者保證會有幾支忘了加權限檢查或忘了寫 301。
/// </para>
///
/// <para>
/// 給了 <paramref name="EditableFields"/> 就是<b>固定資料</b>（頁面——前台每一頁都是寫死的路由）：
/// 不能新增、刪除、取消發布，基底欄位只寫得進這份白名單（camelCase）；翻譯、關聯與子項照常走。
/// 網址片段、版型這類前台路由綁死的欄位因此改不動——改了只會讓那一頁 500。
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
    string? RoutePrefix = null,
    string[]? EditableFields = null)
{
    public AdminLink[] LinkFields => Links ?? [];

    public AdminChild[] ChildFields => Children ?? [];

    public bool IsFixed => EditableFields is not null;

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
/// <param name="OtherEntity">
/// 對面的實體。只有在 <paramref name="OtherNaturalKey"/> 有值時才需要——要靠它把名稱換成主鍵。
/// </param>
/// <param name="OtherNaturalKey">
/// 前端送的不是主鍵而是這一欄的值（目前只有 <c>Roles.Name</c>）。角色的 id 是 seed 決定的，
/// 讓前端記住 1／2 等於把魔術數字釘進兩個專案；用名稱對應，日後加角色也不必改前端。
/// </param>
public sealed record AdminLink(
    string Field,
    Type LinkEntity,
    string OwnerFk,
    string OtherFk,
    bool HasSortOrder = false,
    Type? OtherEntity = null,
    string? OtherNaturalKey = null);

/// <summary>
/// 子項集合：規格列、版塊、製程步驟。跟著母體一起送出（`ChildCollection.tsx` 的註解說明了理由），
/// 因此這裡也是整組換掉。
///
/// <para>
/// 給了 <paramref name="EditableFields"/> 就是<b>結構固定</b>的集合（版塊——前台版面已定版）：
/// 不能增刪、不能排序，基底欄位只寫得進這份白名單（camelCase），翻譯欄位照常可改。
/// 這種集合是就地更新，不是整組換掉——版塊底下還掛著 <c>ContentBlockItems</c>，刪掉重建會把它們一起 CASCADE 掉。
/// </para>
///
/// <para>
/// <paramref name="Items"/> 是掛在每一列底下的下一層（版塊的卡片、數字），讀取時塞進該列的同名欄位，
/// 存檔時跟著該列送來、整組換掉——卡片可以增刪排序，沒有再往下掛東西，換掉不會連帶刪到別的資料。
/// </para>
/// </summary>
public sealed record AdminChild(
    string Field,
    Type Entity,
    string OwnerFk,
    Type? Translation = null,
    string? TranslationFk = null,
    string[]? EditableFields = null,
    AdminChild? Items = null);
