using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface ICatalogReadService
{
    Task<IReadOnlyList<CategoryListItemDto>> ListCategoriesAsync(string culture, string? type);
    Task<CategoryDetailDto?> GetCategoryAsync(string culture, string slug);
    Task<PagedResult<ProductListItemDto>> ListProductsAsync(
        string culture, string? categorySlug, string? solutionSlug, bool? featured, int page, int pageSize);
    Task<ProductDetailDto?> GetProductAsync(string culture, string slug);
}

/// <summary>產品目錄（database.md §02）。純讀取——任何寫入一律走 EF Core。</summary>
public sealed class CatalogReadService(IDbConnection db) : ICatalogReadService
{
    private const string CategorySelect = """
        SELECT e.Slug, e.Type, e.AccentColorHex, e.IconName,
               COALESCE(t.Name, f.Name) AS Name,
               COALESCE(t.ShortName, f.ShortName) AS ShortName,
               COALESCE(t.MenuNote, f.MenuNote) AS MenuNote,
               COALESCE(t.Summary, f.Summary) AS Summary,
               CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
        FROM Categories e
        LEFT JOIN CategoryTranslations t ON t.CategoryId = e.Id AND t.Culture = @Culture
        LEFT JOIN CategoryTranslations f ON f.CategoryId = e.Id AND f.Culture = @DefaultCulture
        """;

    public Task<IReadOnlyList<CategoryListItemDto>> ListCategoriesAsync(string culture, string? type) =>
        ListCategoriesAsync(db, culture, ParseCategoryType(type));

