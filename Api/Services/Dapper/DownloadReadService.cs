using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface IDownloadReadService
{
    Task<IReadOnlyList<DownloadDto>> ListAsync(string culture, string? kind, string? productSlug);
}

/// <summary>
/// 下載中心（database.md §06）。
/// <para>
/// <b>公開端永不回 <c>MemberOnly</c> 檔案的真實網址</b>——那些檔案存在 private container，
/// 只能透過 Account API 換 10 分鐘的 SAS（docs/cms-api.md）。這條規則寫在
/// <see cref="DownloadReaders.ToDto"/> 一處，任何回傳下載的端點都走它。
/// </para>
/// </summary>
public sealed class DownloadReadService(IDbConnection db) : IDownloadReadService
{
    public Task<IReadOnlyList<DownloadDto>> ListAsync(string culture, string? kind, string? productSlug) =>
        ListAsync(db, culture, ParseKind(kind), productSlug);

    /// <summary>頁面的 <c>DownloadList</c> reference block 也要這一份（static 的理由同 SolutionReadService）。</summary>
    internal static async Task<IReadOnlyList<DownloadDto>> ListAsync(
        IDbConnection db, string culture, byte? kindValue, string? productSlug)
    {
        var filters = new List<string> { DownloadReaders.Visible };

        // 沒指定產品＝下載中心，只列全域文件。掛在產品上的文件屬於那個產品頁的「下載」區塊，
        // 混進來的話，下載中心會變成兩百多份規格書的流水帳。
        if (string.IsNullOrWhiteSpace(productSlug))
        {
            filters.Add(DownloadReaders.Global("e"));
        }

        if (kindValue is not null)
        {
            filters.Add("e.Kind = @Kind");
        }

        if (!string.IsNullOrWhiteSpace(productSlug))
        {
            filters.Add("""
                EXISTS (SELECT 1 FROM DownloadProducts x
                        INNER JOIN Products p ON p.Id = x.ProductId
                        WHERE x.DownloadId = e.Id AND p.Slug = @ProductSlug)
                """);
        }

        var rows = await db.QueryAsync<DownloadReaders.DownloadRow>(
            $"""
             {DownloadReaders.Select}
             WHERE {string.Join("\n  AND ", filters)}
             ORDER BY e.SortOrder, e.Id
             """,
            new
            {
                culture,
                DefaultCulture = CultureCodes.Default,
                Sql.Published,
                DownloadReaders.Today,
                Kind = kindValue,
                ProductSlug = productSlug,
            });

        return rows.Select(DownloadReaders.ToDto).ToList();
    }

    internal static byte? ParseKind(string? kind) => kind switch
    {
        null or "" => null,
        _ when Enum.TryParse<DownloadKind>(kind.Replace("-", string.Empty), ignoreCase: true, out var parsed)
            => (byte)parsed,
        _ => throw AppException.BadRequest(ErrorCodes.ValidationFormat,
            "kind 只能是 specSheet、whitePaper、catalogue、complianceDocument、certificate、testReport、trendReport 或 other。"),
    };
}

/// <summary>下載的可見性規則與 DTO 對映。證書的 PDF 也走這裡，兩處不會各寫一套。</summary>
internal static class DownloadReaders
{
    /// <summary>已發佈且未過期。<c>ValidUntil</c> 到期的文件自動不列出（§06）。</summary>
    public const string Visible = "e.Status = @Published AND (e.ValidUntil IS NULL OR e.ValidUntil >= @Today)";

    /// <summary>全域文件＝沒有掛在任何產品上；只有這些會出現在下載中心。</summary>
    public static string Global(string download) =>
        $"NOT EXISTS (SELECT 1 FROM DownloadProducts gp WHERE gp.DownloadId = {download}.Id)";

    /// <summary>
    /// 產品文件的所在地：它掛的第一個已上架產品（產品線也要上架）。輸出 <c>{alias}.CategorySlug</c>
    /// 與 <c>{alias}.ProductSlug</c>，交給 <see cref="Path"/>。搜尋、FAQ、導覽連到下載都走這一份。
    /// </summary>
    public static string HomeProduct(string download, string alias) => $"""
        OUTER APPLY (SELECT TOP (1) hc.Slug AS CategorySlug, hp.Slug AS ProductSlug
                     FROM DownloadProducts hx
                     INNER JOIN Products hp ON hp.Id = hx.ProductId AND hp.Status = @Published
                     INNER JOIN Categories hc ON hc.Id = hp.CategoryId AND hc.Status = @Published
                     WHERE hx.DownloadId = {download}.Id
                     ORDER BY hx.SortOrder, hp.SortOrder, hp.Id) {alias}
        """;

