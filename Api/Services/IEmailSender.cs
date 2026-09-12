using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace VicRound.Api.Services;

/// <summary>一封要寄出去的信。純資料，不知道自己會被 SMTP 還是別的管道送走。</summary>
/// <param name="ToEmail">收件者信箱。</param>
/// <param name="ToName">收件者顯示名稱；沒有就只寄給信箱。</param>
/// <param name="Subject">主旨。</param>
/// <param name="HtmlBody">HTML 內文。</param>
/// <param name="TextBody">純文字內文——不是可有可無的備援，缺了會直接拉高垃圾信評分。</param>
/// <param name="ReplyTo">回覆位址；詢問單的通知信用它把業務的「回覆」直接送到客戶手上。</param>
public sealed record EmailMessage(
    string ToEmail,
    string? ToName,
    string Subject,
    string HtmlBody,
    string TextBody,
    string? ReplyTo = null);

/// <summary>
/// 寄信的底層管道。<b>刻意只有這一個方法</b>——「要寄什麼」由各自的 notifier 決定，
/// 這一層只管「怎麼送出去」，換寄信商時不該動到任何一封信的內容。
/// </summary>
public interface IEmailSender
{
    /// <summary>設定是否齊備。沒設好時 <see cref="SendAsync"/> 仍可呼叫，只是不會真的寄出。</summary>
    bool IsConfigured { get; }

    /// <summary>
    /// 寄出一封信。<b>永不丟例外</b>——寄信失敗不該讓註冊或詢問單送出跟著失敗
    /// （帳號已經建好、詢問單已經落庫了）。失敗只記遙測，回傳 false。
    /// </summary>
    Task<bool> SendAsync(EmailMessage message, CancellationToken cancellationToken);
}

/// <summary>
/// SMTP 寄信。設定鍵（App Settings / Key Vault，永不進版控）：
/// <list type="bullet">
///   <item><c>Mail:Host</c>、<c>Mail:Port</c>（預設 587）、<c>Mail:User</c>、<c>Mail:Password</c></item>
///   <item><c>Mail:From</c>、<c>Mail:FromName</c>（預設 VicRound）</item>
///   <item><c>Mail:UseStartTls</c>（預設 true）</item>
/// </list>
///
/// <para>
/// <b>為什麼是 SMTP 而不是 Communication Services 的 SDK</b>：ACS Email 本身就提供 SMTP relay，
/// SendGrid、M365、客戶自己的郵件主機也都是 SMTP。押在 SMTP 上等於一套實作涵蓋所有候選管道，
/// 也不必為了寄兩種信多背一個 Azure SDK 相依。真要換成 ACS SDK，換掉這個類別即可。
/// </para>
///
/// <para>
/// <b>沒設定時不寄、不擋、只記警告</b>——理由與 <see cref="TurnstileAntiBotVerifier"/> 相同：
/// 本機與尚未配置郵件主機的環境要能把註冊流程走完，但正式環境缺設定必須在遙測上持續喊。
/// </para>
/// </summary>
public sealed class SmtpEmailSender(
    IConfiguration configuration,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private string? Host => Value("Mail:Host", "VICROUND_MAIL_HOST");
    private string? From => Value("Mail:From", "VICROUND_MAIL_FROM");

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(From);

    public async Task<bool> SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            // Warning 而非 Information：這不是正常狀態，不該安靜地混在一般日誌裡。
            logger.LogWarning(
                "未設定 Mail:Host / Mail:From，未寄出給 {Email} 的「{Subject}」。",
                message.ToEmail, message.Subject);

            return false;
        }

        try
        {
            using var mail = Compose(message);
            using var client = CreateClient();

            await client.SendMailAsync(mail, cancellationToken);

            logger.LogInformation("已寄出「{Subject}」給 {Email}。", message.Subject, message.ToEmail);
            return true;
        }
        catch (Exception ex) when (ex is SmtpException or InvalidOperationException or FormatException or IOException)
        {
            // 吞掉的理由見介面說明：呼叫端的業務動作已經完成，不該因為寄信失敗而回滾。
            logger.LogError(ex, "寄出「{Subject}」給 {Email} 失敗。", message.Subject, message.ToEmail);
            return false;
        }
    }

    private MailMessage Compose(EmailMessage message)
    {
        var fromName = Value("Mail:FromName", "VICROUND_MAIL_FROM_NAME") ?? "VicRound";

        var mail = new MailMessage
        {
            From = new MailAddress(From!, fromName),
            Subject = message.Subject,
            Body = message.TextBody,
            IsBodyHtml = false,
            SubjectEncoding = System.Text.Encoding.UTF8,
            BodyEncoding = System.Text.Encoding.UTF8,
        };

        mail.To.Add(string.IsNullOrWhiteSpace(message.ToName)
            ? new MailAddress(message.ToEmail)
            : new MailAddress(message.ToEmail, message.ToName));

        // 純文字當主體、HTML 當替代檢視：收件端挑得到 HTML 就顯示 HTML，挑不到也還有東西看。
        mail.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(
            message.HtmlBody, System.Text.Encoding.UTF8, "text/html"));

        if (!string.IsNullOrWhiteSpace(message.ReplyTo))
        {
            mail.ReplyToList.Add(new MailAddress(message.ReplyTo));
        }

        return mail;
    }

    private SmtpClient CreateClient()
    {
        var user = Value("Mail:User", "VICROUND_MAIL_USER");
        var password = Value("Mail:Password", "VICROUND_MAIL_PASSWORD");

        var client = new SmtpClient(Host!)
        {
            Port = int.TryParse(Value("Mail:Port", "VICROUND_MAIL_PORT"), out var port) ? port : 587,
            EnableSsl = !string.Equals(Value("Mail:UseStartTls", "VICROUND_MAIL_STARTTLS"), "false", StringComparison.OrdinalIgnoreCase),
            DeliveryMethod = SmtpDeliveryMethod.Network,
        };

        // 沒給帳密就用匿名寄送（內網 relay 的常見設定）；給了才帶認證。
        if (!string.IsNullOrWhiteSpace(user))
        {
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(user, password ?? string.Empty);
        }

        return client;
    }

    private string? Value(string key, string fallbackKey)
    {
        var value = configuration[key];
        return string.IsNullOrWhiteSpace(value) ? configuration[fallbackKey] : value;
    }
}
