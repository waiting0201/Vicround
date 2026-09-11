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
/// 樣品申請（docs/cms-api.md「Account API」、database.md §14.4）。
///
/// <para>
/// 每一支都以「目前登入的會員」為範圍查詢——<b>單號不是權限</b>，知道別人的
/// <c>SR-2026-000123</c> 也查不到那一單。
/// </para>
/// </summary>
public sealed class AccountSampleRequestsHandler(VicRoundDbContext db)
{
    /// <summary>一次最多建幾個品項。防的是自動化灌單，不是正常使用者。</summary>
    private const int MaxItems = 30;

    public async Task<IActionResult> ListAsync(HttpRequest req)
    {
        var memberId = AccountAuthService.MemberId(req.HttpContext.User);

        var rows = await db.SampleRequests
            .Where(r => r.MemberId == memberId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new SampleRequestSummaryDto(
                r.RequestNumber,
                MemberEnumNames.SampleStatus(r.Status),
                r.CreatedAt,
                r.SubmittedAt,
                r.ShippedAt,
                r.TrackingNumber,
                r.Items.Count))
            .ToListAsync(req.HttpContext.RequestAborted);

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(rows));
    }

    public async Task<IActionResult> GetAsync(HttpRequest req, string requestNumber)
    {
        var dto = await LoadAsync(req, requestNumber)
            ?? throw AppException.NotFound("找不到這張樣品申請單。");

        CacheControl.NoStore(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(dto));
    }

    public async Task<IActionResult> CreateAsync(HttpRequest req)
    {
        RequireApproved(req);

        var memberId = AccountAuthService.MemberId(req.HttpContext.User);
        var request = await ReadAsync<SampleRequestCreateRequest>(req);

        var created = await CreateCoreAsync(req, memberId, request, sourceId: null);

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok(created)) { StatusCode = 201 };
    }

    /// <summary>
    /// 重下同一批規格。複製的是<b>品項與收件資訊</b>，不是狀態與單號——
    /// 新的一單從頭走一次流程。
    /// </summary>
    public async Task<IActionResult> ReorderAsync(HttpRequest req, string requestNumber)
    {
        RequireApproved(req);

        var memberId = AccountAuthService.MemberId(req.HttpContext.User);

        var source = await db.SampleRequests
            .Include(r => r.Items)
            .SingleOrDefaultAsync(
                r => r.MemberId == memberId && r.RequestNumber == requestNumber,
                req.HttpContext.RequestAborted)
            ?? throw AppException.NotFound("找不到這張樣品申請單。");

        var request = new SampleRequestCreateRequest
        {
            ShipToName = source.ShipToName,
            ShipToCompany = source.ShipToCompany,
            ShipToAddressLine1 = source.ShipToAddressLine1,
            ShipToAddressLine2 = source.ShipToAddressLine2,
            ShipToCity = source.ShipToCity,
            ShipToState = source.ShipToState,
            ShipToPostalCode = source.ShipToPostalCode,
            ShipToCountryCode = source.ShipToCountryCode,
            ShipToPhone = source.ShipToPhone,
            ProjectName = source.ProjectName,
            TargetApplication = source.TargetApplication,
            Items = source.Items
                .OrderBy(i => i.SortOrder)
                .Select(i => new SampleRequestItemInput
                {
                    GradeCode = i.GradeCode,
                    RequestedSpec = i.RequestedSpec,
                    Quantity = i.Quantity,
                    Unit = i.Unit,
                })
                .ToList(),
        };

        var created = await CreateCoreAsync(req, memberId, request, source.Id, source.Items.ToList());

        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok(created)) { StatusCode = 201 };
    }

    private async Task<SampleRequestDto> CreateCoreAsync(
        HttpRequest req,
        Guid memberId,
        SampleRequestCreateRequest request,
        Guid? sourceId,
        List<SampleRequestItem>? sourceItems = null)
    {
        if (request.Items.Count == 0)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請至少加入一個品項。");
        }

        if (request.Items.Count > MaxItems)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRange, $"一張申請單最多 {MaxItems} 個品項。");
        }

        foreach (var (value, label) in new[]
                 {
                     (request.ShipToName, "收件人"),
                     (request.ShipToCompany, "公司名稱"),
                     (request.ShipToAddressLine1, "地址"),
                     (request.ShipToCity, "城市"),
                     (request.ShipToPostalCode, "郵遞區號"),
                     (request.ShipToCountryCode, "國家"),
                     (request.ShipToPhone, "聯絡電話"),
                 })
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw AppException.BadRequest(ErrorCodes.ValidationRequired, $"請填寫{label}。");
            }
        }

        // 產品 slug 一次查完再比對：一個品項一次查詢，30 個品項就是 30 趟。
        var slugs = request.Items
            .Select(i => i.ProductSlug)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s!)
            .Distinct()
            .ToList();

        var products = slugs.Count == 0
            ? []
            : await db.Products
                .Where(p => slugs.Contains(p.Slug))
                .Select(p => new
                {
                    p.Id,
                    p.Slug,
                    p.CategoryId,
                    Name = p.Translations.FirstOrDefault(t => t.Culture == CultureCodes.Default)!.Name,
                })
                .ToListAsync(req.HttpContext.RequestAborted);

        var sample = new SampleRequest
        {
            RequestNumber = await NextRequestNumberAsync(req.HttpContext.RequestAborted),
            MemberId = memberId,
            SourceSampleRequestId = sourceId,
            Status = SampleRequestStatus.Submitted,
            SubmittedAt = Clock.UtcNow,
            ShipToName = request.ShipToName!.Trim(),
            ShipToCompany = request.ShipToCompany!.Trim(),
            ShipToAddressLine1 = request.ShipToAddressLine1!.Trim(),
            ShipToAddressLine2 = request.ShipToAddressLine2?.Trim(),
            ShipToCity = request.ShipToCity!.Trim(),
            ShipToState = request.ShipToState?.Trim(),
            ShipToPostalCode = request.ShipToPostalCode!.Trim(),
            ShipToCountryCode = request.ShipToCountryCode!.Trim(),
            ShipToPhone = request.ShipToPhone!.Trim(),
            ProjectName = request.ProjectName?.Trim(),
            TargetApplication = request.TargetApplication?.Trim(),
            MemberNote = request.MemberNote?.Trim(),
        };

        var sort = 0;

        foreach (var input in request.Items)
        {
            var product = products.FirstOrDefault(p => p.Slug == input.ProductSlug);

            if (input.ProductSlug is { Length: > 0 } && product is null)
            {
                throw AppException.BadRequest(ErrorCodes.ValidationFormat, $"找不到產品 {input.ProductSlug}。");
            }

            if (input.Quantity < 1)
            {
                throw AppException.BadRequest(ErrorCodes.ValidationRange, "數量至少為 1。");
            }

            // 重下單時沿用來源單的名稱快照：來源產品已下架也要看得到當初申請的是什麼。
            var snapshot = sourceItems?
                .FirstOrDefault(i => i.GradeCode == input.GradeCode && i.RequestedSpec == input.RequestedSpec)?
                .ProductNameSnapshot;

            sample.Items.Add(new SampleRequestItem
            {
                ProductId = product?.Id,
                CategoryId = product?.CategoryId,
                GradeCode = input.GradeCode?.Trim(),
                ProductNameSnapshot = snapshot ?? product?.Name ?? input.GradeCode ?? "—",
                RequestedSpec = input.RequestedSpec?.Trim(),
                Quantity = input.Quantity,
                Unit = string.IsNullOrWhiteSpace(input.Unit) ? "pcs" : input.Unit.Trim(),
                SortOrder = sort++,
            });
        }

        db.SampleRequests.Add(sample);
        await db.SaveChangesAsync(req.HttpContext.RequestAborted);

        return await LoadAsync(req, sample.RequestNumber)
            ?? throw new AppException(ErrorCodes.Internal, "建立後讀不回申請單。", 500);
    }

    private async Task<SampleRequestDto?> LoadAsync(HttpRequest req, string requestNumber)
    {
        var memberId = AccountAuthService.MemberId(req.HttpContext.User);

        var row = await db.SampleRequests
            .Where(r => r.MemberId == memberId && r.RequestNumber == requestNumber)
            .Select(r => new
            {
                Request = r,
                Items = r.Items
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new SampleRequestItemDto(
                        i.Product!.Slug,
                        i.ProductNameSnapshot,
                        i.GradeCode,
                        i.RequestedSpec,
                        i.Quantity,
                        i.Unit,
                        i.ShippedQuantity))
                    .ToList(),
            })
            .SingleOrDefaultAsync(req.HttpContext.RequestAborted);

        if (row is null)
        {
            return null;
        }

        var r2 = row.Request;

        return new SampleRequestDto(
            r2.RequestNumber,
            MemberEnumNames.SampleStatus(r2.Status),
            r2.CreatedAt,
            r2.SubmittedAt,
            r2.ApprovedAt,
            r2.ShippedAt,
            r2.DeliveredAt,
            r2.RejectionReason,
            r2.Carrier,
            r2.TrackingNumber,
            r2.TrackingUrl,
            r2.ProjectName,
            r2.TargetApplication,
            r2.MemberNote,
            new ShippingAddressDto(
                r2.ShipToName,
                r2.ShipToCompany,
                r2.ShipToAddressLine1,
                r2.ShipToAddressLine2,
                r2.ShipToCity,
                r2.ShipToState,
                r2.ShipToPostalCode,
                r2.ShipToCountryCode,
                r2.ShipToPhone),
            row.Items);
    }

    /// <summary>
    /// <c>SR-{年}-{六位流水}</c>。年度內遞增，跨年重新從 1 起算。
    ///
    /// <para>
    /// 併發下兩張單可能撞號，靠 <c>RequestNumber</c> 的唯一索引擋住（第二筆存檔失敗）。
    /// 樣品申請的量級不需要為此加一張號碼表。
    /// </para>
    /// </summary>
    private async Task<string> NextRequestNumberAsync(CancellationToken cancellationToken)
    {
        var year = Clock.UtcNow.Year;
        var prefix = $"SR-{year}-";

        var last = await db.SampleRequests
            .Where(r => r.RequestNumber.StartsWith(prefix))
            .OrderByDescending(r => r.RequestNumber)
            .Select(r => r.RequestNumber)
            .FirstOrDefaultAsync(cancellationToken);

        var next = last is { Length: > 0 } && int.TryParse(last[prefix.Length..], out var parsed) ? parsed + 1 : 1;

        return prefix + next.ToString("D6");
    }

    /// <summary>只有已核准的會員能送單（docs/cms-api.md）。狀態一併回給前台顯示卡在哪一關。</summary>
    private static void RequireApproved(HttpRequest req)
    {
        var status = req.HttpContext.User.FindFirst("member_status")?.Value ?? "unknown";

        if (status != "approved")
        {
            throw new AppException(
                ErrorCodes.AuthMemberNotApproved, $"帳號通過審核後才能送出樣品申請（目前狀態：{status}）。", 403);
        }
    }

    private static async Task<T> ReadAsync<T>(HttpRequest req)
        where T : new()
    {
        try
        {
            return await req.ReadFromJsonAsync<T>() ?? new T();
        }
        catch (System.Text.Json.JsonException)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "請求主體必須是合法的 JSON。");
        }
    }
}
