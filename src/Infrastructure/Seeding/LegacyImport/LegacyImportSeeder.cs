using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Application.Media;
using VicRound.Domain.Common;
using VicRound.Domain.Globalization;
using VicRound.Domain.Media;
using VicRound.Domain.Navigation;
using VicRound.Domain.Resources;
using VicRound.Infrastructure.Seeding.ContentImport;

namespace VicRound.Infrastructure.Seeding.LegacyImport;

/// <summary>
/// database.md §18.1 的 <b>C 層</b>：舊 Weebly 站（www.vicround.com）的資料匯入。
/// <para>
/// 冪等鍵是 <c>LegacySourceKey</c> 與 <c>Redirects.FromPath</c>，重跑只會略過已存在的列，
/// 131MB 的圖也不會重傳。
/// </para>
/// <para>
/// <b>這份匯出能拿到什麼、拿不到什麼</b>（實地清點，與早期規劃不同）：頁面內文<b>不在</b>
/// 匯出裡（<c>pages</c> 只有 id 與 title、<c>properties</c> 全是版型設定）；
/// 表單來信的內容被 Weebly 全數抽空（692 個欄位值 0 個非空），只剩 IP，而 IP 依 §12 不存。
/// 因此本匯入器處理的是：圖片、4 篇 blog、以及舊網址的 301。
/// </para>
/// </summary>
public sealed class LegacyImportSeeder(
    VicRoundDbContext db,
    IMediaStorage storage,
    ILogger<LegacyImportSeeder> logger)
{
    private const string SourcePrefix = "weebly";

    public async Task ImportAsync(LegacyImportOptions options, CancellationToken cancellationToken = default)
    {
        var media = await ImportMediaAsync(options.ImageDirectory, cancellationToken);
        var posts = await ImportBlogPostsAsync(options.BlogPostCsv, cancellationToken);
        var redirects = await ImportRedirectsAsync(options, cancellationToken);

        logger.LogInformation(
            "舊站匯入完成 —— 圖片 {Media}、文章 {Posts}、轉址 {Redirects}（已存在的一律略過）。",
            media, posts, redirects);
    }

    // ── 圖片 → Blob + MediaAssets ───────────────────────────────────────────

    private async Task<int> ImportMediaAsync(string? directory, CancellationToken cancellationToken)
    {
        if (directory is null || !Directory.Exists(directory))
        {
            logger.LogWarning("找不到圖片目錄 {Directory}，略過媒體匯入。", directory);
            return 0;
        }

        var existing = await db.MediaAssets
            .Where(m => m.LegacySourceKey != null)
            .Select(m => m.LegacySourceKey!)
            .ToListAsync(cancellationToken);

        var added = 0;

        foreach (var path in Directory.EnumerateFiles(directory).OrderBy(p => p))
        {
            var fileName = Path.GetFileName(path);
            var extension = Path.GetExtension(path).ToLowerInvariant();

            // .zip 之類的封裝檔不是媒體資產。
            if (extension is ".zip" or ".ds_store" or "")
            {
                continue;
            }

            var info = new FileInfo(path);
            string sha256;
            await using (var hashStream = File.OpenRead(path))
            {
                sha256 = Convert.ToHexStringLower(await SHA256.HashDataAsync(hashStream, cancellationToken));
            }

            // 冪等鍵用內容雜湊而不是檔名：長檔名會超過 LegacySourceKey 的 nvarchar(128)，
            // 而且以雜湊為鍵正好達成 §18.4 要的「同一張圖只留一份」。
            var key = $"{SourcePrefix}:media:{sha256}";
            if (existing.Contains(key))
            {
                logger.LogDebug("{FileName} 的內容與既有資產相同，略過。", fileName);
                continue;
            }

            // 舊站的圖全部是公開素材，進 public-media。
            StoredBlob stored;
            await using (var content = File.OpenRead(path))
            {
                stored = await storage.UploadAsync(
                    content, $"legacy/{fileName}", MimeTypes.For(extension), isPrivate: false, cancellationToken);
            }

            db.MediaAssets.Add(new MediaAsset
            {
                Container = stored.Container,
                BlobPath = stored.BlobPath,
                Url = stored.Url,
                IsPrivate = false,
                Type = MimeTypes.TypeFor(extension),
                MimeType = MimeTypes.For(extension),
                FileName = fileName,
                FileSizeBytes = info.Length,
                Sha256 = sha256,
                LegacySourceKey = key,
            });

            existing.Add(key);
            added++;

            if (added % 50 == 0)
            {
                await db.SaveChangesAsync(cancellationToken);
                db.ChangeTracker.Clear();
                logger.LogInformation("已上傳 {Count} 張圖片…", added);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();

        return added;
    }

    // ── blog_post.csv → Articles ────────────────────────────────────────────

    private async Task<int> ImportBlogPostsAsync(string? csvPath, CancellationToken cancellationToken)
    {
        if (csvPath is null || !File.Exists(csvPath))
        {
            logger.LogWarning("找不到 {Path}，略過 blog 匯入。", csvPath);
            return 0;
        }

        var existing = await db.Articles
            .Where(a => a.LegacySourceKey != null)
            .Select(a => a.LegacySourceKey!)
            .ToListAsync(cancellationToken);

        var slugs = await db.Articles.Select(a => a.Slug).ToListAsync(cancellationToken);
        var added = 0;

        // 這份 CSV 沒有標題列，三欄依序是 title / html / legacy slug。
        foreach (var row in CsvReader.Read(csvPath).Where(r => r.Length >= 3))
        {
            var legacySlug = row[2].Trim();
            var key = $"{SourcePrefix}:blog:{legacySlug}";

            if (legacySlug.Length == 0 || existing.Contains(key))
            {
                continue;
            }

            var slug = SlugRules.Normalize(Path.GetFileNameWithoutExtension(legacySlug));
            if (slug.Length == 0 || slugs.Contains(slug))
            {
                continue;
            }

            var article = new Article
            {
                Slug = slug,
                Type = ArticleType.CompanyNews,
                LegacySourceKey = key,
                // 舊站沒有匯出發佈日期，因此以草稿進來由編輯者確認後再發佈。
                Status = ContentStatus.Draft,
            };

            var title = row[0].Trim();
            var body = LegacyHtml.Clean(row[1]);

            // 舊站只有英文；繁中列先留空白內容，後台的「翻譯缺漏」流程會標出來。
            article.Translations.Add(new ArticleTranslation
            {
                Culture = CultureCodes.English,
                Title = title,
                Body = body,
            });

            db.Articles.Add(article);
            existing.Add(key);
            slugs.Add(slug);
            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();

        return added;
    }

    // ── 舊網址 → 301 ────────────────────────────────────────────────────────

    /// <summary>
    /// 專案決策：舊網址一律 301 到首頁（<c>/en</c>）。
    /// <para>
    /// 逐條建立而不是用萬用規則，理由有二：新站對真正不存在的網址仍要回 404
    /// （catch-all 會讓每個打錯的網址都回 200 首頁）；而且日後要把某幾條改指到對應新頁時，
    /// 在後台改 <c>Redirects</c> 那一列即可，不用動程式。
    /// </para>
    /// </summary>
    private async Task<int> ImportRedirectsAsync(LegacyImportOptions options, CancellationToken cancellationToken)
    {
        var paths = new SortedSet<string>(StringComparer.Ordinal);

        CollectCrawledPaths(options.CrawlJson, paths);
        CollectDerivedPaths(options.SiteDataCsvs, paths);
        CollectBlogPaths(options.BlogPostCsv, paths);
        CollectListedRedirects(options.UrlRedirectsCsv, paths);

        var existing = await db.Redirects.Select(r => r.FromPath).ToListAsync(cancellationToken);
        var target = $"/{CultureCodes.Default}";
        var added = 0;

        foreach (var path in paths)
        {
            if (path == "/" || existing.Contains(path))
            {
                continue;
            }

            db.Redirects.Add(new Redirect
            {
                FromPath = path,
                ToPath = target,
                StatusCode = 301,
                TargetCulture = CultureCodes.Default,
                IsEnabled = true,
                Notes = "舊站 www.vicround.com 的網址；依專案決策先導向首頁，可於後台改指對應新頁。",
                LegacySourceKey = $"{SourcePrefix}:redirect:{path}",
            });

            added++;
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();

        return added;
    }

    private static void CollectCrawledPaths(string? jsonPath, ISet<string> sink)
    {
        if (jsonPath is null || !File.Exists(jsonPath))
        {
            return;
        }

        var pages = JsonNode.Parse(File.ReadAllText(jsonPath))?["pages"] as JsonObject;

        foreach (var (path, _) in pages ?? [])
        {
            if (LegacyPath.TryNormalize(path, out var normalized))
            {
                sink.Add(normalized);
            }
        }
    }

    /// <summary>
    /// 匯出檔的 <c>pages</c> 區段只有 id 與 title，但 Weebly 的網址就是「標題轉 slug + .html」
    /// （<c>url_redirects.csv</c> 與 blog 的 slug 都吻合），因此可由標題推導出未被連到的孤兒頁。
    /// </summary>
    private static void CollectDerivedPaths(IEnumerable<string> csvPaths, ISet<string> sink)
    {
        foreach (var csvPath in csvPaths.Where(File.Exists))
        {
            var inPages = false;

            foreach (var row in CsvReader.Read(csvPath))
            {
                if (row.Length == 1)
                {
                    // 單欄列是區段標題；離開 pages 區段就不必再往下讀。
                    if (inPages)
                    {
                        break;
                    }

                    inPages = row[0] == "pages";
                    continue;
                }

                if (!inPages || row.Length < 2 || row[0] == "id")
                {
                    continue;
                }

                var slug = SlugRules.Normalize(WebUtilityDecode(row[1]));
                if (slug.Length > 0 && LegacyPath.TryNormalize($"/{slug}.html", out var normalized))
                {
                    sink.Add(normalized);
                }
            }
        }
    }

    private static void CollectBlogPaths(string? csvPath, ISet<string> sink)
    {
        if (csvPath is null || !File.Exists(csvPath))
        {
            return;
        }

        foreach (var row in CsvReader.Read(csvPath).Where(r => r.Length >= 3))
        {
            if (LegacyPath.TryNormalize($"/{row[2].Trim()}", out var normalized))
            {
                sink.Add(normalized);
            }
        }
    }

    /// <summary>`url_redirects.csv` 是「類型,路徑」，不是 from→to 對照。</summary>
    private static void CollectListedRedirects(string? csvPath, ISet<string> sink)
    {
        if (csvPath is null || !File.Exists(csvPath))
        {
            return;
        }

        foreach (var row in CsvReader.Read(csvPath).Where(r => r.Length >= 2))
        {
            if (LegacyPath.TryNormalize(row[1], out var normalized))
            {
                sink.Add(normalized);
            }
        }
    }

    private static string WebUtilityDecode(string value) => System.Net.WebUtility.HtmlDecode(value);
}

public sealed record LegacyImportOptions
{
    public string? ImageDirectory { get; init; }
    public string? BlogPostCsv { get; init; }
    public string? UrlRedirectsCsv { get; init; }
    public string? CrawlJson { get; init; }
    public IReadOnlyList<string> SiteDataCsvs { get; init; } = [];

    /// <summary>由舊站匯出的根目錄推出各檔位置。</summary>
    public static LegacyImportOptions FromRoot(string root)
    {
        var export = Path.Combine(root, "1d0216ed-c6f4-45a4-b718-ac1f81163452");
        var siteData = Path.Combine(export, "ae535dce-c598-4065-99b7-f3411cc10fa9");

        return new LegacyImportOptions
        {
            ImageDirectory = Path.Combine(root, "官網圖片"),
            BlogPostCsv = Path.Combine(siteData, "blog_post.csv"),
            UrlRedirectsCsv = Path.Combine(siteData, "url_redirects.csv"),
            SiteDataCsvs = Directory.Exists(export)
                ? Directory.GetFiles(export, "website-site-*-data.csv")
                : [],
        };
    }
}

internal static class MimeTypes
{
    public static string For(string extension) => extension switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".gif" => "image/gif",
        ".svg" => "image/svg+xml",
        ".pdf" => "application/pdf",
        ".mp4" => "video/mp4",
        _ => "application/octet-stream",
    };

    public static MediaAssetType TypeFor(string extension) => extension switch
    {
        ".jpg" or ".jpeg" or ".png" or ".webp" or ".gif" or ".svg" => MediaAssetType.Image,
        ".mp4" => MediaAssetType.Video,
        ".pdf" => MediaAssetType.Document,
        _ => MediaAssetType.Other,
    };
}

/// <summary>Redirects.FromPath 的正規化規則（database.md §10）：小寫、去尾斜線。</summary>
internal static class LegacyPath
{
    public static bool TryNormalize(string? raw, out string path)
    {
        path = string.Empty;

        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        var value = raw.Trim().ToLowerInvariant();
        if (!value.StartsWith('/'))
        {
            value = '/' + value;
        }

        value = value.TrimEnd('/');
        if (value.Length == 0)
        {
            value = "/";
        }

        // 爬蟲會撿到 /css2 這種不是頁面的路徑。
        if (value is "/css2" || value.Contains("://", StringComparison.Ordinal))
        {
            return false;
        }

        path = value;
        return true;
    }
}

internal static class CsvReader
{
    /// <summary>只夠讀 Weebly 匯出的最小 CSV 解析：雙引號包欄、"" 為跳脫。</summary>
    public static IEnumerable<string[]> Read(string path)
    {
        using var reader = new StreamReader(path);
        var fields = new List<string>();
        var field = new System.Text.StringBuilder();
        var quoted = false;

        while (reader.Read() is var read and >= 0)
        {
            var c = (char)read;

            if (quoted)
            {
                if (c != '"')
                {
                    field.Append(c);
                }
                else if (reader.Peek() == '"')
                {
                    field.Append('"');
                    reader.Read();
                }
                else
                {
                    quoted = false;
                }

                continue;
            }

            switch (c)
            {
                case '"':
                    quoted = true;
                    break;

                case ',':
                    fields.Add(field.ToString());
                    field.Clear();
                    break;

                case '\r':
                    break;

                case '\n':
                    fields.Add(field.ToString());
                    field.Clear();
                    yield return [.. fields];
                    fields.Clear();
                    break;

                default:
                    field.Append(c);
                    break;
            }
        }

        if (field.Length > 0 || fields.Count > 0)
        {
            fields.Add(field.ToString());
            yield return [.. fields];
        }
    }
}

/// <summary>舊站 HTML 的清洗：拿掉 Weebly 的版型 class 與內嵌樣式。</summary>
internal static partial class LegacyHtml
{
    public static string Clean(string html)
    {
        var cleaned = WsiteClass().Replace(html, string.Empty);
        cleaned = InlineStyle().Replace(cleaned, string.Empty);
        cleaned = FontTag().Replace(cleaned, string.Empty);

        return Whitespace().Replace(cleaned, " ").Trim();
    }

    [System.Text.RegularExpressions.GeneratedRegex("""\s*class="[^"]*"\s*""")]
    private static partial System.Text.RegularExpressions.Regex WsiteClass();

    [System.Text.RegularExpressions.GeneratedRegex("""\s*style="[^"]*"\s*""")]
    private static partial System.Text.RegularExpressions.Regex InlineStyle();

    [System.Text.RegularExpressions.GeneratedRegex("</?font[^>]*>")]
    private static partial System.Text.RegularExpressions.Regex FontTag();

    [System.Text.RegularExpressions.GeneratedRegex(@"\s{2,}")]
    private static partial System.Text.RegularExpressions.Regex Whitespace();
}
