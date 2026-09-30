using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VicRound.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseStudies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CaseStudies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseStudies", x => x.Id);
                    table.CheckConstraint("CK_CaseStudies_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_CaseStudies_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CaseStudyProducts",
                columns: table => new
                {
                    CaseStudyId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseStudyProducts", x => new { x.CaseStudyId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_CaseStudyProducts_CaseStudies_CaseStudyId",
                        column: x => x.CaseStudyId,
                        principalTable: "CaseStudies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseStudyProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseStudySolutions",
                columns: table => new
                {
                    CaseStudyId = table.Column<int>(type: "int", nullable: false),
                    SolutionId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseStudySolutions", x => new { x.CaseStudyId, x.SolutionId });
                    table.ForeignKey(
                        name: "FK_CaseStudySolutions_CaseStudies_CaseStudyId",
                        column: x => x.CaseStudyId,
                        principalTable: "CaseStudies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseStudySolutions_Solutions_SolutionId",
                        column: x => x.SolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseStudyTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CaseStudyId = table.Column<int>(type: "int", nullable: false),
                    ClientName = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    ProjectName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Challenge = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Solution = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Result = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseStudyTranslations", x => new { x.CaseStudyId, x.Culture });
                    table.ForeignKey(
                        name: "FK_CaseStudyTranslations_CaseStudies_CaseStudyId",
                        column: x => x.CaseStudyId,
                        principalTable: "CaseStudies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CaseStudyTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_CaseStudyTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_CaseStudies_MediaAssetId",
                table: "CaseStudies",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseStudies_Status",
                table: "CaseStudies",
                columns: new[] { "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "UX_CaseStudies_Slug",
                table: "CaseStudies",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CaseStudyProducts_Reverse",
                table: "CaseStudyProducts",
                columns: new[] { "ProductId", "CaseStudyId" });

            migrationBuilder.CreateIndex(
                name: "IX_CaseStudySolutions_Reverse",
                table: "CaseStudySolutions",
                columns: new[] { "SolutionId", "CaseStudyId" });

            migrationBuilder.CreateIndex(
                name: "IX_CaseStudyTranslations_Culture",
                table: "CaseStudyTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_CaseStudyTranslations_OgImageMediaAssetId",
                table: "CaseStudyTranslations",
                column: "OgImageMediaAssetId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CaseStudyProducts");

            migrationBuilder.DropTable(
                name: "CaseStudySolutions");

            migrationBuilder.DropTable(
                name: "CaseStudyTranslations");

            migrationBuilder.DropTable(
                name: "CaseStudies");
        }
    }
}
