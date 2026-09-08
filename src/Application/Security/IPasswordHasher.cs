namespace VicRound.Application.Security;

/// <summary>
/// 後台 <c>Users</c> 與前台 <c>Members</c> 共用同一種密碼格式（database.md §14.2）。
/// </summary>
public interface IPasswordHasher
{
    /// <summary>產生 PHC 風格字串：<c>$pbkdf2-sha256$i=600000$&lt;salt&gt;$&lt;hash&gt;</c>。</summary>
    string Hash(string password);

    /// <summary>驗證密碼；<c>NeedsRehash</c> 為 true 時呼叫端應以新參數重算並寫回。</summary>
    (bool Verified, bool NeedsRehash) Verify(string password, string phcString);
}
