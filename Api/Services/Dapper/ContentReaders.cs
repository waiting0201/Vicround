using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

/// <summary>
/// 規格列與版塊在三種 owner（產品／產品線／產業）之間形狀完全相同（owner triple，
/// database.md §0.6），因此讀取邏輯共用一份，由呼叫端指定 owner 欄位。
/// </summary>
internal static class ContentReaders
{
    public static async Task<IReadOnlyList<SpecificationRowDto>> SpecificationsAsync(
        IDbConnection db, string ownerColumn, int ownerId, string culture)
    {
        var rows = await db.QueryAsync<SpecRow>(
            $"""
             SELECT {Sql.Coalesce("Label")}, {Sql.Coalesce("Value")}, {Sql.Coalesce("Note")}, e.IsHighlighted
             FROM SpecificationRows e
             {Sql.TranslationJoin("SpecificationRowTranslations", "SpecificationRowId")}
             WHERE e.{ownerColumn} = @OwnerId AND e.Status = @Published
             ORDER BY e.SortOrder
             """,
            new { OwnerId = ownerId, culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        return rows.Select(r => new SpecificationRowDto(r.Label, r.Value, r.Note, r.IsHighlighted)).ToList();
    }

    public static async Task<IReadOnlyList<ContentBlockDto>> BlocksAsync(
        IDbConnection db, string ownerColumn, int ownerId, string culture)
    {
        var args = new { OwnerId = ownerId, culture, DefaultCulture = CultureCodes.Default, Sql.Published };

        var blocks = (await db.QueryAsync<BlockRow>(
            $"""
             SELECT e.Id, e.BlockType, e.Anchor, e.Tone, e.SettingsJson,
                    {Sql.Coalesce("Eyebrow")}, {Sql.Coalesce("Title")}, {Sql.Coalesce("Subtitle")},
                    {Sql.Coalesce("Body")}, {Sql.Coalesce("CtaLabel")}, {Sql.Coalesce("FootNote")}
             FROM ContentBlocks e
             {Sql.TranslationJoin("ContentBlockTranslations", "ContentBlockId")}
             WHERE e.{ownerColumn} = @OwnerId AND e.Status = @Published
             ORDER BY e.SortOrder
             """, args)).ToList();

        if (blocks.Count == 0)
        {
            return [];
        }

        // 一次撈完所有子項再分組，避免每個版塊各打一次 DB。
        var items = (await db.QueryAsync<ItemRow>(
            $"""
             SELECT e.ContentBlockId, e.IconName, e.AccentColorHex, e.Badge, e.LinkUrl,
                    {Sql.Coalesce("Title")}, {Sql.Coalesce("Subtitle")}, {Sql.Coalesce("Body")},
                    {Sql.Coalesce("LinkLabel")}, {Sql.Coalesce("Value")}
             FROM ContentBlockItems e
             {Sql.TranslationJoin("ContentBlockItemTranslations", "ContentBlockItemId")}
             WHERE e.ContentBlockId IN @BlockIds
             ORDER BY e.ContentBlockId, e.SortOrder
             """,
            new { BlockIds = blocks.Select(b => b.Id).ToArray(), culture, DefaultCulture = CultureCodes.Default }))
            .ToLookup(i => i.ContentBlockId);

        // Reference block 的資料要另外查（database.md §09）。一頁的 reference block 只有幾個，
        // 因此逐個解析；真正的省事在於前台不必為了一個版塊再打一趟 API。
        var references = new Dictionary<int, BlockReferenceDto?>();

        foreach (var block in blocks.Where(b => ReferenceBlockResolver.IsReference((BlockType)b.BlockType)))
        {
            references[block.Id] = await ReferenceBlockResolver.ResolveAsync(
                db, culture, (BlockType)block.BlockType, block.SettingsJson);
        }

        return blocks.Select(b => new ContentBlockDto
        {
            BlockType = Camel(((BlockType)b.BlockType).ToString()),
            Reference = references.GetValueOrDefault(b.Id),
            Anchor = b.Anchor,
            Tone = Camel(((BlockTone)b.Tone).ToString()),
            Eyebrow = b.Eyebrow,
            Title = b.Title,
            Subtitle = b.Subtitle,
            Body = b.Body,
            CtaLabel = b.CtaLabel,
            FootNote = b.FootNote,
            Settings = b.SettingsJson,
            Items = items[b.Id].Select(i => new ContentBlockItemDto
            {
                IconName = i.IconName,
                AccentColorHex = i.AccentColorHex,
                Badge = i.Badge,
                LinkUrl = i.LinkUrl,
                Title = i.Title,
                Subtitle = i.Subtitle,
                Body = i.Body,
                LinkLabel = i.LinkLabel,
                Value = i.Value,
            }).ToList(),
        }).ToList();
    }

    /// <summary>enum 對外一律 camelCase 字串（database.md §16）。</summary>
    public static string Camel(string name) => char.ToLowerInvariant(name[0]) + name[1..];

    private sealed record SpecRow(string Label, string Value, string? Note, bool IsHighlighted);

    private sealed record BlockRow(
        int Id, byte BlockType, string? Anchor, byte Tone, string? SettingsJson,
        string? Eyebrow, string? Title, string? Subtitle, string? Body, string? CtaLabel, string? FootNote);

    private sealed record ItemRow(
        int ContentBlockId, string? IconName, string? AccentColorHex, string? Badge, string? LinkUrl,
        string? Title, string? Subtitle, string? Body, string? LinkLabel, string? Value);
}