    /// <summary>
    /// 前台上找得到這份文件：全域文件（下載中心），或至少有一個產品頁列出它。
    /// 掛在產品上、但那些產品都沒上架的文件，哪裡都沒列——連過去只會是一個不存在的錨點。
    /// </summary>
    public static string Reachable(string download, string homeAlias) =>
        $"({homeAlias}.ProductSlug IS NOT NULL OR {Global(download)})";

    /// <summary>產品文件連到產品頁的「下載」區塊，全域文件連到下載中心的錨點。</summary>
    public static string Path(string slug, string? categorySlug, string? productSlug) =>
        productSlug is not null
            ? PublicPaths.ProductDownloads(categorySlug ?? string.Empty, productSlug)
            : PublicPaths.Download(slug);

    public const string Select = """
        SELECT e.Id, e.Slug, e.Kind, e.AccessLevel, e.Version, e.DocumentDate, e.ValidUntil,
               e.FileExtension, e.FileSizeBytes, e.DocumentCulture,
               CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS FileUrl,
               CASE WHEN th.IsPrivate = 1 THEN NULL ELSE th.Url END AS ThumbnailUrl,
               COALESCE(t.Title, f.Title) AS Title,
               COALESCE(t.Description, f.Description) AS Description,
               CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
        FROM Downloads e
        LEFT JOIN MediaAssets m ON m.Id = e.MediaAssetId AND m.IsArchived = 0
        LEFT JOIN MediaAssets th ON th.Id = e.ThumbnailMediaAssetId AND th.IsArchived = 0
        LEFT JOIN DownloadTranslations t ON t.DownloadId = e.Id AND t.Culture = @Culture
        LEFT JOIN DownloadTranslations f ON f.DownloadId = e.Id AND f.Culture = @DefaultCulture
        """;

    public static DateTime Today => DateTime.UtcNow.Date;

    /// <summary>
    /// <c>AccessLevel</c> 決定回什麼（docs/cms-api.md 的對照表）：
    /// <c>public</c> 才有 <c>fileUrl</c>；<c>memberOnly</c> 只回 metadata 與 <c>requiresSignIn</c>；
    /// <c>onRequest</c> 回索取用的 <c>requestUrl</c>。
    /// </summary>
    public static DownloadDto ToDto(DownloadRow r)
    {
        var access = (DownloadAccessLevel)r.AccessLevel;

        return new DownloadDto
        {
            Slug = r.Slug,
            Kind = ContentReaders.Camel(((DownloadKind)r.Kind).ToString()),
            AccessLevel = ContentReaders.Camel(access.ToString()),
            FileUrl = access == DownloadAccessLevel.Public ? r.FileUrl : null,
            RequiresSignIn = access == DownloadAccessLevel.MemberOnly,
            RequestUrl = access == DownloadAccessLevel.OnRequest ? PublicPaths.DownloadRequest(r.Slug) : null,
            Version = r.Version,
            DocumentDate = ToDateOnly(r.DocumentDate),
            ValidUntil = ToDateOnly(r.ValidUntil),
            FileExtension = r.FileExtension,
            FileSizeBytes = r.FileSizeBytes,
            DocumentCulture = r.DocumentCulture,
            ThumbnailUrl = r.ThumbnailUrl,
            Title = r.Title,
            Description = r.Description,
            HasRequestedCulture = r.HasRequestedCulture,
        };
    }

    private static DateOnly? ToDateOnly(DateTime? value) => value is null ? null : DateOnly.FromDateTime(value.Value);

    public sealed class DownloadRow
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public byte Kind { get; set; }
        public byte AccessLevel { get; set; }
        public string? Version { get; set; }
        public DateTime? DocumentDate { get; set; }
        public DateTime? ValidUntil { get; set; }
        public string FileExtension { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string? DocumentCulture { get; set; }
        public string? FileUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public bool HasRequestedCulture { get; set; }
    }
}
