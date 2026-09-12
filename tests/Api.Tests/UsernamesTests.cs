using VicRound.Api.Common;

namespace VicRound.Api.Tests;

/// <summary>
/// 後台登入帳號的規則（database.md §13）。帳號刻意不是 Email，格式也刻意窄——
/// 這幾個案例守的是「看起來一樣卻是兩個帳號」不會發生。
/// </summary>
public class UsernamesTests
{
    [Theory]
    [InlineData("superadmin")]
    [InlineData("vic.editor")]
    [InlineData("a_b-c")]
    [InlineData("abc")]
    public void Accepts_allowed_forms(string value) =>
        Assert.True(Usernames.IsValid(value));

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("ab")]                    // 太短
    [InlineData("sa@system.local")]       // Email 不是帳號
    [InlineData("編輯者")]                 // 非 ASCII
    [InlineData("vic editor")]            // 中間有空白
    public void Rejects_disallowed_forms(string value) =>
        Assert.False(Usernames.IsValid(value));

    [Fact]
    public void Rejects_over_max_length() =>
        Assert.False(Usernames.IsValid(new string('a', Usernames.MaxLength + 1)));

    [Fact]
    public void Normalize_matches_the_unique_index_rule()
    {
        // 唯一索引建在 UPPER(TRIM(Username)) 上，所以這三個是同一個帳號。
        Assert.Equal("EDITOR", Usernames.Normalize("editor"));
        Assert.Equal("EDITOR", Usernames.Normalize("  Editor "));
        Assert.Equal("EDITOR", Usernames.Normalize("EDITOR"));
    }

    [Fact]
    public void Require_trims_and_returns_the_original_casing() =>
        Assert.Equal("Vic.Editor", Usernames.Require("  Vic.Editor  "));

    [Fact]
    public void Require_rejects_an_email_with_a_format_error()
    {
        var error = Assert.Throws<AppException>(() => Usernames.Require("sa@system.local"));
        Assert.Equal(ErrorCodes.ValidationFormat, error.Code);
    }

    [Fact]
    public void Require_rejects_blank_as_a_required_error()
    {
        var error = Assert.Throws<AppException>(() => Usernames.Require("   "));
        Assert.Equal(ErrorCodes.ValidationRequired, error.Code);
    }
}