    /// <summary>頁面的 <c>CategoryGrid</c> reference block 也要這一份（static 的理由同 SolutionReadService）。</summary>
    internal static async Task<IReadOnlyList<CategoryListItemDto>> ListCategoriesAsync(
        IDbConnection db, string culture, byte? typeValue)
    {
        var rows = await db.QueryAsync<CategoryRow>(
            $"""
             {CategorySelect}
             WHERE e.Status = @Published AND (@Type IS NULL OR e.Type = @Type)
             ORDER BY e.SortOrder
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, Type = typeValue });

        return rows.Select(ToListItem).ToList();
    }

    public async Task<CategoryDetailDto?> GetCategoryAsync(string culture, string slug)
    {
        // 詳情頁刻意用 INNER JOIN：該語系沒有翻譯就回 404，由前台 302 到預設語系。
        // 直接 fallback 會產生「zh-Hant 網址顯示英文內容」的重複內容，傷 SEO（§0.2）。
        var row = await db.QuerySingleOrDefaultAsync<CategoryDetailRow>(
            """
            SELECT e.Id, e.Slug, e.Type, e.AccentColorHex, e.IconName,
                   t.Name, t.Summary, t.Intro, t.Description,
                   t.SeoTitle, t.SeoDescription, t.SeoKeywords
            FROM Categories e
            INNER JOIN CategoryTranslations t ON t.CategoryId = e.Id AND t.Culture = @Culture
            WHERE e.Slug = @Slug AND e.Status = @Published
            """,
            new { culture, Slug = slug, Sql.Published });

        if (row is null)
        {
            return null;
        }

        var args = new { row.Id, culture, DefaultCulture = CultureCodes.Default, Sql.Published };

        var products = await db.QueryAsync<ProductRow>(
            $"""
             {ProductSelect}
             WHERE e.CategoryId = @Id AND e.Status = @Published AND e.ParentProductId IS NULL
             ORDER BY e.SortOrder
             """, args);

        var categoryProducts = products.ToList();
        var categoryProductSpecs = await ProductSpecsAsync(db, culture, categoryProducts.Select(p => p.Id).ToArray());

        var solutions = await db.QueryAsync<CategoryRow>(
            """
            SELECT s.Slug, s.IconName, s.IsNew,
                   COALESCE(t.Name, f.Name) AS Name,
                   COALESCE(t.MenuNote, f.MenuNote) AS MenuNote,
                   COALESCE(t.Summary, f.Summary) AS Summary,
                   CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
            FROM SolutionCategories sc
            INNER JOIN Solutions s ON s.Id = sc.SolutionId AND s.Status = @Published
            LEFT JOIN SolutionTranslations t ON t.SolutionId = s.Id AND t.Culture = @Culture
            LEFT JOIN SolutionTranslations f ON f.SolutionId = s.Id AND f.Culture = @DefaultCulture
            WHERE sc.CategoryId = @Id
            ORDER BY sc.SortOrder
            """, args);

        return new CategoryDetailDto
        {
            Slug = row.Slug,
            Type = ContentReaders.Camel(((CategoryType)row.Type).ToString()),
            AccentColorHex = row.AccentColorHex,
            IconName = row.IconName,
            Name = row.Name,
            Summary = row.Summary,
            Intro = row.Intro,
            Description = row.Description,
            Seo = new SeoDto(row.SeoTitle, row.SeoDescription, row.SeoKeywords),
            Specifications = await ContentReaders.SpecificationsAsync(db, "OwnerCategoryId", row.Id, culture),
            Blocks = await ContentReaders.BlocksAsync(db, "OwnerCategoryId", row.Id, culture),
            Products = categoryProducts.Select(p => ToProductListItem(p, row.Slug, categoryProductSpecs)).ToList(),
            Solutions = solutions.Select(s => new SolutionListItemDto
            {
                Slug = s.Slug,
                IconName = s.IconName,
                Name = s.Name,
                MenuNote = s.MenuNote,
                Summary = s.Summary,
                HasRequestedCulture = s.HasRequestedCulture,
            }).ToList(),
        };
    }

    private const string ProductSelect = """
        SELECT e.Id, e.Slug, e.Code, e.Brand, e.IsFeatured, e.IsNew,
               COALESCE(t.Name, f.Name) AS Name,
               COALESCE(t.Summary, f.Summary) AS Summary,
               CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
        FROM Products e
        LEFT JOIN ProductTranslations t ON t.ProductId = e.Id AND t.Culture = @Culture
        LEFT JOIN ProductTranslations f ON f.ProductId = e.Id AND f.Culture = @DefaultCulture
        """;

    public async Task<PagedResult<ProductListItemDto>> ListProductsAsync(
        string culture, string? categorySlug, string? solutionSlug, bool? featured, int page, int pageSize)
    {
        // 卡片層＝family（ParentProductId IS NULL）；細分型號掛在其下，不進列表（§02）。
        const string Filter = """
            WHERE e.Status = @Published
              AND e.ParentProductId IS NULL
              AND (@CategorySlug IS NULL OR c.Slug = @CategorySlug)
              AND (@Featured IS NULL OR e.IsFeatured = @Featured)
              AND (@SolutionSlug IS NULL OR EXISTS (
                    SELECT 1 FROM ProductSolutions ps
                    INNER JOIN Solutions s ON s.Id = ps.SolutionId
                    WHERE ps.ProductId = e.Id AND s.Slug = @SolutionSlug))
            """;

        var args = new
        {
            culture,
            DefaultCulture = CultureCodes.Default,
            Sql.Published,
            CategorySlug = categorySlug,
            SolutionSlug = solutionSlug,
            Featured = featured,
            Skip = (page - 1) * pageSize,
            Take = pageSize,
        };

        var total = await db.ExecuteScalarAsync<int>(
            $"""
             SELECT COUNT(*) FROM Products e
             INNER JOIN Categories c ON c.Id = e.CategoryId
             {Filter}
             """, args);

        var rows = await db.QueryAsync<ProductRow>(
            $"""
             SELECT e.Id, e.Slug, e.Code, e.Brand, e.IsFeatured, e.IsNew, c.Slug AS CategorySlug,
                    COALESCE(t.Name, f.Name) AS Name,
                    COALESCE(t.Summary, f.Summary) AS Summary,
                    CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
             FROM Products e
             INNER JOIN Categories c ON c.Id = e.CategoryId
             LEFT JOIN ProductTranslations t ON t.ProductId = e.Id AND t.Culture = @Culture
             LEFT JOIN ProductTranslations f ON f.ProductId = e.Id AND f.Culture = @DefaultCulture
             {Filter}
             ORDER BY e.SortOrder, e.Id
             OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY
             """, args);

        var productRows = rows.ToList();
        var specs = await ProductSpecsAsync(db, culture, productRows.Select(r => r.Id).ToArray());
        var items = productRows.Select(r => ToProductListItem(r, r.CategorySlug ?? string.Empty, specs)).ToList();

        return new PagedResult<ProductListItemDto>(
            items, total, page, pageSize, (int)Math.Ceiling(total / (double)pageSize));
    }

    public async Task<ProductDetailDto?> GetProductAsync(string culture, string slug)
    {
        var row = await db.QuerySingleOrDefaultAsync<ProductDetailRow>(
            """
            SELECT e.Id, e.Slug, e.Code, e.Brand, c.Slug AS CategorySlug,
                   t.Name, t.Summary, t.Description, t.ApplicationNote,
                   t.SeoTitle, t.SeoDescription, t.SeoKeywords
            FROM Products e
            INNER JOIN Categories c ON c.Id = e.CategoryId
            INNER JOIN ProductTranslations t ON t.ProductId = e.Id AND t.Culture = @Culture
            WHERE e.Slug = @Slug AND e.Status = @Published
            """,
            new { culture, Slug = slug, Sql.Published });

        return row is null ? null : new ProductDetailDto
        {
            Slug = row.Slug,
            CategorySlug = row.CategorySlug,
            Code = row.Code,
            Brand = row.Brand,
            Name = row.Name,
            Summary = row.Summary,
            Description = row.Description,
            ApplicationNote = row.ApplicationNote,
            Seo = new SeoDto(row.SeoTitle, row.SeoDescription, row.SeoKeywords),
            Specifications = await ContentReaders.SpecificationsAsync(db, "OwnerProductId", row.Id, culture),
        };
    }

    /// <summary>頁面與產品線頁的 <c>ProductGrid</c> reference block：只取前幾筆，不分頁。</summary>
    internal static async Task<IReadOnlyList<ProductListItemDto>> TopProductsAsync(
        IDbConnection db, string culture, string? categorySlug, bool? featured, int limit)
    {
        var rows = await db.QueryAsync<ProductRow>(
            $"""
             SELECT TOP (@Take) e.Id, e.Slug, e.Code, e.Brand, e.IsFeatured, e.IsNew, c.Slug AS CategorySlug,
                    COALESCE(t.Name, f.Name) AS Name,
                    COALESCE(t.Summary, f.Summary) AS Summary,
                    CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
             FROM Products e
             INNER JOIN Categories c ON c.Id = e.CategoryId
             LEFT JOIN ProductTranslations t ON t.ProductId = e.Id AND t.Culture = @Culture
             LEFT JOIN ProductTranslations f ON f.ProductId = e.Id AND f.Culture = @DefaultCulture
             WHERE e.Status = @Published
               AND e.ParentProductId IS NULL
               AND (@CategorySlug IS NULL OR c.Slug = @CategorySlug)
               AND (@Featured IS NULL OR e.IsFeatured = @Featured)
             ORDER BY e.SortOrder, e.Id
             """,
            new
            {
                culture,
                DefaultCulture = CultureCodes.Default,
                Sql.Published,
                CategorySlug = categorySlug,
                Featured = featured,
                Take = limit,
            });

        var productRows = rows.ToList();
        var specs = await ProductSpecsAsync(db, culture, productRows.Select(r => r.Id).ToArray());

        return productRows.Select(r => ToProductListItem(r, r.CategorySlug ?? string.Empty, specs)).ToList();
    }

    private static byte? ParseCategoryType(string? type) => type switch
    {
        null or "" => null,
        "optical-film" => (byte)CategoryType.OpticalFilm,
        "textile-foam" => (byte)CategoryType.TextileFoam,
        "acoustic" => (byte)CategoryType.Acoustic,
        _ => throw AppException.BadRequest(ErrorCodes.ValidationFormat,
            "type 只能是 optical-film、textile-foam 或 acoustic。"),
    };

    private static CategoryListItemDto ToListItem(CategoryRow r) => new()
    {
        Slug = r.Slug,
        Type = r.Type is { } t ? ContentReaders.Camel(((CategoryType)t).ToString()) : string.Empty,
        AccentColorHex = r.AccentColorHex,
        IconName = r.IconName,
        Name = r.Name,
        ShortName = r.ShortName,
        MenuNote = r.MenuNote,
        Summary = r.Summary,
        HasRequestedCulture = r.HasRequestedCulture,
    };

    private static ProductListItemDto ToProductListItem(
        ProductRow r, string categorySlug, ILookup<int, SpecificationRowDto>? specs = null) => new()
    {
        Slug = r.Slug,
        CategorySlug = r.CategorySlug ?? categorySlug,
        Code = r.Code,
        Brand = r.Brand,
        IsFeatured = r.IsFeatured,
        IsNew = r.IsNew,
        Name = r.Name,
        Summary = r.Summary,
        Specifications = specs?[r.Id].ToList() ?? [],
        HasRequestedCulture = r.HasRequestedCulture,
    };

    /// <summary>
    /// 列表也要帶規格列：系列卡的 chip 是 <c>IsHighlighted</c> 的那幾列，
    /// Acoustic 產業頁的等級比較表則是同一批產品的具名規格（database.md §02）。
    /// 一次撈完整頁再分組，不讓每張卡各打一次 DB。
    /// </summary>
    private static async Task<ILookup<int, SpecificationRowDto>> ProductSpecsAsync(
        IDbConnection db, string culture, int[] productIds)
    {
        if (productIds.Length == 0)
        {
            return Array.Empty<(int, SpecificationRowDto)>().ToLookup(x => x.Item1, x => x.Item2);
        }

        var rows = await db.QueryAsync<ProductSpecRow>(
            $"""
             SELECT e.OwnerProductId, e.IsHighlighted,
                    {Sql.Coalesce("Label")}, {Sql.Coalesce("Value")}, {Sql.Coalesce("Note")}
             FROM SpecificationRows e
             {Sql.TranslationJoin("SpecificationRowTranslations", "SpecificationRowId")}
             WHERE e.OwnerProductId IN @Ids AND e.Status = @Published
             ORDER BY e.OwnerProductId, e.IsHighlighted DESC, e.SortOrder
             """,
            new { Ids = productIds, culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        return rows.ToLookup(
            r => r.OwnerProductId,
            r => new SpecificationRowDto(r.Label, r.Value, r.Note, r.IsHighlighted));
    }

    private sealed record ProductSpecRow(
        int OwnerProductId, bool IsHighlighted, string? Label, string Value, string? Note);

    // 這兩個型別被多個查詢共用，各自的 SELECT 欄位不完全相同，因此用可設定的屬性而非
    // 位置式 record：位置式要求欄位與建構子逐一對齊，少一欄 Dapper 就擲例外；
    // 而 init-only 屬性 Dapper 也寫不進去（IL 層帶 IsExternalInit modreq）。
    private sealed class CategoryRow
    {
        public string Slug { get; set; } = string.Empty;
        public byte? Type { get; set; }
        public string? AccentColorHex { get; set; }
        public string? IconName { get; set; }
        public bool IsNew { get; set; }
        public string? Name { get; set; }
        public string? ShortName { get; set; }
        public string? MenuNote { get; set; }
        public string? Summary { get; set; }
        public bool HasRequestedCulture { get; set; }
    }

    private sealed record CategoryDetailRow(
        int Id, string Slug, byte Type, string? AccentColorHex, string? IconName,
        string? Name, string? Summary, string? Intro, string? Description,
        string? SeoTitle, string? SeoDescription, string? SeoKeywords);

    private sealed class ProductRow
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Brand { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsNew { get; set; }
        public string? CategorySlug { get; set; }
        public string? Name { get; set; }
        public string? Summary { get; set; }
        public bool HasRequestedCulture { get; set; }
    }

    private sealed record ProductDetailRow(
        int Id, string Slug, string? Code, string? Brand, string CategorySlug,
        string? Name, string? Summary, string? Description, string? ApplicationNote,
        string? SeoTitle, string? SeoDescription, string? SeoKeywords);
}
