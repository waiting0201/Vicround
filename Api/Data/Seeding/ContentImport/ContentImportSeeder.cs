using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data.Seeding.ContentImport;

/// <summary>
/// database.md §18.1 的 <b>C 層</b>：把 `apps/web/content/*.ts` 的確認稿文案匯入資料庫，
/// 讓前台可以改吃 Content API、`content/` 目錄整個刪掉。
/// <para>
/// 與 B 層一樣是<b>冪等</b>的：以自然鍵（slug / anchor / 題目 id）判斷，只補缺不覆寫，
/// 編輯者在後台改過的內容不會被重跑蓋掉。
/// </para>
/// <para>
/// <b>刻意不匯入的：</b>表單欄位標籤、按鈕文字、分頁名稱這類 UI 字串
/// （`member.signIn.*`、`contact.form.fields.*`、`*.readMore`…）。依 architecture.md 的分工，
/// UI 標籤留在 `messages/{locale}.json`，只有<b>內容</b>進翻譯表——否則編輯者會在後台看到
/// 一堆叫「Email」「Submit」的版塊。
/// </para>
/// </summary>
public sealed partial class ContentImportSeeder(VicRoundDbContext db, ILogger<ContentImportSeeder> logger)
{
    private readonly Dictionary<string, int> counters = [];

    public async Task ImportAsync(string exportJson, CancellationToken cancellationToken = default)
    {
        var source = ContentSource.Load(exportJson);

        // 強型別實體先進，版塊的 Ref* 才連得到。
        await ImportCertificationsAsync(source, cancellationToken);
        await ImportFaqAsync(source, cancellationToken);
        await ImportCategoriesAsync(source, cancellationToken);
        await ImportSolutionsAsync(source, cancellationToken);
        await ImportProcessFlowsAsync(source, cancellationToken);
        await ImportCompanyAsync(source, cancellationToken);
        await ImportArticlesAsync(source, cancellationToken);

        // 敘事型頁面的 banner / CTA / 版塊。
        await ImportPagesAsync(source, cancellationToken);

        var summary = string.Join("、", counters.OrderBy(c => c.Key).Select(c => $"{c.Key} {c.Value}"));
        logger.LogInformation("內容匯入完成 —— 新增 {Summary}（已存在的一律略過）。",
            summary.Length == 0 ? "0 列" : summary);
    }

    private void Count(string what, int n = 1)
    {
        if (n <= 0)
        {
            return;
        }

        counters[what] = counters.GetValueOrDefault(what) + n;
    }

    /// <summary>兩個語系各建一列翻譯。</summary>
    private static void AddBilingual<TTranslation>(
        ICollection<TTranslation> target,
        Func<string, TTranslation> factory)
    {
        target.Add(factory(CultureCodes.English));
        target.Add(factory(CultureCodes.TraditionalChinese));
    }

    // ── 頁面 ────────────────────────────────────────────────────────────────

    /// <summary>
    /// 一個 section 要變成什麼版塊。多數 section 的形狀是
    /// <c>{eyebrow, title, lead, items[]}</c>，因此用宣告表 + 通用轉換，
    /// 而不是每一段各寫一支 mapper。
    /// </summary>
    /// <param name="Settings">
    /// Reference block 的查詢參數（<c>SettingsJson</c>）。必須 culture-neutral，
    /// 只放 slug、enum 名稱與數字（database.md §09）。Content block 一律為 <c>null</c>。
    /// </param>
    private sealed record BlockSpec(
        string Section,
        BlockType Type,
        string Anchor,
        BlockTone Tone = BlockTone.Light,
        string? Settings = null,
        bool WithItems = true);

    private sealed record PageSpec(string File, string Export, string PageSlug, BlockSpec[] Blocks);

