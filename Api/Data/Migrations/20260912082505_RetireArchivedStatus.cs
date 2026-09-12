using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VicRound.Api.Data.Migrations
{
    /// <summary>
    /// <c>ContentStatus.Archived</c>（=2）退役——後台的刪除改成真刪之後，沒有東西會再寫入這個值。
    ///
    /// <para>
    /// slug 的唯一索引因此從 <c>WHERE [Status] &lt;&gt; 2</c> 的 filtered unique 換成全域唯一：
    /// 原本的 filter 是為了讓被封存的 slug 能重用，現在 slug 由刪除本身釋出。配套的非唯一全量
    /// 索引 <c>IX_*_Slug_All</c>（供 Admin 做「含 Archived 的碰撞檢查」）一併移除——全域唯一
    /// 索引本身就能服務同樣的查詢。
    /// </para>
    /// </summary>
    public partial class RetireArchivedStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 本機沒有 Status=2 的列，但別的環境若有，留著就會是一個列舉裡不存在的值。
            // 先收回成草稿再建全域唯一索引；萬一因此撞到同名 slug，索引會建不起來而整個
            // migration 回滾——那是要人工處理的資料問題，不該被悄悄吞掉。
            migrationBuilder.Sql("""
                DECLARE @sql nvarchar(max) = N'';
                SELECT @sql = @sql + N'UPDATE [' + t.name + N'] SET [Status] = 0 WHERE [Status] = 2;'
                FROM sys.tables t
                JOIN sys.columns c ON c.object_id = t.object_id AND c.name = 'Status';
                EXEC sp_executesql @sql;
                """);

            migrationBuilder.DropIndex(
                name: "IX_Solutions_Slug_All",
                table: "Solutions");

            migrationBuilder.DropIndex(
                name: "UX_Solutions_Slug",
                table: "Solutions");

            migrationBuilder.DropIndex(
                name: "IX_Products_Slug_All",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "UX_Products_Slug",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_ProcessFlows_Slug_All",
                table: "ProcessFlows");

            migrationBuilder.DropIndex(
                name: "UX_ProcessFlows_Slug",
                table: "ProcessFlows");

            migrationBuilder.DropIndex(
                name: "IX_PartnerBrands_Slug_All",
                table: "PartnerBrands");

            migrationBuilder.DropIndex(
                name: "UX_PartnerBrands_Slug",
                table: "PartnerBrands");

            migrationBuilder.DropIndex(
                name: "IX_Pages_Slug_All",
                table: "Pages");

            migrationBuilder.DropIndex(
                name: "UX_Pages_Slug",
                table: "Pages");

            migrationBuilder.DropIndex(
                name: "IX_FaqItems_Slug_All",
                table: "FaqItems");

            migrationBuilder.DropIndex(
                name: "UX_FaqItems_Slug",
                table: "FaqItems");

            migrationBuilder.DropIndex(
                name: "IX_FaqCategories_Slug_All",
                table: "FaqCategories");

            migrationBuilder.DropIndex(
                name: "UX_FaqCategories_Slug",
                table: "FaqCategories");

            migrationBuilder.DropIndex(
                name: "IX_Exhibitions_Slug_All",
                table: "Exhibitions");

            migrationBuilder.DropIndex(
                name: "UX_Exhibitions_Slug",
                table: "Exhibitions");

            migrationBuilder.DropIndex(
                name: "IX_Downloads_Slug_All",
                table: "Downloads");

            migrationBuilder.DropIndex(
                name: "UX_Downloads_Slug",
                table: "Downloads");

            migrationBuilder.DropIndex(
                name: "IX_ContactChannels_Slug_All",
                table: "ContactChannels");

            migrationBuilder.DropIndex(
                name: "UX_ContactChannels_Slug",
                table: "ContactChannels");

            migrationBuilder.DropIndex(
                name: "IX_Certifications_Slug_All",
                table: "Certifications");

            migrationBuilder.DropIndex(
                name: "UX_Certifications_Slug",
                table: "Certifications");

            migrationBuilder.DropIndex(
                name: "IX_Categories_Slug_All",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "UX_Categories_Slug",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Authors_Slug_All",
                table: "Authors");

            migrationBuilder.DropIndex(
                name: "UX_Authors_Slug",
                table: "Authors");

            migrationBuilder.DropIndex(
                name: "IX_ArticleTags_Slug_All",
                table: "ArticleTags");

            migrationBuilder.DropIndex(
                name: "UX_ArticleTags_Slug",
                table: "ArticleTags");

            migrationBuilder.DropIndex(
                name: "IX_Articles_Slug_All",
                table: "Articles");

            migrationBuilder.DropIndex(
                name: "UX_Articles_Slug",
                table: "Articles");

            migrationBuilder.CreateIndex(
                name: "UX_Solutions_Slug",
                table: "Solutions",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Products_Slug",
                table: "Products",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_ProcessFlows_Slug",
                table: "ProcessFlows",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_PartnerBrands_Slug",
                table: "PartnerBrands",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Pages_Slug",
                table: "Pages",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_FaqItems_Slug",
                table: "FaqItems",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_FaqCategories_Slug",
                table: "FaqCategories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Exhibitions_Slug",
                table: "Exhibitions",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Downloads_Slug",
                table: "Downloads",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_ContactChannels_Slug",
                table: "ContactChannels",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Certifications_Slug",
                table: "Certifications",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Categories_Slug",
                table: "Categories",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Authors_Slug",
                table: "Authors",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_ArticleTags_Slug",
                table: "ArticleTags",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Articles_Slug",
                table: "Articles",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Solutions_Slug",
                table: "Solutions");

            migrationBuilder.DropIndex(
                name: "UX_Products_Slug",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "UX_ProcessFlows_Slug",
                table: "ProcessFlows");

            migrationBuilder.DropIndex(
                name: "UX_PartnerBrands_Slug",
                table: "PartnerBrands");

            migrationBuilder.DropIndex(
                name: "UX_Pages_Slug",
                table: "Pages");

            migrationBuilder.DropIndex(
                name: "UX_FaqItems_Slug",
                table: "FaqItems");

            migrationBuilder.DropIndex(
                name: "UX_FaqCategories_Slug",
                table: "FaqCategories");

            migrationBuilder.DropIndex(
                name: "UX_Exhibitions_Slug",
                table: "Exhibitions");

            migrationBuilder.DropIndex(
                name: "UX_Downloads_Slug",
                table: "Downloads");

            migrationBuilder.DropIndex(
                name: "UX_ContactChannels_Slug",
                table: "ContactChannels");

            migrationBuilder.DropIndex(
                name: "UX_Certifications_Slug",
                table: "Certifications");

            migrationBuilder.DropIndex(
                name: "UX_Categories_Slug",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "UX_Authors_Slug",
                table: "Authors");

            migrationBuilder.DropIndex(
                name: "UX_ArticleTags_Slug",
                table: "ArticleTags");

            migrationBuilder.DropIndex(
                name: "UX_Articles_Slug",
                table: "Articles");

            migrationBuilder.CreateIndex(
                name: "IX_Solutions_Slug_All",
                table: "Solutions",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Solutions_Slug",
                table: "Solutions",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Slug_All",
                table: "Products",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Products_Slug",
                table: "Products",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessFlows_Slug_All",
                table: "ProcessFlows",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_ProcessFlows_Slug",
                table: "ProcessFlows",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerBrands_Slug_All",
                table: "PartnerBrands",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_PartnerBrands_Slug",
                table: "PartnerBrands",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Pages_Slug_All",
                table: "Pages",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Pages_Slug",
                table: "Pages",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_Slug_All",
                table: "FaqItems",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_FaqItems_Slug",
                table: "FaqItems",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_FaqCategories_Slug_All",
                table: "FaqCategories",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_FaqCategories_Slug",
                table: "FaqCategories",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Exhibitions_Slug_All",
                table: "Exhibitions",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Exhibitions_Slug",
                table: "Exhibitions",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Downloads_Slug_All",
                table: "Downloads",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Downloads_Slug",
                table: "Downloads",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ContactChannels_Slug_All",
                table: "ContactChannels",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_ContactChannels_Slug",
                table: "ContactChannels",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Certifications_Slug_All",
                table: "Certifications",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Certifications_Slug",
                table: "Certifications",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Slug_All",
                table: "Categories",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Categories_Slug",
                table: "Categories",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Authors_Slug_All",
                table: "Authors",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Authors_Slug",
                table: "Authors",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleTags_Slug_All",
                table: "ArticleTags",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_ArticleTags_Slug",
                table: "ArticleTags",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Slug_All",
                table: "Articles",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Articles_Slug",
                table: "Articles",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");
        }
    }
}
