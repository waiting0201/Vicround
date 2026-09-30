using System.Data;
using Dapper;
using VicRound.Api.Common;
using VicRound.Api.Models.Dtos;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services.Dapper;

/// <summary>
/// 客戶案例（database.md §02.1）。前台只在產業頁（<c>CaseStudySolutions</c>）呈現；
/// 每則案例另帶用到的產品（<c>CaseStudyProducts</c>），讓讀者從案例連到產品頁。
/// </summary>
internal static class CaseStudyReader
{
    /// <summary>
    /// 與規格列同樣走翻譯 fallback：案例是頁面的一個區段，缺某語系的翻譯時整頁不該因此 404。
    /// </summary>
    public static async Task<IReadOnlyList<CaseStudyDto>> ForSolutionAsync(IDbConnection db, string culture, int solutionId)
    {
        var args = new { SolutionId = solutionId, culture, DefaultCulture = CultureCodes.Default, Sql.Published };

        var rows = (await db.QueryAsync<CaseStudyRow>(
            $"""
             SELECT e.Id, e.Slug,
                    CASE WHEN m.IsPrivate = 1 OR m.IsArchived = 1 THEN NULL ELSE m.Url END AS ImageUrl,
                    {Sql.Coalesce("ClientName")}, {Sql.Coalesce("ProjectName")}, {Sql.Coalesce("Title")},
                    {Sql.Coalesce("Challenge")}, {Sql.Coalesce("Solution")}, {Sql.Coalesce("Result")}
             FROM CaseStudySolutions x
             INNER JOIN CaseStudies e ON e.Id = x.CaseStudyId AND e.Status = @Published
             LEFT JOIN MediaAssets m ON m.Id = e.MediaAssetId
             {Sql.TranslationJoin("CaseStudyTranslations", "CaseStudyId")}
             WHERE x.SolutionId = @SolutionId
             ORDER BY x.SortOrder, e.SortOrder, e.Id
             """, args)).ToList();

        if (rows.Count == 0)
        {
            return [];
        }

        // 一次撈完所有案例的產品再分組，不讓每則案例各打一次 DB。
        var products = (await db.QueryAsync<CaseStudyProductRow>(
            $"""
             SELECT x.CaseStudyId, p.Slug, c.Slug AS CategorySlug, p.Code, {Sql.Coalesce("Name")}
             FROM CaseStudyProducts x
             INNER JOIN Products p ON p.Id = x.ProductId AND p.Status = @Published
             INNER JOIN Categories c ON c.Id = p.CategoryId
             {Sql.TranslationJoin("ProductTranslations", "ProductId", "p")}
             WHERE x.CaseStudyId IN @Ids
             ORDER BY x.SortOrder
             """,
            new { Ids = rows.Select(r => r.Id).ToArray(), culture, DefaultCulture = CultureCodes.Default, Sql.Published }))
            .ToLookup(r => r.CaseStudyId, r => new ProductRefDto(r.Slug, r.CategorySlug, r.Code, r.Name));

        return rows.Select(r => new CaseStudyDto
        {
            Slug = r.Slug,
            ClientName = r.ClientName,
            ProjectName = r.ProjectName,
            Title = r.Title,
            Challenge = r.Challenge,
            Solution = r.Solution,
            Result = r.Result,
            ImageUrl = r.ImageUrl,
            Products = products[r.Id].ToList(),
        }).ToList();
    }

    private sealed record CaseStudyRow(
        int Id, string Slug, string? ImageUrl, string? ClientName, string? ProjectName, string? Title,
        string? Challenge, string? Solution, string? Result);

    private sealed record CaseStudyProductRow(int CaseStudyId, string Slug, string CategorySlug, string? Code, string? Name);
}
