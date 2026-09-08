using VicRound.Infrastructure.Security;
using Xunit;

namespace VicRound.Application.Tests;

public class Pbkdf2PasswordHasherTests
{
    private readonly Pbkdf2PasswordHasher _hasher = new();

    [Fact]
    public void 產生的字串是PHC格式且帶有參數()
    {
        var hash = _hasher.Hash("Admin@123");

        Assert.StartsWith($"${Pbkdf2PasswordHasher.AlgorithmId}$i={Pbkdf2PasswordHasher.DefaultIterations}$", hash);
        Assert.Equal(5, hash.Split('$').Length);
    }

    [Fact]
    public void 同一密碼每次雜湊都不同_salt為隨機()
    {
        Assert.NotEqual(_hasher.Hash("Admin@123"), _hasher.Hash("Admin@123"));
    }

    [Fact]
    public void 正確密碼通過驗證且不需重算()
    {
        var (verified, needsRehash) = _hasher.Verify("Admin@123", _hasher.Hash("Admin@123"));

        Assert.True(verified);
        Assert.False(needsRehash);
    }

    [Fact]
    public void 錯誤密碼不通過()
    {
        var (verified, _) = _hasher.Verify("wrong", _hasher.Hash("Admin@123"));

        Assert.False(verified);
    }

    [Fact]
    public void 參數落後的雜湊在驗證成功後標記需重算()
    {
        // 舊參數的既有帳號：驗證仍要通過，但要能逐使用者升級（§14.2）。
        var legacy = LegacyHash("Admin@123", iterations: 100_000);

        var (verified, needsRehash) = _hasher.Verify("Admin@123", legacy);

        Assert.True(verified);
        Assert.True(needsRehash);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-phc-string")]
    [InlineData("$argon2id$i=3$c2FsdA==$aGFzaA==")]
    [InlineData("$pbkdf2-sha256$i=notanumber$c2FsdA==$aGFzaA==")]
    [InlineData("$pbkdf2-sha256$i=600000$not-base64!$aGFzaA==")]
    public void 格式不正確的雜湊一律不通過且不擲出例外(string stored)
    {
        var (verified, needsRehash) = _hasher.Verify("Admin@123", stored);

        Assert.False(verified);
        Assert.False(needsRehash);
    }

    private static string LegacyHash(string password, int iterations)
    {
        var salt = System.Security.Cryptography.RandomNumberGenerator.GetBytes(16);
        var key = System.Security.Cryptography.Rfc2898DeriveBytes.Pbkdf2(
            password, salt, iterations, System.Security.Cryptography.HashAlgorithmName.SHA256, 32);

        return $"$pbkdf2-sha256$i={iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
    }
}
