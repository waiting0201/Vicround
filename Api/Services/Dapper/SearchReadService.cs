using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface ISearchReadService
{
    Task<SearchResponseDto> SearchAsync(string culture, string? query, int limit);
}

/// <summary>
/// 站內搜尋（database.md §19.5 的 Phase 1：SQL <c>LIKE</c> 掃翻譯表的標題與摘要）。
///
/// <para>
/// <b>為什麼不是 FULLTEXT / Azure AI Search</b>：兩者都是新的基礎設施（前者要在 Azure SQL 上
/// 建全文檢索目錄並維護斷詞，後者是另一個要付費、要同步索引的服務），而這個站的可搜內容
/// 是百來筆標題。<c>LIKE '%…%'</c> 在這個量級下毫無壓力，換掉它的時機是內容量級變了，
/// 不是現在。真要換，換掉這個類別即可——端點的形狀不會變。
/// </para>
///
/// <para>
/// <b>路徑一律由 <see cref="PublicPaths"/> 組</b>，不在 SQL 裡拼字串：搜尋結果和導覽、FAQ
/// 延伸連結用的是同一套規則，某天改了文章前綴不該只改到其中一處。
/// </para>
/// </summary>
public sealed class SearchReadService(IDbConnection db) : ISearchReadService
{
    private const int MaxLimit = 50;
    private const int DefaultLimit = 20;

    /// <summary>摘要在結果卡上只有兩行，超過就截斷——FAQ 的答案整篇塞進來沒有意義。</summary>
    private const int SummaryLength = 200;

    /// <summary>
    /// UNION ALL 的每一段都要湊齊同一組欄位，缺的那幾欄補 NULL。
    /// <b>必須明寫型別</b>：SQL Server 把裸 <c>NULL</c> 當 int，和別段的 nvarchar 併起來會直接報錯。
    /// </summary>
    private const string NullText = "CAST(NULL AS nvarchar(200))";

    private const string NoExtras =
        $"{NullText} AS ParentSlug, CAST(0 AS tinyint) AS TypeCode, {NullText} AS PathPrefix";

    public async Task<SearchResponseDto> SearchAsync(string culture, string? query, int limit)
    {
        var term = (query ?? string.Empty).Trim();

        // 一個字的查詢會撈回半個資料庫，兩個字才開始有鑑別度。
        // 中文的兩個字已經是一個詞（「膜」vs「光學」），所以門檻對兩種語系都適用。
        if (term.Length < 2)
        {
            return new SearchResponseDto(term, 0, false, []);
        }

        var take = Math.Clamp(limit <= 0 ? DefaultLimit : limit, 1, MaxLimit);
        var escaped = Escape(term);

        var rows = (await db.QueryAsync<SearchRow>(
            BuildSql(take + 1),
            new
            {
                culture,
                DefaultCulture = CultureCodes.Default,
                Common.Sql.Published,
                Contains = $"%{escaped}%",
                Prefix = $"{escaped}%",
            })).ToList();

        // 多撈一筆只為了知道「還有更多」，不回給前台。
        var hasMore = rows.Count > take;

        var results = rows
            .Take(take)
            .Select(row => new SearchResultDto(
                row.Kind,
                row.Title ?? string.Empty,
                Shorten(row.Summary),
                Path(row),
                row.HasRequestedCulture))
            .ToList();

        return new SearchResponseDto(term, results.Count, hasMore, results);
    }

