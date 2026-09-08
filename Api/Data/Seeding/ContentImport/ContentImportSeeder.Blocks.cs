using System.Text.Json.Nodes;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Seeding.ContentImport;

public sealed partial class ContentImportSeeder
{
    // 來源的欄位命名不一致（確認稿是逐頁寫的），這裡列出同義欄位讓通用轉換吃得下。
    private static readonly string[] TitleFields = ["title", "headline", "name", "label", "standard", "property"];
    private static readonly string[] SubtitleFields = ["lead", "subcopy", "description", "platform", "scope", "kind", "category"];
    private static readonly string[] BodyFields = ["body", "note", "doc", "quote", "summary"];
    // 順序有意義：取第一個存在的欄位。`stats` 要排在 `lines` 前面——產業頁的 why 區段
    // 兩者都有，而卡片內容在 stats，lines 只是產品線 slug（那份關聯已經在 SolutionCategories）。
    private static readonly string[] ItemFields =
        ["items", "pillars", "steps", "cards", "stats", "values", "capabilities", "groups", "rows", "lines", "channels", "tags", "facts"];

    private void AddPageBlocks(Page page, JsonObject root, PageSpec spec)
    {
        var existing = page.Blocks
            .Where(b => b.Anchor is not null)
            .ToDictionary(b => b.Anchor!, StringComparer.Ordinal);

        var sortOrder = page.Blocks.Count;

        foreach (var blockSpec in spec.Blocks)
        {
            if (existing.TryGetValue(blockSpec.Anchor, out var current))
            {
                // 版塊已經在了就不重建（冪等）。只補「還沒有查詢參數」的 reference block——
                // 這是空值補齊，不是覆寫：編輯者在後台調過的設定不會被重跑蓋掉。
                if (blockSpec.Settings is not null && string.IsNullOrEmpty(current.SettingsJson))
                {
                    current.SettingsJson = blockSpec.Settings;
                    Count("版塊查詢參數");
                }

                continue;
            }

            if (root[blockSpec.Section] is not { } section)
            {
                continue;
            }

            // 來源以「群組 + id 清單」表達的 reference block（About 的三類認證）：
            // 一組一個版塊，選哪幾張存成查詢參數，內容仍然來自強型別表。
            if (section.Arr("groups") is { } groups && groups.Count > 0)
            {
                foreach (var (group, index) in groups.Select((g, i) => (g, i)))
                {
                    var anchor = $"{blockSpec.Anchor}-{index + 1}";
                    if (group is null || existing.ContainsKey(anchor))
                    {
                        continue;
                    }

                    var groupBlock = BuildBlock(group, blockSpec.Type, anchor, blockSpec.Tone, sortOrder++, withItems: false);
                    groupBlock.SettingsJson = SlugSettings(group) ?? blockSpec.Settings;
                    page.Blocks.Add(groupBlock);
                    Count("版塊");
                }

                continue;
            }

            var block = BuildBlock(section, blockSpec.Type, blockSpec.Anchor, blockSpec.Tone, sortOrder++, blockSpec.WithItems);
            block.SettingsJson = SlugSettings(section) ?? blockSpec.Settings;
            page.Blocks.Add(block);
            Count("版塊");
            Count("版塊子項", block.Items.Count);
        }
    }

    /// <summary>
    /// 來源如果已經指名「要顯示哪幾筆」（<c>ids</c> 或 <c>items[].id</c>），就把它變成
    /// reference block 的查詢參數。這比分類篩選精確：確認稿的永續頁挑的四張認證跨了兩個分類。
    /// </summary>
    private static string? SlugSettings(JsonNode section)
    {
        var ids = (section.Arr("ids") ?? [])
            .Select(id => id?.GetValue<string>())
            .Concat((section.Arr("items") ?? []).Select(item => item.Str("id")))
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct()
            .ToList();

        return ids.Count == 0
            ? null
            : "{\"slugs\":[" + string.Join(",", ids.Select(id => "\"" + id + "\"")) + "]}";
    }

    /// <summary>
    /// 把一個 section 變成版塊。section 可能是物件（有 eyebrow/title/items）或直接是陣列
    /// （products.lines、solutions-hub.cards 這種），兩種都吃。
    /// </summary>
    /// <param name="withItems">
    /// <c>false</c> 表示這個版塊只要標題與說明，子項另有出處——例如 Acoustic 的等級比較表，
    /// 表格內容是那四個等級<b>產品</b>的規格列，不該在版塊裡再抄一份。
    /// </param>
    private static ContentBlock BuildBlock(
        JsonNode section, BlockType type, string anchor, BlockTone tone, int sortOrder, bool withItems = true)
    {
        var isBareArray = section is JsonArray;
        var body = isBareArray ? null : section;
        var items = !withItems ? null : isBareArray ? (JsonArray)section : section.ArrAny(ItemFields);

        var block = new ContentBlock
        {
            BlockType = type,
            Anchor = anchor,
            Tone = tone,
            Status = ContentStatus.Published,
            SortOrder = sortOrder,
            PublishedAt = DateTime.UtcNow,
        };

        AddBilingual(block.Translations, culture => new ContentBlockTranslation
        {
            Culture = culture,
            Eyebrow = body.LocAny("eyebrow")?.For(culture),
            Title = body.LocAny(TitleFields)?.For(culture),
            Subtitle = body.LocAny(SubtitleFields)?.For(culture),
            Body = body.LocAny("body")?.For(culture) ?? body.Arr("paragraphs").ToHtml(culture),
            CtaLabel = body.LocAny("cta", "link", "view")?.For(culture),
            FootNote = body.LocAny("note", "pending", "footnote")?.For(culture),
        });

        if (items is not null)
        {
            var index = 0;
            foreach (var item in items)
            {
                block.Items.Add(BuildItem(item, index++));
            }
        }

        return block;
    }

    private static ContentBlockItem BuildItem(JsonNode? item, int sortOrder)
    {
        // 陣列元素也可能直接就是一個雙語字串（例如 qc.tags）。
        var asText = item.Loc();

        var entity = new ContentBlockItem
        {
            SortOrder = sortOrder,
            IconName = item.Str("icon"),
            AccentColorHex = Hex(item.Str("color") ?? item.Str("accent")),
            Badge = item.Str("index") ?? item.Str("id"),
            LinkType = item.Str("href") is { } href && href.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                ? LinkTargetType.External
                : LinkTargetType.Internal,
            LinkUrl = item.Str("href"),
            PublishedAt = DateTime.UtcNow,
        };

        AddBilingual(entity.Translations, culture => new ContentBlockItemTranslation
        {
            Culture = culture,
            Title = asText?.For(culture) ?? item.LocAny(TitleFields)?.For(culture),
            Subtitle = item.LocAny(SubtitleFields)?.For(culture),
            Body = item.LocAny(BodyFields)?.For(culture),
            LinkLabel = item.LocAny("cta", "link", "linkLabel")?.For(culture),
            Value = item.LocAny("value")?.For(culture),
        });

        return entity;
    }

    /// <summary>`AccentColorHex` 是 <c>nvarchar(7)</c>；來源偶有漸層字串，塞不進去就丟掉。</summary>
    private static string? Hex(string? value) =>
        value is not null && value.StartsWith('#') && value.Length <= 7 ? value : null;
}
