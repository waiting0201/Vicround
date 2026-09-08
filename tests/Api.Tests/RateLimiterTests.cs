using VicRound.Api.Services;
using Xunit;

namespace VicRound.Api.Tests;

/// <summary>
/// 詢問表單的限流（database.md §12）。刻意不落 DB，因此正確性只能靠這裡守——
/// 額度算錯不是回錯資料，而是真人被擋在門外。
/// </summary>
public class RateLimiterTests
{
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(10);

    [Fact]
    public void 額度內放行額度用完擋下()
    {
        var limiter = new InMemoryRateLimiter();

        for (var i = 0; i < 3; i++)
        {
            Assert.True(limiter.TryAcquire("ip", 3, Window));
        }

        Assert.False(limiter.TryAcquire("ip", 3, Window));
    }

    [Fact]
    public void 不同來源各自計算()
    {
        var limiter = new InMemoryRateLimiter();

        Assert.True(limiter.TryAcquire("a", 1, Window));
        Assert.False(limiter.TryAcquire("a", 1, Window));
        Assert.True(limiter.TryAcquire("b", 1, Window));
    }

    [Fact]
    public void 時間窗過了就重新計算()
    {
        var limiter = new InMemoryRateLimiter();
        var tiny = TimeSpan.FromMilliseconds(1);

        Assert.True(limiter.TryAcquire("ip", 1, tiny));
        Thread.Sleep(5);
        Assert.True(limiter.TryAcquire("ip", 1, tiny));
    }
}
