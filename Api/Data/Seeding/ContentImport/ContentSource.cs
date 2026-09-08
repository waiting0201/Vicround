using System.Text.Json.Nodes;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Seeding.ContentImport;

/// <summary>
/// `scripts/export-content.mjs` 產出的 JSON 的讀取層。
/// <para>
/// 之所以整份文案走 JSON 而不是抄成 C# 常數：`apps/web/content/` 是客戶確認稿的逐字轉錄
/// （1355 組雙語字串），從真檔案讀才能保證匯入結果與前台現在顯示的內容一致。
/// </para>
/// </summary>
internal sealed class ContentSource(JsonObject content)
{
    public static ContentSource Load(string json)
    {
        var root = JsonNode.Parse(json)?.AsObject()
            ?? throw new InvalidOperationException("content-export.json 不是合法的 JSON 物件。");

        var content = root["content"]?.AsObject()
            ?? throw new InvalidOperationException("content-export.json 缺少 content 區段。");

        return new ContentSource(content);
    }

    /// <summary>取一個具名 export，如 <c>Export("home", "home")</c>。</summary>
    public JsonObject Export(string file, string name) =>
        content[file]?[name]?.AsObject()
        ?? throw new InvalidOperationException($"content-export.json 找不到 {file}.{name}。");

    public JsonObject? TryExport(string file, string name) => content[file]?[name] as JsonObject;

    /// <summary>具名 export 本身就是陣列的情形（<c>CERTIFICATIONS</c>、<c>relatedArticles</c>）。</summary>
    public JsonArray? ArrayExport(string file, string name) => content[file]?[name] as JsonArray;
}

/// <summary>`t(en, zhHant)` 在 JSON 裡的形狀。</summary>
internal readonly record struct LocalizedText(string En, string Zh)
{
    public string For(string culture) => culture == CultureCodes.TraditionalChinese ? Zh : En;

    public bool IsEmpty => string.IsNullOrWhiteSpace(En) && string.IsNullOrWhiteSpace(Zh);
}

internal static class JsonContentExtensions
{
    /// <summary>讀出雙語字串；欄位不存在或不是 <c>{en, zh-Hant}</c> 時回 <c>null</c>。</summary>
    public static LocalizedText? Loc(this JsonNode? node)
    {
        if (node is not JsonObject o)
        {
            return null;
        }

        var en = (o["en"] as JsonValue)?.GetValue<string>();
        var zh = (o[CultureCodes.TraditionalChinese] as JsonValue)?.GetValue<string>();

        return en is null && zh is null ? null : new LocalizedText(en ?? zh!, zh ?? en!);
    }

    /// <summary>依序找第一個存在的欄位——來源的命名不一致（title / name / label 混用）。</summary>
    public static LocalizedText? LocAny(this JsonNode? node, params string[] names)
    {
        foreach (var name in names)
        {
            if (node.Prop(name).Loc() is { } text)
            {
                return text;
            }
        }

        return null;
    }

    /// <summary>
    /// 取子欄位。<b>先確認節點是物件</b>——來源的陣列元素有時直接是字串
    /// （<c>why.lines</c>、<c>qc.tags</c>），對 <c>JsonValue</c> 用索引子會擲例外。
    /// </summary>
    public static JsonNode? Prop(this JsonNode? node, string name) =>
        node is JsonObject o && o.TryGetPropertyValue(name, out var value) ? value : null;

    public static string? Str(this JsonNode? node, string name) =>
        node.Prop(name) is JsonValue v && v.TryGetValue<string>(out var s) ? s : null;

    public static JsonArray? Arr(this JsonNode? node, string name) => node.Prop(name) as JsonArray;

    /// <summary>依序找第一個存在的陣列欄位（items / steps / pillars / rows…）。</summary>
    public static JsonArray? ArrAny(this JsonNode? node, params string[] names)
    {
        foreach (var name in names)
        {
            if (node.Prop(name) is JsonArray a)
            {
                return a;
            }
        }

        return null;
    }

    /// <summary>把多個段落包成 HTML，供 <c>nvarchar(max)</c> 的內文欄位使用。</summary>
    public static string? ToHtml(this JsonArray? paragraphs, string culture)
    {
        if (paragraphs is null)
        {
            return null;
        }

        var parts = paragraphs
            .Select(p => p.Loc())
            .Where(t => t is not null)
            .Select(t => $"<p>{System.Net.WebUtility.HtmlEncode(t!.Value.For(culture))}</p>");

        var html = string.Concat(parts);
        return string.IsNullOrEmpty(html) ? null : html;
    }
}

/// <summary>把來源的 slug 正規化成符合 <c>CK_*_Slug</c>（只允許小寫英數與連字號）。</summary>
