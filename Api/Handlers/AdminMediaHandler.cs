using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Common;
using VicRound.Api.Data;
using VicRound.Api.Models.Entities;
using VicRound.Api.Services;
using VicRound.Api.Services.Admin;

namespace VicRound.Api.Handlers;

/// <summary>
/// 媒體上傳（<c>POST /api/admin/media</c>）。
///
/// <para>
/// <b>選錯容器等於把限會員文件放上公開 CDN</b>，所以容器由呼叫端明確指定，沒有猜測：
/// <c>public-media</c> 會拿到可直連的網址，<c>member-documents</c> 一律私有、只能經 SAS。
/// </para>
///
/// <para>
/// 這一支不是 JSON —— multipart 的 boundary 得讓瀏覽器自己產生，因此與其他後台端點分開。
/// </para>
/// </summary>
public sealed class AdminMediaHandler(
    VicRoundDbContext db,
    IMediaStorage storage,
    IAdminCrudService crud,
    IHttpClientFactory httpClients,
    ILogger<AdminMediaHandler> logger)
{
    /// <summary>單檔上限。超過就擋在這裡，而不是讓 Functions host 用一個看不懂的錯誤結束。</summary>
    private const long MaxBytes = 50 * 1024 * 1024;

    private static readonly string[] AllowedTypes =
    [
        "image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/avif", "image/gif",
        "application/pdf",
        "video/mp4", "video/webm",
    ];

    public async Task<IActionResult> UploadAsync(HttpRequest req)
    {
        if (!req.HasFormContentType)
        {
            throw AppException.BadRequest(ErrorCodes.UploadType, "請以 multipart/form-data 上傳。");
        }

        var form = await req.ReadFormAsync(req.HttpContext.RequestAborted);
        var file = form.Files.GetFile("file")
            ?? throw AppException.BadRequest(ErrorCodes.ValidationRequired, "缺少檔案。");

        if (file.Length > MaxBytes)
        {
            throw AppException.BadRequest(ErrorCodes.UploadSize, $"檔案超過 {MaxBytes / 1024 / 1024} MB 上限。");
        }

        var contentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;

        if (!AllowedTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
        {
            throw AppException.BadRequest(ErrorCodes.UploadType, $"不支援的檔案型別 {contentType}。");
        }

        var container = form["container"].ToString();
        var isPrivate = container == MediaContainers.MemberDocuments;

        // 路徑帶年月與亂數：同名檔案不會互相覆蓋，容器裡也不會出現一層幾萬個檔案的資料夾。
        var safeName = SlugRules.Normalize(Path.GetFileNameWithoutExtension(file.FileName));
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var blobPath = $"{Clock.UtcNow:yyyy/MM}/{safeName}-{Guid.NewGuid():N}{extension}";

        await using var stream = file.OpenReadStream();
        var stored = await storage.UploadAsync(stream, blobPath, contentType, isPrivate, req.HttpContext.RequestAborted);

        var asset = new MediaAsset
        {
            Container = stored.Container,
            BlobPath = stored.BlobPath,
            Url = stored.Url,
            IsPrivate = isPrivate,
            Type = MediaTypeOf(contentType),
            MimeType = contentType,
            FileName = file.FileName,
            FileSizeBytes = file.Length,
            PublishedAt = Clock.UtcNow,
        };

        db.MediaAssets.Add(asset);
        await db.SaveChangesAsync(req.HttpContext.RequestAborted);

        var row = await crud.GetAsync(AdminResources.Find("media")!, asset.Id.ToString(), req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok(row)) { StatusCode = 201 };
    }

    /// <summary>
    /// 加入 YouTube 影片（<c>POST /api/admin/media/youtube</c>，body <c>{ "url": "..." }</c>）。
    ///
    /// <para>
    /// 不上傳任何檔案，只建一筆 <see cref="MediaAssetType.YouTube"/> 的媒體資產，之後就跟圖片一樣
    /// 放進產品圖庫或案例的成果欄位。同一支影片已經登記過就直接回那一筆，不重複建立。
    /// </para>
    /// <para>
    /// 先問 YouTube 的 oEmbed：順便取影片標題當檔名，也擋掉「私人影片」與「擁有者關閉嵌入」——
    /// 這兩種放上前台只會是一塊播不出來的黑框。oEmbed 連不上時不擋，用影片 id 當檔名照樣建立。
    /// </para>
    /// </summary>
    public async Task<IActionResult> AddYouTubeAsync(HttpRequest req)
    {
        var ct = req.HttpContext.RequestAborted;

        YouTubeRequest body;
        try
        {
            body = await req.ReadFromJsonAsync<YouTubeRequest>(ct) ?? new YouTubeRequest();
        }
        catch (System.Text.Json.JsonException)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "請求主體必須是合法的 JSON。");
        }

        var videoId = YouTubeLinks.ParseId(body.Url)
            ?? throw AppException.BadRequest(ErrorCodes.ValidationFormat, "看不出這是哪一支 YouTube 影片，請貼影片頁或分享鈕給的網址。");

        var existing = await db.MediaAssets
            .Where(m => m.Container == MediaContainers.YouTube && m.BlobPath == videoId && !m.IsArchived)
            .Select(m => (int?)m.Id)
            .FirstOrDefaultAsync(ct);

        if (existing is null)
        {
            var title = await YouTubeTitleAsync(videoId, ct);

            var asset = new MediaAsset
            {
                Container = MediaContainers.YouTube,
                BlobPath = videoId,
                Url = YouTubeLinks.ThumbnailUrl(videoId),
                IsPrivate = false,
                Type = MediaAssetType.YouTube,
                MimeType = "video/youtube",
                FileName = Truncate(title ?? $"YouTube {videoId}", 260),
                Width = 480,
                Height = 360,
                PublishedAt = Clock.UtcNow,
            };

            db.MediaAssets.Add(asset);
            await db.SaveChangesAsync(ct);
            existing = asset.Id;
        }

        var row = await crud.GetAsync(AdminResources.Find("media")!, existing.Value.ToString(), ct);

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok(row)) { StatusCode = 201 };
    }

    private async Task<string?> YouTubeTitleAsync(string videoId, CancellationToken ct)
    {
        var oembed = $"https://www.youtube.com/oembed?format=json&url={Uri.EscapeDataString(YouTubeLinks.WatchUrl(videoId))}";

        HttpResponseMessage response;
        try
        {
            var client = httpClients.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);
            response = await client.GetAsync(oembed, ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            logger.LogWarning(ex, "YouTube oEmbed 查不到 {VideoId}，改用影片 id 當檔名。", videoId);
            return null;
        }

        using (response)
        {
            switch ((int)response.StatusCode)
            {
                case 401 or 403:
                    throw AppException.BadRequest(ErrorCodes.ValidationFormat, "這支影片的擁有者不允許嵌入其他網站，請在 YouTube 後台開啟「允許嵌入」。");
                case 400 or 404:
                    throw AppException.BadRequest(ErrorCodes.ValidationFormat, "找不到這支影片。私人影片無法嵌入，請改成「公開」或「不公開」。");
            }

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("YouTube oEmbed 回 {Status}（{VideoId}），改用影片 id 當檔名。", (int)response.StatusCode, videoId);
                return null;
            }

            try
            {
                var payload = await response.Content.ReadFromJsonAsync<OEmbed>(ct);
                return string.IsNullOrWhiteSpace(payload?.Title) ? null : payload.Title.Trim();
            }
            catch (System.Text.Json.JsonException)
            {
                return null;
            }
        }
    }

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];

    private sealed class YouTubeRequest
    {
        public string? Url { get; set; }
    }

    private sealed record OEmbed(string? Title);

    private static MediaAssetType MediaTypeOf(string contentType) => contentType switch
    {
        _ when contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) => MediaAssetType.Image,
        _ when contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase) => MediaAssetType.Video,
        "application/pdf" => MediaAssetType.Document,
        _ => MediaAssetType.Other,
    };
}
