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
/// <b>放 SiteSettings 而不是只放 App Settings</b>：正式網域要換成 www.vicround.com 時，
/// 這是編輯者在後台就能改的一列，不必為了換個網址重新部署
/// ——與 <c>revalidate.webhookUrl</c> 同樣的理由，兩者也放在同一張表。
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
