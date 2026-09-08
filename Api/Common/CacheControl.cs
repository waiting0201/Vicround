using Microsoft.AspNetCore.Http;

namespace VicRound.Api.Common;

/// <summary>
/// 公開內容可快取；會員與後台一律不可。
/// <para>
/// 實際的失效由發佈時的 <c>revalidateTag</c> webhook 負責（architecture.md），
/// 這裡的 max-age 只是 CDN 與瀏覽器的保險層。
/// </para>
/// </summary>
public static class CacheControl
{
    public static void Public(HttpResponse response, int seconds = 300) =>
        response.Headers.CacheControl = $"public, max-age={seconds}, stale-while-revalidate=60";

    public static void NoStore(HttpResponse response) =>
        response.Headers.CacheControl = "no-store";
}
