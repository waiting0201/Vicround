using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using VicRound.Functions;
using VicRound.Infrastructure;

// seed / import-content —— 初始化環境與內容匯入用，不進 Functions host。
if (args.Contains("seed", StringComparer.OrdinalIgnoreCase)
    || args.Contains("import-content", StringComparer.OrdinalIgnoreCase)
    || args.Contains("import-legacy", StringComparer.OrdinalIgnoreCase))
{
    return await SeedCommand.RunAsync(args);
}

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

var connectionString =
    builder.Configuration.GetConnectionString("SqlDatabase")
    ?? builder.Configuration["VICROUND_SQL_CONNECTION"]
    ?? throw new InvalidOperationException(
        "缺少資料庫連線字串。請設定 ConnectionStrings:SqlDatabase（本機放 local.settings.json，Azure 走 App Settings / Key Vault）。");

builder.Services.AddVicRoundDatabase(connectionString);

builder.Build().Run();
return 0;
