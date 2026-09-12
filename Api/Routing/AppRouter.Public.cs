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
            ("GET", ["v1", "redirects"]) => true,
            ("GET", ["v1", "navigation"]) => true,
            ("GET", ["v1", "technologies"]) => true,
            ("GET", ["v1", "articles"]) => true,
            ("GET", ["v1", "articles", _]) => true,
            ("GET", ["v1", "news"]) => true,
            ("GET", ["v1", "exhibitions"]) => true,
            ("GET", ["v1", "faq"]) => true,
            ("GET", ["v1", "certifications"]) => true,
            ("GET", ["v1", "downloads"]) => true,
            ("GET", ["v1", "search"]) => true,
            ("POST", ["v1", "contact"]) => true,
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
            ("GET", ["v1", "redirects"]) => Nullable(pages.RedirectsAsync(req)),

            ("GET", ["v1", "navigation"]) => Nullable(navigation.ListAsync(req)),
            ("GET", ["v1", "technologies"]) => Nullable(technologies.GetAsync(req)),

            ("GET", ["v1", "articles"]) => Nullable(articles.ListAsync(req)),
            ("GET", ["v1", "articles", var slug]) => Nullable(articles.GetAsync(req, slug)),

            // /news 是 /articles?type=news 的別名——前台的新聞頁只要新聞家族那四種 Type。
            ("GET", ["v1", "news"]) => Nullable(articles.ListAsync(req, "news")),

            ("GET", ["v1", "exhibitions"]) => Nullable(resources.ListExhibitionsAsync(req)),
            ("GET", ["v1", "faq"]) => Nullable(resources.ListFaqAsync(req)),
            ("GET", ["v1", "certifications"]) => Nullable(resources.ListCertificationsAsync(req)),
            ("GET", ["v1", "downloads"]) => Nullable(resources.ListDownloadsAsync(req)),

            ("GET", ["v1", "search"]) => Nullable(search.SearchAsync(req)),

            ("POST", ["v1", "contact"]) => Nullable(contact.SubmitAsync(req)),

            _ => Task.FromResult<IActionResult?>(null),
        };

    private static async Task<IActionResult?> Nullable(Task<IActionResult> task) => await task;
}
