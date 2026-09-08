
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §10。改 slug、封存內容、變更 <c>Articles.Type</c> 都必須在同一 transaction 內
/// 寫入本表。Application 層強制：<b>路徑 normalize、不得產生鏈、不得產生環</b>。
/// 依 §0.7 不記錄命中次數。
/// </summary>
public class Redirect : IHasTimestamps
{
    public int Id { get; set; }

    /// <summary>normalize 後的來源路徑：小寫、去尾斜線、query string 參數排序。</summary>
    public string FromPath { get; set; } = string.Empty;
    public string ToPath { get; set; } = string.Empty;

    /// <summary>存真實 HTTP 碼：301 / 302 / 308 / 410。410 = 永久移除且無替代。</summary>
    public short StatusCode { get; set; } = 301;

    /// <summary><c>FromPath</c> 無 locale 前綴時的目標語系。</summary>
    public string? TargetCulture { get; set; }
    public Culture? TargetCultureRef { get; set; }

    public bool IsEnabled { get; set; } = true;
    public string? Notes { get; set; }
    public string? LegacySourceKey { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
}
