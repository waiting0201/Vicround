using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace VicRound.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ArticleTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsSystem = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleTags", x => x.Id);
                    table.CheckConstraint("CK_ArticleTags_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                });

            migrationBuilder.CreateTable(
                name: "BusinessDomainRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Domain = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Rule = table.Column<byte>(type: "tinyint", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessDomainRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContactChannels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    InquiryType = table.Column<byte>(type: "tinyint", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactChannels", x => x.Id);
                    table.CheckConstraint("CK_ContactChannels_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                });

            migrationBuilder.CreateTable(
                name: "Cultures",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NativeName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cultures", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "FaqCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaqCategories", x => x.Id);
                    table.CheckConstraint("CK_FaqCategories_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                });

            migrationBuilder.CreateTable(
                name: "MediaAssets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Container = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    BlobPath = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    Url = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                    IsPrivate = table.Column<bool>(type: "bit", nullable: false),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    MimeType = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Width = table.Column<int>(type: "int", nullable: true),
                    Height = table.Column<int>(type: "int", nullable: true),
                    DurationSeconds = table.Column<int>(type: "int", nullable: true),
                    Sha256 = table.Column<string>(type: "nchar(64)", fixedLength: true, maxLength: 64, nullable: true),
                    FocalPointX = table.Column<decimal>(type: "decimal(5,4)", precision: 5, scale: 4, nullable: true),
                    FocalPointY = table.Column<decimal>(type: "decimal(5,4)", precision: 5, scale: 4, nullable: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false),
                    LegacySourceKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaAssets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SiteSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ValueKind = table.Column<byte>(type: "tinyint", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsLocalized = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteSettings", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "ContactChannelTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ContactChannelId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactChannelTranslations", x => new { x.ContactChannelId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ContactChannelTranslations_ContactChannels_ContactChannelId",
                        column: x => x.ContactChannelId,
                        principalTable: "ContactChannels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContactChannelTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "Members",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    EmailNormalized = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    EmailDomain = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false, computedColumnSql: "LOWER(SUBSTRING([Email], CHARINDEX('@', [Email]) + 1, 320))", stored: true),
                    PasswordHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    PasswordChangedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    MustChangePassword = table.Column<bool>(type: "bit", nullable: false),
                    SecurityStamp = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    JobRole = table.Column<byte>(type: "tinyint", nullable: false),
                    JobRoleOther = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    CountryCode = table.Column<string>(type: "nchar(2)", fixedLength: true, maxLength: 2, nullable: true),
                    PreferredCulture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    EmailVerifiedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    ReviewNote = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    ConsentedPrivacyAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    ConsentPolicyVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    MarketingOptInAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    FailedLoginCount = table.Column<byte>(type: "tinyint", nullable: false),
                    LockoutEndsAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Members_Cultures_PreferredCulture",
                        column: x => x.PreferredCulture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "Redirects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FromPath = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    ToPath = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    StatusCode = table.Column<short>(type: "smallint", nullable: false),
                    TargetCulture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    LegacySourceKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Redirects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Redirects_Cultures_TargetCulture",
                        column: x => x.TargetCulture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    EmailNormalized = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    PasswordChangedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    MustChangePassword = table.Column<bool>(type: "bit", nullable: false),
                    SecurityStamp = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    FailedLoginCount = table.Column<byte>(type: "tinyint", nullable: false),
                    LockoutEndsAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    PreferredCulture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Cultures_PreferredCulture",
                        column: x => x.PreferredCulture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "FaqCategoryTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    FaqCategoryId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaqCategoryTranslations", x => new { x.FaqCategoryId, x.Culture });
                    table.ForeignKey(
                        name: "FK_FaqCategoryTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_FaqCategoryTranslations_FaqCategories_FaqCategoryId",
                        column: x => x.FaqCategoryId,
                        principalTable: "FaqCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleTagTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ArticleTagId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleTagTranslations", x => new { x.ArticleTagId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ArticleTagTranslations_ArticleTags_ArticleTagId",
                        column: x => x.ArticleTagId,
                        principalTable: "ArticleTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleTagTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_ArticleTagTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Authors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Initials = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    MediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Authors", x => x.Id);
                    table.CheckConstraint("CK_Authors_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Authors_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    AccentColorHex = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    IconName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    HeroMediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.CheckConstraint("CK_Categories_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Categories_Categories_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Categories_MediaAssets_HeroMediaAssetId",
                        column: x => x.HeroMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Downloads",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MediaAssetId = table.Column<int>(type: "int", nullable: false),
                    Kind = table.Column<byte>(type: "tinyint", nullable: false),
                    AccessLevel = table.Column<byte>(type: "tinyint", nullable: false),
                    Version = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    DocumentDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ValidUntil = table.Column<DateOnly>(type: "date", nullable: true),
                    FileExtension = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    DocumentCulture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    ThumbnailMediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Downloads", x => x.Id);
                    table.CheckConstraint("CK_Downloads_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Downloads_Cultures_DocumentCulture",
                        column: x => x.DocumentCulture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_Downloads_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Downloads_MediaAssets_ThumbnailMediaAssetId",
                        column: x => x.ThumbnailMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Exhibitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    BoothNumber = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    City = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    CountryCode = table.Column<string>(type: "nchar(2)", fixedLength: true, maxLength: 2, nullable: true),
                    WebsiteUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    MeetingUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    HeroMediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exhibitions", x => x.Id);
                    table.CheckConstraint("CK_Exhibitions_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Exhibitions_MediaAssets_HeroMediaAssetId",
                        column: x => x.HeroMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    CountryCode = table.Column<string>(type: "nchar(2)", fixedLength: true, maxLength: 2, nullable: false),
                    City = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                    Latitude = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: true),
                    Longitude = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: true),
                    MapUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    MediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Locations_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "MediaAssetTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    MediaAssetId = table.Column<int>(type: "int", nullable: false),
                    AltText = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Caption = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaAssetTranslations", x => new { x.MediaAssetId, x.Culture });
                    table.ForeignKey(
                        name: "FK_MediaAssetTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_MediaAssetTranslations_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Milestones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Month = table.Column<byte>(type: "tinyint", nullable: true),
                    MediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Milestones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Milestones_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Pages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Template = table.Column<byte>(type: "tinyint", nullable: false),
                    ParentPageId = table.Column<int>(type: "int", nullable: true),
                    IsSystemPage = table.Column<bool>(type: "bit", nullable: false),
                    HeroMediaAssetId = table.Column<int>(type: "int", nullable: true),
                    LegacySourceKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pages", x => x.Id);
                    table.CheckConstraint("CK_Pages_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Pages_MediaAssets_HeroMediaAssetId",
                        column: x => x.HeroMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pages_Pages_ParentPageId",
                        column: x => x.ParentPageId,
                        principalTable: "Pages",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PartnerBrands",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LogoMediaAssetId = table.Column<int>(type: "int", nullable: false),
                    WebsiteUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    IsLogoWallVisible = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerBrands", x => x.Id);
                    table.CheckConstraint("CK_PartnerBrands_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_PartnerBrands_MediaAssets_LogoMediaAssetId",
                        column: x => x.LogoMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Solutions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IconName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    IsNew = table.Column<bool>(type: "bit", nullable: false),
                    HeroMediaAssetId = table.Column<int>(type: "int", nullable: true),
                    LegacySourceKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Solutions", x => x.Id);
                    table.CheckConstraint("CK_Solutions_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Solutions_MediaAssets_HeroMediaAssetId",
                        column: x => x.HeroMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SiteSettingTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    SettingKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteSettingTranslations", x => new { x.SettingKey, x.Culture });
                    table.ForeignKey(
                        name: "FK_SiteSettingTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_SiteSettingTranslations_SiteSettings_SettingKey",
                        column: x => x.SettingKey,
                        principalTable: "SiteSettings",
                        principalColumn: "Key",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberRefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "nchar(64)", fixedLength: true, maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    ReplacedByTokenHash = table.Column<string>(type: "nchar(64)", fixedLength: true, maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberRefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberRefreshTokens_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Purpose = table.Column<byte>(type: "tinyint", nullable: false),
                    TokenHash = table.Column<string>(type: "nchar(64)", fixedLength: true, maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    ConsumedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MemberTokens_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SampleRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    RequestNumber = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    MemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceSampleRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    ShipToName = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    ShipToCompany = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ShipToAddressLine1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ShipToAddressLine2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ShipToCity = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    ShipToState = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    ShipToPostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ShipToCountryCode = table.Column<string>(type: "nchar(2)", fixedLength: true, maxLength: 2, nullable: false),
                    ShipToPhone = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    ProjectName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TargetApplication = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MemberNote = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    InternalNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    ShippedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    RejectedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    Carrier = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    TrackingNumber = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    TrackingUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    ExternalOrderNumber = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SampleRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SampleRequests_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SampleRequests_SampleRequests_SourceSampleRequestId",
                        column: x => x.SourceSampleRequestId,
                        principalTable: "SampleRequests",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "nchar(64)", fixedLength: true, maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    ReplacedByTokenHash = table.Column<string>(type: "nchar(64)", fixedLength: true, maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuthorTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    AuthorId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    JobTitle = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    Bio = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthorTranslations", x => new { x.AuthorId, x.Culture });
                    table.ForeignKey(
                        name: "FK_AuthorTranslations_Authors_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Authors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AuthorTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "CategoryTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ShortName = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    MenuNote = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    Summary = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    Intro = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryTranslations", x => new { x.CategoryId, x.Culture });
                    table.ForeignKey(
                        name: "FK_CategoryTranslations_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CategoryTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_CategoryTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProcessFlows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Kind = table.Column<byte>(type: "tinyint", nullable: false),
                    OwnerCategoryId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessFlows", x => x.Id);
                    table.CheckConstraint("CK_ProcessFlows_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_ProcessFlows_Categories_OwnerCategoryId",
                        column: x => x.OwnerCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    ParentProductId = table.Column<int>(type: "int", nullable: true),
                    Code = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    Brand = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    IsFeatured = table.Column<bool>(type: "bit", nullable: false),
                    IsNew = table.Column<bool>(type: "bit", nullable: false),
                    HeroMediaAssetId = table.Column<int>(type: "int", nullable: true),
                    LegacySourceKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.CheckConstraint("CK_Products_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Products_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Products_MediaAssets_HeroMediaAssetId",
                        column: x => x.HeroMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Products_Products_ParentProductId",
                        column: x => x.ParentProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Certifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Category = table.Column<byte>(type: "tinyint", nullable: false),
                    CertificateNumber = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    IssuedOn = table.Column<DateOnly>(type: "date", nullable: true),
                    ValidUntil = table.Column<DateOnly>(type: "date", nullable: true),
                    IsPlaceholder = table.Column<bool>(type: "bit", nullable: false),
                    DownloadId = table.Column<int>(type: "int", nullable: true),
                    LogoMediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Certifications", x => x.Id);
                    table.CheckConstraint("CK_Certifications_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Certifications_Downloads_DownloadId",
                        column: x => x.DownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Certifications_MediaAssets_LogoMediaAssetId",
                        column: x => x.LogoMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DownloadCategories",
                columns: table => new
                {
                    DownloadId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DownloadCategories", x => new { x.DownloadId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_DownloadCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DownloadCategories_Downloads_DownloadId",
                        column: x => x.DownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DownloadTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    DownloadId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DownloadTranslations", x => new { x.DownloadId, x.Culture });
                    table.ForeignKey(
                        name: "FK_DownloadTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_DownloadTranslations_Downloads_DownloadId",
                        column: x => x.DownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DownloadTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    AuthorId = table.Column<int>(type: "int", nullable: true),
                    ExhibitionId = table.Column<int>(type: "int", nullable: true),
                    HeroMediaAssetId = table.Column<int>(type: "int", nullable: true),
                    ReadingMinutes = table.Column<byte>(type: "tinyint", nullable: true),
                    IsFeatured = table.Column<bool>(type: "bit", nullable: false),
                    LegacySourceKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                    table.CheckConstraint("CK_Articles_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_Articles_Authors_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Authors",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Articles_Exhibitions_ExhibitionId",
                        column: x => x.ExhibitionId,
                        principalTable: "Exhibitions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Articles_MediaAssets_HeroMediaAssetId",
                        column: x => x.HeroMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ExhibitionTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ExhibitionId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    VenueName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Summary = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OnBoothNote = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    CtaLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExhibitionTranslations", x => new { x.ExhibitionId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ExhibitionTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_ExhibitionTranslations_Exhibitions_ExhibitionId",
                        column: x => x.ExhibitionId,
                        principalTable: "Exhibitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExhibitionTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LocationTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    LocationId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AddressLine = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    OpeningHours = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationTranslations", x => new { x.LocationId, x.Culture });
                    table.ForeignKey(
                        name: "FK_LocationTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_LocationTranslations_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MilestoneTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    MilestoneId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MilestoneTranslations", x => new { x.MilestoneId, x.Culture });
                    table.ForeignKey(
                        name: "FK_MilestoneTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_MilestoneTranslations_Milestones_MilestoneId",
                        column: x => x.MilestoneId,
                        principalTable: "Milestones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PageTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    PageId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Eyebrow = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Subtitle = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    BannerTitle = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    BannerDescription = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    CtaEyebrow = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    CtaHeadline = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CtaSubcopy = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastReviewedLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageTranslations", x => new { x.PageId, x.Culture });
                    table.ForeignKey(
                        name: "FK_PageTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_PageTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PageTranslations_Pages_PageId",
                        column: x => x.PageId,
                        principalTable: "Pages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PartnerBrandTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    PartnerBrandId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerBrandTranslations", x => new { x.PartnerBrandId, x.Culture });
                    table.ForeignKey(
                        name: "FK_PartnerBrandTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_PartnerBrandTranslations_PartnerBrands_PartnerBrandId",
                        column: x => x.PartnerBrandId,
                        principalTable: "PartnerBrands",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContentBlocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BlockType = table.Column<byte>(type: "tinyint", nullable: false),
                    OwnerPageId = table.Column<int>(type: "int", nullable: true),
                    OwnerSolutionId = table.Column<int>(type: "int", nullable: true),
                    OwnerCategoryId = table.Column<int>(type: "int", nullable: true),
                    Anchor = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Tone = table.Column<byte>(type: "tinyint", nullable: false),
                    SettingsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentBlocks", x => x.Id);
                    table.CheckConstraint("CK_ContentBlocks_SingleOwner", "CASE WHEN [OwnerPageId] IS NULL THEN 0 ELSE 1 END + CASE WHEN [OwnerSolutionId] IS NULL THEN 0 ELSE 1 END + CASE WHEN [OwnerCategoryId] IS NULL THEN 0 ELSE 1 END = 1");
                    table.ForeignKey(
                        name: "FK_ContentBlocks_Categories_OwnerCategoryId",
                        column: x => x.OwnerCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlocks_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlocks_Pages_OwnerPageId",
                        column: x => x.OwnerPageId,
                        principalTable: "Pages",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlocks_Solutions_OwnerSolutionId",
                        column: x => x.OwnerSolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DownloadSolutions",
                columns: table => new
                {
                    DownloadId = table.Column<int>(type: "int", nullable: false),
                    SolutionId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DownloadSolutions", x => new { x.DownloadId, x.SolutionId });
                    table.ForeignKey(
                        name: "FK_DownloadSolutions_Downloads_DownloadId",
                        column: x => x.DownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DownloadSolutions_Solutions_SolutionId",
                        column: x => x.SolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SolutionCategories",
                columns: table => new
                {
                    SolutionId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolutionCategories", x => new { x.SolutionId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_SolutionCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SolutionCategories_Solutions_SolutionId",
                        column: x => x.SolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SolutionTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    SolutionId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    MenuNote = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    Summary = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    ChallengeTitle = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ChallengeBody = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CtaLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolutionTranslations", x => new { x.SolutionId, x.Culture });
                    table.ForeignKey(
                        name: "FK_SolutionTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_SolutionTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SolutionTranslations_Solutions_SolutionId",
                        column: x => x.SolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Testimonials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PartnerBrandId = table.Column<int>(type: "int", nullable: true),
                    SolutionId = table.Column<int>(type: "int", nullable: true),
                    MediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Testimonials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Testimonials_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Testimonials_PartnerBrands_PartnerBrandId",
                        column: x => x.PartnerBrandId,
                        principalTable: "PartnerBrands",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Testimonials_Solutions_SolutionId",
                        column: x => x.SolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProcessFlowTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ProcessFlowId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Subtitle = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    Intro = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessFlowTranslations", x => new { x.ProcessFlowId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ProcessFlowTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_ProcessFlowTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProcessFlowTranslations_ProcessFlows_ProcessFlowId",
                        column: x => x.ProcessFlowId,
                        principalTable: "ProcessFlows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProcessSteps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcessFlowId = table.Column<int>(type: "int", nullable: false),
                    StepNumber = table.Column<byte>(type: "tinyint", nullable: false),
                    IconName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    AccentColorHex = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    MediaAssetId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessSteps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcessSteps_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProcessSteps_ProcessFlows_ProcessFlowId",
                        column: x => x.ProcessFlowId,
                        principalTable: "ProcessFlows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContactInquiries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(24)", maxLength: 24, nullable: false),
                    Type = table.Column<byte>(type: "tinyint", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    CompanyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    CategoryId = table.Column<int>(type: "int", nullable: true),
                    ProductLineOther = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RefProductId = table.Column<int>(type: "int", nullable: true),
                    RefDownloadId = table.Column<int>(type: "int", nullable: true),
                    ApplicationText = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TargetSpec = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Message = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    SourceUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    MemberId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ConsentedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    ConsentPolicyVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    AssignedChannelId = table.Column<int>(type: "int", nullable: true),
                    InternalNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RespondedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactInquiries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactInquiries_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContactInquiries_ContactChannels_AssignedChannelId",
                        column: x => x.AssignedChannelId,
                        principalTable: "ContactChannels",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContactInquiries_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_ContactInquiries_Downloads_RefDownloadId",
                        column: x => x.RefDownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContactInquiries_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContactInquiries_Products_RefProductId",
                        column: x => x.RefProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DownloadProducts",
                columns: table => new
                {
                    DownloadId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DownloadProducts", x => new { x.DownloadId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_DownloadProducts_Downloads_DownloadId",
                        column: x => x.DownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DownloadProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FaqItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FaqCategoryId = table.Column<int>(type: "int", nullable: false),
                    RefProductId = table.Column<int>(type: "int", nullable: true),
                    RefCategoryId = table.Column<int>(type: "int", nullable: true),
                    RefSolutionId = table.Column<int>(type: "int", nullable: true),
                    RefPageId = table.Column<int>(type: "int", nullable: true),
                    RefDownloadId = table.Column<int>(type: "int", nullable: true),
                    ExternalUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    IsFeatured = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_CS_AS")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaqItems", x => x.Id);
                    table.CheckConstraint("CK_FaqItems_Slug", "[Slug] = LOWER([Slug]) AND [Slug] NOT LIKE '%[^a-z0-9-]%'");
                    table.ForeignKey(
                        name: "FK_FaqItems_Categories_RefCategoryId",
                        column: x => x.RefCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FaqItems_Downloads_RefDownloadId",
                        column: x => x.RefDownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FaqItems_FaqCategories_FaqCategoryId",
                        column: x => x.FaqCategoryId,
                        principalTable: "FaqCategories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FaqItems_Pages_RefPageId",
                        column: x => x.RefPageId,
                        principalTable: "Pages",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FaqItems_Products_RefProductId",
                        column: x => x.RefProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FaqItems_Solutions_RefSolutionId",
                        column: x => x.RefSolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProductImages",
                columns: table => new
                {
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    MediaAssetId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductImages", x => new { x.ProductId, x.MediaAssetId });
                    table.ForeignKey(
                        name: "FK_ProductImages_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProductImages_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductSolutions",
                columns: table => new
                {
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    SolutionId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductSolutions", x => new { x.ProductId, x.SolutionId });
                    table.ForeignKey(
                        name: "FK_ProductSolutions_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductSolutions_Solutions_SolutionId",
                        column: x => x.SolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProductTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApplicationNote = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductTranslations", x => new { x.ProductId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ProductTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_ProductTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProductTranslations_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SampleRequestItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SampleRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: true),
                    CategoryId = table.Column<int>(type: "int", nullable: true),
                    GradeCode = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ProductNameSnapshot = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RequestedSpec = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    LotSpecReference = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ShippedQuantity = table.Column<int>(type: "int", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SampleRequestItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SampleRequestItems_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SampleRequestItems_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SampleRequestItems_SampleRequests_SampleRequestId",
                        column: x => x.SampleRequestId,
                        principalTable: "SampleRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpecificationRows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OwnerProductId = table.Column<int>(type: "int", nullable: true),
                    OwnerCategoryId = table.Column<int>(type: "int", nullable: true),
                    OwnerSolutionId = table.Column<int>(type: "int", nullable: true),
                    IsHighlighted = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecificationRows", x => x.Id);
                    table.CheckConstraint("CK_SpecificationRows_SingleOwner", "CASE WHEN [OwnerProductId] IS NULL THEN 0 ELSE 1 END + CASE WHEN [OwnerCategoryId] IS NULL THEN 0 ELSE 1 END + CASE WHEN [OwnerSolutionId] IS NULL THEN 0 ELSE 1 END = 1");
                    table.ForeignKey(
                        name: "FK_SpecificationRows_Categories_OwnerCategoryId",
                        column: x => x.OwnerCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SpecificationRows_Products_OwnerProductId",
                        column: x => x.OwnerProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SpecificationRows_Solutions_OwnerSolutionId",
                        column: x => x.OwnerSolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CertificationCategories",
                columns: table => new
                {
                    CertificationId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificationCategories", x => new { x.CertificationId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_CertificationCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CertificationCategories_Certifications_CertificationId",
                        column: x => x.CertificationId,
                        principalTable: "Certifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CertificationProducts",
                columns: table => new
                {
                    CertificationId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificationProducts", x => new { x.CertificationId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_CertificationProducts_Certifications_CertificationId",
                        column: x => x.CertificationId,
                        principalTable: "Certifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CertificationProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CertificationTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CertificationId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ShortNote = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Summary = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IssuerName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ValidityText = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ScopeText = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SitesText = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    DocumentationLabel = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificationTranslations", x => new { x.CertificationId, x.Culture });
                    table.ForeignKey(
                        name: "FK_CertificationTranslations_Certifications_CertificationId",
                        column: x => x.CertificationId,
                        principalTable: "Certifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CertificationTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_CertificationTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DownloadCertifications",
                columns: table => new
                {
                    DownloadId = table.Column<int>(type: "int", nullable: false),
                    CertificationId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DownloadCertifications", x => new { x.DownloadId, x.CertificationId });
                    table.ForeignKey(
                        name: "FK_DownloadCertifications_Certifications_CertificationId",
                        column: x => x.CertificationId,
                        principalTable: "Certifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DownloadCertifications_Downloads_DownloadId",
                        column: x => x.DownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleCategories",
                columns: table => new
                {
                    ArticleId = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleCategories", x => new { x.ArticleId, x.CategoryId });
                    table.ForeignKey(
                        name: "FK_ArticleCategories_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleProducts",
                columns: table => new
                {
                    ArticleId = table.Column<int>(type: "int", nullable: false),
                    ProductId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleProducts", x => new { x.ArticleId, x.ProductId });
                    table.ForeignKey(
                        name: "FK_ArticleProducts_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleProducts_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleSolutions",
                columns: table => new
                {
                    ArticleId = table.Column<int>(type: "int", nullable: false),
                    SolutionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleSolutions", x => new { x.ArticleId, x.SolutionId });
                    table.ForeignKey(
                        name: "FK_ArticleSolutions_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleSolutions_Solutions_SolutionId",
                        column: x => x.SolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleTagLinks",
                columns: table => new
                {
                    ArticleId = table.Column<int>(type: "int", nullable: false),
                    ArticleTagId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleTagLinks", x => new { x.ArticleId, x.ArticleTagId });
                    table.ForeignKey(
                        name: "FK_ArticleTagLinks_ArticleTags_ArticleTagId",
                        column: x => x.ArticleTagId,
                        principalTable: "ArticleTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleTagLinks_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ArticleId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Excerpt = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    Lead = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PullQuote = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true),
                    PullQuoteAttribution = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SeoDescription = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    SeoKeywords = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    OgImageMediaAssetId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleTranslations", x => new { x.ArticleId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ArticleTranslations_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_ArticleTranslations_MediaAssets_OgImageMediaAssetId",
                        column: x => x.OgImageMediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DownloadArticles",
                columns: table => new
                {
                    DownloadId = table.Column<int>(type: "int", nullable: false),
                    ArticleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DownloadArticles", x => new { x.DownloadId, x.ArticleId });
                    table.ForeignKey(
                        name: "FK_DownloadArticles_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DownloadArticles_Downloads_DownloadId",
                        column: x => x.DownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NavigationItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    Location = table.Column<byte>(type: "tinyint", nullable: false),
                    LinkType = table.Column<byte>(type: "tinyint", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    RefPageId = table.Column<int>(type: "int", nullable: true),
                    RefCategoryId = table.Column<int>(type: "int", nullable: true),
                    RefProductId = table.Column<int>(type: "int", nullable: true),
                    RefSolutionId = table.Column<int>(type: "int", nullable: true),
                    RefArticleId = table.Column<int>(type: "int", nullable: true),
                    RefDownloadId = table.Column<int>(type: "int", nullable: true),
                    IconName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    OpenInNewTab = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NavigationItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NavigationItems_Articles_RefArticleId",
                        column: x => x.RefArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NavigationItems_Categories_RefCategoryId",
                        column: x => x.RefCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NavigationItems_Downloads_RefDownloadId",
                        column: x => x.RefDownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NavigationItems_NavigationItems_ParentId",
                        column: x => x.ParentId,
                        principalTable: "NavigationItems",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NavigationItems_Pages_RefPageId",
                        column: x => x.RefPageId,
                        principalTable: "Pages",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NavigationItems_Products_RefProductId",
                        column: x => x.RefProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_NavigationItems_Solutions_RefSolutionId",
                        column: x => x.RefSolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ContentBlockItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContentBlockId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    MediaAssetId = table.Column<int>(type: "int", nullable: true),
                    IconName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    AccentColorHex = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    Badge = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                    LinkType = table.Column<byte>(type: "tinyint", nullable: false),
                    LinkUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    RefCategoryId = table.Column<int>(type: "int", nullable: true),
                    RefProductId = table.Column<int>(type: "int", nullable: true),
                    RefSolutionId = table.Column<int>(type: "int", nullable: true),
                    RefArticleId = table.Column<int>(type: "int", nullable: true),
                    RefDownloadId = table.Column<int>(type: "int", nullable: true),
                    RefPageId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    PublishedAt = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentBlockItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContentBlockItems_Articles_RefArticleId",
                        column: x => x.RefArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlockItems_Categories_RefCategoryId",
                        column: x => x.RefCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlockItems_ContentBlocks_ContentBlockId",
                        column: x => x.ContentBlockId,
                        principalTable: "ContentBlocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContentBlockItems_Downloads_RefDownloadId",
                        column: x => x.RefDownloadId,
                        principalTable: "Downloads",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlockItems_MediaAssets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalTable: "MediaAssets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlockItems_Pages_RefPageId",
                        column: x => x.RefPageId,
                        principalTable: "Pages",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlockItems_Products_RefProductId",
                        column: x => x.RefProductId,
                        principalTable: "Products",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ContentBlockItems_Solutions_RefSolutionId",
                        column: x => x.RefSolutionId,
                        principalTable: "Solutions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ContentBlockTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ContentBlockId = table.Column<int>(type: "int", nullable: false),
                    Eyebrow = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Subtitle = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CtaLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    FootNote = table.Column<string>(type: "nvarchar(600)", maxLength: 600, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentBlockTranslations", x => new { x.ContentBlockId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ContentBlockTranslations_ContentBlocks_ContentBlockId",
                        column: x => x.ContentBlockId,
                        principalTable: "ContentBlocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContentBlockTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                });

            migrationBuilder.CreateTable(
                name: "TestimonialTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TestimonialId = table.Column<int>(type: "int", nullable: false),
                    Quote = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    AuthorName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    AuthorTitle = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true),
                    CompanyType = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestimonialTranslations", x => new { x.TestimonialId, x.Culture });
                    table.ForeignKey(
                        name: "FK_TestimonialTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_TestimonialTranslations_Testimonials_TestimonialId",
                        column: x => x.TestimonialId,
                        principalTable: "Testimonials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProcessStepTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ProcessStepId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessStepTranslations", x => new { x.ProcessStepId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ProcessStepTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_ProcessStepTranslations_ProcessSteps_ProcessStepId",
                        column: x => x.ProcessStepId,
                        principalTable: "ProcessSteps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FaqItemTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    FaqItemId = table.Column<int>(type: "int", nullable: false),
                    Question = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Answer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LinkLabel = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaqItemTranslations", x => new { x.FaqItemId, x.Culture });
                    table.ForeignKey(
                        name: "FK_FaqItemTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_FaqItemTranslations_FaqItems_FaqItemId",
                        column: x => x.FaqItemId,
                        principalTable: "FaqItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SpecificationRowTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    SpecificationRowId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecificationRowTranslations", x => new { x.SpecificationRowId, x.Culture });
                    table.ForeignKey(
                        name: "FK_SpecificationRowTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_SpecificationRowTranslations_SpecificationRows_SpecificationRowId",
                        column: x => x.SpecificationRowId,
                        principalTable: "SpecificationRows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NavigationItemTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    NavigationItemId = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    MenuTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AriaLabel = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NavigationItemTranslations", x => new { x.NavigationItemId, x.Culture });
                    table.ForeignKey(
                        name: "FK_NavigationItemTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                    table.ForeignKey(
                        name: "FK_NavigationItemTranslations_NavigationItems_NavigationItemId",
                        column: x => x.NavigationItemId,
                        principalTable: "NavigationItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ContentBlockItemTranslations",
                columns: table => new
                {
                    Culture = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ContentBlockItemId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Subtitle = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkLabel = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Value = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContentBlockItemTranslations", x => new { x.ContentBlockItemId, x.Culture });
                    table.ForeignKey(
                        name: "FK_ContentBlockItemTranslations_ContentBlockItems_ContentBlockItemId",
                        column: x => x.ContentBlockItemId,
                        principalTable: "ContentBlockItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContentBlockItemTranslations_Cultures_Culture",
                        column: x => x.Culture,
                        principalTable: "Cultures",
                        principalColumn: "Code");
                });

            migrationBuilder.InsertData(
                table: "Cultures",
                columns: new[] { "Code", "DisplayName", "IsDefault", "IsEnabled", "NativeName", "SortOrder" },
                values: new object[,]
                {
                    { "en", "English", true, true, "English", 1 },
                    { "zh-Hant", "Chinese (Traditional)", false, true, "繁體中文", 2 }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Description", "Name", "PublishedAt" },
                values: new object[,]
                {
                    { 1, "Full access to every admin screen and setting.", "Admin", null },
                    { 2, "Content editing; no user, settings or redirect management.", "Editor", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArticleCategories_Reverse",
                table: "ArticleCategories",
                columns: new[] { "CategoryId", "ArticleId" });

            migrationBuilder.CreateIndex(
                name: "IX_ArticleProducts_Reverse",
                table: "ArticleProducts",
                columns: new[] { "ProductId", "ArticleId" });

            migrationBuilder.CreateIndex(
                name: "IX_ArticleSolutions_Reverse",
                table: "ArticleSolutions",
                columns: new[] { "SolutionId", "ArticleId" });

            migrationBuilder.CreateIndex(
                name: "IX_ArticleTagLinks_Reverse",
                table: "ArticleTagLinks",
                columns: new[] { "ArticleTagId", "ArticleId" });

            migrationBuilder.CreateIndex(
                name: "IX_ArticleTagTranslations_Culture",
                table: "ArticleTagTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleTagTranslations_OgImageMediaAssetId",
                table: "ArticleTagTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleTags_Slug_All",
                table: "ArticleTags",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_ArticleTags_Slug",
                table: "ArticleTags",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleTranslations_Culture",
                table: "ArticleTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleTranslations_OgImageMediaAssetId",
                table: "ArticleTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_AuthorId",
                table: "Articles",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Exhibition",
                table: "Articles",
                column: "ExhibitionId",
                filter: "[ExhibitionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_HeroMediaAssetId",
                table: "Articles",
                column: "HeroMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Published",
                table: "Articles",
                column: "PublishedAt",
                descending: new bool[0],
                filter: "[Status] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Slug_All",
                table: "Articles",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Type_Published",
                table: "Articles",
                columns: new[] { "Type", "Status", "PublishedAt" },
                descending: new[] { false, false, true })
                .Annotation("SqlServer:Include", new[] { "Slug", "HeroMediaAssetId" });

            migrationBuilder.CreateIndex(
                name: "UX_Articles_LegacySourceKey",
                table: "Articles",
                column: "LegacySourceKey",
                unique: true,
                filter: "[LegacySourceKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_Articles_Slug",
                table: "Articles",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_AuthorTranslations_Culture",
                table: "AuthorTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_Authors_MediaAssetId",
                table: "Authors",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Authors_Slug_All",
                table: "Authors",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Authors_Slug",
                table: "Authors",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "UX_BusinessDomainRules_Domain",
                table: "BusinessDomainRules",
                column: "Domain",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_HeroMediaAssetId",
                table: "Categories",
                column: "HeroMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Parent",
                table: "Categories",
                columns: new[] { "ParentId", "Type", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Slug_All",
                table: "Categories",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Type",
                table: "Categories",
                columns: new[] { "Type", "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "UX_Categories_Slug",
                table: "Categories",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryTranslations_Culture",
                table: "CategoryTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryTranslations_OgImageMediaAssetId",
                table: "CategoryTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_CertificationCategories_Reverse",
                table: "CertificationCategories",
                columns: new[] { "CategoryId", "CertificationId" });

            migrationBuilder.CreateIndex(
                name: "IX_CertificationProducts_Reverse",
                table: "CertificationProducts",
                columns: new[] { "ProductId", "CertificationId" });

            migrationBuilder.CreateIndex(
                name: "IX_CertificationTranslations_Culture",
                table: "CertificationTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_CertificationTranslations_OgImageMediaAssetId",
                table: "CertificationTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Certifications_Category",
                table: "Certifications",
                columns: new[] { "Category", "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Certifications_DownloadId",
                table: "Certifications",
                column: "DownloadId");

            migrationBuilder.CreateIndex(
                name: "IX_Certifications_LogoMediaAssetId",
                table: "Certifications",
                column: "LogoMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Certifications_Slug_All",
                table: "Certifications",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Certifications_Slug",
                table: "Certifications",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ContactChannelTranslations_Culture",
                table: "ContactChannelTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ContactChannels_InquiryType",
                table: "ContactChannels",
                columns: new[] { "InquiryType", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ContactChannels_Slug_All",
                table: "ContactChannels",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_ContactChannels_Slug",
                table: "ContactChannels",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ContactInquiries_AssignedChannelId",
                table: "ContactInquiries",
                column: "AssignedChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactInquiries_CategoryId",
                table: "ContactInquiries",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactInquiries_Culture",
                table: "ContactInquiries",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ContactInquiries_MemberId",
                table: "ContactInquiries",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactInquiries_RefDownloadId",
                table: "ContactInquiries",
                column: "RefDownloadId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactInquiries_RefProductId",
                table: "ContactInquiries",
                column: "RefProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactInquiries_Status",
                table: "ContactInquiries",
                columns: new[] { "Status", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "UX_ContactInquiries_ReferenceNumber",
                table: "ContactInquiries",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItemTranslations_Culture",
                table: "ContentBlockItemTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItems_Block",
                table: "ContentBlockItems",
                columns: new[] { "ContentBlockId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItems_MediaAssetId",
                table: "ContentBlockItems",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItems_RefArticleId",
                table: "ContentBlockItems",
                column: "RefArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItems_RefCategoryId",
                table: "ContentBlockItems",
                column: "RefCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItems_RefDownloadId",
                table: "ContentBlockItems",
                column: "RefDownloadId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItems_RefPageId",
                table: "ContentBlockItems",
                column: "RefPageId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItems_RefProductId",
                table: "ContentBlockItems",
                column: "RefProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockItems_RefSolutionId",
                table: "ContentBlockItems",
                column: "RefSolutionId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlockTranslations_Culture",
                table: "ContentBlockTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlocks_Category",
                table: "ContentBlocks",
                columns: new[] { "OwnerCategoryId", "SortOrder" },
                filter: "[OwnerCategoryId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlocks_MediaAssetId",
                table: "ContentBlocks",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlocks_Page",
                table: "ContentBlocks",
                columns: new[] { "OwnerPageId", "SortOrder" },
                filter: "[OwnerPageId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ContentBlocks_Solution",
                table: "ContentBlocks",
                columns: new[] { "OwnerSolutionId", "SortOrder" },
                filter: "[OwnerSolutionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_ContentBlocks_PageAnchor",
                table: "ContentBlocks",
                columns: new[] { "OwnerPageId", "Anchor" },
                unique: true,
                filter: "[Anchor] IS NOT NULL AND [OwnerPageId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_Cultures_IsDefault",
                table: "Cultures",
                column: "IsDefault",
                unique: true,
                filter: "[IsDefault] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_DownloadArticles_Reverse",
                table: "DownloadArticles",
                columns: new[] { "ArticleId", "DownloadId" });

            migrationBuilder.CreateIndex(
                name: "IX_DownloadCategories_Reverse",
                table: "DownloadCategories",
                columns: new[] { "CategoryId", "DownloadId" });

            migrationBuilder.CreateIndex(
                name: "IX_DownloadCertifications_Reverse",
                table: "DownloadCertifications",
                columns: new[] { "CertificationId", "DownloadId" });

            migrationBuilder.CreateIndex(
                name: "IX_DownloadProducts_Reverse",
                table: "DownloadProducts",
                columns: new[] { "ProductId", "DownloadId" });

            migrationBuilder.CreateIndex(
                name: "IX_DownloadSolutions_Reverse",
                table: "DownloadSolutions",
                columns: new[] { "SolutionId", "DownloadId" });

            migrationBuilder.CreateIndex(
                name: "IX_DownloadTranslations_Culture",
                table: "DownloadTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_DownloadTranslations_OgImageMediaAssetId",
                table: "DownloadTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Downloads_Access",
                table: "Downloads",
                columns: new[] { "AccessLevel", "Kind", "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Downloads_DocumentCulture",
                table: "Downloads",
                column: "DocumentCulture");

            migrationBuilder.CreateIndex(
                name: "IX_Downloads_MediaAssetId",
                table: "Downloads",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Downloads_Slug_All",
                table: "Downloads",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "IX_Downloads_ThumbnailMediaAssetId",
                table: "Downloads",
                column: "ThumbnailMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Downloads_ValidUntil",
                table: "Downloads",
                column: "ValidUntil",
                filter: "[ValidUntil] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_Downloads_Slug",
                table: "Downloads",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ExhibitionTranslations_Culture",
                table: "ExhibitionTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ExhibitionTranslations_OgImageMediaAssetId",
                table: "ExhibitionTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Exhibitions_Dates",
                table: "Exhibitions",
                columns: new[] { "EndDate", "StartDate" },
                descending: new[] { true, false },
                filter: "[Status] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Exhibitions_HeroMediaAssetId",
                table: "Exhibitions",
                column: "HeroMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Exhibitions_Slug_All",
                table: "Exhibitions",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Exhibitions_Slug",
                table: "Exhibitions",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_FaqCategories_Slug_All",
                table: "FaqCategories",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_FaqCategories_Slug",
                table: "FaqCategories",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_FaqCategoryTranslations_Culture",
                table: "FaqCategoryTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItemTranslations_Culture",
                table: "FaqItemTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_Category",
                table: "FaqItems",
                columns: new[] { "FaqCategoryId", "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_RefCategoryId",
                table: "FaqItems",
                column: "RefCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_RefDownloadId",
                table: "FaqItems",
                column: "RefDownloadId");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_RefPageId",
                table: "FaqItems",
                column: "RefPageId");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_RefProductId",
                table: "FaqItems",
                column: "RefProductId");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_RefSolutionId",
                table: "FaqItems",
                column: "RefSolutionId");

            migrationBuilder.CreateIndex(
                name: "IX_FaqItems_Slug_All",
                table: "FaqItems",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_FaqItems_Slug",
                table: "FaqItems",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_LocationTranslations_Culture",
                table: "LocationTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_MediaAssetId",
                table: "Locations",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_Type",
                table: "Locations",
                columns: new[] { "Type", "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_MediaAssetTranslations_Culture",
                table: "MediaAssetTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_MediaAssets_Container",
                table: "MediaAssets",
                columns: new[] { "Container", "IsPrivate", "IsArchived" });

            migrationBuilder.CreateIndex(
                name: "IX_MediaAssets_Sha256",
                table: "MediaAssets",
                column: "Sha256",
                filter: "[Sha256] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_MediaAssets_LegacySourceKey",
                table: "MediaAssets",
                column: "LegacySourceKey",
                unique: true,
                filter: "[LegacySourceKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MemberRefreshTokens_MemberId",
                table: "MemberRefreshTokens",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "UX_MemberRefreshTokens_TokenHash",
                table: "MemberRefreshTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MemberTokens_Pending",
                table: "MemberTokens",
                columns: new[] { "MemberId", "Purpose", "ExpiresAt" },
                filter: "[ConsumedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "UX_MemberTokens_TokenHash",
                table: "MemberTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Members_EmailDomain",
                table: "Members",
                column: "EmailDomain");

            migrationBuilder.CreateIndex(
                name: "IX_Members_PreferredCulture",
                table: "Members",
                column: "PreferredCulture");

            migrationBuilder.CreateIndex(
                name: "IX_Members_Status",
                table: "Members",
                columns: new[] { "Status", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "UX_Members_EmailNormalized",
                table: "Members",
                column: "EmailNormalized",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MilestoneTranslations_Culture",
                table: "MilestoneTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_Milestones_MediaAssetId",
                table: "Milestones",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Milestones_Year",
                table: "Milestones",
                columns: new[] { "Year", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItemTranslations_Culture",
                table: "NavigationItemTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItems_Location",
                table: "NavigationItems",
                columns: new[] { "Location", "ParentId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItems_ParentId",
                table: "NavigationItems",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItems_RefArticleId",
                table: "NavigationItems",
                column: "RefArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItems_RefCategoryId",
                table: "NavigationItems",
                column: "RefCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItems_RefDownloadId",
                table: "NavigationItems",
                column: "RefDownloadId");

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItems_RefPageId",
                table: "NavigationItems",
                column: "RefPageId");

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItems_RefProductId",
                table: "NavigationItems",
                column: "RefProductId");

            migrationBuilder.CreateIndex(
                name: "IX_NavigationItems_RefSolutionId",
                table: "NavigationItems",
                column: "RefSolutionId");

            migrationBuilder.CreateIndex(
                name: "IX_PageTranslations_Culture",
                table: "PageTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_PageTranslations_OgImageMediaAssetId",
                table: "PageTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Pages_HeroMediaAssetId",
                table: "Pages",
                column: "HeroMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Pages_Parent",
                table: "Pages",
                columns: new[] { "ParentPageId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Pages_Slug_All",
                table: "Pages",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Pages_LegacySourceKey",
                table: "Pages",
                column: "LegacySourceKey",
                unique: true,
                filter: "[LegacySourceKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_Pages_Slug",
                table: "Pages",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerBrandTranslations_Culture",
                table: "PartnerBrandTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerBrands_LogoMediaAssetId",
                table: "PartnerBrands",
                column: "LogoMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerBrands_LogoWall",
                table: "PartnerBrands",
                columns: new[] { "IsLogoWallVisible", "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_PartnerBrands_Slug_All",
                table: "PartnerBrands",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_PartnerBrands_Slug",
                table: "PartnerBrands",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessFlowTranslations_Culture",
                table: "ProcessFlowTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessFlowTranslations_OgImageMediaAssetId",
                table: "ProcessFlowTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessFlows_Kind",
                table: "ProcessFlows",
                columns: new[] { "Kind", "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessFlows_OwnerCategory",
                table: "ProcessFlows",
                column: "OwnerCategoryId",
                filter: "[OwnerCategoryId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessFlows_Slug_All",
                table: "ProcessFlows",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_ProcessFlows_Slug",
                table: "ProcessFlows",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessStepTranslations_Culture",
                table: "ProcessStepTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessSteps_Flow",
                table: "ProcessSteps",
                columns: new[] { "ProcessFlowId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ProcessSteps_MediaAssetId",
                table: "ProcessSteps",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_Reverse",
                table: "ProductImages",
                columns: new[] { "MediaAssetId", "ProductId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductSolutions_Reverse",
                table: "ProductSolutions",
                columns: new[] { "SolutionId", "ProductId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductTranslations_Culture",
                table: "ProductTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_ProductTranslations_OgImageMediaAssetId",
                table: "ProductTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Category",
                table: "Products",
                columns: new[] { "CategoryId", "Status", "SortOrder" })
                .Annotation("SqlServer:Include", new[] { "Slug", "IsFeatured", "HeroMediaAssetId" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Featured",
                table: "Products",
                columns: new[] { "IsFeatured", "Status" },
                filter: "[IsFeatured] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Products_HeroMediaAssetId",
                table: "Products",
                column: "HeroMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ParentProduct",
                table: "Products",
                columns: new[] { "ParentProductId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_Slug_All",
                table: "Products",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "UX_Products_LegacySourceKey",
                table: "Products",
                column: "LegacySourceKey",
                unique: true,
                filter: "[LegacySourceKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_Products_Slug",
                table: "Products",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_Redirects_Enabled",
                table: "Redirects",
                column: "FromPath",
                filter: "[IsEnabled] = 1")
                .Annotation("SqlServer:Include", new[] { "ToPath", "StatusCode", "TargetCulture" });

            migrationBuilder.CreateIndex(
                name: "IX_Redirects_TargetCulture",
                table: "Redirects",
                column: "TargetCulture");

            migrationBuilder.CreateIndex(
                name: "UX_Redirects_FromPath",
                table: "Redirects",
                column: "FromPath",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_User",
                table: "RefreshTokens",
                columns: new[] { "UserId", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "UX_RefreshTokens_TokenHash",
                table: "RefreshTokens",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SampleRequestItems_CategoryId",
                table: "SampleRequestItems",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SampleRequestItems_ProductId",
                table: "SampleRequestItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_SampleRequestItems_Request",
                table: "SampleRequestItems",
                columns: new[] { "SampleRequestId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_SampleRequests_Member",
                table: "SampleRequests",
                columns: new[] { "MemberId", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_SampleRequests_SourceSampleRequestId",
                table: "SampleRequests",
                column: "SourceSampleRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_SampleRequests_Status",
                table: "SampleRequests",
                columns: new[] { "Status", "SubmittedAt" });

            migrationBuilder.CreateIndex(
                name: "UX_SampleRequests_RequestNumber",
                table: "SampleRequests",
                column: "RequestNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SiteSettingTranslations_Culture",
                table: "SiteSettingTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_SolutionCategories_Reverse",
                table: "SolutionCategories",
                columns: new[] { "CategoryId", "SolutionId" });

            migrationBuilder.CreateIndex(
                name: "IX_SolutionTranslations_Culture",
                table: "SolutionTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_SolutionTranslations_OgImageMediaAssetId",
                table: "SolutionTranslations",
                column: "OgImageMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Solutions_HeroMediaAssetId",
                table: "Solutions",
                column: "HeroMediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Solutions_Slug_All",
                table: "Solutions",
                column: "Slug");

            migrationBuilder.CreateIndex(
                name: "IX_Solutions_Status",
                table: "Solutions",
                columns: new[] { "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "UX_Solutions_LegacySourceKey",
                table: "Solutions",
                column: "LegacySourceKey",
                unique: true,
                filter: "[LegacySourceKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_Solutions_Slug",
                table: "Solutions",
                column: "Slug",
                unique: true,
                filter: "[Status] <> 2");

            migrationBuilder.CreateIndex(
                name: "IX_SpecificationRowTranslations_Culture",
                table: "SpecificationRowTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_SpecificationRows_Category",
                table: "SpecificationRows",
                columns: new[] { "OwnerCategoryId", "SortOrder" },
                filter: "[OwnerCategoryId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SpecificationRows_Product",
                table: "SpecificationRows",
                columns: new[] { "OwnerProductId", "SortOrder" },
                filter: "[OwnerProductId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_SpecificationRows_Solution",
                table: "SpecificationRows",
                columns: new[] { "OwnerSolutionId", "SortOrder" },
                filter: "[OwnerSolutionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TestimonialTranslations_Culture",
                table: "TestimonialTranslations",
                column: "Culture");

            migrationBuilder.CreateIndex(
                name: "IX_Testimonials_MediaAssetId",
                table: "Testimonials",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_Testimonials_PartnerBrandId",
                table: "Testimonials",
                column: "PartnerBrandId");

            migrationBuilder.CreateIndex(
                name: "IX_Testimonials_Solution",
                table: "Testimonials",
                columns: new[] { "SolutionId", "Status", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_Reverse",
                table: "UserRoles",
                columns: new[] { "RoleId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_PreferredCulture",
                table: "Users",
                column: "PreferredCulture");

            migrationBuilder.CreateIndex(
                name: "UX_Users_EmailNormalized",
                table: "Users",
                column: "EmailNormalized",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArticleCategories");

            migrationBuilder.DropTable(
                name: "ArticleProducts");

            migrationBuilder.DropTable(
                name: "ArticleSolutions");

            migrationBuilder.DropTable(
                name: "ArticleTagLinks");

            migrationBuilder.DropTable(
                name: "ArticleTagTranslations");

            migrationBuilder.DropTable(
                name: "ArticleTranslations");

            migrationBuilder.DropTable(
                name: "AuthorTranslations");

            migrationBuilder.DropTable(
                name: "BusinessDomainRules");

            migrationBuilder.DropTable(
                name: "CategoryTranslations");

            migrationBuilder.DropTable(
                name: "CertificationCategories");

            migrationBuilder.DropTable(
                name: "CertificationProducts");

            migrationBuilder.DropTable(
                name: "CertificationTranslations");

            migrationBuilder.DropTable(
                name: "ContactChannelTranslations");

            migrationBuilder.DropTable(
                name: "ContactInquiries");

            migrationBuilder.DropTable(
                name: "ContentBlockItemTranslations");

            migrationBuilder.DropTable(
                name: "ContentBlockTranslations");

            migrationBuilder.DropTable(
                name: "DownloadArticles");

            migrationBuilder.DropTable(
                name: "DownloadCategories");

            migrationBuilder.DropTable(
                name: "DownloadCertifications");

            migrationBuilder.DropTable(
                name: "DownloadProducts");

            migrationBuilder.DropTable(
                name: "DownloadSolutions");

            migrationBuilder.DropTable(
                name: "DownloadTranslations");

            migrationBuilder.DropTable(
                name: "ExhibitionTranslations");

            migrationBuilder.DropTable(
                name: "FaqCategoryTranslations");

            migrationBuilder.DropTable(
                name: "FaqItemTranslations");

            migrationBuilder.DropTable(
                name: "LocationTranslations");

            migrationBuilder.DropTable(
                name: "MediaAssetTranslations");

            migrationBuilder.DropTable(
                name: "MemberRefreshTokens");

            migrationBuilder.DropTable(
                name: "MemberTokens");

            migrationBuilder.DropTable(
                name: "MilestoneTranslations");

            migrationBuilder.DropTable(
                name: "NavigationItemTranslations");

            migrationBuilder.DropTable(
                name: "PageTranslations");

            migrationBuilder.DropTable(
                name: "PartnerBrandTranslations");

            migrationBuilder.DropTable(
                name: "ProcessFlowTranslations");

            migrationBuilder.DropTable(
                name: "ProcessStepTranslations");

            migrationBuilder.DropTable(
                name: "ProductImages");

            migrationBuilder.DropTable(
                name: "ProductSolutions");

            migrationBuilder.DropTable(
                name: "ProductTranslations");

            migrationBuilder.DropTable(
                name: "Redirects");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "SampleRequestItems");

            migrationBuilder.DropTable(
                name: "SiteSettingTranslations");

            migrationBuilder.DropTable(
                name: "SolutionCategories");

            migrationBuilder.DropTable(
                name: "SolutionTranslations");

            migrationBuilder.DropTable(
                name: "SpecificationRowTranslations");

            migrationBuilder.DropTable(
                name: "TestimonialTranslations");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "ArticleTags");

            migrationBuilder.DropTable(
                name: "ContactChannels");

            migrationBuilder.DropTable(
                name: "ContentBlockItems");

            migrationBuilder.DropTable(
                name: "Certifications");

            migrationBuilder.DropTable(
                name: "FaqItems");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropTable(
                name: "Milestones");

            migrationBuilder.DropTable(
                name: "NavigationItems");

            migrationBuilder.DropTable(
                name: "ProcessSteps");

            migrationBuilder.DropTable(
                name: "SampleRequests");

            migrationBuilder.DropTable(
                name: "SiteSettings");

            migrationBuilder.DropTable(
                name: "SpecificationRows");

            migrationBuilder.DropTable(
                name: "Testimonials");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "ContentBlocks");

            migrationBuilder.DropTable(
                name: "FaqCategories");

            migrationBuilder.DropTable(
                name: "Articles");

            migrationBuilder.DropTable(
                name: "Downloads");

            migrationBuilder.DropTable(
                name: "ProcessFlows");

            migrationBuilder.DropTable(
                name: "Members");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "PartnerBrands");

            migrationBuilder.DropTable(
                name: "Pages");

            migrationBuilder.DropTable(
                name: "Solutions");

            migrationBuilder.DropTable(
                name: "Authors");

            migrationBuilder.DropTable(
                name: "Exhibitions");

            migrationBuilder.DropTable(
                name: "Cultures");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "MediaAssets");
        }
    }
}
