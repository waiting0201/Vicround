using VicRound.Domain.Common;

namespace VicRound.Domain.Media;

/// <summary>
/// database.md §11。檔案倉庫，<b>不是可發佈內容</b>——沒有 Slug、沒有 ContentStatus，
/// 用 <see cref="IsArchived"/> 隱藏。二進位永不進 SQL。
/// </summary>
public class MediaAsset : IHasTimestamps
{
    public int Id { get; set; }

    /// <summary><c>public-media</c>（公開，存 CDN URL）或 <c>member-documents</c>（私有，只走 SAS）。</summary>
    public string Container { get; set; } = string.Empty;
    public string BlobPath { get; set; } = string.Empty;

    /// <summary>public container 的 CDN URL；private 一律為 <c>null</c>。</summary>
    public string? Url { get; set; }

    /// <summary>true → 一律走短效 SAS，公開 API 不得回傳實際位址。</summary>
    public bool IsPrivate { get; set; }

    public MediaAssetType Type { get; set; } = MediaAssetType.Image;
    public string MimeType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public int? DurationSeconds { get; set; }

    /// <summary>去重提示（非唯一索引）。</summary>
    public string? Sha256 { get; set; }

    /// <summary>響應式裁切的視覺焦點，0–1。</summary>
    public decimal? FocalPointX { get; set; }
    public decimal? FocalPointY { get; set; }

    public bool IsArchived { get; set; }
    public string? LegacySourceKey { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }

    public ICollection<MediaAssetTranslation> Translations { get; set; } = new List<MediaAssetTranslation>();
}

public class MediaAssetTranslation : Translation
{
    public int MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public string? AltText { get; set; }
    public string? Caption { get; set; }
    public string? Title { get; set; }
}
