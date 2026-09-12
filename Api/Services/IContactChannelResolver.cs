using Microsoft.EntityFrameworkCore;
using VicRound.Api.Data;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Services;

/// <summary>指派到的收件窗口。</summary>
public sealed record ContactChannelTarget(int Id, string Email);

public interface IContactChannelResolver
{
    /// <summary>依詢問類型找收件窗口；對不到就退回 <c>Sales</c>，連 Sales 都沒有才回 <c>null</c>。</summary>
    Task<ContactChannelTarget?> ResolveAsync(InquiryType type, CancellationToken cancellationToken);
}

/// <summary>
/// 詢問單與樣品申請共用同一組收件窗口（<c>ContactChannels</c>），因此解析規則只寫一次。
///
/// <para>
/// <b>對不到就退回 <c>Sales</c></b>：確認稿只給了業務、工程、合作三個窗口，而表單預設送出的
/// 是 <c>General</c>、樣品申請是 <c>SampleRequest</c>——硬要精準對應的結果是最大宗的來信
/// 沒有人收。退回業務窗口既符合實務，也讓後台的「已指派」欄位不會整片空白。
/// </para>
/// </summary>
public sealed class ContactChannelResolver(VicRoundDbContext db) : IContactChannelResolver
{
    public async Task<ContactChannelTarget?> ResolveAsync(InquiryType type, CancellationToken cancellationToken)
    {
        var published = db.ContactChannels.Where(c => c.Status == ContentStatus.Published);

        var matched = await published
            .Where(c => c.InquiryType == type)
            .OrderBy(c => c.SortOrder)
            .Select(c => new ContactChannelTarget(c.Id, c.Email))
            .FirstOrDefaultAsync(cancellationToken);

        if (matched is not null)
        {
            return matched;
        }

        return await published
            .Where(c => c.InquiryType == InquiryType.Sales)
            .OrderBy(c => c.SortOrder)
            .Select(c => new ContactChannelTarget(c.Id, c.Email))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
