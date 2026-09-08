using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface IArticleReadService
{
    Task<PagedResult<ArticleListItemDto>> ListAsync(
        string culture, string? type, string? tag, string? categorySlug, string? solutionSlug, int page, int pageSize);

    Task<ArticleDetailDto?> GetAsync(string culture, string slug);
}

/// <summary>
/// News / Insights / Technical articles（database.md §05）。三者同一張表，
/// <c>Type</c> 決定網址前綴，因此列表回傳的 <c>Path</c> 一律由 <see cref="PublicPaths.Article"/> 組。
/// <para>
/// 可見性除了 <c>Status</c> 還看 <c>PublishedAt</c>——這是全庫僅有的兩張這樣的表之一（§0.1），
/// 排程發佈的文章在時間到之前不得外流。
/// </para>
/// </summary>
public sealed class ArticleReadService(IDbConnection db) : IArticleReadService
{
    /// <summary>已發佈且已到發佈時間。所有查詢共用，避免某一支忘了加就漏出排程稿。</summary>
    private const string Visible = "e.Status = @Published AND e.PublishedAt IS NOT NULL AND e.PublishedAt <= SYSUTCDATETIME()";

    public Task<PagedResult<ArticleListItemDto>> ListAsync(
        string culture, string? type, string? tag, string? categorySlug, string? solutionSlug, int page, int pageSize) =>
        ListAsync(db, culture, type, tag, categorySlug, solutionSlug, page, pageSize);

    /// <summary>頁面的 <c>ArticleList</c> reference block 也要這一份（static 的理由同 SolutionReadService）。</summary>
    internal static async Task<IReadOnlyList<ArticleListItemDto>> TopAsync(
        IDbConnection db, string culture, string? type, int limit) =>
        (await ListAsync(db, culture, type, null, null, null, 1, limit)).Items.ToList();

