using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using VicRound.Api.Common;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data;

/// <summary>
/// 由 <c>Username</c> 推出 <c>UsernameNormalized</c>（唯一索引就建在後者）。
/// <para>
/// 放在 interceptor 而不是各個 service：後台的 CRUD 是泛型對映（<c>AdminMapper</c>），
/// 它只會寫前端送來的欄位——沒有這一層，從後台新增的帳號就會留下空的正規化值，
/// 第二個帳號撞唯一索引、而且誰都登不進去。
/// </para>
/// </summary>
public sealed class IdentityNormalizationInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        Normalize(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Normalize(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void Normalize(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        foreach (var entry in context.ChangeTracker.Entries<User>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
            {
                continue;
            }

            entry.Entity.Username = entry.Entity.Username.Trim();
            entry.Entity.UsernameNormalized = Usernames.Normalize(entry.Entity.Username);
            entry.Entity.Email = string.IsNullOrWhiteSpace(entry.Entity.Email) ? null : entry.Entity.Email.Trim();
        }
    }
}
