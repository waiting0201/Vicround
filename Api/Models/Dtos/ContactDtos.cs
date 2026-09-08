namespace VicRound.Api.Models.Dtos;

/// <summary>
/// <c>POST /api/v1/contact</c> 的請求。前台的 Contact 頁與 Header 的 contact drawer
/// 是同一個表單、同一個端點（database.md §12）。
/// <para>
/// 屬性刻意是可寫的——<c>ReadFromJsonAsync</c> 綁的是它，init-only 在此沒有好處。
/// </para>
/// </summary>
public sealed class ContactRequest
{
    /// <summary><c>general</c>／<c>sales</c>／<c>technical</c>…；未給時由後端推斷。</summary>
    public string? Type { get; set; }

    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Company { get; set; }
    public string? Phone { get; set; }

    /// <summary>表單的 Product Line 下拉；選 Other 時改帶 <see cref="ProductLineOther"/>。</summary>
    public string? CategorySlug { get; set; }
    public string? ProductLineOther { get; set; }

    public string? ProductSlug { get; set; }

    /// <summary><c>AccessLevel = OnRequest</c> 的文件索取。</summary>
    public string? DownloadSlug { get; set; }

    public string? Application { get; set; }
    public string? TargetSpec { get; set; }
    public string? Message { get; set; }

    public string? SourceUrl { get; set; }
    public string? Culture { get; set; }

    /// <summary>隱私權同意。<b>false 一律拒收</b>——沒有同意就沒有合法的處理依據。</summary>
    public bool Consent { get; set; }

    /// <summary>anti-bot token（Turnstile）。未設定金鑰時後端略過驗證。</summary>
    public string? AntiBotToken { get; set; }

    /// <summary>蜜罐欄位：真人看不到它，因此有值就是機器人。</summary>
    public string? Website { get; set; }
}

/// <summary>送出成功只回單號，不回聲任何輸入內容（docs/cms-api.md）。</summary>
public sealed record ContactAcceptedDto(string ReferenceNumber);