    internal static async Task<PagedResult<ArticleListItemDto>> ListAsync(
        IDbConnection db, string culture, string? type, string? tag, string? categorySlug, string? solutionSlug,
        int page, int pageSize)
    {
        var types = ParseTypes(type);

        var filters = new List<string> { Visible };

        if (types is not null)
        {
            filters.Add("e.Type IN @Types");
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            filters.Add("""
                EXISTS (SELECT 1 FROM ArticleTagLinks l
                        INNER JOIN ArticleTags g ON g.Id = l.ArticleTagId
                        WHERE l.ArticleId = e.Id AND g.Slug = @Tag)
                """);
        }

        if (!string.IsNullOrWhiteSpace(categorySlug))
        {
            filters.Add("""
                EXISTS (SELECT 1 FROM ArticleCategories ac
                        INNER JOIN Categories c ON c.Id = ac.CategoryId
                        WHERE ac.ArticleId = e.Id AND c.Slug = @CategorySlug)
                """);
        }

        if (!string.IsNullOrWhiteSpace(solutionSlug))
        {
            filters.Add("""
                EXISTS (SELECT 1 FROM ArticleSolutions asol
                        INNER JOIN Solutions s ON s.Id = asol.SolutionId
                        WHERE asol.ArticleId = e.Id AND s.Slug = @SolutionSlug)
                """);
        }

        var where = "WHERE " + string.Join("\n  AND ", filters);

        var args = new
        {
            culture,
            DefaultCulture = CultureCodes.Default,
            Sql.Published,
            Types = types,
            Tag = tag,
            CategorySlug = categorySlug,
            SolutionSlug = solutionSlug,
            Skip = (page - 1) * pageSize,
            Take = pageSize,
        };

        var total = await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM Articles e {where}", args);

        var rows = (await db.QueryAsync<ArticleRow>(
            $"""
             SELECT e.Id, e.Slug, e.Type, e.PublishedAt, e.ReadingMinutes, e.IsFeatured,
                    CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS HeroImageUrl,
                    {Sql.Coalesce("Title")}, {Sql.Coalesce("Excerpt")}, {Sql.HasCulture},
                    au.Slug AS AuthorSlug, au.Initials AS AuthorInitials,
                    COALESCE(aut.Name, auf.Name) AS AuthorName,
                    COALESCE(aut.JobTitle, auf.JobTitle) AS AuthorJobTitle,
                    CASE WHEN am.IsPrivate = 1 THEN NULL ELSE am.Url END AS AuthorAvatarUrl
             FROM Articles e
             LEFT JOIN MediaAssets m ON m.Id = e.HeroMediaAssetId AND m.IsArchived = 0
             LEFT JOIN Authors au ON au.Id = e.AuthorId AND au.Status = @Published
             LEFT JOIN AuthorTranslations aut ON aut.AuthorId = au.Id AND aut.Culture = @Culture
             LEFT JOIN AuthorTranslations auf ON auf.AuthorId = au.Id AND auf.Culture = @DefaultCulture
             LEFT JOIN MediaAssets am ON am.Id = au.MediaAssetId AND am.IsArchived = 0
             {Sql.TranslationJoin("ArticleTranslations", "ArticleId")}
             {where}
             ORDER BY e.PublishedAt DESC, e.Id DESC
             OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY
             """, args)).ToList();

        var ids = rows.Select(r => r.Id).ToArray();
        var categories = await ChipsAsync(db, ids, culture, ChipSource.Category);
        var solutions = await ChipsAsync(db, ids, culture, ChipSource.Solution);
        var tags = await ChipsAsync(db, ids, culture, ChipSource.Tag);

        var items = rows.Select(r => new ArticleListItemDto
        {
            Slug = r.Slug,
            Type = ContentReaders.Camel(((ArticleType)r.Type).ToString()),
            Path = PublicPaths.Article((ArticleType)r.Type, r.Slug),
            PublishedAt = r.PublishedAt,
            ReadingMinutes = r.ReadingMinutes,
            IsFeatured = r.IsFeatured,
            HeroImageUrl = r.HeroImageUrl,
            Title = r.Title,
            Excerpt = r.Excerpt,
            Author = ToAuthor(r),
            Categories = categories[r.Id].ToList(),
            Solutions = solutions[r.Id].ToList(),
            Tags = tags[r.Id].ToList(),
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();

        return new PagedResult<ArticleListItemDto>(
            items, total, page, pageSize, (int)Math.Ceiling(total / (double)pageSize));
    }

    public async Task<ArticleDetailDto?> GetAsync(string culture, string slug)
    {
        // 詳情走 INNER JOIN：缺該語系直接 404，不回退預設語系（§0.2）。
        var row = await db.QuerySingleOrDefaultAsync<ArticleDetailRow>(
            $"""
             SELECT e.Id, e.Slug, e.Type, e.PublishedAt, e.UpdatedAt, e.ReadingMinutes, e.ExhibitionId,
                    CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS HeroImageUrl,
                    t.Title, t.Excerpt, t.Lead, t.Body, t.PullQuote, t.PullQuoteAttribution,
                    t.SeoTitle, t.SeoDescription, t.SeoKeywords,
                    au.Slug AS AuthorSlug, au.Initials AS AuthorInitials,
                    COALESCE(aut.Name, auf.Name) AS AuthorName,
                    COALESCE(aut.JobTitle, auf.JobTitle) AS AuthorJobTitle,
                    CASE WHEN am.IsPrivate = 1 THEN NULL ELSE am.Url END AS AuthorAvatarUrl
             FROM Articles e
             INNER JOIN ArticleTranslations t ON t.ArticleId = e.Id AND t.Culture = @Culture
             LEFT JOIN MediaAssets m ON m.Id = e.HeroMediaAssetId AND m.IsArchived = 0
             LEFT JOIN Authors au ON au.Id = e.AuthorId AND au.Status = @Published
             LEFT JOIN AuthorTranslations aut ON aut.AuthorId = au.Id AND aut.Culture = @Culture
             LEFT JOIN AuthorTranslations auf ON auf.AuthorId = au.Id AND auf.Culture = @DefaultCulture
             LEFT JOIN MediaAssets am ON am.Id = au.MediaAssetId AND am.IsArchived = 0
             WHERE e.Slug = @Slug AND {Visible}
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, Slug = slug });

        if (row is null)
        {
            return null;
        }

        int[] ids = [row.Id];
        var type = (ArticleType)row.Type;

        var (previous, next) = await NeighboursAsync(row, culture);

        return new ArticleDetailDto
        {
            Slug = row.Slug,
            Type = ContentReaders.Camel(type.ToString()),
            Path = PublicPaths.Article(type, row.Slug),
            PublishedAt = row.PublishedAt,
            UpdatedAt = row.UpdatedAt,
            ReadingMinutes = row.ReadingMinutes,
            HeroImageUrl = row.HeroImageUrl,
            Title = row.Title,
            Excerpt = row.Excerpt,
            Lead = row.Lead,
            Body = row.Body,
            PullQuote = row.PullQuote,
            PullQuoteAttribution = row.PullQuoteAttribution,
            Author = ToAuthor(row),
            Seo = new SeoDto(row.SeoTitle, row.SeoDescription, row.SeoKeywords),
            Categories = (await ChipsAsync(db, ids, culture, ChipSource.Category))[row.Id].ToList(),
            Solutions = (await ChipsAsync(db, ids, culture, ChipSource.Solution))[row.Id].ToList(),
            Tags = (await ChipsAsync(db, ids, culture, ChipSource.Tag))[row.Id].ToList(),
            Exhibition = row.ExhibitionId is { } exhibitionId
                ? await ExhibitionReadService.GetByIdAsync(db, exhibitionId, culture)
                : null,
            Previous = previous,
            Next = next,
        };
    }

    /// <summary>
    /// 同一個網址前綴內、依發佈時間相鄰的前後篇。
    /// 在後端算是因為前台只有一篇文章的資料，要自己算就得把整個列表拉回去。
    /// </summary>
    private async Task<(ArticleLinkDto? Previous, ArticleLinkDto? Next)> NeighboursAsync(
        ArticleDetailRow row, string culture)
    {
        var siblingTypes = SameUrlPrefixTypes((ArticleType)row.Type);

        var rows = await db.QueryAsync<NeighbourRow>(
            $"""
             -- 兩個分支各自要 ORDER BY，因此各自包成衍生表；
             -- T-SQL 的 UNION ALL 只允許最後一段有 ORDER BY。
             SELECT * FROM (
                 SELECT TOP 1 e.Slug, e.Type, {Sql.Coalesce("Title")}, 'previous' AS Direction
                 FROM Articles e
                 {Sql.TranslationJoin("ArticleTranslations", "ArticleId")}
                 WHERE {Visible} AND e.Type IN @Types AND e.PublishedAt < @PublishedAt
                 ORDER BY e.PublishedAt DESC
             ) prev
             UNION ALL
             SELECT * FROM (
                 SELECT TOP 1 e.Slug, e.Type, {Sql.Coalesce("Title")}, 'next' AS Direction
                 FROM Articles e
                 {Sql.TranslationJoin("ArticleTranslations", "ArticleId")}
                 WHERE {Visible} AND e.Type IN @Types AND e.PublishedAt > @PublishedAt
                 ORDER BY e.PublishedAt
             ) nxt
             """,
            new
            {
                culture,
                DefaultCulture = CultureCodes.Default,
                Sql.Published,
                Types = siblingTypes,
                row.PublishedAt,
            });

        ArticleLinkDto? Link(string direction) => rows
            .Where(r => r.Direction == direction)
            .Select(r => new ArticleLinkDto(r.Slug, PublicPaths.Article((ArticleType)r.Type, r.Slug), r.Title))
            .FirstOrDefault();

        return (Link("previous"), Link("next"));
    }

    private enum ChipSource
    {
        Category,
        Solution,
        Tag,
    }

    /// <summary>
    /// 文章卡的 chip。三種來源形狀一致，因此共用一支——列表頁一次撈完整頁的 chip 再分組，
    /// 不讓每張卡各打一次 DB。
    /// </summary>
    private static async Task<ILookup<int, ChipDto>> ChipsAsync(
        IDbConnection db, int[] articleIds, string culture, ChipSource source)
    {
        if (articleIds.Length == 0)
        {
            return Array.Empty<(int, ChipDto)>().ToLookup(x => x.Item1, x => x.Item2);
        }

        var sql = source switch
        {
            ChipSource.Category => $"""
                SELECT x.ArticleId, c.Slug, {Sql.Coalesce("Name")}
                FROM ArticleCategories x
                INNER JOIN Categories c ON c.Id = x.CategoryId AND c.Status = @Published
                LEFT JOIN CategoryTranslations t ON t.CategoryId = c.Id AND t.Culture = @Culture
                LEFT JOIN CategoryTranslations f ON f.CategoryId = c.Id AND f.Culture = @DefaultCulture
                WHERE x.ArticleId IN @Ids
                """,
            ChipSource.Solution => $"""
                SELECT x.ArticleId, s.Slug, {Sql.Coalesce("Name")}
                FROM ArticleSolutions x
                INNER JOIN Solutions s ON s.Id = x.SolutionId AND s.Status = @Published
                LEFT JOIN SolutionTranslations t ON t.SolutionId = s.Id AND t.Culture = @Culture
                LEFT JOIN SolutionTranslations f ON f.SolutionId = s.Id AND f.Culture = @DefaultCulture
                WHERE x.ArticleId IN @Ids
                """,
            _ => $"""
                SELECT x.ArticleId, g.Slug, {Sql.Coalesce("Name")}
                FROM ArticleTagLinks x
                INNER JOIN ArticleTags g ON g.Id = x.ArticleTagId AND g.Status = @Published
                LEFT JOIN ArticleTagTranslations t ON t.ArticleTagId = g.Id AND t.Culture = @Culture
                LEFT JOIN ArticleTagTranslations f ON f.ArticleTagId = g.Id AND f.Culture = @DefaultCulture
                WHERE x.ArticleId IN @Ids
                """,
        };

        var rows = await db.QueryAsync<ChipRow>(
            sql, new { Ids = articleIds, culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        // chip 的路徑：產品線與產業有自己的頁面，自由標籤只是列表的篩選條件。
        return rows.ToLookup(r => r.ArticleId, r => new ChipDto(r.Slug, r.Name, source switch
        {
            ChipSource.Category => PublicPaths.Category(r.Slug),
            ChipSource.Solution => PublicPaths.Solution(r.Slug),
            _ => $"/news?tag={r.Slug}",
        }));
    }

    private static AuthorDto? ToAuthor(IAuthorColumns row) =>
        row.AuthorSlug is null
            ? null
            : new AuthorDto(row.AuthorSlug, row.AuthorName, row.AuthorJobTitle, row.AuthorInitials, row.AuthorAvatarUrl);

    /// <summary>
    /// <c>?type=</c> 同時接受網址前綴（<c>news</c> / <c>insight</c> / <c>technicalArticle</c>）
    /// 與 enum 名稱（<c>companyNews</c>…）。前者是前台三個列表頁真正要的分組——
    /// <c>/news</c> 一頁要顯示公司新聞、產品新聞、展會與認證新聞四種 Type。
    /// </summary>
    // 用 int[] 而非 byte[]：Dapper 把 byte[] 當成 varbinary 參數，
    // 不會展開成 IN (@Types1, @Types2)，SQL 會直接語法錯誤。
    private static int[]? ParseTypes(string? type) => type switch
    {
        null or "" => null,
        "news" => NewsTypes,
        "insight" or "insights" => [(int)ArticleType.Insight],
        "technicalArticle" or "technical-article" or "blog" => [(int)ArticleType.TechnicalArticle],
        _ when Enum.TryParse<ArticleType>(type, ignoreCase: true, out var parsed) => [(int)parsed],
        _ => throw AppException.BadRequest(ErrorCodes.ValidationFormat,
            "type 只能是 news、insight、technicalArticle 或單一 ArticleType 名稱。"),
    };

    private static readonly int[] NewsTypes =
    [
        (int)ArticleType.CompanyNews,
        (int)ArticleType.ProductNews,
        (int)ArticleType.Exhibition,
        (int)ArticleType.CertificationNews,
    ];

    private static int[] SameUrlPrefixTypes(ArticleType type) => type switch
    {
        ArticleType.Insight => [(int)ArticleType.Insight],
        ArticleType.TechnicalArticle => [(int)ArticleType.TechnicalArticle],
        _ => NewsTypes,
    };

    /// <summary>列表列與詳情列都帶作者的四欄，<see cref="ToAuthor"/> 因此共用一份對映。</summary>
    private interface IAuthorColumns
    {
        string? AuthorSlug { get; }
        string? AuthorName { get; }
        string? AuthorJobTitle { get; }
        string? AuthorInitials { get; }
        string? AuthorAvatarUrl { get; }
    }

    private sealed class ArticleRow : IAuthorColumns
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public byte Type { get; set; }
        public DateTime? PublishedAt { get; set; }
        public byte? ReadingMinutes { get; set; }
        public bool IsFeatured { get; set; }
        public string? HeroImageUrl { get; set; }
        public string? Title { get; set; }
        public string? Excerpt { get; set; }
        public bool HasRequestedCulture { get; set; }
        public string? AuthorSlug { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorJobTitle { get; set; }
        public string? AuthorInitials { get; set; }
        public string? AuthorAvatarUrl { get; set; }
    }

    private sealed class ArticleDetailRow : IAuthorColumns
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public byte Type { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public byte? ReadingMinutes { get; set; }
        public int? ExhibitionId { get; set; }
        public string? HeroImageUrl { get; set; }
        public string? Title { get; set; }
        public string? Excerpt { get; set; }
        public string? Lead { get; set; }
        public string? Body { get; set; }
        public string? PullQuote { get; set; }
        public string? PullQuoteAttribution { get; set; }
        public string? SeoTitle { get; set; }
        public string? SeoDescription { get; set; }
        public string? SeoKeywords { get; set; }
        public string? AuthorSlug { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorJobTitle { get; set; }
        public string? AuthorInitials { get; set; }
        public string? AuthorAvatarUrl { get; set; }
    }

    private sealed record NeighbourRow(string Slug, byte Type, string? Title, string Direction);

    private sealed record ChipRow(int ArticleId, string Slug, string? Name);
}
