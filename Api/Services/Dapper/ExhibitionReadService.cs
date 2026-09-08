using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

public interface IExhibitionReadService
{
    Task<IReadOnlyList<ExhibitionDto>> ListAsync(string culture, bool? upcoming);
}

/// <summary>
/// 展會（database.md §05）。<b>可見性由日期決定</b>——表上刻意沒有 IsFeatured，
/// 以免置頂旗標忘了關掉、首頁一直顯示已結束的展會。
/// </summary>
public sealed class ExhibitionReadService(IDbConnection db) : IExhibitionReadService
{
    private const string Select = """
        SELECT e.Id, e.Slug, e.StartDate, e.EndDate, e.BoothNumber, e.City, e.CountryCode,
               e.WebsiteUrl, e.MeetingUrl,
               CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS HeroImageUrl,
               COALESCE(t.Name, f.Name) AS Name,
               COALESCE(t.VenueName, f.VenueName) AS VenueName,
               COALESCE(t.Summary, f.Summary) AS Summary,
               COALESCE(t.Description, f.Description) AS Description,
               COALESCE(t.OnBoothNote, f.OnBoothNote) AS OnBoothNote,
               COALESCE(t.CtaLabel, f.CtaLabel) AS CtaLabel,
               CAST(CASE WHEN t.Culture IS NULL THEN 0 ELSE 1 END AS bit) AS HasRequestedCulture
        FROM Exhibitions e
        LEFT JOIN MediaAssets m ON m.Id = e.HeroMediaAssetId AND m.IsArchived = 0
        LEFT JOIN ExhibitionTranslations t ON t.ExhibitionId = e.Id AND t.Culture = @Culture
        LEFT JOIN ExhibitionTranslations f ON f.ExhibitionId = e.Id AND f.Culture = @DefaultCulture
        """;

    public Task<IReadOnlyList<ExhibitionDto>> ListAsync(string culture, bool? upcoming) =>
        ListAsync(db, culture, upcoming);

    /// <summary>頁面的 <c>ExhibitionList</c> reference block 也要這一份（static 的理由同 SolutionReadService）。</summary>
    internal static async Task<IReadOnlyList<ExhibitionDto>> ListAsync(
        IDbConnection db, string culture, bool? upcoming)
    {
        // 未來場次由近到遠（前台取第一筆當「Next exhibition」）；已結束的由新到舊。
        var rows = await db.QueryAsync<ExhibitionRow>(
            $"""
             {Select}
             WHERE e.Status = @Published
               AND (@Upcoming IS NULL
                    OR (@Upcoming = 1 AND e.EndDate >= @Today)
                    OR (@Upcoming = 0 AND e.EndDate < @Today))
             ORDER BY CASE WHEN e.EndDate >= @Today THEN 0 ELSE 1 END,
                      CASE WHEN e.EndDate >= @Today THEN e.StartDate END,
                      CASE WHEN e.EndDate < @Today THEN e.StartDate END DESC
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, Upcoming = upcoming, Today });

        return rows.Select(ToDto).ToList();
    }

    /// <summary>
    /// 文章詳情要在側欄帶出展會資訊（<c>Type = Exhibition</c> 的文章）。
    /// 做成 static 讓 <see cref="ArticleReadService"/> 直接借用，不必再注入一個服務。
    /// </summary>
    internal static async Task<ExhibitionDto?> GetByIdAsync(IDbConnection db, int id, string culture)
    {
        var row = await db.QuerySingleOrDefaultAsync<ExhibitionRow>(
            $"{Select} WHERE e.Id = @Id AND e.Status = @Published",
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, Id = id });

        return row is null ? null : ToDto(row);
    }

    private static DateTime Today => DateTime.UtcNow.Date;

    private static ExhibitionDto ToDto(ExhibitionRow r) => new()
    {
        Slug = r.Slug,
        StartDate = DateOnly.FromDateTime(r.StartDate),
        EndDate = DateOnly.FromDateTime(r.EndDate),
        IsUpcoming = r.EndDate >= Today,
        BoothNumber = r.BoothNumber,
        City = r.City,
        CountryCode = r.CountryCode,
        WebsiteUrl = r.WebsiteUrl,
        MeetingUrl = r.MeetingUrl,
        HeroImageUrl = r.HeroImageUrl,
        Name = r.Name,
        VenueName = r.VenueName,
        Summary = r.Summary,
        Description = r.Description,
        OnBoothNote = r.OnBoothNote,
        CtaLabel = r.CtaLabel,
        HasRequestedCulture = r.HasRequestedCulture,
    };

    // date 欄位以 DateTime 讀出再轉 DateOnly：Dapper 對 date → DateOnly 的對映
    // 依版本而異，讀 DateTime 是各版本都成立的寫法。
    private sealed class ExhibitionRow
    {
        public int Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? BoothNumber { get; set; }
        public string? City { get; set; }
        public string? CountryCode { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? MeetingUrl { get; set; }
        public string? HeroImageUrl { get; set; }
        public string? Name { get; set; }
        public string? VenueName { get; set; }
        public string? Summary { get; set; }
        public string? Description { get; set; }
        public string? OnBoothNote { get; set; }
        public string? CtaLabel { get; set; }
        public bool HasRequestedCulture { get; set; }
    }
}
