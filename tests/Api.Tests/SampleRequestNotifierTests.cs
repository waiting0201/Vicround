using Microsoft.Extensions.Logging.Abstractions;
using VicRound.Api.Models.Entities;
using VicRound.Api.Services;
using Xunit;

namespace VicRound.Api.Tests;

/// <summary>
/// 樣品申請的通知信。這裡釘住的是**「哪些狀態該寄信」**——寄太多封比不寄更糟：
/// 一張單走完流程有六次狀態變動，每次都寄信只會讓人把我們設成垃圾郵件。
/// </summary>
public class SampleRequestNotifierTests
{
    /// <summary>收下信件而不真的寄出，讓測試看得到寄了幾封、寄給誰。</summary>
    private sealed class FakeSender : IEmailSender
    {
        public List<EmailMessage> Sent { get; } = [];

        public bool IsConfigured => true;

        public Task<bool> SendAsync(EmailMessage message, CancellationToken cancellationToken)
        {
            Sent.Add(message);
            return Task.FromResult(true);
        }
    }

    private sealed class FakeChannels : IContactChannelResolver
    {
        public Task<ContactChannelTarget?> ResolveAsync(InquiryType type, CancellationToken cancellationToken) =>
            Task.FromResult<ContactChannelTarget?>(new ContactChannelTarget(1, "sales@example.com"));
    }

    private sealed class FakeSiteUrls(string? baseUrl) : ISiteUrlResolver
    {
        public Task<string?> BaseUrlAsync(CancellationToken cancellationToken) => Task.FromResult(baseUrl);
    }

    private static SampleRequest Request(SampleRequestStatus status) => new()
    {
        RequestNumber = "SR-2026-000001",
        Status = status,
        ShipToName = "Tester",
        ShipToCompany = "Demo Co",
        ShipToAddressLine1 = "1 Demo Road",
        ShipToCity = "Taoyuan",
        ShipToPostalCode = "330",
        ShipToCountryCode = "TW",
        ShipToPhone = "0912345678",
        Items = [new SampleRequestItem { ProductNameSnapshot = "Anti-Glare", Quantity = 5, Unit = "sheet" }],
    };

    private static Member Member(string culture = CultureCodes.Default) => new()
    {
        Email = "member@example.com",
        FullName = "Tester",
        CompanyName = "Demo Co",
        PreferredCulture = culture,
    };

    [Theory]
    [InlineData(SampleRequestStatus.Approved, 1)]
    [InlineData(SampleRequestStatus.Shipped, 1)]
    [InlineData(SampleRequestStatus.Rejected, 1)]
    [InlineData(SampleRequestStatus.UnderReview, 0)]
    [InlineData(SampleRequestStatus.Delivered, 0)]
    [InlineData(SampleRequestStatus.Cancelled, 0)]
    public async Task 只有會員該採取行動的狀態才寄信(SampleRequestStatus status, int expected)
    {
        var sender = new FakeSender();
        var notifier = new SampleRequestNotifier(
            sender, new FakeChannels(), new FakeSiteUrls("https://example.com"),
            NullLogger<SampleRequestNotifier>.Instance);

        await notifier.NotifyStatusAsync(Request(status), Member(), CancellationToken.None);

        Assert.Equal(expected, sender.Sent.Count);
    }

    /// <summary>送出時是兩封：業務要知道有新單，會員要拿到單號。</summary>
    [Fact]
    public async Task 送出時業務與會員各一封()
    {
        var sender = new FakeSender();
        var notifier = new SampleRequestNotifier(
            sender, new FakeChannels(), new FakeSiteUrls("https://example.com"),
            NullLogger<SampleRequestNotifier>.Instance);

        await notifier.NotifySubmittedAsync(Request(SampleRequestStatus.Submitted), Member(), CancellationToken.None);

        Assert.Equal(2, sender.Sent.Count);
        Assert.Equal("sales@example.com", sender.Sent[0].ToEmail);
        Assert.Equal("member@example.com", sender.Sent[1].ToEmail);

        // 業務按「回覆」要直接回到客戶手上，不必再複製貼上一次 Email。
        Assert.Equal("member@example.com", sender.Sent[0].ReplyTo);
    }

    /// <summary>
    /// 沒有 base URL 時照樣寄，只是不放連結——一封沒有按鈕的通知仍然有用，
    /// 一條連到 <c>null</c> 的按鈕則是壞的。
    /// </summary>
    [Fact]
    public async Task 缺少站台網址時信照寄但不放連結()
    {
        var sender = new FakeSender();
        var notifier = new SampleRequestNotifier(
            sender, new FakeChannels(), new FakeSiteUrls(null), NullLogger<SampleRequestNotifier>.Instance);

        await notifier.NotifyStatusAsync(Request(SampleRequestStatus.Approved), Member(), CancellationToken.None);

        var message = Assert.Single(sender.Sent);
        Assert.DoesNotContain("href=\"\"", message.HtmlBody);
        Assert.DoesNotContain("null", message.TextBody);
    }

    /// <summary>出貨信的物流欄位是後台手填的，缺哪一個就跳過哪一個。</summary>
    [Fact]
    public async Task 出貨信只列有填的物流欄位()
    {
        var sender = new FakeSender();
        var notifier = new SampleRequestNotifier(
            sender, new FakeChannels(), new FakeSiteUrls("https://example.com"),
            NullLogger<SampleRequestNotifier>.Instance);

        var request = Request(SampleRequestStatus.Shipped);
        request.TrackingNumber = "TW1234567890";

        await notifier.NotifyStatusAsync(request, Member(), CancellationToken.None);

        var message = Assert.Single(sender.Sent);
        Assert.Contains("TW1234567890", message.TextBody);
        Assert.DoesNotContain("Carrier:", message.TextBody);
    }

    [Fact]
    public async Task 會員的語系決定信件語言()
    {
        var sender = new FakeSender();
        var notifier = new SampleRequestNotifier(
            sender, new FakeChannels(), new FakeSiteUrls("https://example.com"),
            NullLogger<SampleRequestNotifier>.Instance);

        await notifier.NotifyStatusAsync(
            Request(SampleRequestStatus.Approved),
            Member(CultureCodes.TraditionalChinese),
            CancellationToken.None);

        Assert.Contains("已核准", Assert.Single(sender.Sent).Subject);
    }
}
