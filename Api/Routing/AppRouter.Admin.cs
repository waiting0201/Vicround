using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VicRound.Api.Common;

namespace VicRound.Api.Routing;

public sealed partial class AppRouter
{
    /// <summary>
    /// 後台路由 → 權限碼。<b>預設拒絕</b>：沒列在這裡的 <c>/admin/*</c> 一律 403，
    /// 而不是靜默放行。新增端點忘了補表，錯誤會在開發階段就浮現。
    /// <para>
    /// <c>POST</c> 用 <c>[.., ..]</c> 是因為它同時涵蓋新增、<c>publish</c>／<c>unpublish</c>、
    /// <c>reorder</c> 與審核動作——這些都是「改這個單元的資料」，權限相同。
    /// </para>
    /// </summary>
    private static string? GetRequiredPermission(string method, string[] segments) =>
        (method, segments) switch
        {
            // 登入相關端點沒有權限碼：login／refresh／logout 在 RouteAsync 就放行，
            // me／change-password 只要是有效的後台 token 就能打（改自己的密碼不需要額外權限）。
            (_, ["admin", "auth", ..]) => null,

            ("GET",            ["admin", "categories", ..]) => PermissionCodes.CategoriesView,
            ("POST",           ["admin", "categories", ..])     => PermissionCodes.CategoriesEdit,
            ("PUT" or "PATCH", ["admin", "categories", ..]) => PermissionCodes.CategoriesEdit,
            ("DELETE",         ["admin", "categories", ..]) => PermissionCodes.CategoriesDelete,

            ("GET",            ["admin", "products", ..]) => PermissionCodes.ProductsView,
            ("POST",           ["admin", "products", ..])     => PermissionCodes.ProductsEdit,
            ("PUT" or "PATCH", ["admin", "products", ..]) => PermissionCodes.ProductsEdit,
            ("DELETE",         ["admin", "products", ..]) => PermissionCodes.ProductsDelete,

            ("GET",            ["admin", "solutions", ..]) => PermissionCodes.SolutionsView,
            ("POST",           ["admin", "solutions", ..])     => PermissionCodes.SolutionsEdit,
            ("PUT" or "PATCH", ["admin", "solutions", ..]) => PermissionCodes.SolutionsEdit,
            ("DELETE",         ["admin", "solutions", ..]) => PermissionCodes.SolutionsDelete,

            ("GET",            ["admin", "articles", ..]) => PermissionCodes.ArticlesView,
            ("POST",           ["admin", "articles", ..])     => PermissionCodes.ArticlesEdit,
            ("PUT" or "PATCH", ["admin", "articles", ..]) => PermissionCodes.ArticlesEdit,
            ("DELETE",         ["admin", "articles", ..]) => PermissionCodes.ArticlesDelete,

            ("GET",            ["admin", "pages", ..]) => PermissionCodes.PagesView,
            ("POST",           ["admin", "pages", ..])     => PermissionCodes.PagesEdit,
            ("PUT" or "PATCH", ["admin", "pages", ..]) => PermissionCodes.PagesEdit,
            ("DELETE",         ["admin", "pages", ..]) => PermissionCodes.PagesDelete,

            ("GET",            ["admin", "exhibitions", ..]) => PermissionCodes.ExhibitionsView,
            ("POST",           ["admin", "exhibitions", ..])     => PermissionCodes.ExhibitionsEdit,
            ("PUT" or "PATCH", ["admin", "exhibitions", ..]) => PermissionCodes.ExhibitionsEdit,
            ("DELETE",         ["admin", "exhibitions", ..]) => PermissionCodes.ExhibitionsDelete,

            ("GET",            ["admin", "faq-categories", ..]) => PermissionCodes.FaqCategoriesView,
            ("POST",           ["admin", "faq-categories", ..])     => PermissionCodes.FaqCategoriesEdit,
            ("PUT" or "PATCH", ["admin", "faq-categories", ..]) => PermissionCodes.FaqCategoriesEdit,
            ("DELETE",         ["admin", "faq-categories", ..]) => PermissionCodes.FaqCategoriesDelete,

            ("GET",            ["admin", "faq-items", ..]) => PermissionCodes.FaqItemsView,
            ("POST",           ["admin", "faq-items", ..])     => PermissionCodes.FaqItemsEdit,
            ("PUT" or "PATCH", ["admin", "faq-items", ..]) => PermissionCodes.FaqItemsEdit,
            ("DELETE",         ["admin", "faq-items", ..]) => PermissionCodes.FaqItemsDelete,

            ("GET",            ["admin", "downloads", ..]) => PermissionCodes.DownloadsView,
            ("POST",           ["admin", "downloads", ..])     => PermissionCodes.DownloadsEdit,
            ("PUT" or "PATCH", ["admin", "downloads", ..]) => PermissionCodes.DownloadsEdit,
            ("DELETE",         ["admin", "downloads", ..]) => PermissionCodes.DownloadsDelete,

            ("GET",            ["admin", "article-tags", ..]) => PermissionCodes.ArticleTagsView,
            ("POST",           ["admin", "article-tags", ..])     => PermissionCodes.ArticleTagsEdit,
            ("PUT" or "PATCH", ["admin", "article-tags", ..]) => PermissionCodes.ArticleTagsEdit,
            ("DELETE",         ["admin", "article-tags", ..]) => PermissionCodes.ArticleTagsDelete,

            ("GET",            ["admin", "authors", ..]) => PermissionCodes.AuthorsView,
            ("POST",           ["admin", "authors", ..])     => PermissionCodes.AuthorsEdit,
            ("PUT" or "PATCH", ["admin", "authors", ..]) => PermissionCodes.AuthorsEdit,
            ("DELETE",         ["admin", "authors", ..]) => PermissionCodes.AuthorsDelete,

            ("GET",            ["admin", "certifications", ..]) => PermissionCodes.CertificationsView,
            ("POST",           ["admin", "certifications", ..])     => PermissionCodes.CertificationsEdit,
            ("PUT" or "PATCH", ["admin", "certifications", ..]) => PermissionCodes.CertificationsEdit,
            ("DELETE",         ["admin", "certifications", ..]) => PermissionCodes.CertificationsDelete,

            ("GET",            ["admin", "milestones", ..]) => PermissionCodes.MilestonesView,
            ("POST",           ["admin", "milestones", ..])     => PermissionCodes.MilestonesEdit,
            ("PUT" or "PATCH", ["admin", "milestones", ..]) => PermissionCodes.MilestonesEdit,
            ("DELETE",         ["admin", "milestones", ..]) => PermissionCodes.MilestonesDelete,

            ("GET",            ["admin", "locations", ..]) => PermissionCodes.LocationsView,
            ("POST",           ["admin", "locations", ..])     => PermissionCodes.LocationsEdit,
            ("PUT" or "PATCH", ["admin", "locations", ..]) => PermissionCodes.LocationsEdit,
            ("DELETE",         ["admin", "locations", ..]) => PermissionCodes.LocationsDelete,

            ("GET",            ["admin", "testimonials", ..]) => PermissionCodes.TestimonialsView,
            ("POST",           ["admin", "testimonials", ..])     => PermissionCodes.TestimonialsEdit,
            ("PUT" or "PATCH", ["admin", "testimonials", ..]) => PermissionCodes.TestimonialsEdit,
            ("DELETE",         ["admin", "testimonials", ..]) => PermissionCodes.TestimonialsDelete,

            ("GET",            ["admin", "partner-brands", ..]) => PermissionCodes.PartnerBrandsView,
            ("POST",           ["admin", "partner-brands", ..])     => PermissionCodes.PartnerBrandsEdit,
            ("PUT" or "PATCH", ["admin", "partner-brands", ..]) => PermissionCodes.PartnerBrandsEdit,
            ("DELETE",         ["admin", "partner-brands", ..]) => PermissionCodes.PartnerBrandsDelete,

            ("GET",            ["admin", "contact-channels", ..]) => PermissionCodes.ContactChannelsView,
            ("POST",           ["admin", "contact-channels", ..])     => PermissionCodes.ContactChannelsEdit,
            ("PUT" or "PATCH", ["admin", "contact-channels", ..]) => PermissionCodes.ContactChannelsEdit,
            ("DELETE",         ["admin", "contact-channels", ..]) => PermissionCodes.ContactChannelsDelete,

            ("GET",            ["admin", "process-flows", ..]) => PermissionCodes.ProcessFlowsView,
            ("POST",           ["admin", "process-flows", ..])     => PermissionCodes.ProcessFlowsEdit,
            ("PUT" or "PATCH", ["admin", "process-flows", ..]) => PermissionCodes.ProcessFlowsEdit,
            ("DELETE",         ["admin", "process-flows", ..]) => PermissionCodes.ProcessFlowsDelete,

            ("GET",            ["admin", "members", ..]) => PermissionCodes.MembersView,
            ("POST",           ["admin", "members", ..])     => PermissionCodes.MembersEdit,
            ("PUT" or "PATCH", ["admin", "members", ..]) => PermissionCodes.MembersEdit,
            ("DELETE",         ["admin", "members", ..]) => PermissionCodes.MembersDelete,

            ("GET",            ["admin", "sample-requests", ..]) => PermissionCodes.SampleRequestsView,
            ("POST",           ["admin", "sample-requests", ..])     => PermissionCodes.SampleRequestsEdit,
            ("PUT" or "PATCH", ["admin", "sample-requests", ..]) => PermissionCodes.SampleRequestsEdit,
            ("DELETE",         ["admin", "sample-requests", ..]) => PermissionCodes.SampleRequestsDelete,

            ("GET",            ["admin", "contact-inquiries", ..]) => PermissionCodes.ContactInquiriesView,
            ("POST",           ["admin", "contact-inquiries", ..])     => PermissionCodes.ContactInquiriesEdit,
            ("PUT" or "PATCH", ["admin", "contact-inquiries", ..]) => PermissionCodes.ContactInquiriesEdit,
            ("DELETE",         ["admin", "contact-inquiries", ..]) => PermissionCodes.ContactInquiriesDelete,

            ("GET",            ["admin", "business-domains", ..]) => PermissionCodes.BusinessDomainsView,
            ("POST",           ["admin", "business-domains", ..])     => PermissionCodes.BusinessDomainsEdit,
            ("PUT" or "PATCH", ["admin", "business-domains", ..]) => PermissionCodes.BusinessDomainsEdit,
            ("DELETE",         ["admin", "business-domains", ..]) => PermissionCodes.BusinessDomainsDelete,

            ("GET",            ["admin", "navigation", ..]) => PermissionCodes.NavigationView,
            ("POST",           ["admin", "navigation", ..])     => PermissionCodes.NavigationEdit,
            ("PUT" or "PATCH", ["admin", "navigation", ..]) => PermissionCodes.NavigationEdit,
            ("DELETE",         ["admin", "navigation", ..]) => PermissionCodes.NavigationDelete,

            ("GET",            ["admin", "redirects", ..]) => PermissionCodes.RedirectsView,
            ("POST",           ["admin", "redirects", ..])     => PermissionCodes.RedirectsEdit,
            ("PUT" or "PATCH", ["admin", "redirects", ..]) => PermissionCodes.RedirectsEdit,
            ("DELETE",         ["admin", "redirects", ..]) => PermissionCodes.RedirectsDelete,

            ("GET",            ["admin", "site-settings", ..]) => PermissionCodes.SiteSettingsView,
            ("POST",           ["admin", "site-settings", ..])     => PermissionCodes.SiteSettingsEdit,
            ("PUT" or "PATCH", ["admin", "site-settings", ..]) => PermissionCodes.SiteSettingsEdit,
            ("DELETE",         ["admin", "site-settings", ..]) => PermissionCodes.SiteSettingsDelete,

            ("GET",            ["admin", "media", ..]) => PermissionCodes.MediaView,
            ("POST",           ["admin", "media", ..])     => PermissionCodes.MediaEdit,
            ("PUT" or "PATCH", ["admin", "media", ..]) => PermissionCodes.MediaEdit,
            ("DELETE",         ["admin", "media", ..]) => PermissionCodes.MediaDelete,

            ("GET",            ["admin", "users", ..]) => PermissionCodes.UsersView,
            ("POST",           ["admin", "users", ..])     => PermissionCodes.UsersEdit,
            ("PUT" or "PATCH", ["admin", "users", ..]) => PermissionCodes.UsersEdit,
            ("DELETE",         ["admin", "users", ..]) => PermissionCodes.UsersDelete,
            _ => DenySentinel,
        };

