using System.Data;
using Azure.Storage.Blobs;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VicRound.Api.Data;
using VicRound.Api.Data.Seeding;
using VicRound.Api.Data.Seeding.ContentImport;
using VicRound.Api.Data.Seeding.LegacyImport;
using VicRound.Api.Services;

namespace VicRound.Api;

/// <summary>
/// <c>seed [--migrate]</c>、<c>import-content [--file]</c>、<c>import-legacy [--root]</c> 的執行入口
/// （docs/database.md §18.1 的 B 層與 C 層）。
/// <para>
/// 刻意做成 CLI 而不是啟動時自動跑：seeder 雖然冪等，但正式環境不該在每次冷啟動時碰資料庫，
/// 而新環境初始化本來就是一次性的動作。
/// </para>
/// </summary>
internal static class SeedCommand
{
    public static async Task<int> RunAsync(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddEnvironmentVariables()
            .AddCommandLine(args)
            .Build();

        var connectionString =
            configuration.GetConnectionString("SqlDatabase")
            ?? configuration["VICROUND_SQL_CONNECTION"];

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            await Console.Error.WriteLineAsync(
                "缺少連線字串。請設定 VICROUND_SQL_CONNECTION 或 ConnectionStrings__SqlDatabase。");
            return 1;
        }

        var services = new ServiceCollection();
        services.AddLogging(l => l.AddSimpleConsole(o => o.SingleLine = true).SetMinimumLevel(LogLevel.Information));

        services.AddSingleton<AuditingSaveChangesInterceptor>();
        services.AddDbContext<VicRoundDbContext>((provider, options) =>
        {
            options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(3));
            options.AddInterceptors(provider.GetRequiredService<AuditingSaveChangesInterceptor>());
            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        });
        services.AddScoped<IDbConnection>(_ => new SqlConnection(connectionString));

        services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddSingleton(new BlobServiceClient(
            configuration.GetConnectionString("BlobStorage")
            ?? configuration["VICROUND_BLOB_CONNECTION"]
            ?? "UseDevelopmentStorage=true"));
        services.AddSingleton<IMediaStorage, BlobMediaStorage>();

        services.AddScoped<BootstrapSeeder>();
        services.AddScoped<ContentImportSeeder>();
        services.AddScoped<LegacyImportSeeder>();

        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();

        if (args.Contains("--migrate", StringComparer.OrdinalIgnoreCase))
        {
            await scope.ServiceProvider.GetRequiredService<VicRoundDbContext>().Database.MigrateAsync();
        }

        if (args.Contains("seed", StringComparer.OrdinalIgnoreCase))
        {
            await scope.ServiceProvider.GetRequiredService<BootstrapSeeder>().SeedAsync();
        }

        if (args.Contains("import-content", StringComparer.OrdinalIgnoreCase))
        {
            // 確認稿與程式一起進版控（會跟著 build 複製到輸出目錄），
            // 因此不論從哪個工作目錄執行都找得到；`--file` 可指向另一份匯入檔。
            var path = configuration["file"]
                ?? Path.Combine(AppContext.BaseDirectory, "Data", "Seeding", "ContentImport", "confirmed-copy.json");

            if (!File.Exists(path))
            {
                await Console.Error.WriteLineAsync($"找不到 {path}。");
                return 1;
            }

            await scope.ServiceProvider
                .GetRequiredService<ContentImportSeeder>()
                .ImportAsync(await File.ReadAllTextAsync(path));
        }

        if (args.Contains("check-redirects", StringComparer.OrdinalIgnoreCase))
        {
            var root = configuration["root"] ?? "reference/sbk/data";
            var options = (Directory.Exists(root) ? LegacyImportOptions.FromRoot(root) : new LegacyImportOptions()) with
            {
                CrawlJson = configuration["crawl"] ?? "artifacts/legacy-urls.json",
            };

            var coverage = await scope.ServiceProvider
                .GetRequiredService<LegacyImportSeeder>()
                .CheckRedirectsAsync(options);

            // 有舊網址還沒轉址就以非零結束，方便之後接進 CI。
            return coverage.MissingPaths.Count == 0 ? 0 : 2;
        }

        if (args.Contains("import-legacy", StringComparer.OrdinalIgnoreCase))
        {
            var root = configuration["root"] ?? "reference/sbk/data";
            if (!Directory.Exists(root))
            {
                await Console.Error.WriteLineAsync($"找不到舊站匯出目錄 {root}（用 --root 指定）。");
                return 1;
            }

            var options = LegacyImportOptions.FromRoot(root) with
            {
                CrawlJson = configuration["crawl"] ?? "artifacts/legacy-urls.json",
            };

            await scope.ServiceProvider.GetRequiredService<LegacyImportSeeder>().ImportAsync(options);
        }

        return 0;
    }
}
