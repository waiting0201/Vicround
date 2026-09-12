using Microsoft.Extensions.Logging;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services;

/// <summary>詢問單送出後的兩封信：給收件窗口的通知，給填表人的回執。</summary>
public interface IInquiryNotifier
{
    /// <param name="channelEmail">指派到的收件窗口；沒有對應窗口時為 <c>null</c>，只寄回執。</param>
    /// <param name="categorySlug">表單選的產品線，直接用 slug——通知信的讀者是自己人。</param>
    Task NotifyAsync(
        ContactInquiry inquiry, string? channelEmail, string? categorySlug, CancellationToken cancellationToken);
}

/// <summary>
/// 兩封信都寄，但<b>失敗互不影響</b>：業務沒收到通知，客戶還是該拿到回執（反之亦然），
/// 而且兩封都失敗也不能讓 <c>POST /v1/contact</c> 回錯——單據已經落庫，後台看得到。
/// <see cref="IEmailSender"/> 本身不丟例外，這裡順著那個約定走。
/// </summary>
public sealed class InquiryNotifier(
    IEmailSender email,
    ILogger<InquiryNotifier> logger) : IInquiryNotifier
{
    public async Task NotifyAsync(
        ContactInquiry inquiry, string? channelEmail, string? categorySlug, CancellationToken cancellationToken)
    {
        if (!email.IsConfigured)
        {
            logger.LogWarning(
                "寄信未設定，詢問單 {ReferenceNumber} 只落庫、未通知 {Channel}。",
                inquiry.ReferenceNumber, channelEmail ?? "（未指派窗口）");

            return;
        }

        if (!string.IsNullOrWhiteSpace(channelEmail))
        {
            await email.SendAsync(ToStaff(inquiry, channelEmail, categorySlug), cancellationToken);
        }
        else
        {
            logger.LogWarning(
                "詢問單 {ReferenceNumber} 的類型 {Type} 沒有對應的收件窗口，未寄出通知信。",
                inquiry.ReferenceNumber, inquiry.Type);
        }

        await email.SendAsync(ToCustomer(inquiry), cancellationToken);
    }

    /// <summary>
    /// 給業務的通知信。<b>一律用英文</b>——收件人是自己人，而且
    /// <c>Reply-To</c> 設成客戶的信箱，按下「回覆」就是直接回給客戶，不必再複製貼上。
    /// </summary>
    private static EmailMessage ToStaff(ContactInquiry inquiry, string channelEmail, string? categorySlug)
    {
        var rows = new List<(string, string)>
        {
            ("Reference", inquiry.ReferenceNumber),
            ("Type", inquiry.Type.ToString()),
            ("Name", inquiry.Name),
            ("Company", inquiry.CompanyName),
            ("Email", inquiry.Email),
        };

        Add(rows, "Phone", inquiry.Phone);
        Add(rows, "Product line", categorySlug ?? inquiry.ProductLineOther);
        Add(rows, "Application", inquiry.ApplicationText);
        Add(rows, "Target spec", inquiry.TargetSpec);
        Add(rows, "Message", inquiry.Message);
        rows.Add(("Submitted from", inquiry.SourceUrl));
        rows.Add(("Locale", inquiry.Culture));

        var html = EmailTemplates.Layout(
            $"New inquiry {inquiry.ReferenceNumber}",
            EmailTemplates.Paragraph($"{inquiry.Name} ({inquiry.CompanyName}) submitted the contact form.")
            + EmailTemplates.DefinitionList(rows),
            CultureCodes.Default);

        var text = string.Join("\n", rows.Select(row => $"{row.Item1}: {row.Item2}"));

        return new EmailMessage(
            channelEmail,
            null,
            $"[VicRound] New inquiry {inquiry.ReferenceNumber} — {inquiry.CompanyName}",
            html,
            text,
            ReplyTo: inquiry.Email);
    }

    /// <summary>給填表人的回執，語言跟著他送出時所在的頁面（<c>Culture</c>）。</summary>
    private static EmailMessage ToCustomer(ContactInquiry inquiry)
    {
        var zh = EmailTemplates.IsChinese(inquiry.Culture);

        var subject = zh
            ? $"我們已收到您的詢問（{inquiry.ReferenceNumber}）"
            : $"We received your enquiry ({inquiry.ReferenceNumber})";

        var heading = zh ? "已收到您的詢問" : "Your enquiry has been received";

        var lines = zh
            ? new[]
            {
                $"{inquiry.Name} 您好，感謝您與 VicRound 盈絲實業聯絡。",
                $"您的詢問單號是 {inquiry.ReferenceNumber}，我們的業務團隊會在一個工作天內回覆。",
                "若需要補充資料，直接回覆這封信即可。",
            }
            : new[]
            {
                $"Hello {inquiry.Name}, thank you for contacting VicRound.",
                $"Your reference number is {inquiry.ReferenceNumber}. Our team replies within one business day.",
                "If you need to add anything, simply reply to this message.",
            };

        var html = EmailTemplates.Layout(
            heading, string.Concat(lines.Select(EmailTemplates.Paragraph)), inquiry.Culture);

        return new EmailMessage(
            inquiry.Email, inquiry.Name, subject, html, string.Join("\n\n", lines));
    }

    private static void Add(List<(string, string)> rows, string label, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            rows.Add((label, value));
        }
    }
}
