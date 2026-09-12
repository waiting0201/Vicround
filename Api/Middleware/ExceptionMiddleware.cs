using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Middleware;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VicRound.Api.Common;

namespace VicRound.Api.Middleware;

/// <summary>
/// 全域例外處理。是 <see cref="IFunctionsWorkerMiddleware"/>（worker 層）而<b>不是</b>
/// ASP.NET Core middleware——因為採 <c>ConfigureFunctionsWebApplication</c>，
/// 回應要透過 <c>context.GetHttpContext()</c> 寫回。
/// </summary>
public sealed class ExceptionMiddleware(ILogger<ExceptionMiddleware> logger) : IFunctionsWorkerMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        // 預設會把中文 escape 成 \uXXXX，與 Router 走 MVC 序列化的回應長得不一樣。
        // 同一支 API 的錯誤訊息不該有兩種樣子。
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    private const int ConstraintViolation = 547;    // FK 或 CHECK
    private const int UniqueIndexViolation = 2601;
    private const int UniqueViolation = 2627;

    private static readonly int[] ConstraintErrors = [ConstraintViolation, UniqueIndexViolation, UniqueViolation];

    public async Task Invoke(FunctionContext context, FunctionExecutionDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (AppException e)
        {
            logger.LogWarning(e, "AppException [{Code}/{StatusCode}]: {Message}", e.Code, e.StatusCode, e.Message);
            await WriteErrorAsync(context, e.StatusCode, e.Code, e.Message);
        }
        catch (InvalidOperationException e)
            when (e.Message.Contains("Incorrect Content-Type", StringComparison.OrdinalIgnoreCase))
        {
            // ReadFormAsync 對非 multipart 的請求拋這個。不單獨接住會變成 500，
            // 看起來像伺服器壞掉而不是請求格式錯。
            logger.LogWarning(e, "表單解析失敗 [{Function}]", context.FunctionDefinition.Name);
            await WriteErrorAsync(context, 400, ErrorCodes.UploadType,
                "請求需為 multipart/form-data 或 application/x-www-form-urlencoded。");
        }
        catch (DbUpdateException e) when (e.InnerException is SqlException sql && ConstraintErrors.Contains(sql.Number))
        {
            // 約束擋下的寫入是「請求有問題」，不是伺服器壞了。不轉譯的話前端只會看到 500。
            // VicRound 的 CHECK 很多（slug 格式、owner triple），這條特別容易踩到。
            logger.LogWarning(e, "DB 約束擋下寫入：{Number} {Message}", sql.Number, sql.Message);

            var (code, message) = sql.Number switch
            {
                UniqueViolation or UniqueIndexViolation =>
                    (ErrorCodes.ConflictDuplicate, "資料重複，請檢查唯一欄位（如 slug、代號、帳號、Email）。"),
                _ =>
                    (ErrorCodes.ConflictState, "資料關聯或值域檢查未通過，請確認 slug 格式與所選的關聯項目。"),
            };

            await WriteErrorAsync(context, 409, code, message);
        }
        catch (Exception e)
        {
            // 對外只回通用訊息，細節只進 App Insights。
            logger.LogError(e, "未預期例外 [{Function}]", context.FunctionDefinition.Name);
            await WriteErrorAsync(context, 500, ErrorCodes.Internal, "伺服器發生非預期錯誤。");
        }
    }

    private static async Task WriteErrorAsync(FunctionContext context, int status, string code, string message)
    {
        var http = context.GetHttpContext();
        if (http is null || http.Response.HasStarted)
        {
            return;
        }

        http.Response.StatusCode = status;
        http.Response.ContentType = "application/json; charset=utf-8";

        await http.Response.WriteAsync(
            JsonSerializer.Serialize(ApiResponse.Fail(code, message), JsonOptions));
    }
}
