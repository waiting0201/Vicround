using System.Collections.Concurrent;

namespace VicRound.Api.Services;

public interface IRateLimiter
{
    /// <summary>在時間窗內是否還有額度；有則計入這一次。</summary>
    bool TryAcquire(string key, int limit, TimeSpan window);
}

/// <summary>
/// 記憶體內的滑動窗限流。
/// <para>
/// <b>刻意不落 DB</b>（database.md §12）——把每次送出的 IP 寫進資料庫等於自建一張 log 表，
/// 平白多出個人資料的保存責任。代價是每個 Functions 執行個體各算各的：
/// 擴到 N 台時實際上限是 N 倍。以詢問表單的量級這是可接受的取捨；真正的防濫用靠
/// anti-bot token，限流只是擋住最粗糙的重送。
/// </para>
/// </summary>
public sealed class InMemoryRateLimiter : IRateLimiter
{
    private readonly ConcurrentDictionary<string, List<DateTime>> hits = new();

    public bool TryAcquire(string key, int limit, TimeSpan window)
    {
        var now = DateTime.UtcNow;
        var timestamps = hits.GetOrAdd(key, _ => []);

        lock (timestamps)
        {
            timestamps.RemoveAll(t => now - t > window);

            if (timestamps.Count >= limit)
            {
                return false;
            }

            timestamps.Add(now);
        }

        // 沒有背景清理工作，因此順手丟掉已經整段過期的 key，
        // 否則長跑的執行個體會一直累積再也不會出現的 IP。
        if (hits.Count > 4096)
        {
            foreach (var (staleKey, stamps) in hits)
            {
                lock (stamps)
                {
                    if (stamps.Count == 0 || now - stamps[^1] > window)
                    {
                        hits.TryRemove(staleKey, out _);
                    }
                }
            }
        }

        return true;
    }
}
