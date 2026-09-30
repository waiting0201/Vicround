using System.Text.Json;
using System.Text.RegularExpressions;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Tests;

/// <summary>
/// <c>product-catalog.json</c>（<c>import-products</c> 的來源，database.md §18.1）的守門測試。
/// 這份檔案是人工整理的，slug 打錯一個字，匯入器要到連資料庫時才會炸——這裡先擋下來。
/// <para>
/// 檔案在 <c>reference/product-docs/</c>，不進版控（含客戶資料，repo 是公開的），因此 CI 上找不到——
/// 那時這組測試什麼都不驗、直接通過。它守的是「在本機改完 JSON、準備跑匯入」的那一刻。
/// </para>
/// </summary>
public partial class ProductCatalogTests
{
    private static readonly JsonElement? Catalog = Load();

    private static JsonElement? Load()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            var path = Path.Combine(dir.FullName, "reference", "product-docs", "product-catalog.json");
            if (File.Exists(path))
            {
                return JsonDocument.Parse(File.ReadAllText(path)).RootElement;
            }
        }

        return null;
    }

    private static IEnumerable<JsonElement> Items(string section) =>
        Catalog is { } catalog ? catalog.GetProperty(section).EnumerateArray() : [];

    private static IEnumerable<string> Strings(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) ? value.EnumerateArray().Select(v => v.GetString()!) : [];

    private static HashSet<string> ProductSlugs() =>
        Items("families").Concat(Items("products")).Select(p => p.GetProperty("slug").GetString()!).ToHashSet();

    [GeneratedRegex("^[a-z0-9-]+$")]
    private static partial Regex SlugPattern();

    [Fact]
    public void Slug_全部合法且各區內不重複()
    {
        foreach (var section in new[] { "families", "products", "downloads", "caseStudies" })
        {
            var slugs = Items(section).Select(i => i.GetProperty("slug").GetString()!).ToList();

            Assert.All(slugs, slug => Assert.Matches(SlugPattern(), slug));
            Assert.Equal(slugs.Count, slugs.Distinct().Count());
        }
    }

    [Fact]
    public void 下載與案例引用的產品都存在於匯入檔()
    {
        var products = ProductSlugs();

        var dangling = Items("downloads").Concat(Items("caseStudies"))
            .SelectMany(item => Strings(item, "products").Select(slug => $"{item.GetProperty("slug").GetString()} → {slug}"))
            .Where(link => !products.Contains(link.Split(" → ")[1]))
            .ToList();

        Assert.Empty(dangling);
    }

    [Fact]
    public void 產品的_family_若是匯入檔裡的就要先出現在_families()
    {
        var families = Items("families").Select(f => f.GetProperty("slug").GetString()!).ToHashSet();
        var products = Items("products").Select(p => p.GetProperty("slug").GetString()!).ToHashSet();

        // 型號不能掛在另一個型號底下——卡片查詢是 ParentProductId IS NULL，兩層以上會消失。
        var nested = Items("products")
            .Select(p => p.GetProperty("parent").GetString()!)
            .Where(parent => products.Contains(parent) && !families.Contains(parent))
            .ToList();

        Assert.Empty(nested);
    }

    [Fact]
    public void 每個有文字的物件都同時有兩個語系()
    {
        var missing = new List<string>();

        void Walk(JsonElement node, string path)
        {
            switch (node.ValueKind)
            {
                case JsonValueKind.Array:
                    var index = 0;
                    foreach (var child in node.EnumerateArray()) Walk(child, $"{path}[{index++}]");
                    break;
                case JsonValueKind.Object:
                    var hasEn = node.TryGetProperty(CultureCodes.English, out _);
                    var hasZh = node.TryGetProperty(CultureCodes.TraditionalChinese, out _);
                    if (hasEn != hasZh) missing.Add(path);
                    foreach (var property in node.EnumerateObject()) Walk(property.Value, $"{path}.{property.Name}");
                    break;
            }
        }

        if (Catalog is { } catalog) Walk(catalog, "$");
        Assert.Empty(missing);
    }

    [Fact]
    public void 下載的類型與存取層級都對得上_enum()
    {
        Assert.All(Items("downloads"), download =>
        {
            Assert.True(Enum.TryParse<DownloadKind>(download.GetProperty("kind").GetString(), out _));
            Assert.True(Enum.TryParse<DownloadAccessLevel>(download.GetProperty("access").GetString(), out _));
        });
    }

    [Fact]
    public void 每個產品最多兩個亮點規格()
    {
        // 系列卡只排得下兩個 chip（確認稿），多的會把卡片撐高、四張卡對不齊。
        var crowded = Items("families").Concat(Items("products"))
            .Where(p => p.GetProperty("specifications").EnumerateArray()
                .Count(s => s.TryGetProperty("highlight", out var h) && h.GetBoolean()) > 2)
            .Select(p => p.GetProperty("slug").GetString())
            .ToList();

        Assert.Empty(crowded);
    }
}
