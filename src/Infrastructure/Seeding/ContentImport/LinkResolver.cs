using Microsoft.EntityFrameworkCore;
using VicRound.Domain.Resources;

namespace VicRound.Infrastructure.Seeding.ContentImport;

/// <summary>
/// 把來源文案裡的站內路徑（<c>/products/optical-film</c>、<c>/contact</c>）解析成實體 FK。
/// <para>
/// 用 <c>Ref*Id</c> 而不是存裸 URL，是因為目標實體改 slug 時連結要自動跟著走
/// （database.md §05、§10 的同一條理由）。解析不到的才退回 <c>ExternalUrl</c>。
/// </para>
/// </summary>
internal sealed class LinkResolver
{
    private Dictionary<string, int> pages = [];
    private Dictionary<string, int> categories = [];
    private Dictionary<string, int> solutions = [];

    public static async Task<LinkResolver> CreateAsync(VicRoundDbContext db, CancellationToken cancellationToken) => new()
    {
        pages = await db.Pages.ToDictionaryAsync(p => p.Slug, p => p.Id, cancellationToken),
        categories = await db.Categories.ToDictionaryAsync(c => c.Slug, c => c.Id, cancellationToken),
        solutions = await db.Solutions.ToDictionaryAsync(s => s.Slug, s => s.Id, cancellationToken),
    };

    public void Apply(string? href, FaqItem target)
    {
        if (string.IsNullOrWhiteSpace(href))
        {
            return;
        }

        var segments = href.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);

        switch (segments)
        {
            case ["products", var categorySlug] when categories.TryGetValue(categorySlug, out var categoryId):
                target.RefCategoryId = categoryId;
                return;

            case ["solutions", var solutionSlug] when solutions.TryGetValue(solutionSlug, out var solutionId):
                target.RefSolutionId = solutionId;
                return;

            case [var pageSlug] when pages.TryGetValue(pageSlug, out var pageId):
                target.RefPageId = pageId;
                return;

            default:
                target.ExternalUrl = href;
                return;
        }
    }
}