    private Task<IActionResult?> RouteAdminAsync(HttpRequest req, string method, string[] segments) =>
        (method, segments) switch
        {
            ("POST", ["admin", "auth", "login"]) => Nullable(adminAuth.LoginAsync(req)),
            ("POST", ["admin", "auth", "refresh"]) => Nullable(adminAuth.RefreshAsync(req)),
            ("POST", ["admin", "auth", "logout"]) => Nullable(adminAuth.LogoutAsync(req)),
            ("GET", ["admin", "auth", "me"]) => Nullable(adminAuth.MeAsync(req)),
            ("POST", ["admin", "auth", "change-password"]) => Nullable(adminAuth.ChangePasswordAsync(req)),

            // 27 個單元共用同一組 CRUD（AdminResources 的登記表）。
            ("GET", ["admin", var type]) => Nullable(adminContent.ListAsync(req, type)),
            ("POST", ["admin", var type, "reorder"]) => Nullable(adminContent.ReorderAsync(req, type)),
            ("POST", ["admin", var type]) => Nullable(adminContent.CreateAsync(req, type)),
            ("GET", ["admin", var type, var id]) => Nullable(adminContent.GetAsync(req, type, id)),
            ("PUT" or "PATCH", ["admin", var type, var id]) => Nullable(adminContent.UpdateAsync(req, type, id)),
            ("DELETE", ["admin", var type, var id]) => Nullable(adminContent.DeleteAsync(req, type, id)),
            ("PUT", ["admin", var type, var id, "translations", var culture]) =>
                Nullable(adminContent.SaveTranslationAsync(req, type, id, culture)),
            ("POST", ["admin", var type, var id, "publish"]) => Nullable(adminContent.PublishAsync(req, type, id, true)),
            ("POST", ["admin", var type, var id, "unpublish"]) => Nullable(adminContent.PublishAsync(req, type, id, false)),

            _ => Task.FromResult<IActionResult?>(null),
        };
}
