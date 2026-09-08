
namespace VicRound.Api.Models.Entities;

// database.md §08。五張小的強型別表，全部 Embedded（由 reference block 帶出，無獨立 public 端點）。
// 之所以不是 block：Milestones 要按年排序；Locations 有經緯度且出現在 About 與 Contact 兩頁；
// Testimonials 要關聯 Solution 並在多頁輪播；PartnerBrands 是跨兩頁的 logo wall。

/// <summary>About 頁的公司歷程。</summary>
public class Milestone : ContentEntity
{
    public int Year { get; set; }
    public byte? Month { get; set; }

    public int? MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public ICollection<MilestoneTranslation> Translations { get; set; } = new List<MilestoneTranslation>();
}

public class MilestoneTranslation : Translation
{
    public int MilestoneId { get; set; }
    public Milestone? Milestone { get; set; }

    /// <summary><c>01 — Founding</c>。</summary>
    public string? Label { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
}

/// <summary>據點；同時出現在 About 的 Manufacturing 區與 Contact 的三據點。</summary>
public class Location : ContentEntity
{
    public LocationType Type { get; set; }
    public string CountryCode { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? MapUrl { get; set; }

    public int? MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public ICollection<LocationTranslation> Translations { get; set; } = new List<LocationTranslation>();
}

public class LocationTranslation : Translation
{
    public int LocationId { get; set; }
    public Location? Location { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? AddressLine { get; set; }
    public string? Note { get; set; }
    public string? OpeningHours { get; set; }
}

/// <summary>客戶推薦。具名需客戶書面授權，故 <c>AuthorName</c> 可為 null。</summary>
public class Testimonial : ContentEntity
{
    public int? PartnerBrandId { get; set; }
    public PartnerBrand? PartnerBrand { get; set; }

    public int? SolutionId { get; set; }
    public Solution? Solution { get; set; }

    public int? MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public ICollection<TestimonialTranslation> Translations { get; set; } = new List<TestimonialTranslation>();
}

public class TestimonialTranslation : Translation
{
    public int TestimonialId { get; set; }
    public Testimonial? Testimonial { get; set; }

    public string Quote { get; set; } = string.Empty;

    /// <summary>未取得具名授權時留白，只顯示職稱 + 公司類型。</summary>
    public string? AuthorName { get; set; }
    public string? AuthorTitle { get; set; }
    public string? CompanyType { get; set; }
}

/// <summary>Homepage 信任牆與 Partnership 的 logo wall。</summary>
public class PartnerBrand : SluggedEntity
{
    public int LogoMediaAssetId { get; set; }
    public MediaAsset? LogoMediaAsset { get; set; }

    public string? WebsiteUrl { get; set; }
    public bool IsLogoWallVisible { get; set; } = true;

    public ICollection<PartnerBrandTranslation> Translations { get; set; } = new List<PartnerBrandTranslation>();
    public ICollection<Testimonial> Testimonials { get; set; } = new List<Testimonial>();
}

public class PartnerBrandTranslation : Translation
{
    public int PartnerBrandId { get; set; }
    public PartnerBrand? PartnerBrand { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Note { get; set; }
}

/// <summary>Contact 頁的收件窗口；詢問單依 <c>InquiryType</c> 指派。</summary>
public class ContactChannel : SluggedEntity
{
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public InquiryType InquiryType { get; set; }

    public ICollection<ContactChannelTranslation> Translations { get; set; } = new List<ContactChannelTranslation>();
}

public class ContactChannelTranslation : Translation
{
    public int ContactChannelId { get; set; }
    public ContactChannel? ContactChannel { get; set; }

    /// <summary><c>Sales &amp; quotations</c>。</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary><c>Pricing, lead times…</c>。</summary>
    public string? Description { get; set; }
}
