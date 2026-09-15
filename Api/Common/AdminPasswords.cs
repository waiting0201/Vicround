namespace VicRound.Api.Common;

/// <summary>
/// 後台帳號（<c>Users.PasswordHash</c>）的密碼長度下限。
/// <para>
/// 單獨一支是為了只有一個地方可以改——管理員替人設定密碼（<c>AdminCrudService</c>）
/// 與使用者自己改密碼（<c>AdminAuthService</c>）必須是同一個下限，先前兩邊各寫一次
/// 數字，只改一邊就會出現「設得進去卻改不動」的怪事。
/// </para>
/// <para>
/// <b>與前台會員無關</b>：會員是另一套身分（<c>Members</c>），下限在
/// <c>AccountAuthService</c> 自己維護，不共用這裡的值。
/// </para>
/// </summary>
public static class AdminPasswords
{
    public const int MinLength = 6;
}
