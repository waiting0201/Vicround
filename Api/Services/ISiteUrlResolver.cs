using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using VicRound.Api.Data;

namespace VicRound.Api.Services;

/// <summary>
/// 前台的對外網址。信件裡的連結、詢問單通知信的來源連結都要它。
/// </summary>
public interface ISiteUrlResolver
{
    /// <summary>已去掉尾斜線的網址；兩處設定都沒有時回 <c>null</c>。</summary>
    Task<string?> BaseUrlAsync(CancellationToken cancellationToken);
}

/// <summary>
/// 以 <c>SiteSettings["site.baseUrl"]</c> 為準、設定檔的 <c>Site:BaseUrl</c> 為備援。
///
/// <para>
/// 站台設定已不開放後台編輯（2026-10-23）：正式環境請設 <c>Site:BaseUrl</c>；
/// 資料表那一列只是讓既有環境不必改設定就能沿用。<c>revalidate.webhookUrl</c> 同理
/// （<c>Revalidate:WebhookUrl</c>）。
/// </para>
/// </summary>
public sealed class SiteUrlResolver(VicRoundDbContext db, IConfiguration configuration) : ISiteUrlResolver
{
    public async Task<string?> BaseUrlAsync(CancellationToken cancellationToken)
    {
        var stored = await db.SiteSettings
            .Where(setting => setting.Key == "site.baseUrl")
            .Select(setting => setting.Value)
            .FirstOrDefaultAsync(cancellationToken);

        var value = string.IsNullOrWhiteSpace(stored)
            ? configuration["Site:BaseUrl"] ?? configuration["VICROUND_SITE_BASE_URL"]
            : stored;

        return string.IsNullOrWhiteSpace(value) ? null : value.TrimEnd('/');
    }
}
