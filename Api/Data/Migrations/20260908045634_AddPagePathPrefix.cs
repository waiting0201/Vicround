using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VicRound.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPagePathPrefix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PathPrefix",
                table: "Pages",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true,
                collation: "Latin1_General_100_CS_AS");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PathPrefix",
                table: "Pages");
        }
    }
}
