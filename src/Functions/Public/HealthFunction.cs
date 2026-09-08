using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.EntityFrameworkCore;
using VicRound.Infrastructure;

namespace VicRound.Functions.Public;

/// <summary>平台探針用；不吐任何內容資料。</summary>
public class HealthFunction(VicRoundDbContext db)
{
    [Function("Health")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/v1/health")] HttpRequest request,
        CancellationToken cancellationToken)
    {
        var databaseReachable = await db.Database.CanConnectAsync(cancellationToken);

        return new OkObjectResult(new
        {
            status = databaseReachable ? "healthy" : "degraded",
            database = databaseReachable ? "up" : "down",
            utc = DateTime.UtcNow,
        });
    }
}
