using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VicRound.Api.Data.Migrations
{
    /// <summary>
    /// 純資料 migration：把 <c>20260912055237_AdminUsernameLogin</c> 補出來的超級管理員帳號
    /// <c>superadmin</c> 改名為 <c>sa@system.local</c>，與
    /// <c>BootstrapSeeder.SuperAdminUsername</c> 對齊（database.md §18.2）。
    /// <para>
    /// 沒有這一步，升級上來的資料庫是 <c>superadmin</c>、全新 seed 的是 <c>sa@system.local</c>，
    /// 同一份程式碼在兩個環境會是兩個不同的帳號。此處帳號只當字串處理，刻意不套
    /// <c>Usernames</c> 的字元集。
    /// </para>
    /// </summary>
    public partial class RenameSuperAdminUsername : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOT EXISTS 是留給已經手動改過名的資料庫：改過就不動，唯一索引也不會撞。
            migrationBuilder.Sql("""
                UPDATE Users
                SET Username = 'sa@system.local',
                    UsernameNormalized = 'SA@SYSTEM.LOCAL',
                    UpdatedAt = SYSUTCDATETIME()
                WHERE UsernameNormalized = 'SUPERADMIN'
                  AND NOT EXISTS (SELECT 1 FROM Users WHERE UsernameNormalized = 'SA@SYSTEM.LOCAL');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE Users
                SET Username = 'superadmin',
                    UsernameNormalized = 'SUPERADMIN',
                    UpdatedAt = SYSUTCDATETIME()
                WHERE UsernameNormalized = 'SA@SYSTEM.LOCAL'
                  AND NOT EXISTS (SELECT 1 FROM Users WHERE UsernameNormalized = 'SUPERADMIN');
                """);
        }
    }
}
