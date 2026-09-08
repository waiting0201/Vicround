using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;

namespace VicRound.Api.Handlers;

/// <summary>存活檢查。公開端點，<b>刻意不碰資料庫</b>——健康檢查被頻繁探測，不該吃 DTU。</summary>
public sealed class HealthHandler
{
    public IActionResult Get() =>
        new OkObjectResult(ApiResponse.Ok(new
        {
            status = "healthy",
            service = "vicround-api",
            version = typeof(HealthHandler).Assembly.GetName().Version?.ToString() ?? "unknown",
            time = Clock.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
        }));
}
