using System.Data;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.Hosting;
using System.Text.Json;
using VicRound.Api;
using VicRound.Api.Data;
using VicRound.Api.Data.Seeding;
using VicRound.Api.Data.Seeding.ContentImport;
using VicRound.Api.Data.Seeding.LegacyImport;
using VicRound.Api.Handlers;
using VicRound.Api.Middleware;
using VicRound.Api.Routing;
using VicRound.Api.Services;
using VicRound.Api.Services.Dapper;

// seed / import-content / import-legacy —— 初始化環境與內容匯入用，不進 Functions host。
if (args.Any(a => a is "seed" or "import-content" or "import-legacy" or "check-redirects"))
{
    return await SeedCommand.RunAsync(args);
}

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

// worker 層的 middleware，包住整個 Function 執行。
builder.UseMiddleware<ExceptionMiddleware>();

var services = builder.Services;
var configuration = builder.Configuration;

// isolated worker 少了這兩行，所有 ILogger 輸出都不會進 App Insights。
services.AddApplicationInsightsTelemetryWorkerService();
services.ConfigureFunctionsApplicationInsights();

// camelCase：★ 兩處都要設，少一處就會半邊 PascalCase。
services.Configure<JsonOptions>(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});
services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.SerializerOptions.PropertyNameCaseInsensitive = true;
});

var connectionString =
    configuration.GetConnectionString("SqlDatabase")
    ?? configuration["VICROUND_SQL_CONNECTION"]
    ?? throw new InvalidOperationException(
        "缺少資料庫連線字串。請設定 ConnectionStrings:SqlDatabase（本機放 local.settings.json，Azure 走 App Settings / Key Vault）。");

// ── EF Core（寫入 + schema 權威）
services.AddSingleton<AuditingSaveChangesInterceptor>();
services.AddDbContext<VicRoundDbContext>((provider, options) =>
{
    options.UseSqlServer(connectionString, sql =>
    {
        sql.EnableRetryOnFailure(3);
        sql.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
    });

    options.AddInterceptors(provider.GetRequiredService<AuditingSaveChangesInterceptor>());
    options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
});

// ── Dapper（讀取）：與 EF Core 共用同一條連線字串
services.AddScoped<IDbConnection>(_ => new SqlConnection(connectionString));

// ── Singleton：只讀設定、無 per-request 狀態
services.AddSingleton<IJwtService, JwtService>();
services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
services.AddSingleton(new BlobServiceClient(
    configuration.GetConnectionString("BlobStorage")
    ?? configuration["VICROUND_BLOB_CONNECTION"]
    ?? "UseDevelopmentStorage=true"));
services.AddSingleton<IMediaStorage, BlobMediaStorage>();

// ── Scoped：碰 DbContext / IDbConnection 的一律 Scoped，沒有例外
services.AddScoped<BootstrapSeeder>();
services.AddScoped<ContentImportSeeder>();
services.AddScoped<LegacyImportSeeder>();
services.AddScoped<ICatalogReadService, CatalogReadService>();
services.AddScoped<ISolutionReadService, SolutionReadService>();
services.AddScoped<IPageReadService, PageReadService>();
services.AddScoped<HealthHandler>();
services.AddScoped<CatalogHandler>();
services.AddScoped<SolutionHandler>();
services.AddScoped<PageHandler>();
services.AddScoped<AppRouter>();
services.AddHttpContextAccessor();

builder.Build().Run();
return 0;
