using System.Text.RegularExpressions;

namespace VicRound.Api.Common;

/// <summary>
/// 後台登入帳號（<c>Users.Username</c>）的格式與正規化規則。
/// <para>
/// 帳號<b>不是</b> Email（database.md §13）：後台沒有寄信管道，開帳號與給密碼都由管理員完成，
/// 因此帳號只要好唸、好交代，不需要能收信。字元集刻意窄——大小寫英數與 <c>. _ -</c>——
/// 免得出現看起來一樣卻是不同列的帳號（全形字、前後空白、同形字）。
/// </para>
/// </summary>
public static partial class Usernames
{
    public const int MinLength = 3;

    public const int MaxLength = 64;

    /// <summary>比對唯一性與登入用的鍵：<c>UPPER(TRIM(Username))</c>，與資料庫的唯一索引同一套規則。</summary>
    public static string Normalize(string? value) =>
        (value ?? string.Empty).Trim().ToUpperInvariant();

    public static bool IsValid(string? value) =>
        !string.IsNullOrWhiteSpace(value) && Pattern().IsMatch(value.Trim());

    /// <summary>驗證並回傳去除前後空白的帳號；格式不合就丟 400。</summary>
    public static string Require(string? value)
    {
        var trimmed = (value ?? string.Empty).Trim();

        if (trimmed.Length == 0)
        {
            throw AppException.BadRequest(ErrorCodes.ValidationRequired, "請輸入帳號。");
        }

        if (!IsValid(trimmed))
        {
            throw AppException.BadRequest(
                ErrorCodes.ValidationFormat,
                $"帳號只能使用英文、數字與 . _ -，長度 {MinLength}–{MaxLength} 個字元。");
        }

        return trimmed;
    }

    // 長度與 MinLength / MaxLength 一致；GeneratedRegex 的樣式必須是常值，所以不能內插。
    [GeneratedRegex(@"^[A-Za-z0-9._-]{3,64}$", RegexOptions.CultureInvariant)]
    private static partial Regex Pattern();
}
