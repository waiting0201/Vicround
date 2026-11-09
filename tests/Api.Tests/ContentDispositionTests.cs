using VicRound.Api.Services;
using Xunit;

namespace VicRound.Api.Tests;

/// <summary>
/// 會員下載的檔名靠 SAS 帶出的 <c>Content-Disposition</c>（Blob 名稱是 slug）。客戶指定的中文檔名
/// 要能原樣存檔，又不能讓引號或路徑字元把標頭弄壞。
/// </summary>
public class ContentDispositionTests
{
    [Fact]
    public void Ascii_name_is_used_for_both_parameters()
    {
        var header = BlobMediaStorage.ContentDispositionFor("vicround-uv-cut-test-report-20260511.pdf");

        Assert.Equal(
            "attachment; filename=\"vicround-uv-cut-test-report-20260511.pdf\"; " +
            "filename*=UTF-8''vicround-uv-cut-test-report-20260511.pdf",
            header);
    }

    [Fact]
    public void Chinese_name_falls_back_to_underscores_and_keeps_utf8_original()
    {
        var header = BlobMediaStorage.ContentDispositionFor("VICROUND-超薄防窺片-測試報告.pdf");

        Assert.Contains("filename=\"VICROUND-_____-____.pdf\"", header);
        Assert.Contains(
            "filename*=UTF-8''VICROUND-" + Uri.EscapeDataString("超薄防窺片") + "-" + Uri.EscapeDataString("測試報告") + ".pdf",
            header);
    }

    [Fact]
    public void Quotes_and_paths_cannot_break_out_of_the_header()
    {
        var header = BlobMediaStorage.ContentDispositionFor("../evil\"name.pdf");

        Assert.StartsWith("attachment; filename=\"evil_name.pdf\";", header);
        Assert.DoesNotContain("..", header);
    }
}
