namespace VicRound.Api.Services;

/// <summary>
/// Blob 儲存體。兩個容器（architecture.md）：<c>public-media</c> 公開讀取、存 CDN URL；
/// <c>member-documents</c> 私有，只能透過短效 SAS 取得。
/// <b>二進位永不進 SQL</b>——資料庫只存位址與 metadata。
/// </summary>
public interface IMediaStorage
{
    Task<StoredBlob> UploadAsync(
        Stream content,
        string blobPath,
        string contentType,
        bool isPrivate,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 為私有容器裡的檔案簽一個短效的唯讀連結（docs/cms-api.md：MemberOnly 下載）。
    ///
    /// <para>
    /// <b>會員文件永遠不給直連網址</b>，只給這種會過期的連結——網址被轉貼出去時，
    /// 它的有效期就是損害的上限。
    /// </para>
    /// </summary>
    Task<Uri> CreateReadLinkAsync(
        string container,
        string blobPath,
        TimeSpan lifetime,
        CancellationToken cancellationToken = default);
}

/// <param name="Url">公開容器的可直連網址；私有容器一律為 <c>null</c>。</param>
public readonly record struct StoredBlob(string Container, string BlobPath, string? Url);

public static class MediaContainers
{
    public const string Public = "public-media";
    public const string MemberDocuments = "member-documents";
}
