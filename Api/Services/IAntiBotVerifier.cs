using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace VicRound.Api.Services;

public interface IAntiBotVerifier
{
    Task<bool> VerifyAsync(string? token, string? remoteIp, CancellationToken cancellationToken);
}

/// <summary>
/// Cloudflare Turnstile 的 siteverify 驗證。
/// <para>
/// <b>沒有設定金鑰時直接放行</b>並記一筆警告——本機開發與尚未申請金鑰的環境要能送出表單，
/// 但正式環境缺金鑰會在 log 裡持續喊。金鑰放
/// <c>AntiBot:TurnstileSecret</c>（App Settings / Key Vault），永不進版控。
/// </para>
/// </summary>
public sealed class TurnstileAntiBotVerifier(
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    ILogger<TurnstileAntiBotVerifier> logger) : IAntiBotVerifier
{
    private const string VerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    public async Task<bool> VerifyAsync(string? token, string? remoteIp, CancellationToken cancellationToken)
    {
        var secret = configuration["AntiBot:TurnstileSecret"] ?? configuration["VICROUND_TURNSTILE_SECRET"];

        if (string.IsNullOrWhiteSpace(secret))
        {
            logger.LogWarning("未設定 AntiBot:TurnstileSecret，本次略過 anti-bot 驗證。");
            return true;
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        var form = new List<KeyValuePair<string, string>>
        {
            new("secret", secret),
            new("response", token),
        };

        if (!string.IsNullOrWhiteSpace(remoteIp))
        {
            form.Add(new KeyValuePair<string, string>("remoteip", remoteIp));
        }

        try
        {
            var client = httpClientFactory.CreateClient(nameof(TurnstileAntiBotVerifier));
            using var response = await client.PostAsync(VerifyUrl, new FormUrlEncodedContent(form), cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            using var json = JsonDocument.Parse(body);
            return json.RootElement.TryGetProperty("success", out var success) && success.GetBoolean();
        }
        catch (Exception e) when (e is HttpRequestException or TaskCanceledException or JsonException)
        {
            // 驗證服務掛掉時放行：擋下所有真人的詢問，比放進少量機器人更貴。
            logger.LogError(e, "Turnstile 驗證失敗，本次放行。");
            return true;
        }
    }
}
