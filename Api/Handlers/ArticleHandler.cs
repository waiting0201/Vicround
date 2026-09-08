using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;
using VicRound.Api.Services.Dapper;

namespace VicRound.Api.Handlers;

/// <summary>News / Insights / Technical articles（docs/cms-api.md）。</summary>
public sealed class ArticleHandler(IArticleReadService articles)
{
    private const int DefaultPageSize = 12;

    public async Task<IActionResult> ListAsync(HttpRequest req, string? type = null)
    {
        var culture = LangResolver.Resolve(req);
        var (page, pageSize) = Paging.From(req, DefaultPageSize);

        var result = await articles.ListAsync(
            culture,
            type ?? NullIfEmpty(req.Query["type"]),
            NullIfEmpty(req.Query["tag"]),
            NullIfEmpty(req.Query["category"]),
            NullIfEmpty(req.Query["solution"]),
            page,
            pageSize);

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(result));
    }

    public async Task<IActionResult> GetAsync(HttpRequest req, string slug)
    {
        var culture = LangResolver.Resolve(req);
        var article = await articles.GetAsync(culture, slug)
            ?? throw AppException.NotFound($"文章 {slug}（{culture}）");

        CacheControl.Public(req.HttpContext.Response);
        return new OkObjectResult(ApiResponse.Ok(article));
    }

    private static string? NullIfEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;
}
