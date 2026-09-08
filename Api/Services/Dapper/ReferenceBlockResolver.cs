using System.Data;
using System.Text.Json;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

/// <summary>
/// Reference block（<c>BlockType</c> ≥ 100）的解析：把 <c>SettingsJson</c> 的查詢參數
/// 換成強型別表的資料（database.md §09）。
/// <para>
/// <b>為什麼要在後端解析：</b>編輯者存的是「認證清單 → 分類 → 數量」，不是抄一份 ISO 14001。
/// 若讓前台自己再打一次 <c>/certifications</c>，同一頁的 SSR 就得多跑好幾趟往返，
/// 而且「這個版塊要顯示哪些」的規則會散到前台去。
/// </para>
/// <para>
/// 全部是 static function：解析器需要目錄／文章／認證等讀取服務，而那些服務又會讀版塊，
/// 走 DI 注入會形成循環，容器直接組不起來。
/// </para>
/// </summary>
internal static class ReferenceBlockResolver
{
    /// <summary>Content block（&lt; 100）自帶文字，不需要解析。</summary>
    public static bool IsReference(BlockType type) => (byte)type >= 100;

    public static async Task<BlockReferenceDto?> ResolveAsync(
        IDbConnection db, string culture, BlockType type, string? settingsJson)
    {
        var settings = BlockSettings.Parse(settingsJson);

        return type switch
        {
            BlockType.CategoryGrid => new BlockReferenceDto
            {
                Categories = Take(await CatalogReadService.ListCategoriesAsync(db, culture, null), settings.Limit),
            },
            BlockType.ProductGrid => new BlockReferenceDto
            {
                Products = await CatalogReadService.TopProductsAsync(
                    db, culture, settings.Category, settings.Featured, settings.Limit ?? 12),
            },
            BlockType.SolutionGrid => new BlockReferenceDto
            {
                Solutions = Take(await SolutionReadService.ListAsync(db, culture), settings.Limit),
            },
            BlockType.ArticleList => new BlockReferenceDto
            {
                Articles = await ArticleReadService.TopAsync(db, culture, settings.Type, settings.Limit ?? 3),
            },
            BlockType.ExhibitionList => new BlockReferenceDto
            {
                Exhibitions = Take(
                    await ExhibitionReadService.ListAsync(db, culture, settings.Upcoming), settings.Limit),
            },
            BlockType.FaqList => new BlockReferenceDto
            {
                FaqCategories = FilterFaq(
                    await FaqReadService.ListAsync(db, culture, settings.Category), settings),
            },
            BlockType.DownloadList => new BlockReferenceDto
            {
                Downloads = Take(
                    await DownloadReadService.ListAsync(
                        db, culture, DownloadReadService.ParseKind(settings.Kind),
                        settings.Product, settings.Category, settings.Solution),
                    settings.Limit),
            },
            BlockType.CertificationList => new BlockReferenceDto
            {
                Certifications = Take(
                    await CertificationReadService.ListAsync(
                        db, culture, CertificationReadService.ParseCategory(settings.Category)),
                    settings.Limit),
            },
            BlockType.ProcessFlowRef => new BlockReferenceDto
            {
                ProcessFlows = await TechnologyReadService.ProcessFlowsAsync(
                    db, culture, TechnologyReadService.ParseKind(settings.Kind), settings.Slug),
            },
            BlockType.MilestoneTimeline => new BlockReferenceDto
            {
                Milestones = Take(await CompanyReaders.MilestonesAsync(db, culture), settings.Limit),
            },
            BlockType.LocationList => new BlockReferenceDto
            {
                Locations = await CompanyReaders.LocationsAsync(db, culture, ParseLocationType(settings.Kind)),
            },
            BlockType.TestimonialList => new BlockReferenceDto
            {
                Testimonials = Take(
                    await CompanyReaders.TestimonialsAsync(db, culture, settings.Solution), settings.Limit),
            },
            BlockType.PartnerBrandWall => new BlockReferenceDto
            {
                PartnerBrands = Take(await CompanyReaders.PartnerBrandsAsync(db, culture), settings.Limit),
            },
            BlockType.ContactChannelList => new BlockReferenceDto
            {
                ContactChannels = await CompanyReaders.ContactChannelsAsync(db, culture),
            },
            _ => null,
        };
    }

    private static IReadOnlyList<T> Take<T>(IReadOnlyList<T> items, int? limit) =>
        limit is { } n && n < items.Count ? items.Take(n).ToList() : items;

    /// <summary>
    /// Resources hub 只顯示標記為精選的幾題，FAQ 頁顯示全部（<c>FaqItems.IsFeatured</c>，§05）。
    /// 篩完之後空掉的分類就不回——前台不必再判斷一次。
    /// </summary>
    private static IReadOnlyList<FaqCategoryDto> FilterFaq(
        IReadOnlyList<FaqCategoryDto> categories, BlockSettings settings)
    {
        if (!settings.FeaturedOnly && settings.Limit is null)
        {
            return categories;
        }

        var remaining = settings.Limit;

        var result = new List<FaqCategoryDto>();

        foreach (var category in categories)
        {
            var items = settings.FeaturedOnly
                ? category.Items.Where(i => i.IsFeatured).ToList()
                : category.Items.ToList();

            if (remaining is { } left)
            {
                items = items.Take(Math.Max(left, 0)).ToList();
                remaining = left - items.Count;
            }

            if (items.Count > 0)
            {
                result.Add(category with { Items = items });
            }
        }

        return result;
    }

    private static byte? ParseLocationType(string? kind) =>
        kind is not null && Enum.TryParse<LocationType>(kind, ignoreCase: true, out var parsed)
            ? (byte)parsed
            : null;

    /// <summary>
    /// <c>SettingsJson</c> 的形狀。**必須 culture-neutral、不得含任何本地化文字**（§09），
    /// 因此這裡只有 slug、enum 名稱與數字。壞掉的 JSON 一律當成「沒有參數」——
    /// 一個版塊的設定寫壞不該讓整頁 500。
    /// </summary>
    private sealed record BlockSettings(
        string? Category = null,
        string? Solution = null,
        string? Product = null,
        string? Type = null,
        string? Kind = null,
        string? Slug = null,
        bool? Upcoming = null,
        bool? Featured = null,
        bool FeaturedOnly = false,
        int? Limit = null)
    {
        private static readonly BlockSettings Empty = new();

        public static BlockSettings Parse(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return Empty;
            }

            try
            {
                using var document = JsonDocument.Parse(json);
                var root = document.RootElement;

                return new BlockSettings(
                    Category: Str(root, "category"),
                    Solution: Str(root, "solution"),
                    Product: Str(root, "product"),
                    Type: Str(root, "type"),
                    Kind: Str(root, "kind"),
                    Slug: Str(root, "slug"),
                    Upcoming: Bool(root, "upcoming"),
                    Featured: Bool(root, "featured"),
                    FeaturedOnly: Bool(root, "featuredOnly") ?? false,
                    Limit: Int(root, "limit"));
            }
            catch (JsonException)
            {
                return Empty;
            }
        }

        private static string? Str(JsonElement root, string name) =>
            root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;

        private static bool? Bool(JsonElement root, string name) =>
            root.TryGetProperty(name, out var value) && value.ValueKind is JsonValueKind.True or JsonValueKind.False
                ? value.GetBoolean()
                : null;

        private static int? Int(JsonElement root, string name) =>
            root.TryGetProperty(name, out var value) && value.TryGetInt32(out var number) ? number : null;
    }
}
