using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface ICertificationReadService
{
    Task<IReadOnlyList<CertificationDto>> ListAsync(string culture, string? category);
}

/// <summary>
/// 認證與法規符合（database.md §07）。Technologies 的 Product Compliance 表<b>不另建表</b>，
/// 它就是 <c>Category = ProductCompliance</c> 的那幾列——否則 RoHS/REACH 會在兩處各存一份、
/// 內容不同步。
/// </summary>
public sealed class CertificationReadService(IDbConnection db) : ICertificationReadService
{
    public Task<IReadOnlyList<CertificationDto>> ListAsync(string culture, string? category) =>
        ListAsync(db, culture, ParseCategory(category));

    /// <summary>
    /// <see cref="TechnologyReadService"/> 也要這一份（合規表），因此開成 static，
    /// 讓兩個端點共用同一組可見性規則。
    /// </summary>
    internal static async Task<IReadOnlyList<CertificationDto>> ListAsync(
        IDbConnection db, string culture, byte? category)
    {
        var today = DateTime.UtcNow.Date;

        var rows = (await db.QueryAsync<CertificationRow>(
            """
            SELECT e.Id, e.Slug, e.Category, e.CertificateNumber, e.IssuedOn, e.ValidUntil,
                   e.IsPlaceholder, e.DownloadId,
                   CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS LogoUrl,
                   COALESCE(t.Title, f.Title) AS Title,
                   COALESCE(t.ShortNote, f.ShortNote) AS ShortNote,
                   COALESCE(t.Summary, f.Summary) AS Summary,
                   COALESCE(t.IssuerName, f.IssuerName) AS IssuerName,
                   COALESCE(t.ValidityText, f.ValidityText) AS ValidityText,
                   COALESCE(t.ScopeText, f.ScopeText) AS ScopeText,
                   COALESCE(t.SitesText, f.SitesText) AS SitesText,
                   COALESCE(t.DocumentationLabel, f.DocumentationLabel) AS DocumentationLabel,
                   CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
            FROM Certifications e
            LEFT JOIN MediaAssets m ON m.Id = e.LogoMediaAssetId AND m.IsArchived = 0
            LEFT JOIN CertificationTranslations t ON t.CertificationId = e.Id AND t.Culture = @Culture
            LEFT JOIN CertificationTranslations f ON f.CertificationId = e.Id AND f.Culture = @DefaultCulture
            WHERE e.Status = @Published
              AND (@Category IS NULL OR e.Category = @Category)
              AND (e.ValidUntil IS NULL OR e.ValidUntil >= @Today)
            ORDER BY e.Category, e.SortOrder, e.Id
            """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, Category = category, Today = today }))
            .ToList();

        if (rows.Count == 0)
        {
            return [];
        }

        var ids = rows.Select(r => r.Id).ToArray();

        var chips = (await db.QueryAsync<CertificationChipRow>(
            """
            SELECT x.CertificationId, c.Slug, COALESCE(t.Name, f.Name) AS Name
            FROM CertificationCategories x
            INNER JOIN Categories c ON c.Id = x.CategoryId AND c.Status = @Published
            LEFT JOIN CategoryTranslations t ON t.CategoryId = c.Id AND t.Culture = @Culture
            LEFT JOIN CategoryTranslations f ON f.CategoryId = c.Id AND f.Culture = @DefaultCulture
            WHERE x.CertificationId IN @Ids
            ORDER BY c.SortOrder
            """,
            new { Ids = ids, culture, DefaultCulture = CultureCodes.Default, Sql.Published }))
            .ToLookup(r => r.CertificationId, r => new ChipDto(r.Slug, r.Name, PublicPaths.Category(r.Slug)));

        var documentIds = rows.Where(r => r.DownloadId is not null).Select(r => r.DownloadId!.Value).ToArray();
        var documents = new Dictionary<int, DownloadDto>();

        if (documentIds.Length > 0)
        {
            var documentRows = await db.QueryAsync<DownloadReaders.DownloadRow>(
                $"{DownloadReaders.Select} WHERE {DownloadReaders.Visible} AND e.Id IN @Ids",
                new
                {
                    Ids = documentIds,
                    culture,
                    DefaultCulture = CultureCodes.Default,
                    Sql.Published,
                    DownloadReaders.Today,
                });

            documents = documentRows.ToDictionary(d => d.Id, DownloadReaders.ToDto);
        }

        return rows.Select(r => new CertificationDto
        {
            Slug = r.Slug,
            Category = ContentReaders.Camel(((CertificationCategory)r.Category).ToString()),
            CertificateNumber = r.CertificateNumber,
            IssuedOn = ToDateOnly(r.IssuedOn),
            ValidUntil = ToDateOnly(r.ValidUntil),
            IsPlaceholder = r.IsPlaceholder,
            LogoUrl = r.LogoUrl,
            Title = r.Title,
            ShortNote = r.ShortNote,
            Summary = r.Summary,
            IssuerName = r.IssuerName,
            ValidityText = r.ValidityText,
            ScopeText = r.ScopeText,
            SitesText = r.SitesText,
            DocumentationLabel = r.DocumentationLabel,
            Document = r.DownloadId is { } id && documents.TryGetValue(id, out var document) ? document : null,
            Categories = chips[r.Id].ToList(),
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();
    }

    internal static byte? ParseCategory(string? category) => category switch
    {
        null or "" => null,
        "company-factory" or "companyFactory" => (byte)CertificationCategory.CompanyFactory,
        "sustainability" => (byte)CertificationCategory.Sustainability,
        "product-compliance" or "productCompliance" => (byte)CertificationCategory.ProductCompliance,
        _ => throw AppException.BadRequest(ErrorCodes.ValidationFormat,
            "category 只能是 company-factory、sustainability 或 product-compliance。"),
    };

    private static DateOnly? ToDateOnly(DateTime? value) => value is null ? null : DateOnly.FromDateTime(value.Value);

    private sealed class CertificationRow
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public byte Category { get; set; }
        public string? CertificateNumber { get; set; }
        public DateTime? IssuedOn { get; set; }
        public DateTime? ValidUntil { get; set; }
        public bool IsPlaceholder { get; set; }
        public int? DownloadId { get; set; }
        public string? LogoUrl { get; set; }
        public string? Title { get; set; }
        public string? ShortNote { get; set; }
        public string? Summary { get; set; }
        public string? IssuerName { get; set; }
        public string? ValidityText { get; set; }
        public string? ScopeText { get; set; }
        public string? SitesText { get; set; }
        public string? DocumentationLabel { get; set; }
        public bool HasRequestedCulture { get; set; }
    }

    private sealed record CertificationChipRow(int CertificationId, string Slug, string? Name);
}
