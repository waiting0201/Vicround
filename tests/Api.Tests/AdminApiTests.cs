using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using VicRound.Api.Common;
using VicRound.Api.Data;
using VicRound.Api.Models.Entities;
using VicRound.Api.Services.Admin;
using Xunit;

namespace VicRound.Api.Tests;

/// <summary>
/// 後台 API 的守門測試。
///
/// <para>
/// 27 個單元共用同一組 CRUD，因此「登記表與權限表對得上」「登記的實體真的在模型裡」
/// 這類錯誤不會在某一支 handler 上被發現——它們會等到編輯者點開那個畫面才炸開。
/// </para>
/// </summary>
public class AdminApiTests
{
    private static readonly IModel Model = BuildModel();

    private static IModel BuildModel()
    {
        var options = new DbContextOptionsBuilder<VicRoundDbContext>()
            .UseSqlServer("Server=design-time;Database=VicRound;Trusted_Connection=True")
            .Options;

        using var context = new VicRoundDbContext(options);
        return context.GetService<IDesignTimeModel>().Model;
    }

    private static readonly string[] PermissionCodeValues = typeof(PermissionCodes)
        .GetFields(BindingFlags.Public | BindingFlags.Static)
        .Where(field => field.IsLiteral)
        .Select(field => (string)field.GetRawConstantValue()!)
        .ToArray();

    [Fact]
    public void 每個後台單元都有對應的權限碼()
    {
        var missing = AdminResources.All
            .Select(resource => resource.Slug)
            .Where(slug => !PermissionCodeValues.Contains($"{slug}.view"))
            .ToList();

        Assert.Empty(missing);
    }

    [Fact]
    public void 權限碼的單元都有登記在資源表()
    {
        var slugs = AdminResources.All.Select(resource => resource.Slug).ToHashSet();

        var orphans = PermissionCodeValues
            .Select(code => code[..code.LastIndexOf('.')])
            .Distinct()
            .Where(slug => !slugs.Contains(slug))
            .ToList();

        Assert.Empty(orphans);
    }

    [Fact]
    public void 登記的實體與翻譯表都在EF模型裡()
    {
        var problems = new List<string>();

        foreach (var resource in AdminResources.All)
        {
            if (Model.FindEntityType(resource.Entity) is null)
            {
                problems.Add($"{resource.Slug}: {resource.Entity.Name} 不在模型裡");
                continue;
            }

            if (resource.Translation is null)
            {
                continue;
            }

            var translation = Model.FindEntityType(resource.Translation);

            if (translation is null)
            {
                problems.Add($"{resource.Slug}: {resource.Translation.Name} 不在模型裡");
            }
            else if (translation.FindProperty(resource.TranslationFk!) is null)
            {
                problems.Add($"{resource.Slug}: 翻譯表沒有外鍵 {resource.TranslationFk}");
            }
        }

        Assert.Empty(problems);
    }

    [Fact]
    public void 關聯與子項的欄位都真的存在()
    {
        var problems = new List<string>();

        foreach (var resource in AdminResources.All)
        {
            foreach (var link in resource.LinkFields)
            {
                var entity = Model.FindEntityType(link.LinkEntity);

                if (entity is null || entity.FindProperty(link.OwnerFk) is null || entity.FindProperty(link.OtherFk) is null)
                {
                    problems.Add($"{resource.Slug}.{link.Field}");
                }
            }

            foreach (var child in resource.ChildFields)
            {
                var entity = Model.FindEntityType(child.Entity);

                if (entity is null || entity.FindProperty(child.OwnerFk) is null)
                {
                    problems.Add($"{resource.Slug}.{child.Field}");
                }
            }
        }

        Assert.Empty(problems);
    }

    /// <summary>Editor 管內容，Admin 另外管使用者、轉址與站台設定（docs/cms.md）。</summary>
    [Theory]
    [InlineData("categories.edit", true)]
    [InlineData("articles.delete", true)]
    [InlineData("members.edit", true)]
    [InlineData("users.view", false)]
    [InlineData("site-settings.edit", false)]
    [InlineData("redirects.edit", false)]
    public void Editor的權限範圍(string code, bool allowed) =>
        Assert.Equal(allowed, AdminPermissions.Allows([RoleNames.Editor], code));

    [Fact]
    public void Admin是超級使用者()
    {
        Assert.True(AdminPermissions.IsSuperAdmin([RoleNames.Admin]));
        Assert.True(AdminPermissions.Allows([RoleNames.Admin], PermissionCodes.UsersDelete));
        Assert.False(AdminPermissions.IsSuperAdmin([RoleNames.Editor]));
    }

    [Fact]
    public void 沒有角色就沒有任何權限() =>
        Assert.False(AdminPermissions.Allows([], PermissionCodes.CategoriesView));

    [Fact]
    public void enum對外是camelCase字串() =>
        Assert.Equal("productCompliance", AdminMapper.ToJsonValue((byte)3, typeof(CertificationCategory)));

    [Fact]
    public void 時間輸出成ISO8601()
    {
        var value = AdminMapper.ToJsonValue(new DateTime(2026, 9, 8, 1, 2, 3, DateTimeKind.Utc), typeof(DateTime));
        Assert.StartsWith("2026-09-08T01:02:03", (string)value!);
    }

    [Theory]
    [InlineData("\"published\"", typeof(ContentStatus), ContentStatus.Published)]
    [InlineData("2", typeof(int), 2)]
    [InlineData("\"true\"", typeof(bool), true)]
    public void 請求的值會轉成實體的型別(string json, Type type, object expected)
    {
        using var document = JsonDocument.Parse(json);
        Assert.Equal(expected, AdminMapper.ToClrValue(document.RootElement, type, "field"));
    }

    [Fact]
    public void 空字串代表清空可為null的欄位()
    {
        using var document = JsonDocument.Parse("\"\"");
        Assert.Null(AdminMapper.ToClrValue(document.RootElement, typeof(int?), "field"));
    }

    [Fact]
    public void 壞掉的值會被擋下而不是靜默寫進去()
    {
        using var document = JsonDocument.Parse("\"not-a-number\"");
        Assert.Throws<AppException>(() => AdminMapper.ToClrValue(document.RootElement, typeof(int), "field"));
    }
}
