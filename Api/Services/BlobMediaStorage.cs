using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
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

    public Task<Uri> CreateReadLinkAsync(
        string container,
        string blobPath,
        TimeSpan lifetime,
        CancellationToken cancellationToken = default)
    {
        var blob = client.GetBlobContainerClient(container).GetBlobClient(blobPath);

        // 用連線字串建立的 client 握有帳戶金鑰，可以直接簽；改用受控識別時這裡會是 false，
        // 屆時要換成 user delegation key。先明確擋下，不要簽出一個沒有授權的網址。
        if (!blob.CanGenerateSasUri)
        {
            throw new InvalidOperationException(
                "目前的 Blob 認證方式無法簽發 SAS（需要帳戶金鑰或 user delegation key）。");
        }

        // 往前挪一點，容忍伺服器之間的時鐘差——差幾秒就會讓剛簽出的連結先失效。
        var builder = new BlobSasBuilder(BlobSasPermissions.Read, DateTimeOffset.UtcNow.Add(lifetime))
        {
            BlobContainerName = container,
            BlobName = blobPath,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
        };

        return Task.FromResult(blob.GenerateSasUri(builder));
    }
}
