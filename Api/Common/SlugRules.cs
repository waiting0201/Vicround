namespace VicRound.Api.Common;

/// <summary>
/// Slug 的產生規則（database.md §0.4）：小寫英數與連字號，其餘一律換成連字號。
/// DB 端有同一條 CHECK 約束把關，這裡是寫入前先把值整理好。
/// </summary>
public static class SlugRules
{
    public static string Normalize(string value)
    {
        var chars = value.Trim().ToLowerInvariant()
            .Select(c => char.IsAsciiLetterOrDigit(c) ? c : '-');

        var slug = new string(chars.ToArray());

        while (slug.Contains("--", StringComparison.Ordinal))
        {
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        }

        return slug.Trim('-');
    }
}
