using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Logging;

namespace VicRound.Api.Services;

/// <summary>
/// Azure Blob Storage 實作。本機開發指向 Azurite（連線字串換掉即可，API 相同）。
/// </summary>
public sealed class BlobMediaStorage(BlobServiceClient client, ILogger<BlobMediaStorage> logger) : IMediaStorage
{
    private readonly HashSet<string> ensured = [];

    public async Task<StoredBlob> UploadAsync(
        Stream content,
        string blobPath,
        string contentType,
        bool isPrivate,
        CancellationToken cancellationToken = default)
    {
        var containerName = isPrivate ? MediaContainers.MemberDocuments : MediaContainers.Public;
        var container = client.GetBlobContainerClient(containerName);

        if (ensured.Add(containerName))
        {
            // 私有容器一律 None——會員文件只能經 SAS 取得，不得直連。
            await container.CreateIfNotExistsAsync(
                isPrivate ? PublicAccessType.None : PublicAccessType.Blob,
                cancellationToken: cancellationToken);
        }

        var blob = container.GetBlobClient(blobPath);

        try
        {
            await blob.UploadAsync(
                content,
                new BlobUploadOptions { HttpHeaders = new BlobHttpHeaders { ContentType = contentType } },
                cancellationToken);
        }
        catch (RequestFailedException e) when (e.Status == 409)
        {
            // 已存在就沿用——匯入是冪等的，重跑不該重傳 131MB。
            logger.LogDebug("Blob {Path} 已存在，沿用既有檔案。", blobPath);
        }

        return new StoredBlob(containerName, blobPath, isPrivate ? null : blob.Uri.ToString());
    }
}
