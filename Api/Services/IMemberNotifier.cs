using Microsoft.Extensions.Logging;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services;

/// <summary>
/// 會員信件（驗證信、重設密碼信）。
///
/// <para>
/// 做成介面而不是直接在服務裡寄信，是因為「token 產生」與「怎麼把 token 送到人手上」
/// 是兩件會分別改變的事：換寄信商不該動到狀態機。
/// </para>
/// </summary>
public interface IMemberNotifier
{
    Task SendEmailVerificationAsync(Member member, string token, CancellationToken cancellationToken);
    Task SendPasswordResetAsync(Member member, string token, CancellationToken cancellationToken);

    /// <summary>審核通過。驗證信裡承諾過「審核完成會通知您」，這就是那一封。</summary>
    Task SendApprovedAsync(Member member, CancellationToken cancellationToken);

    /// <summary>審核未通過。<paramref name="reason"/> 是後台必填的理由，原樣轉達。</summary>
    Task SendRejectedAsync(Member member, string? reason, CancellationToken cancellationToken);
}

/// <summary>
/// 把一次性 token 組成前台連結寄給會員。
///
/// <para>
/// <b>連結一律帶 <c>PreferredCulture</c> 的語系前綴</b>——收信人按下連結會落在他註冊時用的語言，
/// 而不是預設的英文（CLAUDE.md「Locale lives in the URL」）。前台對應的兩頁是
/// <c>/{culture}/member/verify</c> 與 <c>/{culture}/member/reset</c>。
/// </para>
///
/// <para>
/// <b>站台網址取自 <c>SiteSettings["site.baseUrl"]</c></b>，設定檔的 <c>Site:BaseUrl</c> 是備援。
/// 兩邊都沒有就<b>不寄</b>並把連結寫進遙測：寧可讓本機與未配置的環境退回舊行為，
/// 也不要真的寄出一封連結是壞的信給客戶。
/// </para>
/// </summary>
public sealed class EmailMemberNotifier(
    IEmailSender email,
    ISiteUrlResolver siteUrls,
    ILogger<EmailMemberNotifier> logger) : IMemberNotifier
{
    public Task SendEmailVerificationAsync(Member member, string token, CancellationToken cancellationToken) =>
        SendAsync(member, "member/verify", token, Verification, cancellationToken);

    public Task SendPasswordResetAsync(Member member, string token, CancellationToken cancellationToken) =>
        SendAsync(member, "member/reset", token, Reset, cancellationToken);

    /// <summary>
    /// 審核結果的兩封信沒有一次性 token，但仍然需要 base URL——核准信要把人帶進會員專區。
    /// 拒絕信不帶連結（那裡沒有他能做的事），所以少了 base URL 也照寄。
    /// </summary>
    public async Task SendApprovedAsync(Member member, CancellationToken cancellationToken)
    {
        var baseUrl = await siteUrls.BaseUrlAsync(cancellationToken);
        var link = baseUrl is null ? null : $"{baseUrl}/{member.PreferredCulture}/account";

        await email.SendAsync(Approved(member, link), cancellationToken);
    }

    public Task SendRejectedAsync(Member member, string? reason, CancellationToken cancellationToken) =>
        email.SendAsync(Rejected(member, reason), cancellationToken);

    private async Task SendAsync(
        Member member,
        string path,
        string token,
        Func<Member, string, EmailMessage> compose,
        CancellationToken cancellationToken)
    {
        var baseUrl = await siteUrls.BaseUrlAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            logger.LogWarning(
                "未設定 site.baseUrl，未寄出 {Email} 的信；連結為 /{Culture}/{Path}?token={Token}",
                member.Email, member.PreferredCulture, path, token);

            return;
        }

        var link = $"{baseUrl}/{member.PreferredCulture}/{path}?token={Uri.EscapeDataString(token)}";

        await email.SendAsync(compose(member, link), cancellationToken);
    }

    private static EmailMessage Verification(Member member, string link)
    {
        var zh = EmailTemplates.IsChinese(member.PreferredCulture);

        var subject = zh ? "請驗證你的 VicRound 帳號" : "Verify your VicRound account";
        var heading = zh ? "只差一步就完成註冊" : "One step left";

        var lines = zh
            ? new[]
            {
                $"{member.FullName} 您好，感謝您註冊 VicRound 會員專區。",
                "請點擊下方按鈕驗證這個信箱。驗證後，我們會在一個工作天內完成帳號審核並通知您。",
                "這個連結 3 天後失效。若這不是您本人的操作，請忽略這封信。",
            }
            : new[]
            {
                $"Hello {member.FullName}, thank you for registering for the VicRound member area.",
                "Please confirm this address with the button below. Once confirmed, we review your account within one business day and let you know.",
                "This link expires in 3 days. If you did not create this account, you can ignore this message.",
            };

        var label = zh ? "驗證信箱" : "Verify email";

        return Build(member, subject, heading, lines, label, link);
    }

    private static EmailMessage Reset(Member member, string link)
    {
        var zh = EmailTemplates.IsChinese(member.PreferredCulture);

        var subject = zh ? "重設你的 VicRound 密碼" : "Reset your VicRound password";
        var heading = zh ? "重設密碼" : "Reset your password";

        var lines = zh
            ? new[]
            {
                $"{member.FullName} 您好，我們收到重設 VicRound 帳號密碼的要求。",
                "請點擊下方按鈕設定新密碼。完成後，其他裝置上已登入的工作階段都會被登出。",
                "這個連結 2 小時後失效。若不是您本人提出的，請忽略這封信，密碼不會有任何變動。",
            }
            : new[]
            {
                $"Hello {member.FullName}, we received a request to reset the password for your VicRound account.",
                "Use the button below to choose a new password. Any sessions signed in on other devices will be signed out.",
                "This link expires in 2 hours. If you did not request it, ignore this message — your password stays unchanged.",
            };

        var label = zh ? "設定新密碼" : "Choose a new password";

        return Build(member, subject, heading, lines, label, link);
    }

    private static EmailMessage Approved(Member member, string? link)
    {
        var zh = EmailTemplates.IsChinese(member.PreferredCulture);

        var subject = zh ? "你的 VicRound 會員帳號已開通" : "Your VicRound account is active";
        var heading = zh ? "帳號已開通" : "Your account is active";

        var lines = zh
            ? new[]
            {
                $"{member.FullName} 您好，您的 VicRound 會員帳號已通過審核。",
                "現在可以下載會員專屬的規格書與測試報告，也可以直接線上申請樣品。",
            }
            : new[]
            {
                $"Hello {member.FullName}, your VicRound member account has been approved.",
                "You can now download member-only spec sheets and test reports, and request samples online.",
            };

        // 沒有 base URL 時就只有文字：與其放一條壞連結，不如讓他自己從網站登入。
        var body = string.Concat(lines.Select(EmailTemplates.Paragraph))
            + (link is null
                ? string.Empty
                : EmailTemplates.Button(zh ? "進入會員專區" : "Go to the member area", link));

        return new EmailMessage(
            member.Email,
            member.FullName,
            subject,
            EmailTemplates.Layout(heading, body, member.PreferredCulture),
            string.Join("\n\n", lines) + (link is null ? string.Empty : "\n\n" + link));
    }

    private static EmailMessage Rejected(Member member, string? reason)
    {
        var zh = EmailTemplates.IsChinese(member.PreferredCulture);

        var subject = zh ? "關於你的 VicRound 會員申請" : "About your VicRound account application";
        var heading = zh ? "會員申請結果" : "Your application";

        var lines = new List<string>(zh
            ? new[]
            {
                $"{member.FullName} 您好，感謝您申請 VicRound 會員專區。",
                "很抱歉，這次的申請未能通過審核。",
            }
            : new[]
            {
                $"Hello {member.FullName}, thank you for applying for a VicRound member account.",
                "Unfortunately we are not able to approve this application.",
            });

        if (!string.IsNullOrWhiteSpace(reason))
        {
            lines.Add((zh ? "原因：" : "Reason: ") + reason.Trim());
        }

        // 收尾一律給一條人的路徑：審核結果有誤判的時候，對方需要知道找誰。
        lines.Add(zh
            ? "若您認為這是誤判，或想補充公司資訊，歡迎透過網站的聯絡表單與我們聯繫。"
            : "If you believe this is a mistake, or would like to add company details, please contact us through the website's contact form.");

        return new EmailMessage(
            member.Email,
            member.FullName,
            subject,
            EmailTemplates.Layout(
                heading, string.Concat(lines.Select(EmailTemplates.Paragraph)), member.PreferredCulture),
            string.Join("\n\n", lines));
    }

    private static EmailMessage Build(
        Member member, string subject, string heading, IReadOnlyList<string> lines, string buttonLabel, string link)
    {
        var html = EmailTemplates.Layout(
            heading,
            string.Concat(lines.Select(EmailTemplates.Paragraph))
            + EmailTemplates.Button(buttonLabel, link)
            + EmailTemplates.FallbackLink(link, member.PreferredCulture),
            member.PreferredCulture);

        var text = string.Join("\n\n", lines) + "\n\n" + link;

        return new EmailMessage(member.Email, member.FullName, subject, html, text);
    }
}
