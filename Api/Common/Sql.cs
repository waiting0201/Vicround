namespace VicRound.Api.Common;

/// <summary>
/// 公開查詢共用的 SQL 片段。集中在這裡是為了避免「可見性條件漂移」——
/// 某支端點忘了加 <c>Status = 1</c>，草稿內容就會外流到前台。
/// </summary>
public static class Sql
{
    /// <summary><c>ContentStatus.Published</c>。可見性只看 Status（database.md §0.1）。</summary>
    public const byte Published = 1;

    /// <summary>
    /// 翻譯的 fallback 寫法：缺該語系時回退預設語系的文字，但同時回報
    /// <c>HasRequestedCulture = 0</c>，讓前台知道<b>不要宣告該語系的 hreflang</b>（§0.2）。
    /// </summary>
    public static string TranslationJoin(string table, string fkColumn, string alias = "e") => $"""
        LEFT JOIN {table} t ON t.{fkColumn} = {alias}.Id AND t.Culture = @Culture
        LEFT JOIN {table} f ON f.{fkColumn} = {alias}.Id AND f.Culture = @DefaultCulture
        """;

    public const string HasCulture = "CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture";

    public static string Coalesce(string column) => $"COALESCE(t.{column}, f.{column}) AS {column}";
}
