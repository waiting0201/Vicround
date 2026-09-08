using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VicRound.Api.Data;

namespace VicRound.Api.Services.Admin;

public interface IRevalidationService
{
    /// <summary>讓前台的 Data Cache 失效。<b>失敗不影響存檔</b>，只留下記錄。</summary>
    Task RevalidateAsync(IEnumerable<string> tags, CancellationToken ct);
}

/// <summary>
/// 發布 → 失效（docs/cms.md「Publish → revalidate」）。
///
/// <para>
/// 這是 API 唯一反向呼叫前台的路徑：發布之後打 Next.js 的 <c>revalidateTag</c> webhook，
/// SSR 的下一次請求就會重新取資料，不必重新部署。目標網址存在 <c>SiteSettings</c>
/// （編輯者可改），密鑰走設定／Key Vault（絕不進 DB）。
/// </para>
///
/// <para>
/// <b>失效失敗不會讓存檔失敗</b>：內容已經寫進資料庫了，這時候把整個請求變成 500，
/// 只會讓編輯者以為沒存成功而重按一次。
/// </para>
/// </summary>
public sealed class RevalidationService(
    VicRoundDbContext db,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<RevalidationService> logger) : IRevalidationService
{
    public async Task RevalidateAsync(IEnumerable<string> tags, CancellationToken ct)
    {
        var list = tags.Distinct().ToArray();

        if (list.Length == 0)
        {
            return;
        }

        var url = await db.SiteSettings
            .Where(setting => setting.Key == "revalidate.webhookUrl")
            .Select(setting => setting.Value)
            .FirstOrDefaultAsync(ct);

        var secret = configuration["Revalidate:Secret"] ?? configuration["VICROUND_REVALIDATE_SECRET"];

        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(secret))
        {
            logger.LogInformation("尚未設定 revalidate webhook（url 或密鑰缺一），略過失效 {Tags}。", string.Join(",", list));
            return;
        }

        try
        {
            var client = httpClientFactory.CreateClient(nameof(RevalidationService));
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("x-revalidate-secret", secret);
            request.Content = JsonContent.Create(new { tags = list });

            using var response = await client.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Revalidate webhook 回 {Status}，tags={Tags}。", (int)response.StatusCode, string.Join(",", list));
            }
        }
        catch (Exception e) when (e is HttpRequestException or TaskCanceledException)
        {
            logger.LogError(e, "呼叫 revalidate webhook 失敗，tags={Tags}。", string.Join(",", list));
        }
    }
}

/// <summary>
/// 資源 → 失效標籤。字串與 `apps/web/lib/api.ts` 的 <c>tag</c> 對照表<b>逐字對應</b>——
/// 兩邊不一致的話，發布之後前台的快取就不會動，而且沒有任何錯誤訊息。
/// </summary>
public static class RevalidationTags
{
    public static string[] For(string resourceSlug, string? slug)
    {
        var tags = new List<string>();

        switch (resourceSlug)
        {
            case "categories":
                tags.AddRange(["categories", "navigation", "sitemap"]);
                if (slug is not null) tags.Add($"category:{slug}");
                break;

            case "products":
                tags.Add("products");
                if (slug is not null) tags.Add($"product:{slug}");
                tags.Add("sitemap");
                break;

            case "solutions":
                tags.AddRange(["solutions", "navigation", "sitemap"]);
                if (slug is not null) tags.Add($"solution:{slug}");
                break;

            case "articles":
                tags.AddRange(["articles", "sitemap"]);
                if (slug is not null) tags.Add($"article:{slug}");
                break;

            case "pages":
                tags.Add("sitemap");
                if (slug is not null) tags.Add($"page:{slug}");
                break;

            case "faq-categories" or "faq-items":
                tags.AddRange(["faq", "page:resources", "page:faq"]);
                break;

            case "downloads":
                tags.AddRange(["downloads", "page:resources", "page:downloads"]);
                break;

            case "certifications":
                tags.AddRange(["certifications", "technologies", "page:about", "page:sustainability", "page:technologies"]);
                break;

            case "exhibitions":
                tags.AddRange(["articles:exhibitions", "page:resources", "page:news"]);
                break;

            case "process-flows":
                tags.AddRange(["technologies", "page:technologies", "page:partnership", "page:contact"]);
                break;

            case "navigation":
                tags.Add("navigation");
                break;

            case "site-settings":
                tags.Add("site-settings");
                break;

            // 公司實體沒有自己的頁面，它們出現在別人的 reference block 裡。
            case "milestones" or "locations" or "testimonials" or "partner-brands" or "contact-channels":
                tags.AddRange(["page:about", "page:contact", "page:partnership", "page:home"]);
                break;
        }

        return tags.ToArray();
    }
}
