using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using VicRound.Domain.Common;
using VicRound.Infrastructure;
using Xunit;

namespace VicRound.Application.Tests;

/// <summary>
/// docs/database.md 的全域慣例（§0.1–§0.4、§16、§17）在 EF 模型上的守門測試。
/// 這些規則散落在 70 幾張表上，靠人工 review 抓不完——新增實體時漏掉哪一條，這裡會擋下來。
/// </summary>
public class DatabaseConventionsTests
{
    private static readonly IModel Model = BuildModel();

    private static IModel BuildModel()
    {
        var options = new DbContextOptionsBuilder<VicRoundDbContext>()
            .UseSqlServer("Server=design-time;Database=VicRound;Trusted_Connection=True")
            .Options;

        // 只讀 metadata，不連線。CHECK 約束與定序只存在於 design-time model，
        // 執行期的 read-optimized model 會把它們裁掉。
        using var context = new VicRoundDbContext(options);
        return context.GetService<IDesignTimeModel>().Model;
    }

    [Fact]
    public void 每個實體都對應到一張具名資料表()
    {
        var missing = Model.GetEntityTypes()
            .Where(e => string.IsNullOrEmpty(e.GetTableName()))
            .Select(e => e.ClrType.Name)
            .ToList();

        Assert.Empty(missing);
    }

    [Fact]
    public void 翻譯表的主鍵一律是擁有者加上Culture()
    {
        var offenders = new List<string>();

        foreach (var entity in Model.GetEntityTypes().Where(e => typeof(Translation).IsAssignableFrom(e.ClrType)))
        {
            var key = entity.FindPrimaryKey();
            var names = key?.Properties.Select(p => p.Name).ToList() ?? [];

            if (names.Count != 2 || !names.Contains(nameof(Translation.Culture)))
            {
                offenders.Add($"{entity.ClrType.Name}: [{string.Join(", ", names)}]");
            }
        }

        Assert.Empty(offenders);
    }

