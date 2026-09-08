using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Services.Dapper;

namespace VicRound.Api.Handlers;

/// <summary>產品目錄的公開端點（docs/cms-api.md）。</summary>
public sealed class CatalogHandler(ICatalogReadService catalog)
{
    public async Task<IActionResult> ListCategoriesAsync(HttpRequest req)
    {
        var culture = LangResolver.Resolve(req);
        var items = await catalog.ListCategoriesAsync(culture, req.Query["type"]);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(items));
    }

    public async Task<IActionResult> GetCategoryAsync(HttpRequest req, string slug)
    {
        var culture = LangResolver.Resolve(req);
        var category = await catalog.GetCategoryAsync(culture, slug)
            ?? throw AppException.NotFound($"產品線 {slug}（{culture}）");

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(category));
    }

    public async Task<IActionResult> ListProductsAsync(HttpRequest req)
    {
        var culture = LangResolver.Resolve(req);
        var (page, pageSize) = Paging.From(req);

        bool? featured = bool.TryParse(req.Query["featured"], out var f) ? f : null;

        var result = await catalog.ListProductsAsync(
            culture,
            NullIfEmpty(req.Query["category"]),
            NullIfEmpty(req.Query["solution"]),
            featured,
            page,
            pageSize);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(result));
    }

    public async Task<IActionResult> GetProductAsync(HttpRequest req, string slug)
    {
        var culture = LangResolver.Resolve(req);
        var product = await catalog.GetProductAsync(culture, slug)
            ?? throw AppException.NotFound($"產品 {slug}（{culture}）");

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(product));
    }

    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;
}
