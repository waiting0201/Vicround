using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VicRound.Api.Common;
using VicRound.Api.Data;
using VicRound.Api.Models.Entities;
using VicRound.Api.Services.Admin;

namespace VicRound.Api.Handlers;

/// <summary>
/// 後台的非 CRUD 動作：會員審核與樣品申請的狀態流轉（docs/cms-api.md「非 CRUD 端點」）。
///
/// <para>
/// 這些不做成一般的 <c>PUT</c> 是因為它們有**狀態機**：能不能從現在的狀態走到下一步，
/// 是後端說了算。後台的看板也只列出合法的下一步（`SampleRequestsScreen`），
/// 但真正的把關必須在這裡——否則改一下請求就能把「已拒絕」變成「已核准」。
/// </para>
/// </summary>
public sealed class AdminActionHandler(VicRoundDbContext db, IAdminCrudService crud)
{
    /// <summary>樣品申請的合法轉移（database.md §14.4）。</summary>
    private static readonly Dictionary<SampleRequestStatus, SampleRequestStatus[]> SampleTransitions = new()
    {
        [SampleRequestStatus.Draft] = [SampleRequestStatus.Submitted, SampleRequestStatus.Cancelled],
        [SampleRequestStatus.Submitted] = [SampleRequestStatus.UnderReview, SampleRequestStatus.Rejected, SampleRequestStatus.Cancelled],
        [SampleRequestStatus.UnderReview] = [SampleRequestStatus.Approved, SampleRequestStatus.Rejected, SampleRequestStatus.Cancelled],
        [SampleRequestStatus.Approved] = [SampleRequestStatus.Shipped, SampleRequestStatus.Cancelled],
        [SampleRequestStatus.Shipped] = [SampleRequestStatus.Delivered],
        [SampleRequestStatus.Delivered] = [],
        [SampleRequestStatus.Rejected] = [],
        [SampleRequestStatus.Cancelled] = [],
    };

    public async Task<IActionResult> MemberAsync(HttpRequest req, string id, string action)
    {
        var body = await ReadAsync(req);
        var member = await FindAsync<Member>(id, req.HttpContext.RequestAborted);
        var now = Clock.UtcNow;

        switch (action)
        {
            case "approve":
                Require(member.Status is MemberStatus.PendingApproval or MemberStatus.Rejected or MemberStatus.Suspended,
                    $"{member.Status} 的會員不能直接核准。");
                member.Status = MemberStatus.Approved;
                member.ApprovedAt ??= now;
                member.ReviewNote = null;
                break;

            case "reject":
                // 拒絕一定要寫理由：這段文字會出現在給對方的通知裡，也是日後查詢的唯一依據。
                var note = body.TryGetProperty("reviewNote", out var value) ? value.GetString() : null;
                Require(!string.IsNullOrWhiteSpace(note), "拒絕必須填寫理由。");
                member.Status = MemberStatus.Rejected;
                member.ReviewNote = note;
                break;

            case "suspend":
                Require(member.Status == MemberStatus.Approved, "只有已核准的會員可以停權。");
                member.Status = MemberStatus.Suspended;
                break;

            case "reactivate":
                Require(member.Status == MemberStatus.Suspended, "只有已停權的會員可以恢復。");
                member.Status = MemberStatus.Approved;
                break;

            default:
                throw AppException.NotFound($"動作 {action}");
        }

        await db.SaveChangesAsync(req.HttpContext.RequestAborted);
        return await RowAsync(req, "members", id);
    }

    public async Task<IActionResult> SampleRequestStatusAsync(HttpRequest req, string id)
    {
        var body = await ReadAsync(req);
        var request = await FindAsync<SampleRequest>(id, req.HttpContext.RequestAborted);

        var target = body.TryGetProperty("status", out var value) && value.ValueKind == JsonValueKind.String
            ? (SampleRequestStatus)AdminMapper.ToClrValue(value, typeof(SampleRequestStatus), "status")!
            : throw AppException.BadRequest(ErrorCodes.ValidationRequired, "缺少 status。");

        Require(SampleTransitions[request.Status].Contains(target),
            $"{request.Status} 不能直接變成 {target}。");

        var now = Clock.UtcNow;
        request.Status = target;

        // 每個階段的時間戳是業務資料（出貨查詢、交期統計都看它），不是稽核記錄。
        switch (target)
        {
            case SampleRequestStatus.UnderReview: request.ReviewedAt ??= now; break;
            case SampleRequestStatus.Approved: request.ApprovedAt ??= now; break;
            case SampleRequestStatus.Shipped: request.ShippedAt ??= now; break;
            case SampleRequestStatus.Delivered: request.DeliveredAt ??= now; break;
            case SampleRequestStatus.Rejected: request.RejectedAt ??= now; break;
            case SampleRequestStatus.Cancelled: request.CancelledAt ??= now; break;
        }

        foreach (var field in new[] { "carrier", "trackingNumber", "trackingUrl", "internalNote", "reviewNote" })
        {
            if (body.TryGetProperty(field, out var text) && text.ValueKind == JsonValueKind.String)
            {
                typeof(SampleRequest).GetProperty(AdminMapper.Pascal(field))?.SetValue(request, text.GetString());
            }
        }

        await db.SaveChangesAsync(req.HttpContext.RequestAborted);
        return await RowAsync(req, "sample-requests", id);
    }

    private async Task<T> FindAsync<T>(string id, CancellationToken ct)
        where T : class
    {
        if (!Guid.TryParse(id, out var key))
        {
            throw AppException.NotFound($"識別碼 {id}");
        }

        var entity = await db.FindAsync<T>([key], ct) ?? throw AppException.NotFound($"{typeof(T).Name} {id}");

        if (db.Entry(entity).State == EntityState.Detached)
        {
            db.Attach(entity);
        }

        return entity;
    }

    private async Task<IActionResult> RowAsync(HttpRequest req, string slug, string id)
    {
        var row = await crud.GetAsync(AdminResources.Find(slug)!, id, req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(row));
    }

    private static void Require(bool condition, string message)
    {
        if (!condition)
        {
            throw AppException.Conflict(ErrorCodes.ConflictState, message);
        }
    }

    private static async Task<JsonElement> ReadAsync(HttpRequest req)
    {
        if (req.ContentLength is null or 0)
        {
            return JsonDocument.Parse("{}").RootElement.Clone();
        }

        try
        {
            using var document = await JsonDocument.ParseAsync(req.Body, cancellationToken: req.HttpContext.RequestAborted);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "請求主體必須是合法的 JSON。");
        }
    }
}
