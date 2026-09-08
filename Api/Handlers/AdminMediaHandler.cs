using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    IAdminCrudService crud)
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

    private static MediaAssetType MediaTypeOf(string contentType) => contentType switch
    {
        _ when contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) => MediaAssetType.Image,
        _ when contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase) => MediaAssetType.Video,
        "application/pdf" => MediaAssetType.Document,
        _ => MediaAssetType.Other,
    };
}
