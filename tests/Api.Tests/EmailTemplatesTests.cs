using VicRound.Api.Models.Entities;
using VicRound.Api.Services;
using Xunit;

namespace VicRound.Api.Tests;

/// <summary>
/// 交易信的模板。信件的 HTML 進了收件匣就改不了，所以把兩件事釘住：
/// 語系判斷，以及「使用者填的字不得變成標記」。
/// </summary>
public class EmailTemplatesTests
{
    [Theory]
    [InlineData("zh-Hant", true)]
    [InlineData("zh-hant", true)]
    [InlineData("en", false)]
    [InlineData(null, false)]
    [InlineData("", false)]
    public void 語系判斷不分大小寫且空值視為英文(string? culture, bool expected) =>
        Assert.Equal(expected, EmailTemplates.IsChinese(culture));

    /// <summary>
    /// 詢問單的通知信會把客戶填的欄位原樣列出來，姓名欄填 <c>&lt;script&gt;</c>
    /// 不該變成業務信箱裡的一段標記。
    /// </summary>
    [Fact]
    public void 使用者填的內容一律跳脫()
    {
        var html = EmailTemplates.DefinitionList([("Name", "<script>alert(1)</script>")]);

        Assert.DoesNotContain("<script>", html);
        Assert.Contains("&lt;script&gt;", html);
    }

    [Fact]
    public void 連結的網址也會跳脫()
    {
        var html = EmailTemplates.Button("Verify", "https://example.com/verify?token=a&b=1");

        Assert.Contains("token=a&amp;b=1", html);
    }

    /// <summary>外框要宣告收件人的語言，讀螢幕與翻譯工具都看這一個屬性。</summary>
    [Fact]
    public void 外框帶上語言屬性()
    {
        Assert.Contains("""lang="zh-Hant" """.Trim(), EmailTemplates.Layout("標題", "", CultureCodes.TraditionalChinese));
        Assert.Contains("""lang="en" """.Trim(), EmailTemplates.Layout("Title", "", CultureCodes.Default));
    }
}
