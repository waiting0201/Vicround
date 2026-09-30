using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Data.Seeding.LegacyImport;
using VicRound.Api.Models.Entities;
using VicRound.Api.Services;

namespace VicRound.Api.Data.Seeding.ProductImport;

/// <summary>
/// database.md §18.1 的 <b>C 層</b>：客戶提供的產品資料（規格書、第三方報告、證書、客戶案例）。
/// <para>
/// 文字內容已人工整理成 <c>product-catalog.json</c>，與原始檔一起放在 <c>reference/product-docs/</c>
/// （由 <c>--root</c> 指定）。<b>兩者都不進版控</b>：內容含客戶名稱與尚未取得授權的案例，而 repo 是公開的；
/// 經 <c>scripts/sync-nas-assets.sh</c> 同步到 NAS。檔案上傳到 Blob、建 MediaAssets，
/// 再建產品、規格列、下載、案例與各種關聯。
/// </para>
/// <para>
/// 與其他 seeder 一樣<b>冪等、只補缺不覆寫</b>：以 slug 判斷實體是否已存在，媒體以內容雜湊為鍵；
/// 已存在的產品只補上缺的關聯，編輯者在後台改過的文字不會被重跑蓋掉。唯一的例外是認證上的
/// <c>[Pending client input]</c> 佔位字——那本來就是「缺」，拿到真實資料就該填上。
/// </para>
/// </summary>
public sealed class ProductImportSeeder(
    VicRoundDbContext db,
    IMediaStorage storage,
    ILogger<ProductImportSeeder> logger)
{
    private const string SourcePrefix = "product-docs";

    /// <summary>確認稿時期留下的佔位字（ContentImport 的兩種語系寫法）。</summary>
    private static readonly string[] PlaceholderTexts = ["[Pending client input]", "[待客戶提供]"];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly Dictionary<string, int> counters = [];
    private string root = string.Empty;

    public async Task ImportAsync(string catalogJson, string sourceRoot, CancellationToken cancellationToken = default)
    {
        root = sourceRoot;
        var catalog = JsonSerializer.Deserialize<Catalog>(catalogJson, JsonOptions)
            ?? throw new InvalidOperationException("product-catalog.json 是空的。");

        // 產品先進，下載、案例、認證的關聯才連得到。
        foreach (var family in catalog.Families)
        {
            await ImportProductAsync(family, cancellationToken);
        }

        foreach (var product in catalog.Products)
        {
            await ImportProductAsync(product, cancellationToken);
        }

        foreach (var download in catalog.Downloads)
        {
            await ImportDownloadAsync(download, cancellationToken);
        }

        foreach (var certification in catalog.Certifications)
        {
            await FillCertificationAsync(certification, cancellationToken);
        }

        foreach (var caseStudy in catalog.CaseStudies)
        {
            await ImportCaseStudyAsync(caseStudy, cancellationToken);
        }

        var summary = string.Join("、", counters.OrderBy(c => c.Key).Select(c => $"{c.Key} {c.Value}"));
        logger.LogInformation("產品資料匯入完成 —— {Summary}（已存在的一律略過）。",
            summary.Length == 0 ? "沒有新增任何列" : summary);
    }

    // ── 產品與 family ───────────────────────────────────────────────────────

    private async Task ImportProductAsync(ProductSource source, CancellationToken cancellationToken)
    {
        var product = await db.Products.AsTracking().SingleOrDefaultAsync(p => p.Slug == source.Slug, cancellationToken);

        if (product is null)
        {
            var categoryId = await db.Categories
                .Where(c => c.Slug == source.Category)
                .Select(c => (int?)c.Id)
                .SingleOrDefaultAsync(cancellationToken)
                ?? throw new InvalidOperationException($"{source.Slug}：找不到產品線 {source.Category}。");

            int? parentId = null;
            if (source.Parent is not null)
            {
                parentId = await db.Products
                    .Where(p => p.Slug == source.Parent)
                    .Select(p => (int?)p.Id)
                    .SingleOrDefaultAsync(cancellationToken)
                    ?? throw new InvalidOperationException($"{source.Slug}：找不到 family {source.Parent}。");
            }

            product = new Product
            {
                Slug = source.Slug,
                CategoryId = categoryId,
                ParentProductId = parentId,
                Code = source.Code,
                Brand = source.Brand,
                IsNew = source.IsNew,
                Status = ContentStatus.Published,
                SortOrder = source.SortOrder,
                PublishedAt = DateTime.UtcNow,
                HeroMediaAssetId = source.Hero is null ? null : await UploadAsync(source.Hero, $"products/{source.Slug}", false, cancellationToken),
            };

            foreach (var (culture, text) in source.Texts())
            {
                product.Translations.Add(new ProductTranslation
                {
                    Culture = culture,
                    Name = text.Name,
                    Summary = text.Summary,
                    Description = text.Description,
                    ApplicationNote = text.ApplicationNote,
                    SeoTitle = text.SeoTitle,
                    SeoDescription = text.SeoDescription,
                });
            }

            var sort = 0;
            foreach (var spec in source.Specifications)
            {
                var row = new SpecificationRow
                {
                    IsHighlighted = spec.Highlight,
                    Status = ContentStatus.Published,
                    SortOrder = ++sort,
                };

                foreach (var (culture, text) in spec.Texts())
                {
                    row.Translations.Add(new SpecificationRowTranslation
                    {
                        Culture = culture,
                        Label = text.Label,
                        Value = text.Value,
                        Note = text.Note,
                    });
                }

                product.SpecificationRows.Add(row);
            }

            db.Products.Add(product);
            await db.SaveChangesAsync(cancellationToken);
            Count("產品");
            Count("規格列", sort);
        }

        // 關聯不論產品是否新建都補：後台若刪掉了某條關聯，這裡會再加回來——
        // 但那正是「只補缺」的定義，要永久拿掉請改 JSON。
        var solutionIds = await db.Solutions
            .Where(s => source.Solutions.Contains(s.Slug))
            .Select(s => new { s.Id, s.Slug })
            .ToListAsync(cancellationToken);
        var linkedSolutions = await db.ProductSolutions
            .Where(x => x.ProductId == product.Id)
            .Select(x => x.SolutionId)
            .ToListAsync(cancellationToken);

        foreach (var solution in solutionIds.Where(s => !linkedSolutions.Contains(s.Id)))
        {
            db.ProductSolutions.Add(new ProductSolution
            {
                ProductId = product.Id,
                SolutionId = solution.Id,
                SortOrder = source.Solutions.IndexOf(solution.Slug) + 1,
            });
            Count("產品↔產業");
        }

        var certificationIds = await db.Certifications
            .Where(c => source.Certifications.Contains(c.Slug))
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);
        var linkedCertifications = await db.CertificationProducts
            .Where(x => x.ProductId == product.Id)
            .Select(x => x.CertificationId)
            .ToListAsync(cancellationToken);

        foreach (var certificationId in certificationIds.Except(linkedCertifications))
        {
            db.CertificationProducts.Add(new CertificationProduct { ProductId = product.Id, CertificationId = certificationId });
            Count("產品↔認證");
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
    }

    // ── 下載（規格書、測試報告、證書、型錄） ────────────────────────────────

    private async Task ImportDownloadAsync(DownloadSource source, CancellationToken cancellationToken)
    {
        var download = await db.Downloads.AsTracking().SingleOrDefaultAsync(d => d.Slug == source.Slug, cancellationToken);

        if (download is null)
        {
            // 限會員的檔案必須進私有容器（database.md §06）——公開端永遠拿不到它的真實網址。
            var isPrivate = source.Access == DownloadAccessLevel.MemberOnly;
            var extension = Path.GetExtension(source.File).ToLowerInvariant();
            var mediaId = await UploadAsync(source.File, $"downloads/{source.Slug}", isPrivate, cancellationToken);

            download = new Download
            {
                Slug = source.Slug,
                MediaAssetId = mediaId,
                Kind = source.Kind,
                AccessLevel = source.Access,
                Version = source.Version,
                DocumentDate = source.Date,
                ValidUntil = source.ValidUntil,
                FileExtension = extension.TrimStart('.'),
                FileSizeBytes = new FileInfo(Resolve(source.File)).Length,
                DocumentCulture = source.Culture,
                Status = ContentStatus.Published,
                PublishedAt = DateTime.UtcNow,
            };

            foreach (var (culture, text) in source.Texts())
            {
                download.Translations.Add(new DownloadTranslation
                {
                    Culture = culture,
                    Title = text.Title,
                    Description = text.Description,
                });
            }

            db.Downloads.Add(download);
            await db.SaveChangesAsync(cancellationToken);
            Count("下載");
        }

        var products = await db.Products
            .Where(p => source.Products.Contains(p.Slug))
            .Select(p => new { p.Id, p.Slug })
            .ToListAsync(cancellationToken);
        var linked = await db.DownloadProducts
            .Where(x => x.DownloadId == download.Id)
            .Select(x => x.ProductId)
            .ToListAsync(cancellationToken);

        foreach (var product in products.Where(p => !linked.Contains(p.Id)))
        {
            db.DownloadProducts.Add(new DownloadProduct
            {
                DownloadId = download.Id,
                ProductId = product.Id,
                SortOrder = source.Products.IndexOf(product.Slug) + 1,
            });
            Count("下載↔產品");
        }

        if (source.Certification is not null)
        {
            var certification = await db.Certifications.AsTracking()
                .SingleOrDefaultAsync(c => c.Slug == source.Certification, cancellationToken);

            if (certification is not null)
            {
                // 證書 PDF 重用 Downloads（§07）；已經有人掛了別份就不動。
                certification.DownloadId ??= download.Id;

                if (!await db.DownloadCertifications.AnyAsync(
                        x => x.DownloadId == download.Id && x.CertificationId == certification.Id, cancellationToken))
                {
                    db.DownloadCertifications.Add(new DownloadCertification
                    {
                        DownloadId = download.Id,
                        CertificationId = certification.Id,
                    });
                    Count("下載↔認證");
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
    }

    // ── 認證：把佔位字換成真實資料 ─────────────────────────────────────────

    private async Task FillCertificationAsync(CertificationSource source, CancellationToken cancellationToken)
    {
        var certification = await db.Certifications.AsTracking()
            .Include(c => c.Translations)
            .SingleOrDefaultAsync(c => c.Slug == source.Slug, cancellationToken);

        if (certification is null)
        {
            logger.LogWarning("找不到認證 {Slug}，略過。", source.Slug);
            return;
        }

        var filled = 0;
        if (certification.CertificateNumber is null && source.CertificateNumber is not null)
        {
            certification.CertificateNumber = source.CertificateNumber;
            filled++;
        }

        if (certification.IssuedOn is null && source.IssuedOn is not null)
        {
            certification.IssuedOn = source.IssuedOn;
            filled++;
        }

        if (certification.ValidUntil is null && source.ValidUntil is not null)
        {
            certification.ValidUntil = source.ValidUntil;
            filled++;
        }

        foreach (var (culture, text) in source.Texts())
        {
            var translation = certification.Translations.SingleOrDefault(t => t.Culture == culture);
            if (translation is null)
            {
                continue;
            }

            translation.IssuerName = Fill(translation.IssuerName, text.IssuerName, ref filled);
            translation.ValidityText = Fill(translation.ValidityText, text.ValidityText, ref filled);
            translation.SitesText = Fill(translation.SitesText, text.SitesText, ref filled);
            translation.ScopeText = Fill(translation.ScopeText, text.ScopeText, ref filled);
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
        Count("認證欄位", filled);
    }

    /// <summary>
    /// 空值或佔位字才填。<c>ScopeText</c> 這類確認稿寫過的真實敘述（如 "Recycled content tracing"）
    /// 不在此列，保持原樣。
    /// </summary>
    private static string? Fill(string? current, string? incoming, ref int filled)
    {
        if (incoming is null || (current is not null && !PlaceholderTexts.Contains(current)))
        {
            return current;
        }

        filled++;
        return incoming;
    }

    // ── 客戶案例 ────────────────────────────────────────────────────────────

    private async Task ImportCaseStudyAsync(CaseStudySource source, CancellationToken cancellationToken)
    {
        var caseStudy = await db.CaseStudies.AsTracking().SingleOrDefaultAsync(c => c.Slug == source.Slug, cancellationToken);

        if (caseStudy is null)
        {
            caseStudy = new CaseStudy
            {
                Slug = source.Slug,
                Status = ContentStatus.Published,
                SortOrder = source.SortOrder,
                PublishedAt = DateTime.UtcNow,
                MediaAssetId = source.Image is null ? null : await UploadAsync(source.Image, $"case-studies/{source.Slug}", false, cancellationToken),
            };

            foreach (var (culture, text) in source.Texts())
            {
                caseStudy.Translations.Add(new CaseStudyTranslation
                {
                    Culture = culture,
                    ClientName = text.ClientName,
                    ProjectName = text.ProjectName,
                    Title = text.Title,
                    Challenge = text.Challenge,
                    Solution = text.Solution,
                    Result = text.Result,
                });
            }

            db.CaseStudies.Add(caseStudy);
            await db.SaveChangesAsync(cancellationToken);
            Count("客戶案例");
        }

        var products = await db.Products
            .Where(p => source.Products.Contains(p.Slug))
            .Select(p => new { p.Id, p.Slug })
            .ToListAsync(cancellationToken);
        var linkedProducts = await db.CaseStudyProducts
            .Where(x => x.CaseStudyId == caseStudy.Id)
            .Select(x => x.ProductId)
            .ToListAsync(cancellationToken);

        foreach (var product in products.Where(p => !linkedProducts.Contains(p.Id)))
        {
            db.CaseStudyProducts.Add(new CaseStudyProduct
            {
                CaseStudyId = caseStudy.Id,
                ProductId = product.Id,
                SortOrder = source.Products.IndexOf(product.Slug) + 1,
            });
            Count("案例↔產品");
        }

        var solutions = await db.Solutions
            .Where(s => source.Solutions.Contains(s.Slug))
            .Select(s => new { s.Id, s.Slug })
            .ToListAsync(cancellationToken);
        var linkedSolutions = await db.CaseStudySolutions
            .Where(x => x.CaseStudyId == caseStudy.Id)
            .Select(x => x.SolutionId)
            .ToListAsync(cancellationToken);

        foreach (var solution in solutions.Where(s => !linkedSolutions.Contains(s.Id)))
        {
            db.CaseStudySolutions.Add(new CaseStudySolution
            {
                CaseStudyId = caseStudy.Id,
                SolutionId = solution.Id,
                SortOrder = source.Solutions.IndexOf(solution.Slug) + 1,
            });
            Count("案例↔產業");
        }

        await db.SaveChangesAsync(cancellationToken);
        db.ChangeTracker.Clear();
    }

    // ── 媒體 ────────────────────────────────────────────────────────────────

    /// <summary>
    /// 上傳並建 MediaAsset，回傳其 Id。冪等鍵是內容雜湊加容器：同一份 PDF 被兩個產品資料夾各放一份
    /// （客戶交來的資料常這樣）只會存一次；同一檔案若同時要公開與私有則是兩份，互不影響。
    /// </summary>
    private async Task<int> UploadAsync(string relativePath, string blobStem, bool isPrivate, CancellationToken cancellationToken)
    {
        var (content, fileName) = await ReadSourceAsync(relativePath, cancellationToken);
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var sha256 = Convert.ToHexStringLower(SHA256.HashData(content));

        var key = $"{SourcePrefix}:{(isPrivate ? "private" : "public")}:{sha256}";
        var existing = await db.MediaAssets
            .Where(m => m.LegacySourceKey == key)
            .Select(m => (int?)m.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is { } id)
        {
            return id;
        }

        // Blob 名稱用 slug 而非原檔名：原檔名有中文、空白與「的副本 的副本」，
        // 會原封不動出現在下載網址裡。
        StoredBlob stored;
        await using (var stream = new MemoryStream(content))
        {
            stored = await storage.UploadAsync(
                stream, $"{SourcePrefix}/{blobStem}{extension}", MimeTypes.For(extension), isPrivate, cancellationToken);
        }

        var asset = new MediaAsset
        {
            Container = stored.Container,
            BlobPath = stored.BlobPath,
            Url = stored.Url,
            IsPrivate = isPrivate,
            Type = MimeTypes.TypeFor(extension),
            MimeType = MimeTypes.For(extension),
            FileName = fileName,
            FileSizeBytes = content.Length,
            Sha256 = sha256,
            LegacySourceKey = key,
        };

        db.MediaAssets.Add(asset);
        await db.SaveChangesAsync(cancellationToken);
        Count("媒體檔");

        return asset.Id;
    }

    /// <summary>
    /// 讀來源檔。<c>案例.docx#word/media/image1.png</c> 這種寫法取 Office 檔裡內嵌的圖——
    /// 客戶的案例成果圖只貼在 Word 裡，沒有另外給檔案。
    /// </summary>
    private async Task<(byte[] Content, string FileName)> ReadSourceAsync(string relativePath, CancellationToken cancellationToken)
    {
        var hash = relativePath.IndexOf('#');
        if (hash < 0)
        {
            var path = Resolve(relativePath);
            return (await File.ReadAllBytesAsync(path, cancellationToken), Path.GetFileName(path));
        }

        var container = Resolve(relativePath[..hash]);
        var entryName = relativePath[(hash + 1)..];

        using var zip = ZipFile.OpenRead(container);
        var entry = zip.GetEntry(entryName)
            ?? throw new FileNotFoundException($"{relativePath[..hash]} 裡沒有 {entryName}。");

        await using var entryStream = entry.Open();
        using var buffer = new MemoryStream();
        await entryStream.CopyToAsync(buffer, cancellationToken);

        return (buffer.ToArray(), $"{Path.GetFileNameWithoutExtension(container)}-{Path.GetFileName(entryName)}");
    }

    private string Resolve(string relativePath)
    {
        var path = Path.Combine(root, relativePath);
        return File.Exists(path)
            ? path
            : throw new FileNotFoundException($"找不到 {relativePath}（--root {root}）。", path);
    }

    private void Count(string what, int n = 1)
    {
        if (n > 0)
        {
            counters[what] = counters.GetValueOrDefault(what) + n;
        }
    }

    // ── product-catalog.json 的形狀 ────────────────────────────────────────

    private sealed class Catalog
    {
        public List<ProductSource> Families { get; set; } = [];
        public List<ProductSource> Products { get; set; } = [];
        public List<DownloadSource> Downloads { get; set; } = [];
        public List<CertificationSource> Certifications { get; set; } = [];
        public List<CaseStudySource> CaseStudies { get; set; } = [];
    }

    /// <summary>每個來源物件都有 <c>en</c> 與 <c>zh-Hant</c> 兩份文字。</summary>
    private abstract class Bilingual<T>
    {
        [JsonPropertyName("en")] public T? En { get; set; }
        [JsonPropertyName("zh-Hant")] public T? ZhHant { get; set; }

        public IEnumerable<(string Culture, T Text)> Texts()
        {
            if (En is not null) yield return (CultureCodes.English, En);
            if (ZhHant is not null) yield return (CultureCodes.TraditionalChinese, ZhHant);
        }
    }

    private sealed class ProductSource : Bilingual<ProductText>
    {
        public string Slug { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? Parent { get; set; }
        public string? Code { get; set; }
        public string? Brand { get; set; }
        public bool IsNew { get; set; }
        public int SortOrder { get; set; }
        public string? Hero { get; set; }
        public List<string> Solutions { get; set; } = [];
        public List<string> Certifications { get; set; } = [];
        public List<SpecSource> Specifications { get; set; } = [];
    }

    private sealed record ProductText(
        string Name, string? Summary, string? Description, string? ApplicationNote, string? SeoTitle, string? SeoDescription);

    private sealed class SpecSource : Bilingual<SpecText>
    {
        public bool Highlight { get; set; }
    }

    private sealed record SpecText(string? Label, string Value, string? Note);

    private sealed class DownloadSource : Bilingual<DownloadText>
    {
        public string Slug { get; set; } = string.Empty;
        public DownloadKind Kind { get; set; }
        public DownloadAccessLevel Access { get; set; }
        public string? Version { get; set; }
        public DateOnly? Date { get; set; }
        public DateOnly? ValidUntil { get; set; }
        public string? Culture { get; set; }
        public string File { get; set; } = string.Empty;
        public List<string> Products { get; set; } = [];
        public string? Certification { get; set; }
    }

    private sealed record DownloadText(string Title, string? Description);

    private sealed class CertificationSource : Bilingual<CertificationText>
    {
        public string Slug { get; set; } = string.Empty;
        public string? CertificateNumber { get; set; }
        public DateOnly? IssuedOn { get; set; }
        public DateOnly? ValidUntil { get; set; }
    }

    private sealed record CertificationText(string? IssuerName, string? ValidityText, string? SitesText, string? ScopeText);

    private sealed class CaseStudySource : Bilingual<CaseStudyText>
    {
        public string Slug { get; set; } = string.Empty;
        public List<string> Products { get; set; } = [];
        public List<string> Solutions { get; set; } = [];
        public string? Image { get; set; }
        public int SortOrder { get; set; }
    }

    private sealed record CaseStudyText(
        string? ClientName, string? ProjectName, string Title, string Challenge, string Solution, string? Result);
}
