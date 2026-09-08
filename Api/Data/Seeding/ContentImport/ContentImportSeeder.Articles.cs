using System.Globalization;
using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Seeding.ContentImport;

public sealed partial class ContentImportSeeder
{
    private async Task ImportArticlesAsync(ContentSource source, CancellationToken cancellationToken)
    {
        var news = source.TryExport("articles", "newsIndex");
        var sampleArticle = source.TryExport("articles", "sampleArticle");
        var sampleNews = source.TryExport("articles", "sampleNews");
        var related = source.ArrayExport("articles", "relatedArticles");
        var resources = source.TryExport("resources", "resources");

        var authorId = await ImportAuthorAsync(((JsonNode?)sampleArticle).Prop("author"), cancellationToken);
        await ImportExhibitionsAsync(((JsonNode?)news).Prop("events").Arr("items"), cancellationToken);

        // 同一篇文章在來源裡會出現在多處（列表卡、詳情頁、延伸閱讀），以 slug 去重；
        // 先放形狀最完整的來源，後面重複的就會被跳過。
        var candidates = new List<(JsonNode? Node, ArticleType Type)>();

        if (sampleArticle is not null)
        {
            candidates.Add((sampleArticle, ArticleType.TechnicalArticle));
        }

        if (sampleNews is not null)
        {
            candidates.Add((sampleNews, ArticleType.Exhibition));
        }

        candidates.AddRange((news.Arr("items") ?? []).Select(i => ((JsonNode?)i, MapNewsType(i.Str("category")))));

        // Resources hub 的分區就是 Type 的權威來源（它決定網址前綴），因此排在
        // 延伸閱讀之前——`relatedArticles` 只是某篇文章底下的推薦卡，裡面也會出現洞察文章，
        // 讓它先命中會把洞察文誤設成技術文章、網址跟著變成 /blog。
        candidates.AddRange((((JsonNode?)resources).Prop("insights").Arr("items") ?? []).Select(i => ((JsonNode?)i, ArticleType.Insight)));
        candidates.AddRange((((JsonNode?)resources).Prop("articles").Arr("items") ?? []).Select(i => ((JsonNode?)i, ArticleType.TechnicalArticle)));
        candidates.AddRange((related ?? []).Select(i => ((JsonNode?)i, ArticleType.TechnicalArticle)));

        var existing = await db.Articles.Select(a => a.Slug).ToListAsync(cancellationToken);
        var added = 0;

        foreach (var (node, type) in candidates)
        {
            var slug = node.Str("slug");
            if (slug is null || existing.Contains(slug))
            {
                continue;
            }

            var article = new Article
            {
                Slug = SlugRules.Normalize(slug),
                Type = type,
                AuthorId = node.Prop("author") is not null ? authorId : null,
                Status = ContentStatus.Published,
                PublishedAt = ParseDate(node.Str("date")) ?? DateTime.UtcNow,
            };

            AddBilingual(article.Translations, culture => new ArticleTranslation
            {
                Culture = culture,
                Title = node.LocAny("title")?.For(culture) ?? slug,
                Excerpt = node.LocAny("excerpt", "body")?.For(culture),
                Lead = node.LocAny("lead")?.For(culture),
                Body = RenderArticleBody(node.Arr("blocks"), culture),
            });

            db.Articles.Add(article);
            existing.Add(slug);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("文章", added);

        await LinkArticleTaxonomyAsync(candidates.Select(c => c.Node), cancellationToken);
    }

    private static ArticleType MapNewsType(string? category) => category switch
    {
        "product" => ArticleType.ProductNews,
        "events" => ArticleType.Exhibition,
        "certification" => ArticleType.CertificationNews,
        _ => ArticleType.CompanyNews,
    };

    private static DateTime? ParseDate(string? value) =>
        DateTime.TryParseExact(
            value,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out var parsed)
            ? parsed
            : null;

    private async Task<int?> ImportAuthorAsync(JsonNode? node, CancellationToken cancellationToken)
    {
        if (node is null)
        {
            return null;
        }

        var name = node.LocAny("name");
        var slug = SlugRules.Normalize(name?.En ?? "author");

        var existing = await db.Authors.SingleOrDefaultAsync(a => a.Slug == slug, cancellationToken);
        if (existing is not null)
        {
            return existing.Id;
        }

        var author = new Author
        {
            Slug = slug,
            Initials = node.Str("initials"),
            Status = ContentStatus.Published,
            PublishedAt = DateTime.UtcNow,
        };

        AddBilingual(author.Translations, culture => new AuthorTranslation
        {
            Culture = culture,
            Name = name?.For(culture) ?? slug,
            JobTitle = node.LocAny("role")?.For(culture),
        });

        db.Authors.Add(author);
        await db.SaveChangesAsync(cancellationToken);

        var id = author.Id;
        db.ChangeTracker.Clear();
        Count("作者");

        return id;
    }

    private async Task ImportExhibitionsAsync(JsonArray? events, CancellationToken cancellationToken)
    {
        if (events is null)
        {
            return;
        }

        var existing = await db.Exhibitions.Select(e => e.Slug).ToListAsync(cancellationToken);

        // 冪等鍵是展會原名，不是 slug——slug 由名稱衍生，拿它比對重跑時會被加後綴而重複新增。
        var imported = await db.ExhibitionTranslations
            .Where(t => t.Culture == CultureCodes.English)
            .Select(t => t.Name)
            .ToListAsync(cancellationToken);

        var added = 0;
        var order = 0;

        foreach (var item in events)
        {
            var name = item.LocAny("name");
            var range = ParseDateRange(item.LocAny("date")?.En);
            order++;

            if (name is null || imported.Contains(name.Value.En))
            {
                continue;
            }

            var slug = UniqueSlug(name.Value.En, existing);
            if (slug is null)
            {
                continue;
            }

            if (range is null)
            {
                logger.LogWarning(
                    "展會「{Name}」的日期「{Date}」解析不了，略過——Exhibitions 的起訖日是必填。",
                    name.Value.En, item.LocAny("date")?.En);
                continue;
            }

            var exhibition = new Exhibition
            {
                Slug = slug,
                StartDate = range.Value.Start,
                EndDate = range.Value.End,
                Status = ContentStatus.Published,
                SortOrder = order,
                PublishedAt = DateTime.UtcNow,
            };

            AddBilingual(exhibition.Translations, culture => new ExhibitionTranslation
            {
                Culture = culture,
                Name = name.Value.For(culture),
                // 來源把場地、攤位與展出內容寫在同一段敘述裡，未拆成欄位。
                Description = item.LocAny("body")?.For(culture),
            });

            db.Exhibitions.Add(exhibition);
            existing.Add(slug);
            imported.Add(name.Value.En);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("展會", added);
    }

    /// <summary>解析確認稿的日期寫法：<c>Aug 26–28, 2026</c> 與 <c>Dec 30 – Jan 3, 2027</c>。</summary>
    private static (DateOnly Start, DateOnly End)? ParseDateRange(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var parts = value.Replace('–', '-').Replace('—', '-').Split(',');
        if (parts.Length != 2 || !int.TryParse(parts[1].Trim(), out var year))
        {
            return null;
        }

        var days = parts[0].Split('-', StringSplitOptions.TrimEntries);
        if (days.Length != 2)
        {
            return null;
        }

        var start = ParseMonthDay(days[0], year);

        // 結尾可能只有日（Aug 26-28）或月加日（Dec 30 - Jan 3）。
        var end = days[1].Any(char.IsLetter)
            ? ParseMonthDay(days[1], year)
            : start is null || !int.TryParse(days[1], out var day)
                ? null
                : new DateOnly(start.Value.Year, start.Value.Month, day);

        if (start is null || end is null)
        {
            return null;
        }

        // 跨年（Dec → Jan）時結束日屬於隔年。
        return end < start ? (start.Value, end.Value.AddYears(1)) : (start.Value, end.Value);
    }

    private static DateOnly? ParseMonthDay(string text, int year) =>
        DateTime.TryParseExact(
            $"{text.Trim()} {year}",
            ["MMM d yyyy", "MMMM d yyyy"],
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var parsed)
            ? DateOnly.FromDateTime(parsed)
            : null;

    /// <summary>文章卡上的產品線 chip → <c>ArticleCategories</c>（不是自由標籤，見 database.md §05）。</summary>
    private async Task LinkArticleTaxonomyAsync(IEnumerable<JsonNode?> nodes, CancellationToken cancellationToken)
    {
        var articles = await db.Articles.ToDictionaryAsync(a => a.Slug, a => a.Id, cancellationToken);

        var byName = (await db.Categories.Include(c => c.Translations).ToListAsync(cancellationToken))
            .SelectMany(c => c.Translations.Select(t => (t.Name, c.Id)))
            .GroupBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);

        var linked = (await db.ArticleCategories.ToListAsync(cancellationToken))
            .Select(ac => (ac.ArticleId, ac.CategoryId))
            .ToHashSet();

        var added = 0;

        foreach (var node in nodes)
        {
            var slug = node.Str("slug");
            var label = node.LocAny("category")?.En;

            if (slug is null || label is null
                || !articles.TryGetValue(slug, out var articleId)
                || !byName.TryGetValue(label, out var categoryId)
                || !linked.Add((articleId, categoryId)))
            {
                continue;
            }

            db.ArticleCategories.Add(new ArticleCategory { ArticleId = articleId, CategoryId = categoryId });
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("文章 × 產品線關聯", added);
    }

    /// <summary>
    /// 內文 block 轉 HTML。heading 保留 <c>id</c>——文章頁的側欄目錄靠它定位，
    /// 爬蟲也靠它理解章節結構。
    /// </summary>
    private static string? RenderArticleBody(JsonArray? blocks, string culture)
    {
        if (blocks is null)
        {
            return null;
        }

        var html = new StringBuilder();

        foreach (var block in blocks)
        {
            var text = block.LocAny("text")?.For(culture);

            switch (block.Str("type"))
            {
                case "heading":
                    var id = block.Str("id");
                    html.Append($"<h2{(id is null ? string.Empty : $" id=\"{Encode(id)}\"")}>{Encode(text)}</h2>");
                    break;

                case "paragraph":
                    html.Append($"<p>{Encode(text)}</p>");
                    break;

                case "callout":
                    html.Append($"<aside class=\"callout\"><p>{Encode(text)}</p></aside>");
                    break;

                case "quote":
                    var author = block.LocAny("author")?.For(culture);
                    html.Append($"<blockquote><p>{Encode(text)}</p>");
                    html.Append(author is null ? string.Empty : $"<cite>{Encode(author)}</cite>");
                    html.Append("</blockquote>");
                    break;

                case "list":
                    html.Append("<ul>");
                    foreach (var entry in block.Arr("items") ?? [])
                    {
                        html.Append($"<li>{Encode(entry.Loc()?.For(culture))}</li>");
                    }

                    html.Append("</ul>");
                    break;

                case "definitions":
                    html.Append("<dl>");
                    foreach (var entry in block.Arr("items") ?? [])
                    {
                        html.Append($"<dt>{Encode(entry.LocAny("term", "title", "label")?.For(culture))}</dt>");
                        html.Append($"<dd>{Encode(entry.LocAny("body", "text")?.For(culture))}</dd>");
                    }

                    html.Append("</dl>");
                    break;

                case "table":
                    html.Append("<table><thead><tr>");
                    foreach (var column in block.Arr("columns") ?? [])
                    {
                        html.Append($"<th>{Encode(column.Loc()?.For(culture))}</th>");
                    }

                    html.Append("</tr></thead><tbody>");
                    foreach (var row in block.Arr("rows") ?? [])
                    {
                        html.Append("<tr>");
                        foreach (var cell in row as JsonArray ?? [])
                        {
                            html.Append($"<td>{Encode(cell.Loc()?.For(culture))}</td>");
                        }

                        html.Append("</tr>");
                    }

                    html.Append("</tbody></table>");
                    break;

                case "figure":
                    // 圖片本身走 Blob 媒體庫，這裡只保留說明文字。
                    html.Append($"<figure><figcaption>{Encode(block.LocAny("caption")?.For(culture))}</figcaption></figure>");
                    break;
            }
        }

        return html.Length == 0 ? null : html.ToString();
    }

    private static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
}