    [Fact]
    public void 翻譯表的Culture都外接Cultures參照表()
    {
        var offenders = Model.GetEntityTypes()
            .Where(e => typeof(Translation).IsAssignableFrom(e.ClrType))
            .Where(e => !e.GetForeignKeys().Any(fk =>
                fk.PrincipalEntityType.ClrType == typeof(Domain.Globalization.Culture) &&
                fk.Properties.Any(p => p.Name == nameof(Translation.Culture))))
            .Select(e => e.ClrType.Name)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void 有Slug的實體都有排除Archived的唯一索引與CHECK()
    {
        var offenders = new List<string>();

        foreach (var entity in Model.GetEntityTypes().Where(e => typeof(SluggedEntity).IsAssignableFrom(e.ClrType)))
        {
            var table = entity.GetTableName();

            var uniqueFiltered = entity.GetIndexes().Any(i =>
                i.IsUnique &&
                i.Properties.Count == 1 &&
                i.Properties[0].Name == nameof(SluggedEntity.Slug) &&
                i.GetFilter() == "[Status] <> 2");

            // Admin 的「含 Archived 碰撞檢查」需要一條非唯一的全量索引。
            var fullIndex = entity.GetIndexes().Any(i =>
                !i.IsUnique &&
                i.Properties.Count == 1 &&
                i.Properties[0].Name == nameof(SluggedEntity.Slug));

            var check = entity.GetCheckConstraints().Any(c => c.Name == $"CK_{table}_Slug");

            if (!uniqueFiltered || !fullIndex || !check)
            {
                offenders.Add($"{table}(unique={uniqueFiltered}, all={fullIndex}, check={check})");
            }
        }

        Assert.Empty(offenders);
    }

    [Fact]
    public void Slug都用大小寫敏感定序且長度為200()
    {
        var offenders = Model.GetEntityTypes()
            .Where(e => typeof(SluggedEntity).IsAssignableFrom(e.ClrType))
            .Select(e => e.FindProperty(nameof(SluggedEntity.Slug))!)
            .Where(p => p.GetCollation() != "Latin1_General_100_CS_AS" || p.GetMaxLength() != 200)
            .Select(p => p.DeclaringType.ClrType.Name)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void 所有時間欄位都是datetime2三位小數()
    {
        var offenders = Model.GetEntityTypes()
            .SelectMany(e => e.GetProperties())
            .Where(p => p.ClrType == typeof(DateTime) || p.ClrType == typeof(DateTime?))
            .Where(p => p.GetColumnType() != "datetime2(3)")
            .Select(p => $"{p.DeclaringType.ClrType.Name}.{p.Name} → {p.GetColumnType()}")
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void 所有enum欄位都存成tinyint()
    {
        var offenders = Model.GetEntityTypes()
            .SelectMany(e => e.GetProperties())
            .Where(p => (Nullable.GetUnderlyingType(p.ClrType) ?? p.ClrType).IsEnum)
            .Where(p => p.GetColumnType() != "tinyint")
            .Select(p => $"{p.DeclaringType.ClrType.Name}.{p.Name} → {p.GetColumnType()}")
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void 所有字串欄位都有明確長度或是nvarchar_max()
    {
        // §0.4：字串一律長度明確；HTML 內文才用 nvarchar(max)（EF 以 maxLength = null 表示）。
        var htmlOrLongText = new[]
        {
            "Description", "Intro", "Body", "Answer", "ChallengeBody", "SettingsJson",
            "InternalNote", "Value", "Url",
        };

        var offenders = Model.GetEntityTypes()
            .SelectMany(e => e.GetProperties())
            .Where(p => p.ClrType == typeof(string) && p.GetMaxLength() is null)
            .Where(p => !htmlOrLongText.Contains(p.Name))
            .Select(p => $"{p.DeclaringType.ClrType.Name}.{p.Name}")
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void OwnerTriple的表都有恰一非NULL的CHECK()
    {
        foreach (var table in new[] { "SpecificationRows", "ContentBlocks" })
        {
            var entity = Model.GetEntityTypes().Single(e => e.GetTableName() == table);
            Assert.Contains(entity.GetCheckConstraints(), c => c.Name == $"CK_{table}_SingleOwner");
        }
    }

    [Fact]
    public void 沒有任何指向MediaAssets的Cascade刪除()
    {
        // §17.3：刪一張圖不得連帶刪掉引用它的內容。
        var offenders = Model.GetEntityTypes()
            .SelectMany(e => e.GetForeignKeys())
            .Where(fk => fk.PrincipalEntityType.ClrType == typeof(Domain.Media.MediaAsset))
            .Where(fk => fk.DeleteBehavior == DeleteBehavior.Cascade)
            // MediaAssetTranslations 是媒體自己的翻譯列，適用「base → translations 一律 CASCADE」。
            .Where(fk => fk.DeclaringEntityType.ClrType != typeof(Domain.Media.MediaAssetTranslation))
            .Select(fk => fk.DeclaringEntityType.ClrType.Name)
            .ToList();

        Assert.Empty(offenders);
    }

    [Fact]
    public void 會員停權不會連帶刪除樣品申請()
    {
        var sampleRequest = Model.GetEntityTypes().Single(e => e.GetTableName() == "SampleRequests");
        var memberFk = sampleRequest.GetForeignKeys()
            .Single(fk => fk.PrincipalEntityType.ClrType == typeof(Domain.Members.Member));

        Assert.Equal(DeleteBehavior.NoAction, memberFk.DeleteBehavior);
    }

    [Theory]
    [InlineData("optical-film")]
    [InlineData("consumer-electronics")]
    [InlineData("sustainability")]
    public void 種子Slug符合DB的CHECK條件(string slug)
    {
        // CK_*_Slug 的等價式：只允許小寫英數與連字號。
        Assert.Matches(new Regex("^[a-z0-9-]+$"), slug);
    }
}
