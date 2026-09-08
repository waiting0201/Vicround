using Azure.Storage.Blobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VicRound.Application.Media;
using VicRound.Application.Security;
using VicRound.Infrastructure.Interceptors;
using VicRound.Infrastructure.Security;
using VicRound.Infrastructure.Storage;
using VicRound.Infrastructure.Seeding;
using VicRound.Infrastructure.Seeding.ContentImport;
using VicRound.Infrastructure.Seeding.LegacyImport;

namespace VicRound.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// 註冊 <see cref="VicRoundDbContext"/> 與時間戳攔截器。
    /// 讀取一律 <c>AsNoTracking</c>——三個 API surface 沒有一個需要跨請求追蹤實體。
    /// </summary>
    public static IServiceCollection AddVicRoundDatabase(this IServiceCollection services, string connectionString)
    {
        services.AddSingleton<AuditingSaveChangesInterceptor>();

        services.AddDbContext<VicRoundDbContext>((provider, options) =>
        {
            options.UseSqlServer(connectionString, sql =>
            {
                sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
                sql.MigrationsAssembly(typeof(VicRoundDbContext).Assembly.FullName);
            });

            options.AddInterceptors(provider.GetRequiredService<AuditingSaveChangesInterceptor>());
            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        });

        services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddScoped<BootstrapSeeder>();
        services.AddScoped<ContentImportSeeder>();

        return services;
    }

    /// <summary>媒體儲存體。本機用 Azurite 的 <c>UseDevelopmentStorage=true</c>。</summary>
    public static IServiceCollection AddVicRoundMediaStorage(this IServiceCollection services, string connectionString)
    {
        services.AddSingleton(new BlobServiceClient(connectionString));
        services.AddSingleton<IMediaStorage, BlobMediaStorage>();
        services.AddScoped<LegacyImportSeeder>();

        return services;
    }
}
