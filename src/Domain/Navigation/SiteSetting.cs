using VicRound.Domain.Common;

namespace VicRound.Domain.Navigation;

/// <summary>
/// database.md §10。承載預設 SEO title 樣板、Organization JSON-LD 的公司資訊、GA/GTM id、
/// revalidateTag webhook 目標、預設 OG 圖、隱私政策版本號。
/// </summary>
public class SiteSetting : IHasTimestamps
{
    /// <summary>PK，如 <c>seo.titleTemplate</c>；後台依前綴自動分區。</summary>
    public string Key { get; set; } = string.Empty;

    public SettingValueKind ValueKind { get; set; } = SettingValueKind.Text;

    /// <summary>culture-neutral 的值；<see cref="IsLocalized"/> 為 true 時改讀翻譯表。</summary>
    public string? Value { get; set; }
    public bool IsLocalized { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<SiteSettingTranslation> Translations { get; set; } = new List<SiteSettingTranslation>();
}

public class SiteSettingTranslation : Translation
{
    public string SettingKey { get; set; } = string.Empty;
    public SiteSetting? Setting { get; set; }

    public string? Value { get; set; }
}
