using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

/// <summary>
/// database.md §08 的五張小表（歷程、據點、推薦、品牌、聯絡窗口）。
/// <b>它們沒有獨立的 public 端點</b>——只由頁面的 reference block 帶出來，
/// 因此不做成注入式服務，避免多出五個沒有人單獨呼叫的介面。
/// </summary>
internal static class CompanyReaders
{
    public static async Task<IReadOnlyList<MilestoneDto>> MilestonesAsync(IDbConnection db, string culture)
    {
        var rows = await db.QueryAsync<MilestoneRow>(
            $"""
             SELECT e.Year, e.Month,
                    CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS ImageUrl,
                    {Sql.Coalesce("Label")}, {Sql.Coalesce("Title")}, {Sql.Coalesce("Body")}, {Sql.HasCulture}
             FROM Milestones e
             LEFT JOIN MediaAssets m ON m.Id = e.MediaAssetId AND m.IsArchived = 0
             {Sql.TranslationJoin("MilestoneTranslations", "MilestoneId")}
             WHERE e.Status = @Published
             ORDER BY e.Year, e.Month, e.SortOrder
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        return rows.Select(r => new MilestoneDto
        {
            Year = r.Year,
            Month = r.Month,
            ImageUrl = r.ImageUrl,
            Label = r.Label,
            Title = r.Title,
            Body = r.Body,
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();
    }

    public static async Task<IReadOnlyList<LocationDto>> LocationsAsync(IDbConnection db, string culture, byte? type)
    {
        var rows = await db.QueryAsync<LocationRow>(
            $"""
             SELECT e.Type, e.CountryCode, e.City, e.Phone, e.Email, e.Latitude, e.Longitude, e.MapUrl,
                    CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS ImageUrl,
                    {Sql.Coalesce("Name")}, {Sql.Coalesce("AddressLine")},
                    {Sql.Coalesce("Note")}, {Sql.Coalesce("OpeningHours")}, {Sql.HasCulture}
             FROM Locations e
             LEFT JOIN MediaAssets m ON m.Id = e.MediaAssetId AND m.IsArchived = 0
             {Sql.TranslationJoin("LocationTranslations", "LocationId")}
             WHERE e.Status = @Published AND (@Type IS NULL OR e.Type = @Type)
             ORDER BY e.SortOrder, e.Id
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, Type = type });

