using Microsoft.Extensions.Logging;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services;

/// <summary>樣品申請的通知：送出時給業務與會員，狀態變動時給會員。</summary>
public interface ISampleRequestNotifier
{
    /// <summary>送出時：給收件窗口的通知（附品項與收件地址）＋給會員的回執。</summary>
    Task NotifySubmittedAsync(SampleRequest request, Member member, CancellationToken cancellationToken);

    /// <summary>
    /// 狀態變動時通知會員。<b>只有三個狀態會寄信</b>——核准、出貨、拒絕；
    /// 其餘（審核中、已送達、已取消）對收信的人沒有任何該做的事，寄了只是噪音。
    /// </summary>
    Task NotifyStatusAsync(SampleRequest request, Member member, CancellationToken cancellationToken);
}

/// <summary>
/// 與 <see cref="IInquiryNotifier"/> 同一組取捨：兩封信互不影響，失敗只記遙測，
/// 永遠不讓業務動作跟著失敗——單據已經落庫，後台看得到。
/// </summary>
public sealed class SampleRequestNotifier(
    IEmailSender email,
    IContactChannelResolver channels,
    ISiteUrlResolver siteUrls,
    ILogger<SampleRequestNotifier> logger) : ISampleRequestNotifier
{
    public async Task NotifySubmittedAsync(
        SampleRequest request, Member member, CancellationToken cancellationToken)
    {
        if (!email.IsConfigured)
        {
            logger.LogWarning(
                "寄信未設定，樣品申請 {RequestNumber} 只落庫、未通知任何人。", request.RequestNumber);

            return;
        }

        var channel = await channels.ResolveAsync(InquiryType.SampleRequest, cancellationToken);

        if (channel is not null)
        {
            await email.SendAsync(ToStaff(request, member, channel.Email), cancellationToken);
        }
        else
        {
            logger.LogWarning(
                "沒有可用的收件窗口，樣品申請 {RequestNumber} 未寄出通知信。", request.RequestNumber);
        }

        await email.SendAsync(Receipt(request, member, await LinkAsync(member, request, cancellationToken)), cancellationToken);
    }

    public async Task NotifyStatusAsync(SampleRequest request, Member member, CancellationToken cancellationToken)
    {
        var message = request.Status switch
        {
            SampleRequestStatus.Approved or SampleRequestStatus.Shipped or SampleRequestStatus.Rejected =>
                StatusUpdate(request, member, await LinkAsync(member, request, cancellationToken)),
            _ => null,
        };

        if (message is not null)
        {
            await email.SendAsync(message, cancellationToken);
        }
    }

    /// <summary>會員專區裡這張單的網址；沒有 base URL 就不放連結（不放壞連結）。</summary>
    private async Task<string?> LinkAsync(Member member, SampleRequest request, CancellationToken cancellationToken)
    {
        var baseUrl = await siteUrls.BaseUrlAsync(cancellationToken);

        return baseUrl is null
            ? null
            : $"{baseUrl}/{member.PreferredCulture}/account/sample-requests/{Uri.EscapeDataString(request.RequestNumber)}";
    }

    /// <summary>給業務的通知。一律英文、<c>Reply-To</c> 設成申請人，理由同詢問單的通知信。</summary>
    private static EmailMessage ToStaff(SampleRequest request, Member member, string channelEmail)
    {
        var rows = new List<(string, string)>
        {
            ("Request", request.RequestNumber),
            ("Member", $"{member.FullName} <{member.Email}>"),
            ("Company", member.CompanyName),
        };

        Add(rows, "Project", request.ProjectName);
        Add(rows, "Target application", request.TargetApplication);
        Add(rows, "Member note", request.MemberNote);

        rows.Add(("Ship to", ShipTo(request)));

        foreach (var item in request.Items.OrderBy(i => i.SortOrder))
        {
            rows.Add((
                "Item",
                $"{item.ProductNameSnapshot}"
                + (string.IsNullOrWhiteSpace(item.GradeCode) ? "" : $" / {item.GradeCode}")
                + (string.IsNullOrWhiteSpace(item.RequestedSpec) ? "" : $" / {item.RequestedSpec}")
                + $" — {item.Quantity} {item.Unit}"));
        }

        var html = EmailTemplates.Layout(
            $"New sample request {request.RequestNumber}",
            EmailTemplates.Paragraph($"{member.FullName} ({member.CompanyName}) submitted a sample request.")
            + EmailTemplates.DefinitionList(rows),
            CultureCodes.Default);

        return new EmailMessage(
            channelEmail,
            null,
            $"[VicRound] Sample request {request.RequestNumber} — {member.CompanyName}",
            html,
            string.Join("\n", rows.Select(row => $"{row.Item1}: {row.Item2}")),
            ReplyTo: member.Email);
    }

    private static EmailMessage Receipt(SampleRequest request, Member member, string? link)
    {
        var zh = EmailTemplates.IsChinese(member.PreferredCulture);

        var lines = zh
            ? new[]
            {
                $"{member.FullName} 您好，我們已收到您的樣品申請。",
                $"單號是 {request.RequestNumber}，共 {request.Items.Count} 個品項。我們會先確認規格與庫存，通常一個工作天內回覆。",
                "核准與出貨時都會再寄信通知您，進度也可以在會員專區查詢。",
            }
            : new[]
            {
                $"Hello {member.FullName}, we have received your sample request.",
                $"Your reference is {request.RequestNumber}, covering {request.Items.Count} item(s). We check the specification and stock first, usually replying within one business day.",
                "We will email you again when it is approved and when it ships. You can also follow it in the member area.",
            };

        return Compose(
            member,
            zh ? $"已收到您的樣品申請（{request.RequestNumber}）" : $"Sample request received ({request.RequestNumber})",
            zh ? "已收到您的樣品申請" : "Sample request received",
            lines,
            zh ? "查看這張申請單" : "View this request",
            link);
    }

    private static EmailMessage StatusUpdate(SampleRequest request, Member member, string? link)
    {
        var zh = EmailTemplates.IsChinese(member.PreferredCulture);

        var (subject, heading, lines) = request.Status switch
        {
            SampleRequestStatus.Approved => (
                zh ? $"樣品申請已核准（{request.RequestNumber}）" : $"Sample request approved ({request.RequestNumber})",
                zh ? "樣品申請已核准" : "Sample request approved",
                zh
                    ? new[]
                    {
                        $"{member.FullName} 您好，您的樣品申請 {request.RequestNumber} 已核准。",
                        "我們正在備料，出貨時會再寄一封信給您，附上物流追蹤資訊。",
                    }
                    : new[]
                    {
                        $"Hello {member.FullName}, your sample request {request.RequestNumber} has been approved.",
                        "We are preparing the samples and will email you the tracking details when they ship.",
                    }),

            SampleRequestStatus.Shipped => (
                zh ? $"樣品已出貨（{request.RequestNumber}）" : $"Samples shipped ({request.RequestNumber})",
                zh ? "樣品已出貨" : "Your samples are on the way",
                Shipping(request, member, zh)),

            _ => (
                zh ? $"關於您的樣品申請（{request.RequestNumber}）" : $"About your sample request ({request.RequestNumber})",
                zh ? "樣品申請結果" : "Your sample request",
                Rejection(request, member, zh)),
        };

        return Compose(
            member,
            subject,
            heading,
            lines,
            zh ? "查看這張申請單" : "View this request",
            link);
    }

    private static string[] Shipping(SampleRequest request, Member member, bool zh)
    {
        var lines = new List<string>(zh
            ? [$"{member.FullName} 您好，您申請的樣品（{request.RequestNumber}）已經出貨。"]
            : [$"Hello {member.FullName}, the samples for {request.RequestNumber} have shipped."]);

        // 物流欄位是後台人員手填的，缺哪一個就跳過哪一個——寧可少一行，也不要出現「追蹤號碼：（空白）」。
        if (!string.IsNullOrWhiteSpace(request.Carrier))
        {
            lines.Add((zh ? "物流商：" : "Carrier: ") + request.Carrier);
        }

        if (!string.IsNullOrWhiteSpace(request.TrackingNumber))
        {
            lines.Add((zh ? "追蹤號碼：" : "Tracking number: ") + request.TrackingNumber);
        }

        if (!string.IsNullOrWhiteSpace(request.TrackingUrl))
        {
            lines.Add((zh ? "追蹤網址：" : "Tracking: ") + request.TrackingUrl);
        }

        lines.Add(zh
            ? "收到樣品後若需要完整的規格書或測試報告，會員專區都可以下載。"
            : "Once the samples arrive, full spec sheets and test reports are available in the member area.");

        return [.. lines];
    }

    private static string[] Rejection(SampleRequest request, Member member, bool zh)
    {
        var lines = new List<string>(zh
            ? [$"{member.FullName} 您好，很抱歉，您的樣品申請 {request.RequestNumber} 這次無法受理。"]
            : [$"Hello {member.FullName}, unfortunately we cannot fulfil sample request {request.RequestNumber}."]);

        if (!string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            lines.Add((zh ? "原因：" : "Reason: ") + request.RejectionReason.Trim());
        }

        lines.Add(zh
            ? "若需要改用其他規格或討論替代方案，直接回覆這封信即可。"
            : "If you would like a different specification or want to discuss alternatives, simply reply to this message.");

        return [.. lines];
    }

    private static EmailMessage Compose(
        Member member, string subject, string heading, IReadOnlyList<string> lines, string buttonLabel, string? link)
    {
        var body = string.Concat(lines.Select(EmailTemplates.Paragraph))
            + (link is null ? string.Empty : EmailTemplates.Button(buttonLabel, link));

        return new EmailMessage(
            member.Email,
            member.FullName,
            subject,
            EmailTemplates.Layout(heading, body, member.PreferredCulture),
            string.Join("\n\n", lines) + (link is null ? string.Empty : "\n\n" + link));
    }

    private static string ShipTo(SampleRequest request) => string.Join(", ", new[]
    {
        request.ShipToName,
        request.ShipToCompany,
        request.ShipToAddressLine1,
        request.ShipToAddressLine2,
        request.ShipToCity,
        request.ShipToState,
        request.ShipToPostalCode,
        request.ShipToCountryCode,
        request.ShipToPhone,
    }.Where(part => !string.IsNullOrWhiteSpace(part)));

    private static void Add(List<(string, string)> rows, string label, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            rows.Add((label, value));
        }
    }
}