    private static readonly PageSpec[] PageSpecs =
    [
        new("home", "home", "home",
        [
            new("hero", BlockType.Hero, "hero", BlockTone.Dark),
            new("materials", BlockType.CategoryGrid, "materials", BlockTone.Dark),
            new("industries", BlockType.SolutionGrid, "industries", BlockTone.Dark, """{"limit":4}"""),
            new("trust", BlockType.LogoWall, "trust", BlockTone.Dark),
            new("sustainability", BlockType.Cta, "sustainability", BlockTone.Dark),
        ]),
        new("products", "products", "products",
        [
            new("lines", BlockType.CategoryGrid, "lines"),
        ]),
        new("solutions-hub", "solutionsHub", "solutions",
        [
            new("cards", BlockType.SolutionGrid, "cards"),
        ]),
        new("technologies", "technologies", "technologies",
        [
            new("core", BlockType.ProcessFlowRef, "core-processes", Settings: """{"kind":"coreProcess"}"""),
            new("qc", BlockType.MediaTextSplit, "qc"),
            new("innovation", BlockType.FeatureGrid, "innovation"),
            new("compliance", BlockType.CertificationList, "compliance", Settings: """{"category":"product-compliance"}"""),
        ]),
        new("about", "about", "about",
        [
            new("vision", BlockType.MediaTextSplit, "vision", BlockTone.Dark),
            new("values", BlockType.FeatureGrid, "values", BlockTone.Dark),
            new("history", BlockType.MilestoneTimeline, "history", BlockTone.Dark),
            new("manufacturing", BlockType.FeatureGrid, "manufacturing", BlockTone.Dark),
            new("sustainability", BlockType.FeatureGrid, "sustainability", BlockTone.Dark),
            new("certification", BlockType.CertificationList, "certifications", BlockTone.Dark),
            new("partnership", BlockType.OfferingGrid, "partnership", BlockTone.Dark),
        ]),
        new("sustainability", "sustainability", "sustainability",
        [
            new("esg", BlockType.FeatureGrid, "esg"),
            new("carbon", BlockType.MediaTextSplit, "carbon"),
            new("eudr", BlockType.MediaTextSplit, "eudr"),
            new("certifications", BlockType.CertificationList, "certifications", Settings: """{"category":"sustainability"}"""),
        ]),
        new("partnership", "partnership", "partnership",
        [
            new("oem", BlockType.ProcessFlowRef, "oem-odm", Settings: """{"kind":"oemOdm"}"""),
            new("distribution", BlockType.MediaTextSplit, "distribution"),
            new("testimonials", BlockType.TestimonialList, "testimonials"),
        ]),
        new("resources", "resources", "resources",
        [
            new("news", BlockType.ExhibitionList, "news", Settings: """{"upcoming":true,"limit":3}"""),
            new("faq", BlockType.FaqList, "faq", Settings: """{"limit":4}"""),
            new("insights", BlockType.ArticleList, "insights", Settings: """{"type":"insight","limit":2}"""),
            new("articles", BlockType.ArticleList, "articles", Settings: """{"type":"technicalArticle","limit":3}"""),
            new("downloads", BlockType.DownloadList, "downloads"),
        ]),
        new("contact", "contact", "contact",
        [
            new("direct", BlockType.ContactChannelList, "channels"),
            new("locations", BlockType.LocationList, "locations"),
            new("process", BlockType.ProcessFlowRef, "what-happens-next", Settings: """{"kind":"inquiryFlow"}"""),
        ]),
        new("member", "member", "member",
        [
            new("benefits", BlockType.FeatureGrid, "benefits", BlockTone.Dark),
        ]),
        // privacy 刻意沒有版塊：純長文走 PageTranslations.Body（database.md §09）。
        new("privacy", "privacy", "privacy", []),

        // Resources 的兩個子頁。FAQ 沒有版塊——題目本身是強型別表（FaqItems），
        // 頁面只需要 banner；清單由前台打 /v1/faq 取得。
        new("faq", "faq", "faq", []),

        // 下載中心在確認稿裡是 Resources 的一個區段，本站的資訊架構另給它可索引的網址
        // （docs/sitemap.md）。banner 沿用 Resources 的那一份——同一份文案先各自落一列，
        // 之後編輯者可以分開改。
        new("resources", "resources", "downloads",
        [
            new("downloads", BlockType.DownloadList, "downloads"),
        ]),
        new("articles", "newsIndex", "news",
        [
            new("list", BlockType.ArticleList, "list", Settings: """{"type":"news","limit":12}"""),
            new("events", BlockType.ExhibitionList, "events", Settings: """{"upcoming":true}"""),
        ]),
    ];

    private async Task ImportPagesAsync(ContentSource source, CancellationToken cancellationToken)
    {
        foreach (var spec in PageSpecs)
        {
            var root = source.TryExport(spec.File, spec.Export);
            if (root is null)
            {
                logger.LogWarning("找不到 {File}.{Export}，略過頁面 {Slug}。", spec.File, spec.Export, spec.PageSlug);
                continue;
            }

            var page = await db.Pages
                .AsTracking()
                .Include(p => p.Translations)
                .Include(p => p.Blocks)
                .SingleOrDefaultAsync(p => p.Slug == spec.PageSlug, cancellationToken);

            if (page is null)
            {
                logger.LogWarning("資料庫沒有 Page {Slug}（B 層 seeder 跑過了嗎？），略過。", spec.PageSlug);
                continue;
            }

            SynthesizeSections(spec.PageSlug, root);
            EnrichPageTranslations(page, root, spec.PageSlug);
            AddPageBlocks(page, root, spec);

            await db.SaveChangesAsync(cancellationToken);
            db.ChangeTracker.Clear();
        }
    }

