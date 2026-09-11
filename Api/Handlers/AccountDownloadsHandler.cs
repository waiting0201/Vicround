using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VicRound.Api.Common;
using VicRound.Api.Data;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;
using VicRound.Api.Services;

namespace VicRound.Api.Handlers;

/// <summary>
/// 會員下載（docs/cms-api.md「Account API」）。
///
/// <para>
/// 與公開的 <c>/v1/downloads</c> 的差別只有一個，但很關鍵：這裡會列出
/// <see cref="DownloadAccessLevel.MemberOnly"/> 的項目。即使如此，**清單上永遠沒有
/// 真實檔案網址**——要下載得再打一次 <c>link</c> 端點換一個十分鐘後就失效的連結。
/// </para>
/// </summary>
public sealed class AccountDownloadsHandler(
    VicRoundDbContext db,
    IMediaStorage storage)
{
    /// <summary>SAS 的有效期。夠一次下載，短到轉貼出去也很快變成死連結。</summary>
    private static readonly TimeSpan LinkLifetime = TimeSpan.FromMinutes(10);

    public async Task<IActionResult> ListAsync(HttpRequest req)
    {
        var culture = LangResolver.Resolve(req);
        var approved = IsApproved(req);
        var today = DateOnly.FromDateTime(Clock.UtcNow);

        var query = db.Downloads
            .Where(d => d.Status == ContentStatus.Published)
            .Where(d => d.ValidUntil == null || d.ValidUntil >= today);

        // 未核准的會員看到的清單與公開端一樣——列出 MemberOnly 只會讓人點了才發現不能下載。
        if (!approved)
        {
            query = query.Where(d => d.AccessLevel != DownloadAccessLevel.MemberOnly);
        }

        var rows = await query
            .OrderBy(d => d.SortOrder)
            .ThenByDescending(d => d.DocumentDate)
            .Select(d => new
            {
                d.Slug,
                d.Kind,
                d.AccessLevel,
                d.Version,
                d.DocumentDate,
                d.ValidUntil,
                d.FileSizeBytes,
                d.FileExtension,
                Translation = d.Translations.FirstOrDefault(t => t.Culture == culture)
                    ?? d.Translations.FirstOrDefault(t => t.Culture == CultureCodes.Default),
                FileName = d.MediaAsset!.FileName,
                MimeType = d.MediaAsset!.MimeType,
            })
            .ToListAsync(req.HttpContext.RequestAborted);

        var items = rows.Select(r => new MemberDownloadDto(
            r.Slug,
            r.Translation?.Title ?? r.Slug,
            r.Translation?.Description,
            r.Kind.ToString(),
            r.AccessLevel.ToString(),
            r.Version,
            r.DocumentDate?.ToDateTime(TimeOnly.MinValue),
            r.ValidUntil?.ToDateTime(TimeOnly.MinValue),
            r.FileName,
            r.FileSizeBytes,
            r.MimeType,
            CanDownload: r.AccessLevel != DownloadAccessLevel.OnRequest
                && (r.AccessLevel != DownloadAccessLevel.MemberOnly || approved)))
            .ToList();

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(items));
    }

    public async Task<IActionResult> CreateLinkAsync(HttpRequest req, string slug)
    {
        var today = DateOnly.FromDateTime(Clock.UtcNow);

        var download = await db.Downloads
            .Where(d => d.Slug == slug && d.Status == ContentStatus.Published)
            .Select(d => new
            {
                d.AccessLevel,
                d.ValidUntil,
                Container = d.MediaAsset!.Container,
                BlobPath = d.MediaAsset!.BlobPath,
                Url = d.MediaAsset!.Url,
                IsPrivate = d.MediaAsset!.IsPrivate,
            })
            .SingleOrDefaultAsync(req.HttpContext.RequestAborted)
            ?? throw AppException.NotFound("找不到這份文件。");

        if (download.ValidUntil is { } until && until < today)
        {
            throw new AppException(ErrorCodes.ConflictState, "這份文件已過期。", 409);
        }

        // 需要詢問的文件沒有直接下載這條路——它的「下載」動作是送出詢問單。
        if (download.AccessLevel == DownloadAccessLevel.OnRequest)
        {
            throw new AppException(ErrorCodes.Forbidden, "這份文件需要透過詢問單索取。", 403);
        }

        if (download.AccessLevel == DownloadAccessLevel.MemberOnly && !IsApproved(req))
        {
            throw new AppException(
                ErrorCodes.AuthMemberNotApproved, "帳號通過審核後才能下載這份文件。", 403);
        }

        // 公開檔案本來就有直連網址，不必簽 SAS；簽了反而給它一個會過期的網址。
        if (!download.IsPrivate && download.Url is { Length: > 0 })
        {
            return Link(req, new DownloadLinkDto(download.Url, Clock.UtcNow.Add(LinkLifetime)));
        }

        var uri = await storage.CreateReadLinkAsync(
            download.Container, download.BlobPath, LinkLifetime, req.HttpContext.RequestAborted);

        return Link(req, new DownloadLinkDto(uri.ToString(), Clock.UtcNow.Add(LinkLifetime)));
    }

    /// <summary>
    /// 狀態取自 token 的 <c>member_status</c>。放進 token 是為了讓每次下載不必多查一次 DB；
    /// 代價是狀態變更最多晚 15 分鐘生效（access token 的壽命），而停權時後台會一併
    /// 撤銷 refresh token，所以他換不到新的。
    /// </summary>
    private static bool IsApproved(HttpRequest req) =>
        req.HttpContext.User.FindFirst("member_status")?.Value == "approved";

    private static IActionResult Link(HttpRequest req, DownloadLinkDto dto)
    {
        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(dto));
    }
}
