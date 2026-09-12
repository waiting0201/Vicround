using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Services;

namespace VicRound.Api.Handlers;

/// <summary>
/// <c>POST /api/v1/contact</c>。公開站唯一的寫入端點，因此把三道防線都放在這裡：
/// 蜜罐、anti-bot token、以 IP 為鍵的限流（docs/cms-api.md）。
/// </summary>
public sealed class ContactHandler(
    IContactInquiryService inquiries,
    IRateLimiter rateLimiter,
    IAntiBotVerifier antiBot)
{
    // 每個請求都計入，包含驗證失敗的——擋的是重送本身，不是只擋成功的那幾筆。
    // 額度給到 10 是因為使用者打錯 Email 再送幾次很正常，不該因此被鎖十分鐘。
    private const int MaxPerWindow = 10;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(10);

    public async Task<IActionResult> SubmitAsync(HttpRequest req)
    {
        var request = await ReadAsync(req);
        var clientIp = Common.ClientIp.Of(req);

        // 蜜罐先擋：真人看不到那個欄位，有值就不必再花一次 siteverify 的往返。
        if (!string.IsNullOrWhiteSpace(request.Website))
        {
            throw AppException.BadRequest(ErrorCodes.BotCheckFailed, "送出未通過機器人檢查。");
        }

        if (!rateLimiter.TryAcquire($"contact:{clientIp}", MaxPerWindow, Window))
        {
            throw new AppException(ErrorCodes.RateLimited, "送出過於頻繁，請稍後再試。", 429);
        }

        if (!await antiBot.VerifyAsync(request.AntiBotToken, clientIp, req.HttpContext.RequestAborted))
        {
            throw AppException.BadRequest(ErrorCodes.BotCheckFailed, "送出未通過機器人檢查。");
        }

        var culture = string.IsNullOrWhiteSpace(request.Culture) ? LangResolver.Resolve(req) : request.Culture;
        var referenceNumber = await inquiries.SubmitAsync(request, culture, req.HttpContext.RequestAborted);

        // 表單送出永不快取。回 202 而不是 201：單據已經落庫，但「有人會回覆你」這件事
        // 還沒發生——通知信寄不出去時我們也不會讓送出失敗（見 IInquiryNotifier）。
        CacheControl.NoStore(req.HttpContext.Response);
        return new ObjectResult(ApiResponse.Ok(new ContactAcceptedDto(referenceNumber))) { StatusCode = 202 };
    }

    private static async Task<ContactRequest> ReadAsync(HttpRequest req)
    {
        try
        {
            return await req.ReadFromJsonAsync<ContactRequest>()
                ?? throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請求主體不可為空。");
        }
        catch (System.Text.Json.JsonException)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationFormat, "請求主體必須是合法的 JSON。");
        }
    }
}
