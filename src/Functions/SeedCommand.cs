using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VicRound.Infrastructure;
using VicRound.Infrastructure.Seeding;
using VicRound.Infrastructure.Seeding.ContentImport;
using VicRound.Infrastructure.Seeding.LegacyImport;

namespace VicRound.Functions;

/// <summary>
/// <c>seed [--migrate]</c> 與 <c>import-content [--file &lt;path&gt;]</c> 的執行入口
/// （database.md §18.1 的 B 層與 C 層）。
/// <para>
/// 刻意做成 CLI 而不是啟動時自動跑：seeder 雖然冪等，但正式環境不該在每次冷啟動時碰資料庫，
/// 而新環境初始化本來就是一次性的動作。C 層的 <c>import-legacy</c> 之後掛在同一個入口。
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
        services.AddLogging(logging => logging.AddSimpleConsole(o => o.SingleLine = true).SetMinimumLevel(LogLevel.Information));
        services.AddVicRoundDatabase(connectionString);
        services.AddVicRoundMediaStorage(
            configuration.GetConnectionString("BlobStorage")
            ?? configuration["VICROUND_BLOB_CONNECTION"]
            ?? "UseDevelopmentStorage=true");

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
            var path = configuration["file"] ?? "artifacts/content-export.json";
            if (!File.Exists(path))
            {
                await Console.Error.WriteLineAsync(
                    $"找不到 {path}。先跑 `node scripts/export-content.mjs` 產生它。");
                return 1;
            }

            await scope.ServiceProvider
                .GetRequiredService<ContentImportSeeder>()
                .ImportAsync(await File.ReadAllTextAsync(path));
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
