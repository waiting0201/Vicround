using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VicRound.Api.Data.Migrations
{
    /// <summary>
    /// 客戶案例不再具名（2026-10-20）：<c>ClientName</c> 換成不具名的 <c>ClientProfile</c>（客戶類型）。
    /// 刻意 Drop + Add 而不是 RenameColumn —— 改名會把已存的客戶名稱原封不動帶進新欄位，
    /// 刪欄位才能讓每個環境在套用時就清掉它們。Down 只還原欄位，資料不會回來。
    /// </summary>
    public partial class ReplaceCaseStudyClientName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClientName",
                table: "CaseStudyTranslations");

            migrationBuilder.AddColumn<string>(
                name: "ClientProfile",
                table: "CaseStudyTranslations",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClientProfile",
                table: "CaseStudyTranslations");

            migrationBuilder.AddColumn<string>(
                name: "ClientName",
                table: "CaseStudyTranslations",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: true);
        }
    }
}
