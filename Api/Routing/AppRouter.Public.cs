using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace VicRound.Api.Routing;

public sealed partial class AppRouter
{
    /// <summary>
    /// 公開唯讀端點的白名單，對應 docs/cms-api.md 的 Content API。
    /// <b>列舉式</b>：新增前台端點必須同時補這裡與 <see cref="RoutePublicAsync"/>，
    /// 否則會直接 404——這是刻意的，寧可在開發階段壞掉，也不要靜悄悄多出一個公開端點。
    /// </summary>
    private static bool IsPublicRoute(string method, string[] segments) =>
        (method, segments) switch
        {
            ("GET", ["v1", "health"]) => true,
            ("GET", ["v1", "categories"]) => true,
            ("GET", ["v1", "categories", _]) => true,
            ("GET", ["v1", "products"]) => true,
            ("GET", ["v1", "products", _]) => true,
            ("GET", ["v1", "solutions"]) => true,
            ("GET", ["v1", "solutions", _]) => true,
            ("GET", ["v1", "pages", _]) => true,
            ("GET", ["v1", "sitemap"]) => true,
            _ => false,
        };

    private Task<IActionResult?> RoutePublicAsync(HttpRequest req, string method, string[] segments) =>
        (method, segments) switch
        {
            ("GET", ["v1", "health"]) => Task.FromResult<IActionResult?>(health.Get()),

            ("GET", ["v1", "categories"]) => Nullable(catalog.ListCategoriesAsync(req)),
            ("GET", ["v1", "categories", var slug]) => Nullable(catalog.GetCategoryAsync(req, slug)),

            ("GET", ["v1", "products"]) => Nullable(catalog.ListProductsAsync(req)),
            ("GET", ["v1", "products", var slug]) => Nullable(catalog.GetProductAsync(req, slug)),

            ("GET", ["v1", "solutions"]) => Nullable(solutions.ListAsync(req)),
            ("GET", ["v1", "solutions", var slug]) => Nullable(solutions.GetAsync(req, slug)),

            ("GET", ["v1", "pages", var slug]) => Nullable(pages.GetAsync(req, slug)),
            ("GET", ["v1", "sitemap"]) => Nullable(pages.SitemapAsync(req)),

            _ => Task.FromResult<IActionResult?>(null),
        };

    private static async Task<IActionResult?> Nullable(Task<IActionResult> task) => await task;
}
