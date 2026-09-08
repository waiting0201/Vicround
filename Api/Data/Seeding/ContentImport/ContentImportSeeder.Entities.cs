using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Seeding.ContentImport;

public sealed partial class ContentImportSeeder
{
    // ── 07 認證 ─────────────────────────────────────────────────────────────

    private async Task ImportCertificationsAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var array = source.ArrayExport("certifications", "CERTIFICATIONS");
        if (array is null)
        {
            return;
        }

        // 卡片上的一行說明散在 about 頁的 notes，以 id 對應。
        var notes = source.TryExport("about", "about").Prop("certification").Prop("notes");

        var existing = await db.Certifications.Select(c => c.Slug).ToListAsync(cancellationToken);
        var added = 0;
        var order = 0;

        foreach (var item in array)
        {
            var id = item.Str("id");
            if (id is null)
            {
                continue;
            }

            var slug = SlugRules.Normalize(id);
            order++;

            if (existing.Contains(slug))
            {
                continue;
            }

            var title = item.LocAny("title");
            var isPlaceholder = title?.En.Contains("[Pending", StringComparison.OrdinalIgnoreCase) ?? false;

            var certification = new Certification
            {
                Slug = slug,
                Category = MapCertificationCategory(item.LocAny("category")?.En),
                IsPlaceholder = isPlaceholder,
                Status = ContentStatus.Published,
                SortOrder = order,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(certification.Translations, culture => new CertificationTranslation
            {
                Culture = culture,
                Title = title?.For(culture) ?? slug,
                ShortNote = notes.Prop(id).Loc()?.For(culture),
                Summary = item.LocAny("summary")?.For(culture),
                IssuerName = item.LocAny("issuer")?.For(culture),
                ValidityText = item.LocAny("validity")?.For(culture),
                ScopeText = item.LocAny("scope")?.For(culture),
                SitesText = item.LocAny("sites")?.For(culture),
            });

            db.Certifications.Add(certification);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("認證", added);

        await ImportComplianceDocumentationAsync(source, cancellationToken);
    }

    /// <summary>
    /// Technologies 的法規符合表多帶一欄「文件類型」（Declaration / Test report）。
    /// 那一欄屬於認證本身（<c>DocumentationLabel</c>），不是頁面文字——存在認證上，
    /// Technologies 與 Sustainability 兩頁才不會各講一套。
    /// </summary>
    private async Task ImportComplianceDocumentationAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var rows = source.TryExport("technologies", "technologies").Prop("compliance").Arr("rows");
        if (rows is null)
        {
            return;
        }

        var certifications = await db.Certifications
            .AsTracking()
            .Include(c => c.Translations)
            .Where(c => c.Category == CertificationCategory.ProductCompliance)
            .ToListAsync(cancellationToken);

        var filled = 0;

        foreach (var row in rows)
        {
            var standard = row.LocAny("standard")?.En;
            var doc = row.LocAny("doc");

            if (standard is null || doc is null)
            {
                continue;
            }

            var certification = certifications.FirstOrDefault(c => c.Translations
                .Any(t => t.Culture == CultureCodes.English && t.Title == standard));

            foreach (var translation in certification?.Translations ?? [])
            {
                if (string.IsNullOrEmpty(translation.DocumentationLabel))
                {
                    translation.DocumentationLabel = doc.Value.For(translation.Culture);
                    filled++;
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("認證文件類型", filled);
    }

    private static CertificationCategory MapCertificationCategory(string? label) => label switch
    {
        not null when label.Contains("Company", StringComparison.OrdinalIgnoreCase) => CertificationCategory.CompanyFactory,
        not null when label.Contains("Sustainab", StringComparison.OrdinalIgnoreCase) => CertificationCategory.Sustainability,
        _ => CertificationCategory.ProductCompliance,
    };

    // ── 05 FAQ ──────────────────────────────────────────────────────────────

    private async Task ImportFaqAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var faq = source.TryExport("faq", "faq");
        if (faq is null)
        {
            return;
        }

        var existingCategories = await db.FaqCategories.ToDictionaryAsync(c => c.Slug, c => c.Id, cancellationToken);
        var addedCategories = 0;
        var order = 0;

        foreach (var item in faq.Arr("categories") ?? [])
        {
            var id = item.Str("id");

            // 'all' 是前台的篩選鈕，不是分類。
            if (id is null or "all" || existingCategories.ContainsKey(id))
            {
                continue;
            }

            var category = new FaqCategory
            {
                Slug = SlugRules.Normalize(id),
                Status = ContentStatus.Published,
                SortOrder = order++,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(category.Translations, culture => new FaqCategoryTranslation
            {
                Culture = culture,
                Name = item.LocAny("label")?.For(culture) ?? id,
            });

            db.FaqCategories.Add(category);
            addedCategories++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("FAQ 分類", addedCategories);

        var categories = await db.FaqCategories.ToDictionaryAsync(c => c.Slug, c => c.Id, cancellationToken);
        var existingItems = await db.FaqItems.Select(i => i.Slug).ToListAsync(cancellationToken);

        // 冪等鍵是「題目原文」而不是 slug——slug 由題目衍生，拿它比對會在重跑時
        // 被加上 -2 後綴而變成新的一列（而不是被跳過）。
        var importedQuestions = await db.FaqItemTranslations
            .Where(t => t.Culture == CultureCodes.English)
            .Select(t => t.Question)
            .ToListAsync(cancellationToken);
        var links = await LinkResolver.CreateAsync(db, cancellationToken);
        var addedItems = 0;
        order = 0;

        foreach (var item in faq.Arr("items") ?? [])
        {
            var categorySlug = SlugRules.Normalize(item.Str("category") ?? string.Empty);
            if (!categories.TryGetValue(categorySlug, out var categoryId))
            {
                continue;
            }

            var question = item.LocAny("question");
            order++;

            if (question is null || importedQuestions.Contains(question.Value.En))
            {
                continue;
            }

            // 來源的 id 是 q1…q13，當錨點沒有意義；改由題目產生可讀的 slug。
            var slug = UniqueSlug(question.Value.En, existingItems);
            if (slug is null)
            {
                continue;
            }

            var faqItem = new FaqItem
            {
                Slug = slug,
                FaqCategoryId = categoryId,
                Status = ContentStatus.Published,
                SortOrder = order,
                PublishedAt = DateTime.UtcNow,
            };

            links.Apply(item.Str("href"), faqItem);

            AddBilingual(faqItem.Translations, culture => new FaqItemTranslation
            {
                Culture = culture,
                Question = question.Value.For(culture),
                Answer = item.LocAny("answer")?.For(culture) ?? string.Empty,
                LinkLabel = item.LocAny("linkLabel")?.For(culture),
            });

            db.FaqItems.Add(faqItem);
            existingItems.Add(slug);
            importedQuestions.Add(question.Value.En);
            addedItems++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("FAQ 題目", addedItems);
    }

    /// <summary>由文字產生 slug，長度收在 80 字元內，撞名時加序號。</summary>
    private static string? UniqueSlug(string text, ICollection<string> taken)
    {
        var slug = SlugRules.Normalize(text);
        if (slug.Length > 80)
        {
            slug = slug[..80].TrimEnd('-');
        }

        if (slug.Length == 0)
        {
            return null;
        }

        if (!taken.Contains(slug))
        {
            return slug;
        }

        for (var i = 2; i < 100; i++)
        {
            var candidate = $"{slug}-{i}";
            if (!taken.Contains(candidate))
            {
                return candidate;
            }
        }

        return null;
    }
}
