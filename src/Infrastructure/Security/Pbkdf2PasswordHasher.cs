using System.Security.Cryptography;
using VicRound.Application.Security;

namespace VicRound.Infrastructure.Security;

/// <summary>
/// PBKDF2-HMAC-SHA256，iterations = 600,000（OWASP 現行建議值），salt 16 bytes、key 32 bytes。
/// <para>
/// 選用 PBKDF2 而非 Argon2id 的理由（database.md §14.2）：.NET BCL 內建、<b>零第三方相依</b>，
/// Functions 冷啟動少載一個組件；Argon2id 在 .NET 需第三方套件，其記憶體參數在 Consumption
/// plan 的記憶體上限與高併發登入下是穩定性風險。
/// </para>
/// <para>
/// 參數隨雜湊一起存成單一 PHC 字串，因此可<b>逐使用者漸進升級</b>——驗證成功時若參數落後於
/// 目前設定就重算寫回，不需 migration，也不需強制全員改密碼。
/// </para>
/// </summary>
public sealed class Pbkdf2PasswordHasher : IPasswordHasher
{
    public const string AlgorithmId = "pbkdf2-sha256";
    public const int DefaultIterations = 600_000;

    private const int SaltBytes = 16;
    private const int KeyBytes = 32;

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrEmpty(password);

        var salt = RandomNumberGenerator.GetBytes(SaltBytes);
        var key = Derive(password, salt, DefaultIterations);

        return $"${AlgorithmId}$i={DefaultIterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(key)}";
    }

    public (bool Verified, bool NeedsRehash) Verify(string password, string phcString)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(phcString))
        {
            return (false, false);
        }

        // $pbkdf2-sha256$i=600000$<salt>$<hash> → ["", "pbkdf2-sha256", "i=600000", salt, hash]
        var parts = phcString.Split('$');
        if (parts.Length != 5 || parts[1] != AlgorithmId || !parts[2].StartsWith("i=", StringComparison.Ordinal))
        {
            return (false, false);
        }

        if (!int.TryParse(parts[2].AsSpan(2), out var iterations) || iterations <= 0)
        {
            return (false, false);
        }

        byte[] salt;
        byte[] expected;
        try
        {
            salt = Convert.FromBase64String(parts[3]);
            expected = Convert.FromBase64String(parts[4]);
        }
        catch (FormatException)
        {
            return (false, false);
        }

        var actual = Derive(password, salt, iterations, expected.Length);
        var verified = CryptographicOperations.FixedTimeEquals(actual, expected);

        return (verified, verified && iterations < DefaultIterations);
    }

    private static byte[] Derive(string password, byte[] salt, int iterations, int keyBytes = KeyBytes) =>
        Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, keyBytes);
}
