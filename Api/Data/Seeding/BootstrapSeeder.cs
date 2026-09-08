using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Services;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Seeding;

/// <summary>
/// database.md §18.1 的 <b>B 層</b> seeder：可重複執行，以自然鍵（Slug / EmailNormalized /
/// Key / Domain）判斷，<b>只 insert 缺的，絕不覆寫已存在的列</b>——編輯者改過的內容不能被蓋掉。
/// <para>
/// A 層（<c>Cultures</c>、<c>Roles</c>）由 migration 的 <c>HasData</c> 負責；
/// C 層（舊站 118 頁、blog_post、圖片）是一次性匯入，不在這裡。
/// </para>
/// </summary>
public sealed class BootstrapSeeder(
    VicRoundDbContext db,
    IPasswordHasher passwordHasher,
    ILogger<BootstrapSeeder> logger)
{
    /// <summary>未設定 <c>VICROUND_SA_INITIAL_PASSWORD</c> 時的初始密碼（§18.2 專案決策）。</summary>
    public const string DefaultSuperAdminPassword = "Admin@123";

    public const string SuperAdminEmail = "sa@system.local";

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var inserted = 0;

        inserted += await SeedSuperAdminAsync(cancellationToken);
        inserted += await SeedCategoriesAsync(cancellationToken);
        inserted += await SeedSolutionsAsync(cancellationToken);
        inserted += await SeedPagesAsync(cancellationToken);
        inserted += await SeedLocationsAsync(cancellationToken);
        inserted += await SeedContactChannelsAsync(cancellationToken);
        inserted += await SeedBusinessDomainRulesAsync(cancellationToken);
        inserted += await SeedSiteSettingsAsync(cancellationToken);
        inserted += await SeedNavigationAsync(cancellationToken);

        logger.LogInformation("Bootstrap seed 完成，新增 {Count} 列（已存在的一律略過）。", inserted);
    }

    private async Task<int> SeedSuperAdminAsync(CancellationToken cancellationToken)
    {
        var normalized = SuperAdminEmail.ToUpperInvariant();
        if (await db.Users.AnyAsync(u => u.EmailNormalized == normalized, cancellationToken))
        {
            return 0;
        }

        // 密碼雜湊含隨機 salt，因此不能用 HasData——每次 migrations add 都會被 diff 成「值變了」。
        var password = Environment.GetEnvironmentVariable("VICROUND_SA_INITIAL_PASSWORD") ?? DefaultSuperAdminPassword;

        var user = new User
        {
            Email = SuperAdminEmail,
            EmailNormalized = normalized,
            DisplayName = "System Administrator",
            PasswordHash = passwordHasher.Hash(password),
            MustChangePassword = false,
            IsActive = true,
            SecurityStamp = Guid.NewGuid(),
            PreferredCulture = CultureCodes.Default,
        };

        var adminRoleId = await db.Roles
            .Where(r => r.Name == RoleNames.Admin)
            .Select(r => r.Id)
            .SingleAsync(cancellationToken);

        user.UserRoles.Add(new UserRole { Role = null, RoleId = adminRoleId });

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        logger.LogWarning(
            "已建立超級管理員 {Email}。**上線前必須人工更改此密碼**（database.md §18.2）。",
            SuperAdminEmail);

        return 1;
    }

    private async Task<int> SeedCategoriesAsync(CancellationToken cancellationToken)
    {
        var existing = await db.Categories.Select(c => c.Slug).ToListAsync(cancellationToken);
        var added = 0;

        foreach (var (seed, index) in SeedData.Categories.Select((s, i) => (s, i)))
        {
            if (existing.Contains(seed.Slug))
            {
                continue;
            }

            var category = new Category
            {
                Slug = seed.Slug,
                Type = seed.Type,
                AccentColorHex = seed.AccentColorHex,
                Status = ContentStatus.Published,
                SortOrder = index,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(category.Translations, (culture, text) => new CategoryTranslation
            {
                Culture = culture,
                Name = text(seed.Name),
                ShortName = text(seed.ShortName),
                MenuNote = text(seed.MenuNote),
            });

            db.Categories.Add(category);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return added;
    }

    private async Task<int> SeedSolutionsAsync(CancellationToken cancellationToken)
    {
        var existing = await db.Solutions.Select(s => s.Slug).ToListAsync(cancellationToken);
        var added = 0;

        foreach (var (seed, index) in SeedData.Solutions.Select((s, i) => (s, i)))
        {
            if (existing.Contains(seed.Slug))
            {
                continue;
            }

            var solution = new Solution
            {
                Slug = seed.Slug,
                IsNew = seed.IsNew,
                Status = ContentStatus.Published,
                SortOrder = index,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(solution.Translations, (culture, text) => new SolutionTranslation
            {
                Culture = culture,
                Name = text(seed.Name),
                MenuNote = text(seed.MenuNote),
                Summary = text(seed.MenuNote),
            });

            db.Solutions.Add(solution);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return added;
    }

    private async Task<int> SeedPagesAsync(CancellationToken cancellationToken)
    {
        var existing = await db.Pages.Select(p => p.Slug).ToListAsync(cancellationToken);
        var added = 0;

        // 先建全部頁面，再回頭接父子關係——sustainability / partnership 掛在 about 之下。
        foreach (var (seed, index) in SeedData.Pages.Select((s, i) => (s, i)))
        {
            if (existing.Contains(seed.Slug))
            {
                continue;
            }

            var page = new Page
            {
                Slug = seed.Slug,
                Template = seed.Template,
                IsSystemPage = true,
                Status = ContentStatus.Published,
                SortOrder = index,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(page.Translations, (culture, text) => new PageTranslation
            {
                Culture = culture,
                Title = text(seed.Title),
            });

            db.Pages.Add(page);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);

        // 剛 Add 的頁面仍在 change tracker 裡；不清掉就會與下面重查到的實例撞同一個鍵。
        db.ChangeTracker.Clear();

        // 這裡要改屬性，所以刻意用 AsTracking 覆寫 DbContext 的 NoTracking 預設。
        var pagesBySlug = await db.Pages.AsTracking().ToDictionaryAsync(p => p.Slug, cancellationToken);

        foreach (var seed in SeedData.Pages.Where(s => s.ParentSlug is not null))
        {
            pagesBySlug[seed.Slug].ParentPageId = pagesBySlug[seed.ParentSlug!].Id;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();

        return added;
    }

    private async Task<int> SeedLocationsAsync(CancellationToken cancellationToken)
    {
        // Locations 沒有 Slug，自然鍵取 (Type, City)。
        var existing = await db.Locations.Select(l => new { l.Type, l.City }).ToListAsync(cancellationToken);
        var added = 0;

        foreach (var (seed, index) in SeedData.Locations.Select((s, i) => (s, i)))
        {
            if (existing.Any(e => e.Type == seed.Type && e.City == seed.City))
            {
                continue;
            }

            var location = new Location
            {
                Type = seed.Type,
                CountryCode = seed.CountryCode,
                City = seed.City,
                Phone = seed.Phone,
                Status = ContentStatus.Published,
                SortOrder = index,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(location.Translations, (culture, text) => new LocationTranslation
            {
                Culture = culture,
                Name = text(seed.Name),
                AddressLine = text(seed.AddressLine),
            });

            db.Locations.Add(location);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return added;
    }

    private async Task<int> SeedContactChannelsAsync(CancellationToken cancellationToken)
    {
        var existing = await db.ContactChannels.Select(c => c.Slug).ToListAsync(cancellationToken);
        var added = 0;

        foreach (var (seed, index) in SeedData.ContactChannels.Select((s, i) => (s, i)))
        {
            if (existing.Contains(seed.Slug))
            {
                continue;
            }

            var channel = new ContactChannel
            {
                Slug = seed.Slug,
                Email = seed.Email,
                InquiryType = seed.InquiryType,
                Status = ContentStatus.Published,
                SortOrder = index,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(channel.Translations, (culture, text) => new ContactChannelTranslation
            {
                Culture = culture,
                Label = text(seed.Label),
                Description = text(seed.Description),
            });

            db.ContactChannels.Add(channel);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return added;
    }

    private async Task<int> SeedBusinessDomainRulesAsync(CancellationToken cancellationToken)
    {
        var existing = await db.BusinessDomainRules.Select(r => r.Domain).ToListAsync(cancellationToken);

        var missing = SeedData.BlockedEmailDomains
            .Where(domain => !existing.Contains(domain))
            .Select(domain => new BusinessDomainRuleEntry
            {
                Domain = domain,
                Rule = BusinessDomainRule.Block,
                Note = "Personal or disposable mailbox — business domain required.",
            })
            .ToList();

        if (missing.Count > 0)
        {
            db.BusinessDomainRules.AddRange(missing);
            await db.SaveChangesAsync(cancellationToken);
        }

        return missing.Count;
    }

    private async Task<int> SeedSiteSettingsAsync(CancellationToken cancellationToken)
    {
        var existing = await db.SiteSettings.Select(s => s.Key).ToListAsync(cancellationToken);
        var added = 0;

        foreach (var seed in SeedData.SiteSettings)
        {
            if (existing.Contains(seed.Key))
            {
                continue;
            }

            var setting = new SiteSetting
            {
                Key = seed.Key,
                ValueKind = seed.ValueKind,
                IsLocalized = seed.IsLocalized,
                Value = seed.IsLocalized ? null : seed.Value,
            };

            if (seed.LocalizedValue is { } localized)
            {
                AddBilingual(setting.Translations, (culture, text) => new SiteSettingTranslation
                {
                    Culture = culture,
                    Value = text(localized),
                });
            }

            db.SiteSettings.Add(setting);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return added;
    }

    private async Task<int> SeedNavigationAsync(CancellationToken cancellationToken)
    {
        // 導覽沒有自然鍵可比對，因此以 Location 為粒度：該位置已有任何一列就整組略過，
        // 避免重複執行時把編輯者排好的選單灌成兩份。
        var occupied = await db.NavigationItems
            .Select(n => n.Location)
            .Distinct()
            .ToListAsync(cancellationToken);

        var pages = await db.Pages.ToDictionaryAsync(p => p.Slug, p => p.Id, cancellationToken);
        var categories = await db.Categories.ToDictionaryAsync(c => c.Slug, c => c.Id, cancellationToken);
        var solutions = await db.Solutions.ToDictionaryAsync(s => s.Slug, s => s.Id, cancellationToken);
        var added = 0;

        foreach (var group in SeedData.Navigation.GroupBy(n => n.Location))
        {
            if (occupied.Contains(group.Key))
            {
                continue;
            }

            foreach (var (seed, index) in group.Select((s, i) => (s, i)))
            {
                db.NavigationItems.Add(BuildNavigationItem(seed, index, pages, categories, solutions, ref added));
            }
        }

        if (added > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
        }

        return added;
    }

    private static NavigationItem BuildNavigationItem(
        NavSeed seed,
        int sortOrder,
        IReadOnlyDictionary<string, int> pages,
        IReadOnlyDictionary<string, int> categories,
        IReadOnlyDictionary<string, int> solutions,
        ref int added)
    {
        var item = new NavigationItem
        {
            Location = seed.Location,
            LinkType = seed.LinkType,
            Url = seed.Url,
            RefPageId = seed.RefPageSlug is null ? null : pages[seed.RefPageSlug],
            RefCategoryId = seed.RefCategorySlug is null ? null : categories[seed.RefCategorySlug],
            RefSolutionId = seed.RefSolutionSlug is null ? null : solutions[seed.RefSolutionSlug],
            Status = ContentStatus.Published,
            SortOrder = sortOrder,
            PublishedAt = DateTime.UtcNow,
        };

        AddBilingual(item.Translations, (culture, text) => new NavigationItemTranslation
        {
            Culture = culture,
            Label = text(seed.Label),
            Note = seed.Note is null ? null : text(seed.Note),
            MenuTitle = seed.MenuTitle is null ? null : text(seed.MenuTitle),
        });

        added++;

        foreach (var (child, index) in (seed.Children ?? []).Select((c, i) => (c, i)))
        {
            item.Children.Add(BuildNavigationItem(child, index, pages, categories, solutions, ref added));
        }

        return item;
    }

    /// <summary>每個實體一次建立 <c>en</c> 與 <c>zh-Hant</c> 兩列翻譯。</summary>
    private static void AddBilingual<TTranslation>(
        ICollection<TTranslation> target,
        Func<string, Func<Text, string>, TTranslation> factory)
    {
        target.Add(factory(CultureCodes.English, text => text.En));
        target.Add(factory(CultureCodes.TraditionalChinese, text => text.Zh));
    }
}