        return rows.Select(r => new LocationDto
        {
            Type = ContentReaders.Camel(((LocationType)r.Type).ToString()),
            CountryCode = r.CountryCode,
            City = r.City,
            Phone = r.Phone,
            Email = r.Email,
            Latitude = r.Latitude,
            Longitude = r.Longitude,
            MapUrl = r.MapUrl,
            ImageUrl = r.ImageUrl,
            Name = r.Name,
            AddressLine = r.AddressLine,
            Note = r.Note,
            OpeningHours = r.OpeningHours,
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();
    }

    public static async Task<IReadOnlyList<TestimonialDto>> TestimonialsAsync(
        IDbConnection db, string culture, string? solutionSlug)
    {
        var rows = await db.QueryAsync<TestimonialRow>(
            $"""
             SELECT s.Slug AS SolutionSlug,
                    COALESCE(bt.Name, bf.Name) AS BrandName,
                    CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS AvatarUrl,
                    {Sql.Coalesce("Quote")}, {Sql.Coalesce("AuthorName")},
                    {Sql.Coalesce("AuthorTitle")}, {Sql.Coalesce("CompanyType")}, {Sql.HasCulture}
             FROM Testimonials e
             LEFT JOIN Solutions s ON s.Id = e.SolutionId AND s.Status = @Published
             LEFT JOIN PartnerBrands b ON b.Id = e.PartnerBrandId AND b.Status = @Published
             LEFT JOIN PartnerBrandTranslations bt ON bt.PartnerBrandId = b.Id AND bt.Culture = @Culture
             LEFT JOIN PartnerBrandTranslations bf ON bf.PartnerBrandId = b.Id AND bf.Culture = @DefaultCulture
             LEFT JOIN MediaAssets m ON m.Id = e.MediaAssetId AND m.IsArchived = 0
             {Sql.TranslationJoin("TestimonialTranslations", "TestimonialId")}
             WHERE e.Status = @Published AND (@SolutionSlug IS NULL OR s.Slug = @SolutionSlug)
             ORDER BY e.SortOrder, e.Id
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published, SolutionSlug = solutionSlug });

        return rows.Select(r => new TestimonialDto
        {
            Quote = r.Quote,
            AuthorName = r.AuthorName,
            AuthorTitle = r.AuthorTitle,
            CompanyType = r.CompanyType,
            SolutionSlug = r.SolutionSlug,
            BrandName = r.BrandName,
            AvatarUrl = r.AvatarUrl,
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();
    }

    public static async Task<IReadOnlyList<PartnerBrandDto>> PartnerBrandsAsync(IDbConnection db, string culture)
    {
        var rows = await db.QueryAsync<PartnerBrandRow>(
            $"""
             SELECT e.Slug, e.WebsiteUrl,
                    CASE WHEN m.IsPrivate = 1 THEN NULL ELSE m.Url END AS LogoUrl,
                    {Sql.Coalesce("Name")}, {Sql.Coalesce("Note")}, {Sql.HasCulture}
             FROM PartnerBrands e
             LEFT JOIN MediaAssets m ON m.Id = e.LogoMediaAssetId AND m.IsArchived = 0
             {Sql.TranslationJoin("PartnerBrandTranslations", "PartnerBrandId")}
             WHERE e.Status = @Published AND e.IsLogoWallVisible = 1
             ORDER BY e.SortOrder, e.Id
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        return rows.Select(r => new PartnerBrandDto
        {
            Slug = r.Slug,
            LogoUrl = r.LogoUrl,
            WebsiteUrl = r.WebsiteUrl,
            Name = r.Name,
            Note = r.Note,
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();
    }

    public static async Task<IReadOnlyList<ContactChannelDto>> ContactChannelsAsync(IDbConnection db, string culture)
    {
        var rows = await db.QueryAsync<ContactChannelRow>(
            $"""
             SELECT e.Slug, e.Email, e.Phone, e.InquiryType,
                    {Sql.Coalesce("Label")}, {Sql.Coalesce("Description")}, {Sql.HasCulture}
             FROM ContactChannels e
             {Sql.TranslationJoin("ContactChannelTranslations", "ContactChannelId")}
             WHERE e.Status = @Published
             ORDER BY e.SortOrder, e.Id
             """,
            new { culture, DefaultCulture = CultureCodes.Default, Sql.Published });

        return rows.Select(r => new ContactChannelDto
        {
            Slug = r.Slug,
            Email = r.Email,
            Phone = r.Phone,
            InquiryType = ContentReaders.Camel(((InquiryType)r.InquiryType).ToString()),
            Label = r.Label,
            Description = r.Description,
            HasRequestedCulture = r.HasRequestedCulture,
        }).ToList();
    }

    private sealed record MilestoneRow(
        int Year, byte? Month, string? ImageUrl, string? Label, string? Title, string? Body, bool HasRequestedCulture);

    private sealed record LocationRow(
        byte Type, string CountryCode, string City, string? Phone, string? Email,
        decimal? Latitude, decimal? Longitude, string? MapUrl, string? ImageUrl,
        string? Name, string? AddressLine, string? Note, string? OpeningHours, bool HasRequestedCulture);

    private sealed record TestimonialRow(
        string? SolutionSlug, string? BrandName, string? AvatarUrl,
        string? Quote, string? AuthorName, string? AuthorTitle, string? CompanyType, bool HasRequestedCulture);

    private sealed record PartnerBrandRow(
        string Slug, string? WebsiteUrl, string? LogoUrl, string? Name, string? Note, bool HasRequestedCulture);

    private sealed record ContactChannelRow(
        string Slug, string Email, string? Phone, byte InquiryType,
        string? Label, string? Description, bool HasRequestedCulture);
}
