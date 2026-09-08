
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §05。服務 Resources 的「Next exhibition」卡、News 的展會列表、文章頁的
/// Event details 側欄與 <c>Event</c> JSON-LD。可見性<b>由日期決定</b>——刻意不加 IsFeatured，
/// 以免置頂旗標忘了關掉、首頁一直顯示已結束的展會。
/// </summary>
public class Exhibition : SluggedEntity
{
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }

    public string? BoothNumber { get; set; }
    public string? City { get; set; }

    /// <summary>ISO 3166-1 alpha-2。</summary>
    public string? CountryCode { get; set; }

    public string? WebsiteUrl { get; set; }

    /// <summary>「Book a meeting」目的地；站內 contact 或外部排程工具皆可（§19.11）。</summary>
    public string? MeetingUrl { get; set; }

    public int? HeroMediaAssetId { get; set; }
    public MediaAsset? HeroMediaAsset { get; set; }

    public ICollection<ExhibitionTranslation> Translations { get; set; } = new List<ExhibitionTranslation>();
    public ICollection<Article> Articles { get; set; } = new List<Article>();
}

public class ExhibitionTranslation : SeoTranslation
{
    public int ExhibitionId { get; set; }
    public Exhibition? Exhibition { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? VenueName { get; set; }
    public string? Summary { get; set; }
    public string? Description { get; set; }
    public string? OnBoothNote { get; set; }
    public string? CtaLabel { get; set; }
}
