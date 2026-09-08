
namespace VicRound.Api.Models.Entities;

/// <summary>
/// database.md §04。mockup 的 5 種有序步驟清單（Core Processes、產品線 How it is made、
/// Co-development、OEM/ODM、Contact 三步驟）共用父子兩張表 + <see cref="Kind"/>，
/// 而非各建一張表。Addressable：Slug 只供 <c>#core-processes</c> 這類錨點，不進 sitemap。
/// </summary>
public class ProcessFlow : SluggedEntity
{
    public ProcessFlowKind Kind { get; set; }

    /// <summary>產品線專屬的 How it is made；其餘 flow 為 <c>null</c>。</summary>
    public int? OwnerCategoryId { get; set; }
    public Category? OwnerCategory { get; set; }

    public ICollection<ProcessFlowTranslation> Translations { get; set; } = new List<ProcessFlowTranslation>();
    public ICollection<ProcessStep> Steps { get; set; } = new List<ProcessStep>();
}

public class ProcessFlowTranslation : SeoTranslation
{
    public int ProcessFlowId { get; set; }
    public ProcessFlow? ProcessFlow { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Intro { get; set; }
}

public class ProcessStep : ContentEntity
{
    public int ProcessFlowId { get; set; }
    public ProcessFlow? ProcessFlow { get; set; }

    public byte StepNumber { get; set; }
    public string? IconName { get; set; }

    /// <summary>Co-development flow 的漸層色條。</summary>
    public string? AccentColorHex { get; set; }

    public int? MediaAssetId { get; set; }
    public MediaAsset? MediaAsset { get; set; }

    public ICollection<ProcessStepTranslation> Translations { get; set; } = new List<ProcessStepTranslation>();
}

public class ProcessStepTranslation : Translation
{
    public int ProcessStepId { get; set; }
    public ProcessStep? ProcessStep { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
}
