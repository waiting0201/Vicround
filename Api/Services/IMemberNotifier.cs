using Microsoft.Extensions.Logging;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services;

/// <summary>
/// 會員信件（驗證信、重設密碼信）。
///
/// <para>
/// ⚠️ <b>寄信管道尚未接上</b>——與 <see cref="ContactInquiryService"/> 的通知信是同一個待辦，
/// 等 Communication Services / SMTP 設定就緒後一起補。在那之前
/// <see cref="LoggingMemberNotifier"/> 只把連結寫進 log，讓註冊與重設密碼的流程
/// <b>在本機與測試環境可以完整走完</b>。
/// </para>
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
}

/// <summary>
/// 暫時的實作：把連結寫進 Application Insights 的 trace。
///
/// <para>
/// <b>刻意用 Warning 等級</b>——這不是正常狀態，不該安靜地混在 Information 裡；
/// 正式環境若真的走到這裡，我們希望它在遙測上顯眼。
/// </para>
/// </summary>
public sealed class LoggingMemberNotifier(ILogger<LoggingMemberNotifier> logger) : IMemberNotifier
{
    public Task SendEmailVerificationAsync(Member member, string token, CancellationToken cancellationToken)
    {
        logger.LogWarning(
            "寄信尚未接上：{Email} 的驗證連結為 /member/verify?token={Token}", member.Email, token);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(Member member, string token, CancellationToken cancellationToken)
    {
        logger.LogWarning(
            "寄信尚未接上：{Email} 的重設密碼連結為 /member/reset?token={Token}", member.Email, token);

        return Task.CompletedTask;
    }
}
