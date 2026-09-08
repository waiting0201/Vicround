using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using VicRound.Api.Models.Entities;

namespace VicRound.Api.Data;

/// <summary>
/// 寫入 <c>CreatedAt</c> / <c>UpdatedAt</c>（一律 UTC）。
/// <b>刻意不用 DB trigger</b>——trigger 會與 EF 產生的 <c>OUTPUT</c> 子句衝突（database.md §0.4）。
/// </summary>
public sealed class AuditingSaveChangesInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        Stamp(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        Stamp(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void Stamp(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var now = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries<IHasTimestamps>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    // CreatedAt 不可被更新覆寫。
                    entry.Property(e => e.CreatedAt).IsModified = false;
                    break;
            }
        }
    }
}
