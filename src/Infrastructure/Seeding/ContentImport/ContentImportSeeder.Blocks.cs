using System.Text.Json.Nodes;
using VicRound.Domain.Common;
using VicRound.Domain.Pages;

namespace VicRound.Infrastructure.Seeding.ContentImport;

public sealed partial class ContentImportSeeder
{
    // 來源的欄位命名不一致（確認稿是逐頁寫的），這裡列出同義欄位讓通用轉換吃得下。
    private static readonly string[] TitleFields = ["title", "headline", "name", "label", "standard", "property"];
    private static readonly string[] SubtitleFields = ["lead", "subcopy", "description", "platform", "scope", "kind", "category"];
    private static readonly string[] BodyFields = ["body", "note", "doc", "quote", "summary"];
    private static readonly string[] ItemFields =
        ["items", "pillars", "steps", "cards", "values", "capabilities", "groups", "rows", "lines", "channels", "tags", "facts"];

    private void AddPageBlocks(Page page, JsonObject root, PageSpec spec)
    {
        var existing = page.Blocks.Select(b => b.Anchor).ToHashSet(StringComparer.Ordinal);
        var sortOrder = page.Blocks.Count;

        foreach (var blockSpec in spec.Blocks)
        {
            if (existing.Contains(blockSpec.Anchor) || root[blockSpec.Section] is not { } section)
            {
                continue;
            }

            var block = BuildBlock(section, blockSpec.Type, blockSpec.Anchor, blockSpec.Tone, sortOrder++);
            page.Blocks.Add(block);
            Count("版塊");
            Count("版塊子項", block.Items.Count);
        }
    }

    /// <summary>
    /// 把一個 section 變成版塊。section 可能是物件（有 eyebrow/title/items）或直接是陣列
    /// （products.lines、solutions-hub.cards 這種），兩種都吃。
    /// </summary>
    private static ContentBlock BuildBlock(JsonNode section, BlockType type, string anchor, BlockTone tone, int sortOrder)
    {
        var isBareArray = section is JsonArray;
        var body = isBareArray ? null : section;
        var items = isBareArray ? (JsonArray)section : section.ArrAny(ItemFields);

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
