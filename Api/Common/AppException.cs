namespace VicRound.Api.Common;

/// <summary>
/// 帶錯誤碼與 HTTP status 的業務例外。<b>禁止 <c>throw new Exception(...)</c></b>——
/// 沒有 code、沒有 status，只會變成 500。
/// </summary>
public sealed class AppException(string code, string message, int statusCode = 400) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;

    public static AppException NotFound(string resource) =>
        new(ErrorCodes.NotFound, $"{resource} 不存在。", 404);

    public static AppException Unauthorized(string? detail = null) =>
        new(ErrorCodes.AuthTokenInvalid, detail ?? "未授權。", 401);

    public static AppException Forbidden(string? detail = null) =>
        new(ErrorCodes.Forbidden, detail ?? "權限不足。", 403);

    public static AppException BadRequest(string code, string detail) => new(code, detail, 400);

    public static AppException Conflict(string code, string detail) => new(code, detail, 409);
}
