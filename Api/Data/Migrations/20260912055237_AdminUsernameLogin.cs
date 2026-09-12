using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VicRound.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AdminUsernameLogin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Users_EmailNormalized",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmailNormalized",
                table: "Users");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(320)",
                maxLength: 320,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(320)",
                oldMaxLength: 320);

            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Users",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UsernameNormalized",
                table: "Users",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            // 既有帳號補上登入帳號：超級管理員固定 superadmin，其餘取 Email 的 @ 前段——
            // 但只在它符合帳號字元集、長度且不與別人重複時才用，否則補流水號，
            // 免得下面的唯一索引建不起來。
            migrationBuilder.Sql("""
                UPDATE Users
                SET Username = 'superadmin', UsernameNormalized = 'SUPERADMIN', Email = NULL
                WHERE Email = 'sa@system.local';

                WITH parsed AS (
                    SELECT Id, CreatedAt,
                           CASE WHEN CHARINDEX('@', Email) > 1
                                THEN LEFT(Email, CHARINDEX('@', Email) - 1)
                           END AS LocalPart
                    FROM Users
                    WHERE Username = ''
                ),
                candidates AS (
                    SELECT Id,
                           ROW_NUMBER() OVER (ORDER BY CreatedAt, Id) AS Seq,
                           CASE WHEN LocalPart IS NOT NULL
                                     AND LocalPart NOT LIKE '%[^A-Za-z0-9._-]%'
                                     AND LEN(LocalPart) BETWEEN 3 AND 64
                                     AND COUNT(*) OVER (PARTITION BY UPPER(LocalPart)) = 1
                                THEN LocalPart
                           END AS Candidate
                    FROM parsed
                )
                UPDATE u
                SET Username = COALESCE(c.Candidate, CONCAT('user', c.Seq)),
                    UsernameNormalized = UPPER(COALESCE(c.Candidate, CONCAT('user', c.Seq)))
                FROM Users AS u
                INNER JOIN candidates AS c ON c.Id = u.Id;
                """);

            migrationBuilder.CreateIndex(
                name: "UX_Users_UsernameNormalized",
                table: "Users",
                column: "UsernameNormalized",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Users_UsernameNormalized",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UsernameNormalized",
                table: "Users");

            migrationBuilder.Sql(
                "UPDATE Users SET Email = CONCAT(Username, '@invalid.local') WHERE Email IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "nvarchar(320)",
                maxLength: 320,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(320)",
                oldMaxLength: 320,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmailNormalized",
                table: "Users",
                type: "nvarchar(320)",
                maxLength: 320,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("UPDATE Users SET EmailNormalized = UPPER(LTRIM(RTRIM(Email)));");

            migrationBuilder.CreateIndex(
                name: "UX_Users_EmailNormalized",
                table: "Users",
                column: "EmailNormalized",
                unique: true);
        }
    }
}
