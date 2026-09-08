namespace VicRound.Api.Common;

/// <summary>
/// JWT audience。兩套身分完全隔離，一方的 token 打另一方一律 401
/// （docs/database.md §14.1）。
/// </summary>
public static class TokenAudiences
{
    public const string Admin = "vicround-admin-api";
    public const string Member = "vicround-public-api";
}

public static class TokenIssuers
{
    public const string Admin = "vicround-admin";
    public const string Member = "vicround-account";
}

public static class Clock
{
    public static DateTime UtcNow => DateTime.UtcNow;
}
