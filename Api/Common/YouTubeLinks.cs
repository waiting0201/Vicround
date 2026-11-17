using System.Text.RegularExpressions;

namespace VicRound.Api.Common;

/// <summary>
/// 把編輯者貼進來的 YouTube 連結收斂成 11 碼影片 id。
///
/// <para>
/// 編輯者會從各種地方複製網址：瀏覽器網址列（<c>watch?v=</c>）、分享鈕（<c>youtu.be/</c>）、
/// Shorts、嵌入碼裡的 <c>embed/</c>，後面常黏著 <c>&amp;t=</c>、<c>?si=</c> 之類的參數。
/// 這些都接受；只貼 id 本身也接受。其他網域一律不收——嵌入的 iframe 只開 YouTube。
/// </para>
/// </summary>
public static partial class YouTubeLinks
{
    /// <summary>YouTube 影片 id：固定 11 碼的 base64url 字元。</summary>
    [GeneratedRegex("^[A-Za-z0-9_-]{11}$")]
    private static partial Regex IdPattern();

    private static readonly string[] Hosts =
        ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"];

    /// <summary>解析不出合法的影片 id 時回 <c>null</c>。</summary>
    public static string? ParseId(string? input)
    {
        var value = input?.Trim();
        if (string.IsNullOrEmpty(value))
        {
            return null;
        }

        if (IdPattern().IsMatch(value))
        {
            return value;
        }

        if (!value.Contains("://", StringComparison.Ordinal))
        {
            value = "https://" + value;
        }

        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
        {
            return null;
        }

        var host = uri.Host.ToLowerInvariant();
        var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);

        string? candidate = null;
        if (host == "youtu.be")
        {
            candidate = segments.FirstOrDefault();
        }
        else if (Hosts.Contains(host))
        {
            candidate = segments switch
            {
                ["watch", ..] => QueryValue(uri.Query, "v"),
                ["embed" or "shorts" or "live" or "v", var id, ..] => id,
                _ => null,
            };
        }

        return candidate is not null && IdPattern().IsMatch(candidate) ? candidate : null;
    }

    /// <summary>
    /// 縮圖網址。<c>hqdefault</c>（480×360）每支影片都有；<c>maxresdefault</c> 不一定存在，
    /// 拿不到時 YouTube 回的是 404 而不是退回小圖，所以不用它。
    /// </summary>
    public static string ThumbnailUrl(string id) => $"https://i.ytimg.com/vi/{id}/hqdefault.jpg";

    public static string WatchUrl(string id) => $"https://www.youtube.com/watch?v={id}";

    private static string? QueryValue(string query, string key)
    {
        foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var separator = pair.IndexOf('=');
            if (separator > 0 && pair[..separator] == key)
            {
                return Uri.UnescapeDataString(pair[(separator + 1)..]);
            }
        }

        return null;
    }
}