    /// <summary>
    /// 六個來源 UNION ALL。<c>Weight</c> 是<b>類型</b>的先後（產品先於文章），
    /// <c>MatchRank</c> 是<b>命中位置</b>的先後（標題開頭 &gt; 標題內 &gt; 摘要內）；
    /// 排序時命中位置優先，因為使用者打的字通常就是他要的東西的名字。
    /// </summary>
    private static string BuildSql(int take) => $"""
        WITH hits AS (
            {Segment(
                kind: "product", table: "Products", translations: "ProductTranslations", fk: "ProductId",
                title: "Name", summary: "Summary", weight: 0,
                extraSelect: $"c.Slug AS ParentSlug, CAST(0 AS tinyint) AS TypeCode, {NullText} AS PathPrefix",
                extraJoin: "INNER JOIN Categories c ON c.Id = e.CategoryId AND c.Status = @Published")}
            UNION ALL
            {Segment(
                kind: "category", table: "Categories", translations: "CategoryTranslations", fk: "CategoryId",
                title: "Name", summary: "Summary", weight: 1)}
            UNION ALL
            {Segment(
                kind: "solution", table: "Solutions", translations: "SolutionTranslations", fk: "SolutionId",
                title: "Name", summary: "Summary", weight: 2)}
            UNION ALL
            {Segment(
                kind: "page", table: "Pages", translations: "PageTranslations", fk: "PageId",
                title: "Title", summary: "Subtitle", weight: 3,
                extraSelect: $"{NullText} AS ParentSlug, CAST(0 AS tinyint) AS TypeCode, e.PathPrefix")}
            UNION ALL
            {Segment(
                kind: "article", table: "Articles", translations: "ArticleTranslations", fk: "ArticleId",
                title: "Title", summary: "Excerpt", weight: 4,
                extraSelect: $"{NullText} AS ParentSlug, e.Type AS TypeCode, {NullText} AS PathPrefix",
                // 排程稿在時間到之前不得外流（ArticleReadService 的 Visible 同一條）。
                extraWhere: "AND e.PublishedAt IS NOT NULL AND e.PublishedAt <= SYSUTCDATETIME()")}
            UNION ALL
            {Segment(
                kind: "download", table: "Downloads", translations: "DownloadTranslations", fk: "DownloadId",
                title: "Title", summary: "Description", weight: 5)}
            UNION ALL
            {Segment(
                kind: "faq", table: "FaqItems", translations: "FaqItemTranslations", fk: "FaqItemId",
                title: "Question", summary: "Answer", weight: 6)}
        )
        SELECT TOP ({take}) Kind, Slug, ParentSlug, TypeCode, PathPrefix, Title, Summary, HasRequestedCulture
        FROM hits
        WHERE Title IS NOT NULL
        ORDER BY MatchRank, Weight, Title
        """;

    private static string Segment(
        string kind,
        string table,
        string translations,
        string fk,
        string title,
        string summary,
        int weight,
        string extraSelect = NoExtras,
        string extraJoin = "",
        string extraWhere = "")
    {
        // 命中判斷與輸出都看 fallback 後的文字：缺 zh-Hant 翻譯時，
        // 頁面顯示的是英文，搜尋自然也該搜得到那段英文（database.md §0.2）。
        var titleExpr = $"COALESCE(t.{title}, f.{title})";
        var summaryExpr = $"COALESCE(t.{summary}, f.{summary})";

        return $"""
            SELECT '{kind}' AS Kind, e.Slug, {extraSelect},
                   {titleExpr} AS Title,
                   {summaryExpr} AS Summary,
                   {Common.Sql.HasCulture},
                   {weight} AS Weight,
                   CASE WHEN {titleExpr} LIKE @Prefix ESCAPE '\' THEN 0
                        WHEN {titleExpr} LIKE @Contains ESCAPE '\' THEN 1
                        ELSE 2 END AS MatchRank
            FROM {table} e
            {extraJoin}
            LEFT JOIN {translations} t ON t.{fk} = e.Id AND t.Culture = @Culture
            LEFT JOIN {translations} f ON f.{fk} = e.Id AND f.Culture = @DefaultCulture
            WHERE e.Status = @Published {extraWhere}
              AND ({titleExpr} LIKE @Contains ESCAPE '\' OR {summaryExpr} LIKE @Contains ESCAPE '\')
            """;
    }

    private static string Path(SearchRow row) => row.Kind switch
    {
        "product" => PublicPaths.Product(row.ParentSlug ?? string.Empty, row.Slug),
        "category" => PublicPaths.Category(row.Slug),
        "solution" => PublicPaths.Solution(row.Slug),
        "page" => PublicPaths.Page(row.Slug, row.PathPrefix),
        "article" => PublicPaths.Article((ArticleType)row.TypeCode, row.Slug),
        "download" => PublicPaths.Download(row.Slug),
        _ => PublicPaths.FaqItem(row.Slug),
    };

    /// <summary>
    /// <c>LIKE</c> 的萬用字元跳脫。少了這一步，使用者打一個 <c>%</c> 就等於全表掃描，
    /// <c>[</c> 更會讓查詢語意整個歪掉。
    /// </summary>
    private static string Escape(string term) => term
        .Replace("\\", "\\\\", StringComparison.Ordinal)
        .Replace("%", "\\%", StringComparison.Ordinal)
        .Replace("_", "\\_", StringComparison.Ordinal)
        .Replace("[", "\\[", StringComparison.Ordinal);

    private static string? Shorten(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var text = value.Trim();
        return text.Length <= SummaryLength ? text : text[..SummaryLength].TrimEnd() + "…";
    }

    private sealed class SearchRow
    {
        public string Kind { get; init; } = string.Empty;
        public string Slug { get; init; } = string.Empty;
        public string? ParentSlug { get; init; }
        public byte TypeCode { get; init; }
        public string? PathPrefix { get; init; }
        public string? Title { get; init; }
        public string? Summary { get; init; }
        public bool HasRequestedCulture { get; init; }
    }
}
