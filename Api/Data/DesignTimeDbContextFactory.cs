using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VicRound.Api.Data;

/// <summary>
/// 只給 <c>dotnet ef</c> 用。<c>migrations add</c> 不需要連得上資料庫，因此沒有設定
/// <c>VICROUND_SQL_CONNECTION</c> 時退回一個佔位連線字串——正式連線字串來自
/// configuration / Key Vault，<b>永不進版控</b>。
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<VicRoundDbContext>
{
    private const string DesignTimePlaceholder =
        "Server=(localdb)\\MSSQLLocalDB;Database=VicRound;Trusted_Connection=True;TrustServerCertificate=True";

    public VicRoundDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("VICROUND_SQL_CONNECTION") ?? DesignTimePlaceholder;

        var options = new DbContextOptionsBuilder<VicRoundDbContext>()
            .UseSqlServer(connectionString, sql => sql.MigrationsAssembly(typeof(VicRoundDbContext).Assembly.FullName))
            .Options;

        return new VicRoundDbContext(options);
    }
}
