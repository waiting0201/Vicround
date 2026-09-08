using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Common;
using VicRound.Api.Data;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services;

public interface IContactInquiryService
{
    Task<string> SubmitAsync(ContactRequest request, string culture, CancellationToken cancellationToken);
}

/// <summary>
/// 詢問表單的寫入（database.md §12）。<b>寫入一律走 EF Core</b>——Dapper 只負責讀。
/// <para>
/// 這是公開站唯一的寫入路徑，而且只寫 <c>ContactInquiries</c> 一張表；
/// 內容表在這一側連 DbSet 都碰不到（CLAUDE.md「Three API surfaces, never mixed」）。
/// </para>
/// </summary>
public sealed class ContactInquiryService(
    VicRoundDbContext db,
    ILogger<ContactInquiryService> logger) : IContactInquiryService
{
    public async Task<string> SubmitAsync(ContactRequest request, string culture, CancellationToken cancellationToken)
    {
        Validate(request);

        var categoryId = await ResolveAsync(
            db.Categories.Where(c => c.Slug == request.CategorySlug).Select(c => (int?)c.Id),
            request.CategorySlug, "categorySlug", cancellationToken);

        var productId = await ResolveAsync(
            db.Products.Where(p => p.Slug == request.ProductSlug).Select(p => (int?)p.Id),
            request.ProductSlug, "productSlug", cancellationToken);

        var downloadId = await ResolveAsync(
            db.Downloads.Where(d => d.Slug == request.DownloadSlug).Select(d => (int?)d.Id),
            request.DownloadSlug, "downloadSlug", cancellationToken);

        var type = ResolveType(request, downloadId);

        // 收件窗口依詢問類型指派；沒有對應窗口就留空，由後台自行分派。
        var channelId = await db.ContactChannels
            .Where(c => c.InquiryType == type && c.Status == ContentStatus.Published)
            .OrderBy(c => c.SortOrder)
            .Select(c => (int?)c.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var policyVersion = await db.SiteSettings
            .Where(s => s.Key == "privacy.policyVersion")
            .Select(s => s.Value)
            .FirstOrDefaultAsync(cancellationToken);

        var inquiry = new ContactInquiry
        {
            Type = type,
            Name = request.Name!.Trim(),
            CompanyName = request.Company!.Trim(),
            Email = request.Email!.Trim(),
            Phone = Clean(request.Phone),
            CategoryId = categoryId,
            ProductLineOther = Clean(request.ProductLineOther),
            RefProductId = productId,
            RefDownloadId = downloadId,
            ApplicationText = Clean(request.Application),
            TargetSpec = Clean(request.TargetSpec),
            Message = Clean(request.Message),
            SourceUrl = request.SourceUrl!.Trim(),
            Culture = culture,
            ConsentedAt = Clock.UtcNow,
            ConsentPolicyVersion = string.IsNullOrWhiteSpace(policyVersion) ? "unspecified" : policyVersion,
            Status = InquiryStatus.New,
            AssignedChannelId = channelId,
        };

        var referenceNumber = await SaveWithReferenceNumberAsync(inquiry, cancellationToken);

        // TODO 通知信：等 Communication Services / SMTP 設定就緒後在此排入佇列。
        // 單據已經落庫，後台的收件匣看得到，因此寄信失敗不該讓送出失敗。
        logger.LogInformation("詢問單已建立 {ReferenceNumber}（type={Type}）", referenceNumber, type);

        return referenceNumber;
    }

    /// <summary>
    /// 單號是 <c>INQ-{年}-{6 位流水}</c>，年度內連號。
    /// 併發時兩個請求可能算出同一個號碼，因此靠 <c>UX_ContactInquiries_ReferenceNumber</c>
    /// 擋下並重試——用資料庫的唯一性當仲裁，不自己造鎖。
    /// </summary>
    private async Task<string> SaveWithReferenceNumberAsync(ContactInquiry inquiry, CancellationToken cancellationToken)
    {
        var prefix = $"INQ-{Clock.UtcNow.Year}-";

        var last = await db.ContactInquiries
            .Where(i => i.ReferenceNumber.StartsWith(prefix))
            .OrderByDescending(i => i.ReferenceNumber)
            .Select(i => i.ReferenceNumber)
            .FirstOrDefaultAsync(cancellationToken);

        var next = last is not null && int.TryParse(last[prefix.Length..], out var parsed) ? parsed + 1 : 1;

        for (var attempt = 0; attempt < 5; attempt++)
        {
            inquiry.ReferenceNumber = prefix + (next + attempt).ToString("000000");

            try
            {
                db.ContactInquiries.Add(inquiry);
                await db.SaveChangesAsync(cancellationToken);
                return inquiry.ReferenceNumber;
            }
            catch (DbUpdateException e) when (IsDuplicateReferenceNumber(e))
            {
                logger.LogWarning("單號 {ReferenceNumber} 已被佔用，重試。", inquiry.ReferenceNumber);
                db.ChangeTracker.Clear();
            }
        }

        throw AppException.Conflict(ErrorCodes.ConflictDuplicate, "產生詢問單號失敗，請稍後再試。");
    }

    private static bool IsDuplicateReferenceNumber(DbUpdateException e) =>
        e.InnerException is Microsoft.Data.SqlClient.SqlException { Number: 2601 or 2627 };

    private static void Validate(ContactRequest request)
    {
        // 確認稿的表單只有姓名／公司／Email／產品線／應用／目標規格與同意勾選，
        // 因此必填只認這幾項——message 在該版面上根本不存在（STATUS.md 第二節）。
        Require(request.Name, "name");
        Require(request.Company, "company");
        Require(request.Email, "email");
        Require(request.SourceUrl, "sourceUrl");

        if (!IsEmail(request.Email!))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "email 格式不正確。");
        }

        if (!request.Consent)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "必須勾選隱私權同意才能送出。");
        }
    }

    private static void Require(string? value, string field)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, $"{field} 為必填。");
        }
    }

    private static bool IsEmail(string value) => MailAddress.TryCreate(value.Trim(), out _);

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    /// <summary>沒指定 type 時由內容推斷：帶了文件 slug 就是索取文件，否則一般詢問。</summary>
    private static InquiryType ResolveType(ContactRequest request, int? downloadId) => request.Type switch
    {
        null or "" => downloadId is null ? InquiryType.General : InquiryType.DocumentRequest,
        _ when Enum.TryParse<InquiryType>(request.Type, ignoreCase: true, out var parsed) => parsed,
        _ => throw AppException.BadRequest(ErrorCodes.ValidationFormat,
            "type 只能是 general、sales、technical、partnership、sampleRequest 或 documentRequest。"),
    };

    /// <summary>slug 有給就必須查得到——查不到代表前台送了不存在的選項，回 400 而不是靜默存 null。</summary>
    private static async Task<int?> ResolveAsync(
        IQueryable<int?> query, string? slug, string field, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slug))
        {
            return null;
        }

        return await query.FirstOrDefaultAsync(cancellationToken)
            ?? throw AppException.BadRequest(ErrorCodes.ValidationFormat, $"{field} 找不到對應的內容。");
    }
}