    /// <summary>
    /// 把來源裡「不是 section 形狀」的欄位補成 section，讓通用轉換吃得下。
    /// <para>
    /// news 的列表標題在確認稿裡是兩個扁平字串（<c>listEyebrow</c> / <c>listTitle</c>），
    /// 不是一個物件。與其為這一頁另寫一支 mapper，不如把來源補成標準形狀。
    /// </para>
    /// </summary>
    private static void SynthesizeSections(string pageSlug, JsonObject root)
    {
        if (pageSlug == "news" && root["list"] is null && root["listTitle"] is not null)
        {
            root["list"] = new JsonObject
            {
                ["eyebrow"] = root["listEyebrow"]?.DeepClone(),
                ["title"] = root["listTitle"]?.DeepClone(),
            };
        }

        if (pageSlug == "technologies")
        {
            // 線上品管是「核心製程」底下的一小段，來源把它包在 core.qc。
            root["qc"] ??= root["core"]?["qc"]?.DeepClone();

            // 法規符合的導言在來源裡拆成三段字串（前段／連結文字／後段），
            // 為的是中間夾一個站內連結。合成 HTML 存進版塊的 Body，
            // 連結的語系前綴由前台渲染時補（lib/html.ts）。
            if (root["compliance"] is JsonObject compliance && compliance["body"] is null)
            {
                compliance["body"] = new JsonObject
                {
                    [CultureCodes.English] = ComplianceLead(compliance, CultureCodes.English),
                    [CultureCodes.TraditionalChinese] = ComplianceLead(compliance, CultureCodes.TraditionalChinese),
                };
            }
        }
    }

    private static string ComplianceLead(JsonObject compliance, string culture)
    {
        var before = ((JsonNode?)compliance).LocAny("leadBefore")?.For(culture) ?? string.Empty;
        var link = ((JsonNode?)compliance).LocAny("leadLink")?.For(culture) ?? string.Empty;
        var after = ((JsonNode?)compliance).LocAny("leadAfter")?.For(culture) ?? string.Empty;

        return $"<p>{System.Net.WebUtility.HtmlEncode(before)}" +
               $"<a href=\"/sustainability\">{System.Net.WebUtility.HtmlEncode(link)}</a>" +
               $"{System.Net.WebUtility.HtmlEncode(after)}</p>";
    }

    /// <summary>banner 與 CTA 填進 <c>PageTranslations</c> 既有欄位；只補空值，不覆寫。</summary>
    private void EnrichPageTranslations(Page page, JsonObject root, string pageSlug)
    {
        var banner = ((JsonNode)root).Prop("banner");
        var cta = ((JsonNode)root).Prop("cta");
        var updated = false;

        foreach (var translation in page.Translations)
        {
            var culture = translation.Culture;

            updated |= Fill(() => translation.Eyebrow, v => translation.Eyebrow = v, banner.LocAny("eyebrow"), culture);
            updated |= Fill(() => translation.BannerTitle, v => translation.BannerTitle = v, banner.LocAny("title"), culture);
            updated |= Fill(() => translation.BannerDescription, v => translation.BannerDescription = v, banner.LocAny("description"), culture);
            updated |= Fill(() => translation.CtaEyebrow, v => translation.CtaEyebrow = v, cta.LocAny("eyebrow"), culture);
            updated |= Fill(() => translation.CtaHeadline, v => translation.CtaHeadline = v, cta.LocAny("headline"), culture);
            updated |= Fill(() => translation.CtaSubcopy, v => translation.CtaSubcopy = v, cta.LocAny("subcopy"), culture);

            if (pageSlug == "privacy")
            {
                updated |= Fill(() => translation.Body, v => translation.Body = v, PrivacyBody(root, culture), culture);
                updated |= Fill(() => translation.LastReviewedLabel, v => translation.LastReviewedLabel = v, root.LocAny("updated"), culture);
            }
        }

        if (updated)
        {
            Count("頁面文案", 1);
        }
    }

    private static bool Fill(Func<string?> get, Action<string?> set, LocalizedText? value, string culture)
    {
        if (value is not { IsEmpty: false } text || !string.IsNullOrEmpty(get()))
        {
            return false;
        }

        set(text.For(culture));
        return true;
    }

    private static bool Fill(Func<string?> get, Action<string?> set, string? value, string culture)
    {
        _ = culture;
        if (string.IsNullOrEmpty(value) || !string.IsNullOrEmpty(get()))
        {
            return false;
        }

        set(value);
        return true;
    }

    /// <summary>隱私權頁是純長文，8 個條文串成一份帶錨點的 HTML（database.md §09）。</summary>
    private static string? PrivacyBody(JsonObject root, string culture)
    {
        var sections = root.Arr("sections");
        if (sections is null)
        {
            return null;
        }

        var html = sections.Select(s =>
        {
            var id = s.Str("id");
            var title = s.LocAny("title")?.For(culture);
            var body = s.LocAny("body")?.For(culture);
            var anchor = id is null ? string.Empty : $" id=\"{System.Net.WebUtility.HtmlEncode(id)}\"";

            return $"<section{anchor}><h2>{System.Net.WebUtility.HtmlEncode(title ?? string.Empty)}</h2>" +
                   $"<p>{System.Net.WebUtility.HtmlEncode(body ?? string.Empty)}</p></section>";
        });

        return string.Concat(html);
    }
}
