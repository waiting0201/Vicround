using Microsoft.AspNetCore.Http;

namespace VicRound.Api.Common;

/// <summary>
/// 限流用的來源識別。
///
/// <para>
/// Azure 前面有反向代理，<c>RemoteIpAddress</c> 會是代理本身，因此優先取
/// <c>X-Forwarded-For</c> 的第一段（最靠近使用者的那一跳）。
/// </para>
///
/// <para>
/// <b>這個值只用於記憶體內的限流，不落 DB</b>（database.md §12）——把每個請求的 IP
/// 寫進資料庫等於自建一張 log 表，平白多出個人資料的保存責任。
/// </para>
/// </summary>
public static class ClientIp
{
    public static string Of(HttpRequest req)
    {
        var forwarded = req.Headers["X-Forwarded-For"].ToString();

        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            var first = forwarded.Split(',')[0].Trim();

            // Azure 的 X-Forwarded-For 會帶連接埠（1.2.3.4:5678），限流的鍵不需要它。
            var colon = first.LastIndexOf(':');
            return colon > 0 && !first.Contains("::", StringComparison.Ordinal) ? first[..colon] : first;
        }

        return req.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
