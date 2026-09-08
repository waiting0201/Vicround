
namespace VicRound.Api.Models.Entities;

/// <summary>
/// 語系參照表（database.md §0.2）。取代散落各表的 <c>CHECK IN ('en','zh-Hant')</c>——
/// 新增第三語系不需 migration，Admin 也能直接列舉語系分頁。
/// </summary>
public class Culture
{
    /// <summary>PK，同時是 URL 段與 hreflang 值：<c>en</c> / <c>zh-Hant</c>。</summary>
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string NativeName { get; set; } = string.Empty;

    /// <summary>只有一列為 true（filtered unique index 保證）。</summary>
    public bool IsDefault { get; set; }
    public bool IsEnabled { get; set; } = true;
    public int SortOrder { get; set; }
}

/// <summary>已知語系代碼；用於 seeder 與需要編譯期常數之處。</summary>
public static class CultureCodes
{
    public const string English = "en";
    public const string TraditionalChinese = "zh-Hant";

    public static readonly string[] All = [English, TraditionalChinese];
    public const string Default = English;
}
