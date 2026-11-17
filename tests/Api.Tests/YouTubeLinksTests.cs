using VicRound.Api.Common;

namespace VicRound.Api.Tests;

/// <summary>編輯者從各種地方複製來的 YouTube 連結，都要收斂成同一個 11 碼 id。</summary>
public class YouTubeLinksTests
{
    [Theory]
    [InlineData("dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/watch?v=dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")]
    [InlineData("https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ")]
    [InlineData("https://m.youtube.com/watch?v=dQw4w9WgXcQ")]
    [InlineData("https://youtu.be/dQw4w9WgXcQ")]
    [InlineData("https://youtu.be/dQw4w9WgXcQ?si=abcdef")]
    [InlineData("youtu.be/dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/shorts/dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/embed/dQw4w9WgXcQ")]
    [InlineData("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0")]
    [InlineData("https://www.youtube.com/live/dQw4w9WgXcQ")]
    [InlineData("  https://youtu.be/dQw4w9WgXcQ  ")]
    public void Extracts_the_video_id(string input) =>
        Assert.Equal("dQw4w9WgXcQ", YouTubeLinks.ParseId(input));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("https://vimeo.com/123456")]
    [InlineData("https://evil.example/watch?v=dQw4w9WgXcQ")]       // 不是 YouTube 網域
    [InlineData("https://www.youtube.com/channel/UCxyz")]
    [InlineData("https://www.youtube.com/watch?v=short")]          // id 長度不對
    [InlineData("javascript:alert(1)")]
    public void Rejects_anything_else(string? input) =>
        Assert.Null(YouTubeLinks.ParseId(input));
}
