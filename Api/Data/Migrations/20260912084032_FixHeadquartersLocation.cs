using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VicRound.Api.Data.Migrations
{
    /// <summary>
    /// 純資料 migration：把總部那一筆 <c>Locations</c> 從確認稿的台中佔位值改成實際資料 ——
    /// 台北的地址、電話、信箱，以及舊站 www.vicround.com/contact 地圖用的座標與地圖連結。
    /// <para>
    /// 不能靠重跑 seeder 解決：<c>BootstrapSeeder</c> 的自然鍵是 <c>(Type, City)</c> 且只補缺不覆寫，
    /// <c>Taichung</c> ≠ <c>Taipei</c>，重跑只會多插一筆總部。
    /// </para>
    /// <para>
    /// 這一步是有時效性的：contact 頁的 JSON-LD 會把 <c>AddressLine</c> 原樣輸出成
    /// <c>PostalAddress</c>，留著佔位值等於把假地址餵給搜尋引擎與 AI 引擎（sitemap.md JSON-LD 一節）。
    /// 座標欄是 <c>decimal(9,6)</c>，因此常數已先四捨五入到 6 位，與
    /// <c>SeedData.Locations</c> 逐字一致。
    /// </para>
    /// </summary>
    public partial class FixHeadquartersLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 兩個 WHERE 條件一致：只動「還是台中佔位值」的那一筆，而且資料庫裡還沒有台北總部時才動。
            // 已經在後台改好的、或全新 seed 出來的資料庫，套用後都是 no-op。
            // 翻譯要先更新 —— 它靠母體的 City 篩選，母體一改就找不到了。
            migrationBuilder.Sql("""
                UPDATE t
                SET t.Name = CASE t.Culture
                        WHEN 'zh-Hant' THEN N'台灣台北'
                        ELSE N'Taipei, Taiwan' END,
                    t.AddressLine = CASE t.Culture
                        WHEN 'zh-Hant' THEN N'10491 台北市中山區南京東路二段 66 號 11 樓'
                        ELSE N'11F., No. 66, Sec. 2, Nanjing E. Rd., Zhongshan Dist., Taipei City 10491, Taiwan' END
                FROM LocationTranslations t
                INNER JOIN Locations l ON l.Id = t.LocationId
                WHERE l.Type = 1 AND l.City = N'Taichung'
                  AND NOT EXISTS (SELECT 1 FROM Locations WHERE Type = 1 AND City = N'Taipei');
                """);

            migrationBuilder.Sql("""
                UPDATE Locations
                SET City = N'Taipei',
                    Phone = N'+886 2 2511 0190',
                    Email = N'vicround@vicround.com',
                    Latitude = 25.051797,
                    Longitude = 121.530444,
                    MapUrl = N'https://www.google.com/maps/search/?api=1&query=25.051797%2C121.530444',
                    UpdatedAt = SYSUTCDATETIME()
                WHERE Type = 1 AND City = N'Taichung'
                  AND NOT EXISTS (SELECT 1 FROM Locations WHERE Type = 1 AND City = N'Taipei');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 還原成確認稿的佔位值。座標、信箱與地圖連結在佔位狀態下本來就是空的，一併清掉。
            migrationBuilder.Sql("""
                UPDATE t
                SET t.Name = CASE t.Culture
                        WHEN 'zh-Hant' THEN N'台灣台中'
                        ELSE N'Taichung, Taiwan' END,
                    t.AddressLine = CASE t.Culture
                        WHEN 'zh-Hant' THEN N'407 台中市西屯區台灣大道 0 段 000 號'
                        ELSE N'No. 000, Sec. 0, Taiwan Blvd., Xitun Dist., Taichung City 407, Taiwan' END
                FROM LocationTranslations t
                INNER JOIN Locations l ON l.Id = t.LocationId
                WHERE l.Type = 1 AND l.City = N'Taipei'
                  AND NOT EXISTS (SELECT 1 FROM Locations WHERE Type = 1 AND City = N'Taichung');
                """);

            migrationBuilder.Sql("""
                UPDATE Locations
                SET City = N'Taichung',
                    Phone = N'+886 4 2359 0000',
                    Email = NULL,
                    Latitude = NULL,
                    Longitude = NULL,
                    MapUrl = NULL,
                    UpdatedAt = SYSUTCDATETIME()
                WHERE Type = 1 AND City = N'Taipei'
                  AND NOT EXISTS (SELECT 1 FROM Locations WHERE Type = 1 AND City = N'Taichung');
                """);
        }
    }
}
