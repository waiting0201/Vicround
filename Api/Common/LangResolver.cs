using Microsoft.AspNetCore.Http;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Common;

/// <summary>
/// 決定這個請求要回哪個語系的內容。
/// <para>
/// <b>語系的真相來源是網址</b>——前台把 <c>[locale]</c> 段轉成 <c>?culture=</c> 帶過來。
/// <c>Accept-Language</c> 只有在沒有帶參數時才作為 fallback（database.md §0.2）。
/// </para>
/// </summary>
public static class LangResolver
{
    public static string Resolve(HttpRequest request)
    {
        var requested = request.Query["culture"].ToString();

        if (IsSupported(requested))
        {
            return Normalize(requested);
        }

        foreach (var candidate in request.Headers.AcceptLanguage.ToString().Split(','))
        {
            // 去掉 q 權重（zh-Hant;q=0.9）後比對。
            var code = candidate.Split(';')[0].Trim();
            if (IsSupported(code))
            {
                return Normalize(code);
            }
        }

        return CultureCodes.Default;
    }

    private static bool IsSupported(string? code) =>
        !string.IsNullOrWhiteSpace(code)
        && CultureCodes.All.Any(c => string.Equals(c, code, StringComparison.OrdinalIgnoreCase));

    private static string Normalize(string code) =>
        CultureCodes.All.First(c => string.Equals(c, code, StringComparison.OrdinalIgnoreCase));
}

/// <summary>分頁參數。上限刻意設低——公開端點不該讓人一次撈走整個目錄。</summary>
public static class Paging
{
    public const int DefaultPageSize = 24;
    public const int MaxPageSize = 100;

    public static (int Page, int PageSize) From(HttpRequest request, int defaultPageSize = DefaultPageSize)
    {
        var page = int.TryParse(request.Query["page"], out var p) && p > 0 ? p : 1;
        var size = int.TryParse(request.Query["pageSize"], out var s) && s > 0 ? s : defaultPageSize;

        return (page, Math.Min(size, MaxPageSize));
    }
}
