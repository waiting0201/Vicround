# Database (SQL Server)

Azure SQL Database。EF Core code-first on **.NET 10**；model 與 `DbContext` 放在 `Infrastructure`，
由兩個 Function app 共用。**Migrations 是唯一能改 schema 的方式。**

本文件以**功能單元（feature module）**分章。每章開頭固定標示「**服務頁面**」（對應哪些
mockup 頁面）與「**API**」（對應哪些端點），讓每一張表都能回答「它為誰存在」。

> **範圍基準**：以 `VICROUND Web Sitemap-0819` 與 `mockup/Rounded Design/` 的 32 個頁面為準，
> 而非早期的兩產品線敘述。三條產品線為 Optical Film / Textile & Foam / **Acoustic**（CIS 手冊
> p.8 已定義第三色）。原 `Applications` 已收斂為 `Solutions`。

## 章節索引

| 章 | 功能單元 | 主要表 |
| --- | --- | --- |
| [00](#00-讀我全域慣例) | 全域慣例 | `Cultures` |
| [01](#01-路由地圖) | 路由地圖與 Slug 作用域 | — |
| [02](#02-產品目錄) | 產品目錄 | `Categories` `Products` `SpecificationRows` `ProductImages` |
| [03](#03-產業解決方案) | 產業解決方案 | `Solutions` |
| [04](#04-技術與製程) | 技術與製程 | `ProcessFlows` `ProcessSteps` |
| [05](#05-資源中心) | 資源中心 | `Articles` `Authors` `ArticleTags` `Exhibitions` `FaqCategories` `FaqItems` |
| [06](#06-下載中心) | 下載中心 | `Downloads` |
| [07](#07-永續與認證) | 永續與認證 | `Certifications` |
| [08](#08-合作夥伴與公司資訊) | 合作夥伴與公司資訊 | `Milestones` `Locations` `Testimonials` `PartnerBrands` `ContactChannels` |
| [09](#09-頁面與版塊) | 頁面與版塊 | `Pages` `ContentBlocks` `ContentBlockItems` |
| [10](#10-導覽seo-與轉址) | 導覽、SEO 與轉址 | `NavigationItems` `Redirects` `SiteSettings` |
| [11](#11-媒體資產) | 媒體資產 | `MediaAssets` |
| [12](#12-詢問與名單) | 詢問與名單 | `ContactInquiries` |
| [13](#13-後台身分cms-users) | 後台身分 | `Users` `Roles` `UserRoles` `RefreshTokens` |
| [14](#14-前台會員members) | 前台會員 | `Members` `MemberTokens` `MemberRefreshTokens` `BusinessDomainRules` `SampleRequests` `SampleRequestItems` |
| [15](#15-多對多關聯總表) | 多對多關聯總表 | — |
| [16](#16-enum-總表) | Enum 總表 | — |
| [17](#17-索引唯一鍵與-cascade) | 索引、唯一鍵與 Cascade | — |
| [18](#18-seed-與舊站匯入) | Seed 與舊站匯入 | — |
| [19](#19-待客戶確認事項) | 待客戶確認事項 | — |

---

## 00 讀我：全域慣例

### 0.1 三種表分類（先分類，再套慣例）

盲目對每張表套「`Slug` + `Status` + `PublishedAt`」會產生沒有 URL 的 Slug。所有表先歸入三類：

| 類別 | 定義 | 共同欄位 |
| --- | --- | --- |
| **Routable** | 有自己的 `/{locale}/...` URL、進 sitemap、有 hreflang | `Id`, `Slug`, `Status`, `SortOrder`, `HeroMediaAssetId`, `CreatedAt`, `UpdatedAt`, `PublishedAt` |
| **Addressable** | 沒有獨立頁，但需要穩定識別碼供 `#anchor` / `?cert=` / JSON-LD 使用 | 同上，但 `Slug` 只用於錨點或查詢參數，**不進 sitemap** |
| **Embedded** | 只在母體頁面內出現，無識別需求 | `Id`, `Status`, `SortOrder`, `CreatedAt`, `UpdatedAt`, `PublishedAt`（**無 `Slug`**） |

**`PublishedAt` 的兩種語意**（務必分辨，否則會誤加 where 條件）：

- `Articles`、`Exhibitions`：參與**可見性與排序**，公開查詢需加 `PublishedAt <= SYSUTCDATETIME()`。
- 其餘所有表：僅記錄「首次發佈時間」，**不參與可見性**，可見性只看 `Status`。

### 0.2 i18n 慣例

Base table 為 culture-neutral；`{Entity}Translations` 每 culture 一列，PK = `({Entity}Id, Culture)`。
這避免重複列、讓 slug/關聯只改一次，並把「是否已發佈」與「是否已翻譯」分開。

```
Products                       ProductTranslations
─────────                      ───────────────────
Id (PK)            ◀────────── ProductId (FK)
CategoryId (FK)                Culture        ('en' | 'zh-Hant')
Slug   (unique)                Name
Brand                          Summary
Status                         Description (HTML)
IsFeatured                     SeoTitle / SeoDescription / SeoKeywords
SortOrder                      PRIMARY KEY (ProductId, Culture)
```

**Routable / Addressable 的翻譯表共同 SEO 欄位**（Embedded 表一律不加）：

| 欄位 | 型別 |
| --- | --- |
| `SeoTitle` | `nvarchar(200)` |
| `SeoDescription` | `nvarchar(400)` |
| `SeoKeywords` | `nvarchar(400)` |
| `OgImageMediaAssetId` | `int NULL` FK→`MediaAssets` |

**`Cultures` 參照表**（取代散落各表的 `CHECK IN ('en','zh-Hant')`）：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Code` | `nvarchar(10)` PK | `en` / `zh-Hant` |
| `DisplayName` | `nvarchar(50)` | `English` / `Chinese (Traditional)` |
| `NativeName` | `nvarchar(50)` | `English` / `繁體中文` |
| `IsDefault` | `bit` | 只有一列為 1（filtered unique index） |
| `IsEnabled` | `bit` | |
| `SortOrder` | `int` | |

所有翻譯表的 `Culture` 欄位 FK → `Cultures.Code`（`ON DELETE NO ACTION`）。新增第三語系不需改
CHECK 約束、不需 migration，且 Admin 可直接列舉語系分頁。

**翻譯缺漏的 fallback 政策**（待客戶拍板，見 [19](#19-待客戶確認事項) 第 6 項；目前建議值）：
列表端點缺 `zh-Hant` 時回退 `en` 內容但**不宣告該語系的 hreflang**；詳情端點缺 `zh-Hant` 時回
`404`，由 Next.js middleware **302**（非 301）到 `en` 版本。詳情頁直接 fallback 會產生「zh-Hant
URL 顯示英文內容」的重複內容，傷 SEO。

### 0.3 主鍵型別

| 表群 | PK 型別 | 理由 |
| --- | --- | --- |
| 內容 / 營運表 | `int IDENTITY(1,1)` | 索引窄、join 快、seeder 對照容易；公開 API 本來就用 slug 不用 Id |
| 身分與單據表：`Users` `Members` `RefreshTokens` `MemberRefreshTokens` `MemberTokens` `SampleRequests` `ContactInquiries` | `uniqueidentifier DEFAULT NEWSEQUENTIALID()` | 這些 Id 會出現在 URL、email 連結與支援對話中；遞增整數可被枚舉（推算會員總數、猜測他人詢問單） |

對外顯示一律用業務編號而非 GUID：`SampleRequests.RequestNumber`（`SR-2026-000123`）、
`ContactInquiries.ReferenceNumber`（`INQ-2026-000431`）。

### 0.4 型別與定序

- **時間**：一律 `datetime2(3)`、**UTC**，DB 預設 `SYSUTCDATETIME()`。`UpdatedAt` 由 EF
  `SaveChangesInterceptor` 寫入，**不用 trigger**（trigger 與 EF 的 `OUTPUT` 子句衝突）。
- **字串**：一律 `nvarchar` 且長度明確；HTML 內文用 `nvarchar(max)`。
- **Slug**：`nvarchar(200) COLLATE Latin1_General_100_CS_AS`，加 DB CHECK
  `Slug = LOWER(Slug) AND Slug NOT LIKE '%[^a-z0-9-]%'`。大小寫敏感可避免 `/Anti-Fog` 與
  `/anti-fog` 在 CI 定序下被視為同一列、卻在 URL 上是兩個頁面。
- **Email**：另存 `EmailNormalized nvarchar(320)`（`UPPER(TRIM(Email))`），unique index 建在
  `EmailNormalized` 上（前台會員 `Members`；後台 `Users` 的帳號是 `Username`，見 §13）。
- **後台帳號**：另存 `UsernameNormalized nvarchar(64)`（`UPPER(TRIM(Username))`），unique index
  建在正規化欄位上。正規化由 `IdentityNormalizationInterceptor` 在 `SaveChanges` 時寫入——
  後台 CRUD 是泛型對映，服務層各自記得要算一次的話遲早會漏。

### 0.5 Slug 是內容，不是衍生值

以下三種變更都會改變公開 URL，**必須在同一個 transaction 內寫入 `Redirects`(301)**：

1. 任何 Routable 實體的 `Slug` 變更。
2. `Status` 變成 `Archived`（見 [17.1](#171-archived-slug-重用) 的配套）。
3. `Articles.Type` 變更（`Type` 決定 URL 前綴，見 [05](#05-資源中心)）。

這是 Application 層的 `SlugChangeGuard` 責任，不是資料庫層，但觸發條件必須明列於此。

### 0.6 Owner triple 模式（多型 owner）

`SpecificationRows`、`ContentBlocks`、`ContentBlockItems.Ref*` 三處使用同一個模式：多個
nullable FK + CHECK 約束恰一非 NULL + 每個 owner 一條 filtered index。這是**刻意的取捨**，
省下約 12 張近乎重複的表，代價是查詢一定要帶 owner 條件。統一寫法：

```sql
-- CHECK：恰一個 owner 非 NULL
CONSTRAINT CK_SpecificationRows_SingleOwner CHECK (
    (CASE WHEN OwnerProductId  IS NULL THEN 0 ELSE 1 END
   + CASE WHEN OwnerCategoryId IS NULL THEN 0 ELSE 1 END
   + CASE WHEN OwnerSolutionId IS NULL THEN 0 ELSE 1 END) = 1
)

-- 每個 owner 一條 filtered index
CREATE INDEX IX_SpecificationRows_Product
    ON SpecificationRows(OwnerProductId, SortOrder) WHERE OwnerProductId IS NOT NULL;
```

### 0.7 不留 log

本專案**不建任何稽核表**。界線如下（此表用於防止後續開發者誤加或誤刪）：

| 保留（**業務資料** — 使用者主動提出的請求與其履行狀態） | 不建（**稽核** — 誰在何時看了／改了什麼） |
| --- | --- |
| `Members`（帳號本身）、`Members.ReviewNote` | `MemberLoginAttempts` |
| `SampleRequests` + `SampleRequestItems` + 各階段時間戳 | `SampleRequestStatusHistory` |
| `ContactInquiries` | `DownloadEvents` / `MemberDownloads` |
| `Users.FailedLoginCount` / `LockoutEndsAt` / `LastLoginAt`（**狀態欄位**，非 log） | `AuditLogs` / `ContentVersions` |
| `Redirects` | `RedirectHitCount` / 任何瀏覽統計 |

狀態變更歷程一律改用**每個狀態一個時間戳欄位**表達（`SubmittedAt` … `DeliveredAt`），既滿足
前台「追蹤何時出貨」的需求，又不引入歷程表。

---

## 01 路由地圖

Slug 只在**自己的表內**唯一；跨型別的唯一性由固定路由前綴保證。層級依 Sitemap-0819（即
mockup 已實作的版本）。

| 路徑 | 來源 | Slug 作用域 |
| --- | --- | --- |
| `/{locale}` | `Pages` slug=`home` | Pages |
| `/{locale}/products` | `Pages` slug=`products` | Pages |
| `/{locale}/products/{category}` | `Categories`（產品線） | Categories |
| `/{locale}/products/{category}/{product}` | `Products` | Products |
| `/{locale}/solutions` | `Pages` slug=`solutions` | Pages |
| `/{locale}/solutions/{slug}` | `Solutions` | Solutions |
| `/{locale}/technologies` | `Pages` | Pages |
| `/{locale}/about` | `Pages` | Pages |
| `/{locale}/sustainability` | `Pages`（`ParentPageId` → about） | Pages |
| `/{locale}/partnership` | `Pages`（`ParentPageId` → about） | Pages |
| `/{locale}/resources` | `Pages` | Pages |
| `/{locale}/resources/faq` | `Pages` + `FaqItems` | Pages |
| `/{locale}/resources/downloads` | `Pages` + `Downloads` | Pages |
| `/{locale}/news` | `Articles` Type ∈ 新聞群 | — |
| `/{locale}/news/{slug}` | `Articles` Type ∈ {CompanyNews, ProductNews, Exhibition, CertificationNews} | Articles（全表） |
| `/{locale}/insights/{slug}` | `Articles` Type = Insight | Articles（全表） |
| `/{locale}/blog/{slug}` | `Articles` Type = TechnicalArticle | Articles（全表） |
| `/{locale}/contact` | `Pages` | Pages |
| `/{locale}/privacy` | `Pages` | Pages |
| `/{locale}/member` | `Pages`（登入／註冊頁） | Pages |
| `/{locale}/account/**` | 會員專區，**`noindex`** | — |
| `/admin/**` | 後台 CMS，**`noindex`** | — |

**保留字 slug**（seeder 與 Admin 驗證必須阻擋內容實體使用）：

```
api  admin  account  _next  products  solutions  news  insights  blog
resources  technologies  about  sustainability  partnership  contact
privacy  member  sitemap.xml  robots.txt  en  zh-Hant
```

**路由解析順序（寫死，不可調換）**：

```
實體查詢 → 找不到才查 Redirects → 都沒有才 404
```

這是 [17.1](#171-archived-slug-重用) 的 filtered unique index 能安全成立的前提。

### 1.1 mockup 頁面 → 功能單元對照

`mockup/Rounded Design/` 的 32 個檔案全數對應如下（此表即覆蓋率查核清單）：

| mockup 檔案 | 功能單元 |
| --- | --- |
| `index.dc.html` | [09](#09-頁面與版塊) Pages(`home`) + reference blocks（CategoryGrid / SolutionGrid / PartnerBrandWall / ExhibitionList） |
| `products.dc.html` | [09](#09-頁面與版塊) Pages(`products`) + [02](#02-產品目錄) |
| `product-optical-film.dc.html`<br>`product-textile-foam.dc.html`<br>`product-acoustic.dc.html` | [02](#02-產品目錄) Categories + Products + SpecificationRows；How it is made → [04](#04-技術與製程) ProcessFlows(Kind=Manufacturing) |
| `solutions.dc.html` | [09](#09-頁面與版塊) Pages(`solutions`) + [03](#03-產業解決方案) |
| `solution-consumer-electronics.dc.html`<br>`solution-automotive.dc.html`<br>`solution-healthcare.dc.html`<br>`solution-renewable-energy.dc.html`<br>`solution-acoustic.dc.html`<br>`solution-e-paper.dc.html`<br>`solution-sports-glasses.dc.html` | [03](#03-產業解決方案) Solutions（7 列）+ `ContentBlocks(OwnerSolutionId)` + `SpecificationRows(OwnerSolutionId)` |
| `technologies.dc.html` | [04](#04-技術與製程) ProcessFlows；Product Compliance → [07](#07-永續與認證) Certifications；品管四標籤與 R&D 三卡 → ContentBlocks |
| `about-us.dc.html` | [08](#08-合作夥伴與公司資訊) Milestones + Locations；認證卡 → [07](#07-永續與認證)；願景與核心價值 → ContentBlocks |
| `sustainability.dc.html` | [09](#09-頁面與版塊) Pages + ContentBlocks（`#esg` / `#carbon` / `#eudr`）+ [07](#07-永續與認證) |
| `partnership.dc.html` | [04](#04-技術與製程) ProcessFlows(Kind=OemOdm) + [08](#08-合作夥伴與公司資訊) Testimonials + ContentBlocks |
| `resources.dc.html` | [05](#05-資源中心) Exhibitions + FaqItems + Articles + [06](#06-下載中心) Downloads |
| `news.dc.html`<br>`news-article.dc.html`<br>`article.dc.html` | [05](#05-資源中心) Articles（`Type` 決定 URL 前綴）+ Authors + Exhibitions |
| `faq.dc.html` | [05](#05-資源中心) FaqCategories + FaqItems |
| `contact.dc.html` | [12](#12-詢問與名單) ContactInquiries + [08](#08-合作夥伴與公司資訊) ContactChannels + Locations；三步驟 → ProcessFlows(Kind=InquiryFlow) |
| `member.dc.html` | [14](#14-前台會員members) Members + BusinessDomainRules；會員權益四格 → ContentBlocks |
| `privacy.dc.html` | [09](#09-頁面與版塊) Pages(`privacy`)，用 `PageTranslations.Body` 長文，不用 block |
| `Header.dc.html`<br>`Footer.dc.html` | [10](#10-導覽seo-與轉址) NavigationItems（五個 `Location`，含 SearchChip） |
| `PageBanner.dc.html` | `PageTranslations.BannerTitle` / `BannerDescription` + `Pages.HeroMediaAssetId` |
| `PageCTA.dc.html` | `PageTranslations.CtaEyebrow` / `CtaHeadline` / `CtaSubcopy` |
| `CertificationDialog.dc.html` | [07](#07-永續與認證) Certifications（`?cert={slug}` 深連結） |
| `FloatingButton.dc.html` | 純 UI 元件，**無內容模型**；連結目標為 `NavigationItems(LinkType = ContactModal)`。所列的「AI Agent」按鈕本版不建模（見 [19.12](#19-待客戶確認事項)） |

---

## 02 產品目錄

**服務頁面**：`products.dc.html`、`product-optical-film.dc.html`、`product-textile-foam.dc.html`、
`product-acoustic.dc.html`、Homepage 三大產品導引、Header mega menu、Solution 頁的
「What we bring」。
**API**：`GET /api/v1/categories`、`/categories/{slug}`、`/products`、`/products/{slug}`；
Admin `categories`、`products`。

### Categories（Routable）— 產品線與子分類

`Type` 依 CIS 手冊擴充為三線；**原 `Application` 值已移除**（見 [03](#03-產業解決方案)），
`Categories` 從此只承載產品分類樹。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `int` PK | |
| `ParentId` | `int NULL` FK→`Categories` | 產品線 = NULL；子分類指向產品線 |
| `Type` | `tinyint` | `CategoryType`：OpticalFilm=1 / TextileFoam=2 / Acoustic=3 |
| `Slug` | `nvarchar(200)` | filtered unique |
| `AccentColorHex` | `nvarchar(7)` | CIS p.8 產品色：`#71d6e0` / `#e7004b` / `#cfcfcd` |
| `IconName` | `nvarchar(64) NULL` | lucide icon key |
| `HeroMediaAssetId` | `int NULL` FK→`MediaAssets` | |
| `Status` `SortOrder` `CreatedAt` `UpdatedAt` `PublishedAt` | | |

`CategoryTranslations(CategoryId, Culture)`：`Name nvarchar(200)`、`ShortName nvarchar(80)`
（選單用）、`MenuNote nvarchar(160)`（mega menu 的一行說明）、`Summary nvarchar(600)`、
`Intro nvarchar(max)`（產品線頁開場）、`Description nvarchar(max)`、+ SEO 四欄。

### Products（Routable）

同時支援 mockup 的 family 卡片（`AG`、`VR-AC 110`）與舊站的細分型號（`AG16`、`AG34`）兩層。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `int` PK | |
| `CategoryId` | `int` FK→`Categories` | 產品線或子分類 |
| `ParentProductId` | `int NULL` FK→`Products` | 型號掛在 family 之下；卡片查詢 = `ParentProductId IS NULL` |
| `Slug` | `nvarchar(200)` | filtered unique |
| `Code` | `nvarchar(32) NULL` | `AG` / `VR-AC 360-A`（卡片短碼） |
| `Brand` | `nvarchar(80) NULL` | `FlexCore™` |
| `IsFeatured` | `bit` | 熱銷／首頁陳列 |
| `IsNew` | `bit` | 卡片 "New" badge |
| `HeroMediaAssetId` | `int NULL` | |
| `LegacySourceKey` | `nvarchar(128) NULL` | 舊站匯入的冪等鍵 |
| `Status` `SortOrder` + 三時間戳 | | |

`ProductTranslations(ProductId, Culture)`：`Name nvarchar(200)`、`Summary nvarchar(600)`、
`Description nvarchar(max)`（HTML）、`ApplicationNote nvarchar(600)`、+ SEO 四欄。

**`Product ↔ Category` 不做多對多**：URL 是 `/products/{category}/{product}`，多分類會讓同一產品
有多個 canonical URL。跨線陳列改用 `ProductSolutions` 或 `IsFeatured` 解決。

### SpecificationRows（Embedded，Owner triple）

mockup 有三處同形的規格表：產品線頁「Common specifications」、產品卡片的 2 個亮點、Solution
頁「Key specifications」。三處都是 `Property / Typical value / Method-note`，因此**一張表服務三種
owner**，而非三對表。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `int` PK | |
| `OwnerProductId` | `int NULL` FK→`Products` | |
| `OwnerCategoryId` | `int NULL` FK→`Categories` | |
| `OwnerSolutionId` | `int NULL` FK→`Solutions` | |
| `IsHighlighted` | `bit` | 產品卡片的亮點 chip |
| `Status` `SortOrder` + 三時間戳 | | |

CHECK 約束與 filtered index 見 [0.6](#06-owner-triple-模式多型-owner)。

`SpecificationRowTranslations(SpecificationRowId, Culture)`：`Label nvarchar(200)`（Property）、
`Value nvarchar(200)`、`Note nvarchar(400)`（Method / note）。**無 SEO 欄位。**

> **為什麼規格不用 ContentBlock**：規格要進 `Product` JSON-LD 的 `additionalProperty`、要餵會員區
> 的完整公差表、未來要做產品比較。這是產品資料，不是排版資料——符合 [09](#09-頁面與版塊) 的判準 2。

### ProductImages（join）

`ProductId`、`MediaAssetId`、`SortOrder`；PK = `(ProductId, MediaAssetId)`。

---

## 03 產業解決方案

**服務頁面**：`solutions.dc.html` 與 7 個 `solution-*.dc.html`、Homepage 解決方案總覽、
Header mega menu。
**API**：`GET /api/v1/solutions`、`/solutions/{slug}`；Admin `solutions`。

### 決策：`Applications` 收斂為 `Solutions`

舊版文件同時有 `Applications` 表與 `Categories.Type = Application`，是**同一件事的兩份建模**。
兩版 Sitemap、mockup、Header、Footer 都稱 Solutions，故收斂為一：

1. 移除 `Categories.Type = Application`。
2. `Applications` / `ApplicationTranslations` 更名為 `Solutions` / `SolutionTranslations`，升級為
   一級 Routable 實體。
3. URL 改為 `/{locale}/solutions` 與 `/{locale}/solutions/{slug}`。

**理由**：Solution 頁的資訊形狀（Challenge → What we bring → Key specs → Why us → Other
applications）與 Category（分類樹 + 產品列表）完全不同。硬塞進 `Categories` 會讓它同時承載
「分類樹」與「行銷長頁」兩種語意，導致 `Type` 判斷散落到每一個查詢裡。

**必須 seed 的 301**（見 [18](#18-seed-與舊站匯入)）：`/application` → `/en/solutions`；
`/application/{oldSlug}` → `/en/solutions/{newSlug}`（逐筆）；舊站 flat 頁
（`products-for-health-care.html`、`personal-workplace.html`、`team-workplace.html`、
`automobile-film-universal-series.html`、`curved-privacy-filter.html` 等）→ 對應的 Solution 或
Product（需人工審核對照表）。

### Solutions（Routable）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `int` PK | |
| `Slug` | `nvarchar(200)` | filtered unique |
| `IconName` | `nvarchar(64) NULL` | |
| `IsNew` | `bit` | 索引卡 "New" badge（Acoustic Solutions） |
| `HeroMediaAssetId` | `int NULL` | |
| `Status` `SortOrder` + 三時間戳 | | |

`SolutionTranslations(SolutionId, Culture)`：`Name nvarchar(200)`、`MenuNote nvarchar(160)`
（mega menu 子項說明）、`Summary nvarchar(600)`（索引卡）、`ChallengeTitle nvarchar(300)`、
`ChallengeBody nvarchar(max)`、`Description nvarchar(max)`、`CtaLabel nvarchar(80)`、+ SEO 四欄。

Solution 頁的「What we bring to the assembly」（3 張卡）與「Why teams specify us here」（敘述 +
數字）→ 用 [09](#09-頁面與版塊) 的 `ContentBlocks`（`OwnerSolutionId`）。

### join tables

- `SolutionCategories(SolutionId, CategoryId, SortOrder)` — 索引卡的產品線 chip、Solution 頁底部的
  產品線連結
- `ProductSolutions(ProductId, SolutionId, SortOrder)` — 產品線頁「Where it is used」、Solution 頁的
  關聯產品

---

## 04 技術與製程

**服務頁面**：`technologies.dc.html`、產品線頁的「How it is made」、`about-us.dc.html` 的
Manufacturing 區、`partnership.dc.html` 的 Spec→Sample→Scale、`contact.dc.html` 的
「What happens after you send」。
**API**：`GET /api/v1/technologies`；Admin `process-flows`。

### 五組步驟流程用一組表

mockup 共有 5 種有序步驟清單（Core Processes 4 步、Co-development 5 步、OEM/ODM 3 步、
每條產品線的 How it is made 4 步 ×3、Contact 3 步）。各建一張表會有 5 張表；全塞 block 又無法
跨頁重用。折衷為**父子兩張表 + `Kind` enum**：

```
ProcessFlows (Addressable)
  Id, Slug (filtered unique，供 #core-processes 錨點), Kind tinyint (ProcessFlowKind),
  OwnerCategoryId int NULL FK→Categories,     -- 產品線專屬的 How it is made
  Status, SortOrder, CreatedAt, UpdatedAt, PublishedAt

ProcessFlowTranslations (ProcessFlowId, Culture)
  Title nvarchar(300), Subtitle nvarchar(400), Intro nvarchar(max), + SEO 四欄

ProcessSteps (Embedded)
  Id, ProcessFlowId FK (CASCADE), StepNumber tinyint, IconName nvarchar(64),
  AccentColorHex nvarchar(7) NULL,            -- Co-development flow 的漸層色條
  MediaAssetId int NULL FK→MediaAssets,
  Status, SortOrder, CreatedAt, UpdatedAt, PublishedAt

ProcessStepTranslations (ProcessStepId, Culture)
  Title nvarchar(200), Body nvarchar(1000)
```

`ProcessFlowKind`：CoreProcess=1 / Manufacturing=2 / CoDevelopment=3 / OemOdm=4 / InquiryFlow=5。

### Product Compliance 不建表

`technologies.dc.html` 的三欄表（Standard / Scope / Documentation）與 `CertificationDialog` 的欄位
（Title / Issuer / Validity / Scope / Sites / 文件）**是同一實體的兩種呈現**——RoHS、REACH、
IEC-IP 同時出現在兩處，且 CertificationDialog 本身已有 `Product Compliance` 這個分類值。

**決定**：不建 `ComplianceItems`，Technologies 的合規表直接查
`Certifications WHERE Category = ProductCompliance`（[07](#07-永續與認證)）。省下一張表 + 一張
翻譯表，且不會出現「RoHS 在兩處各存一份、內容不同步」。

「In-line quality control」的 4 個檢測項目與「R&D / Material Innovation」的 3 張卡 →
`ContentBlocks(BlockType = FeatureGrid)`：只出現在一個頁面、不需查詢、不進 JSON-LD。

---

## 05 資源中心

**服務頁面**：`resources.dc.html`、`news.dc.html`、`news-article.dc.html`、`article.dc.html`、
`faq.dc.html`。
**API**：`GET /api/v1/articles`、`/articles/{slug}`、`/exhibitions`、`/faq`；
Admin `articles`、`article-tags`、`authors`、`exhibitions`、`faq-categories`、`faq-items`。

### News / Insights / Blog 共用同一張 `Articles` 表

三者欄位重疊約 95%（title / excerpt / body HTML / hero / publishedAt / SEO / 相關文章）。分成三張表
要維護三套 CRUD、三套翻譯表、三套 sitemap 收集器、三套 Admin 畫面，而差異只有 2~3 個 nullable
欄位（`ReadingMinutes`、`AuthorId`、`ExhibitionId`）。因此用單表 + `Type` enum：

| 值 | 名稱 | 前台位置 |
| --- | --- | --- |
| 1 | `CompanyNews` | `/news` |
| 2 | `ProductNews` | `/news` |
| 3 | `Exhibition` | `/news` |
| 4 | `CertificationNews` | `/news` |
| 5 | `Insight` | `/insights`（Industry Insights / Trend Reports） |
| 6 | `TechnicalArticle` | `/blog`（Blog / Technical Articles） |

> **`Type` 決定 URL 前綴，所以變更 `Type` 等同變更 URL，必須寫 301**（同 [0.5](#05-slug-是內容不是衍生值) 守則）。

### 標籤拆成三種語意，不混用一張表

| 語意 | 實作 | 來源 |
| --- | --- | --- |
| 自由標籤 | `ArticleTags` + `ArticleTagLinks` | 舊站 `blog_post_tag.csv` 的 `knowledge` / `activity` |
| 產品線標籤 | `ArticleCategories` join → `Categories` | 文章卡上的 Optical Film / Textile & Foam / Acoustic chip |
| 產業標籤 | `ArticleSolutions` join → `Solutions` | `article.dc.html` 的 Automotive / E-Paper chip |

**理由**：產品線與產業本來就是站內既有實體。用自由標籤複製一份會造成「Optical Film 這個 tag」
與「Optical Film 這個 category」不同步，且 chip 無法產生正確連結。自由標籤只留給沒有對應實體的
行銷標籤。

### Articles（Routable）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `Id` | `int` PK | |
| `Type` | `tinyint` | `ArticleType` |
| `Slug` | `nvarchar(200)` | filtered unique（**全表，跨 Type**） |
| `AuthorId` | `int NULL` FK→`Authors` | |
| `ExhibitionId` | `int NULL` FK→`Exhibitions` | `Type = Exhibition` 時連到展會實體 |
| `HeroMediaAssetId` | `int NULL` | |
| `ReadingMinutes` | `tinyint NULL` | "9 min read" |
| `IsFeatured` | `bit` | Resources 首頁置頂 |
| `LegacySourceKey` | `nvarchar(128) NULL` | 舊站 `blog_post` 匯入 |
| `Status` `SortOrder` + 三時間戳 | | **`PublishedAt` 參與可見性與排序** |

`ArticleTranslations(ArticleId, Culture)`：`Title nvarchar(300)`、`Excerpt nvarchar(600)`、
`Lead nvarchar(1000)`（大字導言）、`Body nvarchar(max)`（HTML，含 TOC 用的 h2 錨點）、
`PullQuote nvarchar(600)`、`PullQuoteAttribution nvarchar(160)`、+ SEO 四欄。

### Authors（Embedded）

`Id`、`Slug`、`Initials nvarchar(4)`、`MediaAssetId int NULL`、`Status`、`SortOrder`、三時間戳。
`AuthorTranslations`：`Name nvarchar(160)`、`JobTitle nvarchar(160)`、`Bio nvarchar(1000)`。

### ArticleTags（Addressable）

`Id`、`Slug`(filtered unique)、`IsSystem bit`、`Status`、`SortOrder`、三時間戳。
`ArticleTagTranslations`：`Name nvarchar(120)`、`Description nvarchar(400)`、+ SEO 四欄（tag 頁可能
被索引）。Seed：`knowledge`、`activity`。

### Exhibitions（Addressable）

服務 `resources.dc.html` 的「Next exhibition」卡、`news.dc.html` 的 Exhibitions & Events 列表、
`news-article.dc.html` 的 Event details 側欄、Homepage 的 Exhibition Records，以及 `Event` JSON-LD。

| 欄位 | 型別 |
| --- | --- |
| `Id` | `int` PK |
| `Slug` | `nvarchar(200)` filtered unique |
| `StartDate` / `EndDate` | `date` |
| `BoothNumber` | `nvarchar(32) NULL` |
| `City` / `CountryCode` | `nvarchar(80)` / `char(2)` |
| `WebsiteUrl` / `MeetingUrl` | `nvarchar(512) NULL` |
| `HeroMediaAssetId` | `int NULL` |
| `Status` `SortOrder` + 三時間戳 | |

`ExhibitionTranslations`：`Name nvarchar(300)`、`VenueName nvarchar(200)`、
`Summary nvarchar(600)`、`Description nvarchar(max)`、`OnBoothNote nvarchar(600)`、
`CtaLabel nvarchar(80)`、+ SEO 四欄。

- 「下一場展會」＝ `Status = Published AND EndDate >= CAST(SYSUTCDATETIME() AS date) ORDER BY StartDate` 取 1
- 「Exhibition Records」＝ `EndDate < today ORDER BY StartDate DESC`

**刻意不加 `IsFeatured`**：由日期決定可避免「置頂旗標忘了關掉，首頁一直顯示已結束的展會」。

### FaqCategories / FaqItems

`faq.dc.html` 有 6 個分類、13 題，且 Sitemap 明寫需 structured data（`FAQPage` JSON-LD，供 AI 引擎
引用）→ **必須強型別**，block 無法產生正確的 JSON-LD。

```
FaqCategories (Addressable)
  Id, Slug (filtered unique), Status, SortOrder, 三時間戳
FaqCategoryTranslations
  Name nvarchar(160), Description nvarchar(400)

FaqItems (Addressable)
  Id, FaqCategoryId FK, Slug (filtered unique，供 #faq-anti-glare-vs-ar 錨點),
  RefProductId / RefCategoryId / RefSolutionId / RefPageId / RefDownloadId  (int NULL FK),
  ExternalUrl nvarchar(512) NULL,
  IsFeatured bit,                     -- resources.dc.html 只顯示前幾題
  Status, SortOrder, 三時間戳
FaqItemTranslations (FaqItemId, Culture)
  Question nvarchar(500), Answer nvarchar(max), LinkLabel nvarchar(120)
```

`Ref*` 對應 mockup 每題底部的 `linkLabel` + `href`。用 nullable FK 而非裸 URL，目標 slug 改變時
連結自動跟著走。

---

## 06 下載中心

**服務頁面**：`resources.dc.html` 的技術規格下載、產品頁的 spec sheet、`member.dc.html` 的白皮書
與合規文件、Certification dialog 的證書。
**API**：`GET /api/v1/downloads`；`POST /api/v1/account/downloads/{slug}/link`；Admin `downloads`。

### `Downloads` 必須獨立於 `MediaAssets`

- `MediaAssets` 是**檔案倉庫**——一張圖、一支影片、一個 PDF 的位址與 metadata。
- `Downloads` 是**可發佈的內容實體**——有需翻譯的標題與說明、版本與文件日期、存取層級、上下架
  狀態、關聯與 SEO，還有自己的列表頁。

若把 `AccessLevel` / `Version` 塞進 `MediaAssets`，等於讓每一張 hero 圖都背著權限與版本欄位，且
無法表達「同一份 ISO 14001 證書的 2024 版與 2026 版是兩個 Download、指向兩個 MediaAsset」。

```
Downloads (Routable — /{locale}/resources/downloads#{slug})
  Id                    int PK
  Slug                  nvarchar(200)  filtered unique
  MediaAssetId          int FK→MediaAssets          -- 實際檔案
  Kind                  tinyint (DownloadKind)
  AccessLevel           tinyint (DownloadAccessLevel)
  Version               nvarchar(32) NULL           -- 'Rev. C' / '2026.1'
  DocumentDate          date NULL
  ValidUntil            date NULL                   -- 證書效期，過期自動不列出
  FileExtension         nvarchar(16)                -- 冗餘存放，列表 UI 免 join
  FileSizeBytes         bigint
  DocumentCulture       nvarchar(10) NULL FK→Cultures  -- 檔案本身的語言；NULL = 語言中立
  ThumbnailMediaAssetId int NULL FK→MediaAssets
  Status, SortOrder, 三時間戳

DownloadTranslations (DownloadId, Culture)
  Title nvarchar(300), Description nvarchar(1000), + SEO 四欄
```

### 權限判定（Application 層規則）

| `AccessLevel` | Public API 行為 | Account API 行為 |
| --- | --- | --- |
| `Public` = 0 | 回 `fileUrl`（public container 的 CDN URL） | 同左 |
| `MemberOnly` = 1 | 回 metadata，`fileUrl = null`、`requiresSignIn = true` | `Members.Status = Approved` → 回 **10 分鐘有效的 Blob SAS URL**；否則 403 |
| `OnRequest` = 2 | 回 metadata，`fileUrl = null`、`requestUrl = /contact?download={slug}` | 同左（一律走詢問單） |

`MemberOnly` 檔案存於 **private container**（`MediaAssets.IsPrivate = 1`）；`Public` 檔案存 public
container。這會影響 Blob 佈署設定，見 [architecture.md](architecture.md)。

依 [0.7](#07-不留-log) **不建下載紀錄表**（`MemberDownloads` / `DownloadEvents`）。若業務端日後
需要「誰下載了 EUDR 文件包」，加一張 `MemberDownloadGrants`（記錄授權而非瀏覽）成本很低——見
[19](#19-待客戶確認事項) 第 10 項。

### join tables

`DownloadProducts`、`DownloadCategories`、`DownloadSolutions`、`DownloadCertifications`、
`DownloadArticles`——皆為 `(左Id, 右Id[, SortOrder])`，PK = 兩個 Id。

---

## 07 永續與認證

**服務頁面**：`sustainability.dc.html`、`about-us.dc.html` 的認證卡、`CertificationDialog.dc.html`、
`technologies.dc.html` 的 Product Compliance 表、Homepage 信任牆、`faq.dc.html` 的合規題。
**API**：`GET /api/v1/certifications`；Admin `certifications`。

`CertificationDialog` 是獨立元件、被 4 個頁面觸發、有結構化欄位（issuer / validity / scope /
sites）→ 教科書級的「必須強型別」案例。

```
Certifications (Addressable — ?cert={slug} 深連結)
  Id                 int PK
  Slug               nvarchar(200)  filtered unique      -- 'iso-14001'
  Category           tinyint (CertificationCategory)
  CertificateNumber  nvarchar(120) NULL
  IssuedOn           date NULL
  ValidUntil         date NULL
  IsPlaceholder      bit                                  -- mockup 的 [Pending client input] 虛線卡
  DownloadId         int NULL FK→Downloads                -- 證書 PDF，重用 Downloads 不另建表
  LogoMediaAssetId   int NULL FK→MediaAssets
  Status, SortOrder, 三時間戳

CertificationTranslations (CertificationId, Culture)
  Title              nvarchar(200)   -- 'ISO 14001'
  ShortNote          nvarchar(200)   -- 卡片上的一行說明
  Summary            nvarchar(1000)  -- dialog 的敘述段
  IssuerName         nvarchar(200)   -- Issuing body
  ValidityText       nvarchar(200)   -- 'Reviewed annually' 這類非日期敘述
  ScopeText          nvarchar(400)   -- 'Environmental management system'
  SitesText          nvarchar(400)   -- 'All material platforms'
  DocumentationLabel nvarchar(120)   -- Technologies 表的 'Declaration' / 'Test report'
  + SEO 四欄
```

> `ValidityText` 與 `ValidUntil` 並存的理由：mockup 有 `Per test report`、
> `Reviewed per SVHC list update` 這類非日期值。`ValidUntil` 供程式判定過期並自動隱藏，
> `ValidityText` 供顯示。**兩者都要。**

ESG 三支柱、碳足跡 TRIPs、EUDR 三個區塊 → **不建表**，用 `Pages(slug = sustainability)` +
`ContentBlocks`（`Anchor` = `esg` / `carbon` / `eudr` / `certifications`，對應 mockup 的 hash）。
純敘事、只出現一次、不需查詢、不進 JSON-LD。

### join tables

`CertificationProducts`、`CertificationCategories`（後者連到 `Categories`，表示「這張證書涵蓋哪條
產品線」）。

---

## 08 合作夥伴與公司資訊

**服務頁面**：`partnership.dc.html`、`about-us.dc.html`、`contact.dc.html`、Homepage 信任牆。
**API**：由 `GET /api/v1/pages/{slug}` 的 reference block 一併解析回傳（不給獨立 public 端點）；
Admin `milestones`、`locations`、`testimonials`、`partner-brands`、`contact-channels`。

五張小的強型別表，全部是 Embedded：

```
Milestones                 Id, Year int, Month tinyint NULL, MediaAssetId int NULL,
                           Status, SortOrder, 三時間戳
MilestoneTranslations      Label nvarchar(80) ('01 — Founding'), Title nvarchar(200),
                           Body nvarchar(1000)

Locations                  Id, Type tinyint (LocationType), CountryCode char(2),
                           City nvarchar(80), Phone nvarchar(40), Email nvarchar(320) NULL,
                           Latitude/Longitude decimal(9,6) NULL, MapUrl nvarchar(512) NULL,
                           MediaAssetId int NULL, Status, SortOrder, 三時間戳
LocationTranslations       Name nvarchar(200), AddressLine nvarchar(400),
                           Note nvarchar(600), OpeningHours nvarchar(200)

Testimonials               Id, PartnerBrandId int NULL FK, SolutionId int NULL FK,
                           MediaAssetId int NULL, Status, SortOrder, 三時間戳
TestimonialTranslations    Quote nvarchar(1000), AuthorName nvarchar(120) NULL,
                           AuthorTitle nvarchar(160), CompanyType nvarchar(160)

PartnerBrands              Id, Slug (filtered unique), LogoMediaAssetId int FK,
                           WebsiteUrl nvarchar(512) NULL, IsLogoWallVisible bit,
                           Status, SortOrder, 三時間戳
PartnerBrandTranslations   Name nvarchar(200), Note nvarchar(400)

ContactChannels            Id, Slug (filtered unique), Email nvarchar(320),
                           Phone nvarchar(40) NULL, InquiryType tinyint,
                           Status, SortOrder, 三時間戳
ContactChannelTranslations Label nvarchar(120) ('Sales & quotations'),
                           Description nvarchar(400) ('Pricing, lead times…')
```

**為什麼這五張要強型別而不是 block**：Milestones 要按年排序；Locations 有經緯度與地圖連結、
同時出現在 About 與 Contact 兩頁；Testimonials 要能關聯 Solution 並在多頁輪播；PartnerBrands 是
logo wall，同時出現在 Homepage 與 Partnership。全都符合判準 1（跨頁重用）。

`Testimonials.AuthorName` 設為 nullable——具名需要客戶書面授權，未取得時只顯示職稱 + 公司類型。

OEM/ODM 的 Spec→Sample→Scale 三步驟 → `ProcessFlows(Kind = OemOdm)`（[04](#04-技術與製程)）。
Distribution 的「兩種合作模式」→ `ContentBlocks(BlockType = FeatureGrid)`。

---

## 09 頁面與版塊

**服務頁面**：`index.dc.html`、`about-us.dc.html`、`sustainability.dc.html`、`partnership.dc.html`、
`technologies.dc.html`、`privacy.dc.html`、`contact.dc.html`，以及共用元件 `PageBanner`、`PageCTA`。
**API**：`GET /api/v1/pages/{slug}`；Admin `pages`、`content-blocks`。

### 判準：什麼時候給強型別表，什麼時候用 block

一個區塊該給**強型別表**，若**任一為真**：

1. **跨頁重用** — 同一批資料出現在兩個以上的頁面／API（Certifications 出現在 4 頁；Locations 出現
   在 2 頁）。
2. **需被查詢、排序、關聯，或輸出為結構化資料** — FAQ → `FAQPage`、Exhibition → `Event`、
   SpecificationRow → `Product.additionalProperty`、Download 依 `AccessLevel` 過濾。
3. **有自己的生命週期** — 有效期（`Certifications.ValidUntil`）、存取層級
   （`Downloads.AccessLevel`）、日期驅動的可見性（`Exhibitions.EndDate`）。

否則就用 block。

### 最終分配

| 區塊 | 決定 | 觸發判準 |
| --- | --- | --- |
| Certifications | **強型別** | 1, 2, 3 |
| Milestones | **強型別** | 1 |
| Locations | **強型別** | 1, 2 |
| Testimonials | **強型別** | 1 |
| Process steps（5 組） | **強型別**（`ProcessFlows` / `ProcessSteps`） | 1 |
| FaqItems | **強型別** | 1, 2 |
| Exhibitions | **強型別** | 1, 2, 3 |
| Downloads | **強型別** | 1, 2, 3 |
| PartnerBrands | **強型別** | 1 |
| SpecificationRows | **強型別** | 1, 2 |
| Technologies 的 Product compliance 表 | **併入 `Certifications`** | 與 Certifications 同實體 |
| Contact 的三步驟 | **強型別**（`ProcessFlows` Kind=InquiryFlow，複用既有表） | 免建新表 |
| Homepage hero / 品牌口號 | block | 皆不成立 |
| Homepage 三大產品導引 | **reference block**（`CategoryGrid`） | 資料來自 `Categories` |
| About 品牌願景 / 核心價值四格 | block | 皆不成立 |
| About Manufacturing capabilities 四卡 | block | 皆不成立 |
| Sustainability ESG / 碳足跡 / EUDR | block | 皆不成立 |
| Technologies 品質管制四標籤 / R&D 三卡 | block | 皆不成立 |
| Partnership 兩種合作模式 | block | 皆不成立 |
| Solution 頁 What we bring / Why us / stats | block（`OwnerSolutionId`） | 皆不成立 |
| 產品線頁 stat band | block（`OwnerCategoryId`） | 皆不成立 |

### 兩種 block 型別（避免「什麼都是 block」的關鍵）

- **Content Block** — 自帶文字內容，資料存在 `ContentBlockItems` + 翻譯表。
  例：RichText / Hero / Gallery / FeatureGrid / StepList / StatBand / MediaTextSplit / Quote / Cta。
- **Reference Block** — **只帶查詢參數**，資料來自強型別表。
  例：`CertificationList` / `FaqList` / `DownloadList` / `ExhibitionList` / `SolutionGrid` /
  `PartnerBrandWall` / `ArticleList` / `ProcessFlowRef`。查詢參數存 `SettingsJson`——這是
  **唯一允許的 JSON 欄位，且必須 culture-neutral、不得含任何本地化文字**。

編輯者看到的是「插入認證清單 → 選分類 → 選數量」，而不是「手抄一遍 ISO 14001」。這同時解決
編輯體驗與資料同步。

### 表定義

```
Pages (Routable)
  Id, Slug (filtered unique), Template tinyint (PageTemplate),
  ParentPageId int NULL FK→Pages,        -- /resources/faq、sustainability→about 的層級
  IsSystemPage bit,                       -- 系統頁不可刪（home / privacy / contact …）
  HeroMediaAssetId int NULL,
  Status, SortOrder, 三時間戳

PageTranslations (PageId, Culture)
  Title nvarchar(300), Eyebrow nvarchar(120), Subtitle nvarchar(400),
  BannerTitle nvarchar(300), BannerDescription nvarchar(600),      -- PageBanner 元件
  CtaEyebrow nvarchar(120), CtaHeadline nvarchar(300), CtaSubcopy nvarchar(400),  -- PageCTA 元件
  Body nvarchar(max) NULL,                -- privacy 這類純長文可不用 block
  LastReviewedLabel nvarchar(80),         -- 'Last updated: June 1, 2026'
  + SEO 四欄

ContentBlocks (Embedded, Owner triple)
  Id, BlockType tinyint,
  OwnerPageId     int NULL FK→Pages,
  OwnerSolutionId int NULL FK→Solutions,
  OwnerCategoryId int NULL FK→Categories,
  Anchor nvarchar(64) NULL,               -- 'core-processes' / 'downloads' / 'esg'
  Tone tinyint (BlockTone),               -- Dark=0 / Light=1（mockup 深淺交錯）
  SettingsJson nvarchar(max) NULL,        -- 僅 Reference block 使用
  MediaAssetId int NULL,
  Status, SortOrder, 三時間戳
  CHECK: 三個 Owner 恰一非 NULL（見 0.6）

ContentBlockTranslations (ContentBlockId, Culture)
  Eyebrow nvarchar(120), Title nvarchar(300), Subtitle nvarchar(400),
  Body nvarchar(max), CtaLabel nvarchar(80), FootNote nvarchar(600)

ContentBlockItems (Embedded)
  Id, ContentBlockId FK (CASCADE), SortOrder,
  MediaAssetId int NULL, IconName nvarchar(64) NULL,
  AccentColorHex nvarchar(7) NULL, Badge nvarchar(32) NULL,
  LinkType tinyint (LinkTargetType), LinkUrl nvarchar(512) NULL,
  RefCategoryId / RefProductId / RefSolutionId / RefArticleId /
  RefDownloadId / RefPageId   (int NULL FK),
  CreatedAt, UpdatedAt, PublishedAt

ContentBlockItemTranslations (ContentBlockItemId, Culture)
  Title nvarchar(300), Subtitle nvarchar(300), Body nvarchar(max),
  LinkLabel nvarchar(120), Value nvarchar(100)    -- StatBand 的 '± 0.05 mm'
```

`Anchor` 在同一 owner 內 unique（filtered unique index），確保 `#core-processes` 不會有兩個目標。

**`Template` ↔ 可用 `BlockType` 的白名單寫在程式碼（`PageTemplateRegistry`），不進 DB**——它是
編輯 UI 的規則，不是資料，放 DB 只會多一張沒人維護的表。

---

## 10 導覽、SEO 與轉址

**服務頁面**：`Header.dc.html`、`Footer.dc.html`、全站 metadata、`sitemap.xml`、`robots.txt`。
**API**：`GET /api/v1/navigation`、`/sitemap`；Admin `navigation`、`redirects`、`site-settings`。

### NavigationItems

```
NavigationItems
  Id            int PK
  ParentId      int NULL FK→NavigationItems
  Location      tinyint (NavigationLocation)   -- Header / Footer / FooterLegal / Social / SearchChip
  LinkType      tinyint (LinkTargetType)       -- Internal / External / Anchor / EntityRef / ContactModal
  Url           nvarchar(512) NULL             -- External / Anchor 用
  RefPageId / RefCategoryId / RefProductId /
  RefSolutionId / RefArticleId / RefDownloadId  (int NULL FK)   -- EntityRef 用
  IconName      nvarchar(64) NULL              -- Footer 社群 icon
  OpenInNewTab  bit
  Status, SortOrder, CreatedAt, UpdatedAt, PublishedAt

NavigationItemTranslations (NavigationItemId, Culture)
  Label     nvarchar(120)      -- 'Products'
  Note      nvarchar(200)      -- mega menu 子項的 'Eight coated surface families'
  MenuTitle nvarchar(200)      -- mega menu 面板標題 'Products — what we make'
  AriaLabel nvarchar(200) NULL
```

**用 `Ref*Id` 而非硬編 URL 的理由**：實體改 slug 時導覽自動跟著改，不會出現「導覽指向已被 301 的
舊路徑」。`Location = SearchChip` 直接承載 Header 的 "Frequent searches" 五個 chip，免建新表。

### Redirects

```
Redirects
  Id              int PK
  FromPath        nvarchar(512)  UNIQUE    -- normalized：小寫、去尾斜線
  ToPath          nvarchar(512)
  StatusCode      smallint                 -- 301 / 302 / 308 / 410（存真實 HTTP 碼）
  TargetCulture   nvarchar(10) NULL FK→Cultures   -- FromPath 無 locale 時的目標語系
  IsEnabled       bit
  Notes           nvarchar(400) NULL
  LegacySourceKey nvarchar(128) NULL
  CreatedAt, UpdatedAt, PublishedAt
```

**寫入規則（Application 層強制）**：

1. `FromPath` 一律 normalize（小寫、去尾斜線、保留 query string 但排序參數）。
2. **不得產生鏈**：新增 `A→B` 時若已存在 `B→C`，直接寫 `A→C`，並把既有指向 A 的列一併重寫。
3. **不得產生環**：寫入前檢查 `ToPath` 不等於任一祖先的 `FromPath`。
4. `StatusCode = 410` 表示「內容永久移除且無替代」（`Archived` 且無適當目標時）。

依 [0.7](#07-不留-log)：**不建 `RedirectHitCount`、不記錄命中次數。**

### SiteSettings

```
SiteSettings              Key nvarchar(100) PK, ValueKind tinyint (SettingValueKind),
                          Value nvarchar(max) NULL, IsLocalized bit, CreatedAt, UpdatedAt
SiteSettingTranslations   (SettingKey, Culture) → Value nvarchar(max)
```

承載：預設 SEO title 樣板、`Organization` JSON-LD 的公司資訊、GA/GTM id、`revalidateTag` webhook
目標、預設 OG 圖、隱私政策版本號（`PrivacyPolicyVersion`，供 `ConsentPolicyVersion` 比對）。

---

## 11 媒體資產

**API**：`POST /api/admin/media`、`GET /api/admin/media`。公開端不直接暴露媒體端點。

```
MediaAssets
  Id               int PK
  Container        nvarchar(64)      -- 'public-media' | 'member-documents'
  BlobPath         nvarchar(512)
  Url              nvarchar(1024) NULL  -- public container 的 CDN URL；private 為 NULL
  IsPrivate        bit                  -- 1 → 一律走 SAS，不得直接回 URL
  Type             tinyint (MediaAssetType)
  MimeType         nvarchar(120)
  FileName         nvarchar(260)
  FileSizeBytes    bigint
  Width / Height   int NULL
  DurationSeconds  int NULL
  Sha256           char(64) NULL        -- 去重；非唯一索引
  FocalPointX / FocalPointY  decimal(5,4) NULL   -- 響應式裁切
  IsArchived       bit
  CreatedAt, UpdatedAt, PublishedAt

MediaAssetTranslations (MediaAssetId, Culture)
  AltText nvarchar(300), Caption nvarchar(600), Title nvarchar(200)
```

`MediaAssets` **沒有 `Slug`、沒有 `ContentStatus`**——它不是可發佈內容，用 `IsArchived` 隱藏即可。
**二進位永不進 SQL**（[CLAUDE.md](../CLAUDE.md) 硬性 convention）。

---

## 12 詢問與名單

**服務頁面**：`contact.dc.html` 與 Header 的 contact drawer——**同一個表單、同一個端點**。
**API**：`POST /api/v1/contact`；Admin `contact-inquiries`。

```
ContactInquiries
  Id                   uniqueidentifier PK DEFAULT NEWSEQUENTIALID()
  ReferenceNumber      nvarchar(24) UNIQUE      -- 'INQ-2026-000431'，回信給客戶用
  Type                 tinyint (InquiryType)
  Name                 nvarchar(160)
  CompanyName          nvarchar(200)
  Email                nvarchar(320)
  Phone                nvarchar(40) NULL
  CategoryId           int NULL FK→Categories   -- 表單的 Product Line 下拉
  ProductLineOther     nvarchar(100) NULL       -- 選 'Other' 時的自由輸入
  RefProductId         int NULL FK→Products     -- 從產品頁「Request a sample」帶入
  RefDownloadId        int NULL FK→Downloads    -- AccessLevel = OnRequest 的文件索取
  ApplicationText      nvarchar(500) NULL
  TargetSpec           nvarchar(2000) NULL
  Message              nvarchar(4000) NULL
  SourceUrl            nvarchar(512)
  Culture              nvarchar(10) FK→Cultures
  MemberId             uniqueidentifier NULL FK→Members   -- 已登入會員送出時帶入
  ConsentedAt          datetime2(3)
  ConsentPolicyVersion nvarchar(20)
  Status               tinyint (InquiryStatus)
  AssignedChannelId    int NULL FK→ContactChannels
  InternalNote         nvarchar(max) NULL
  RespondedAt          datetime2(3) NULL
  CreatedAt, UpdatedAt, PublishedAt
```

**不存 IP 位址**：rate-limit 在 Functions 的 middleware 處理，不落 DB——避免它變成事實上的 log 表，
同時降低 GDPR 責任。反機器人 token 驗證通過即丟棄。

---

## 13 後台身分（CMS Users）

與前台會員**完全隔離**：不同表、不同 token、不同 API surface。

**登入帳號是 `Username`，不是 Email**（2026-09-12 決定）。理由：後台沒有寄信管道，
帳號由管理員開、密碼也由管理員直接給（§18.2 的 super admin 之外，其餘從後台「使用者」
單元新增，建立時必填密碼）。用信箱當帳號會讓人以為有「忘記密碼」的信可收，但那條路徑
不存在。`Email` 保留為**選填的聯絡欄位**：不唯一、不參與登入。

帳號格式：英數與 `. _ -`，3–64 字元（`Api/Common/Usernames.cs`）。字元集刻意窄，
避免出現看起來一樣卻是不同列的帳號。

```
Roles
  Id int PK, Name nvarchar(50) UNIQUE, Description nvarchar(200),
  CreatedAt, UpdatedAt, PublishedAt

Users
  Id                  uniqueidentifier PK DEFAULT NEWSEQUENTIALID()
  Username            nvarchar(64)         -- 登入帳號，不是 Email
  UsernameNormalized  nvarchar(64) UNIQUE  -- UPPER(TRIM(Username))
  Email               nvarchar(320) NULL   -- 選填聯絡方式，不唯一、不能登入
  DisplayName         nvarchar(160)
  PasswordHash        nvarchar(256)        -- PHC 字串，見 14.2
  PasswordChangedAt   datetime2(3) NULL
  MustChangePassword  bit NOT NULL DEFAULT 0
  SecurityStamp       uniqueidentifier     -- 改密碼／停用時輪替，令既有 token 失效
  IsActive            bit
  FailedLoginCount    tinyint NOT NULL DEFAULT 0
  LockoutEndsAt       datetime2(3) NULL
  LastLoginAt         datetime2(3) NULL
  PreferredCulture    nvarchar(10) NULL FK→Cultures
  CreatedAt, UpdatedAt, PublishedAt

UserRoles      (UserId, RoleId)  複合 PK
RefreshTokens
  Id uniqueidentifier PK, UserId FK→Users (CASCADE), TokenHash char(64),   -- SHA-256(token)
  ExpiresAt datetime2(3), RevokedAt datetime2(3) NULL,
  ReplacedByTokenHash char(64) NULL, CreatedAt
```

> `FailedLoginCount` / `LockoutEndsAt` / `LastLoginAt` 是**狀態欄位，不是 log 表**——依
> [0.7](#07-不留-log) 允許保留（不建 `LoginAttempts` 表）。此處明說是為了避免被誤刪。

**`UserRoles` 用 M2M 而非 `Users.RoleId` 單一 FK 的理由**：未來要加 `Translator`、`Approver` 角色時
不必改 schema，且一人可同時是 Admin + Editor。JWT 的 `role` claim 輸出為陣列。

---

## 14 前台會員（Members）

**服務頁面**：`member.dc.html`（Sign in / Create account）、會員專區 `/account/**`。
**API**：`/api/v1/account/**`（見 [cms-api.md](cms-api.md)）；Admin `members`、`sample-requests`、
`business-domains`。

### 14.1 API surface

會員 API 掛在 **`fn-public` 底下的 `/api/v1/account/**`**（獨立 route group），不掛 `fn-admin`，
也不在啟動時就拆第三個 Function app。

| 面向 | Base path | App | Auth | 快取 |
| --- | --- | --- | --- | --- |
| Public Content | `/api/v1/**` | `fn-public` | 匿名 | 可快取、Data Cache tagged |
| **Account** | `/api/v1/account/**` | `fn-public`（獨立 route group） | Member JWT | `Cache-Control: no-store`，**不進 Data Cache** |
| Admin | `/api/admin/**` | `fn-admin` | Admin JWT | 不快取 |

**理由**：

1. 前台 Next.js SSR 對會員 API 是同源、同 base URL 的呼叫；掛到 `fn-admin` 會讓公開站必須知道
   admin 的 base URL 與網路路徑，等於擴大 admin 的暴露面。
2. 「`fn-public` 沒有寫入路徑」的原則仍成立——account 端點只能寫 `Members`、`MemberTokens`、
   `MemberRefreshTokens`、`SampleRequests`、`ContactInquiries`，**碰不到任何內容表**。做法：
   account handler 注入 `IAccountDbContext`（只 map 這幾張表），並在 SQL 端用獨立 DB user 授予
   最小權限。
3. 若日後要對會員區單獨做 WAF / rate limit / 擴縮容，再拆出 `fn-member`——屆時只是搬 trigger，
   路由不變。

**Token 三層隔離**：

| | Admin | Member |
| --- | --- | --- |
| Issuer | `vicround-admin` | `vicround-account` |
| Audience | `vicround-admin-api` | `vicround-public-api` |
| 簽章金鑰 | Key Vault `Jwt--Admin--SigningKey` | Key Vault `Jwt--Member--SigningKey` |
| Access TTL | 15 min | 30 min |
| Refresh 表 | `RefreshTokens` | `MemberRefreshTokens` |
| Cookie | `vr_admin_at`，`Path=/admin`，`SameSite=Strict` | `vr_member_at`，`Path=/`，`SameSite=Lax` |

`fn-admin` 只信任 admin audience，account handler 只信任 member audience。即使拿到對方的 token
也一律 401。

### 14.2 密碼雜湊（`Users` 與 `Members` 共用同一格式）

**演算法：PBKDF2-HMAC-SHA256，iterations = 600,000，salt 16 bytes（CSPRNG），derived key 32 bytes。**

- .NET BCL 內建 `Rfc2898DeriveBytes.Pbkdf2`，**零第三方相依**；Functions 冷啟動時少載入一個組件。
- Argon2id 理論上更抗 GPU，但在 .NET 需要 `Konscious.Security.Cryptography` 等第三方套件，且其
  記憶體參數（建議 ≥ 19 MiB/次）在 Consumption plan 的記憶體上限與高併發登入下是穩定性風險。
- 600,000 是 OWASP 對 PBKDF2-HMAC-SHA256 的現行建議值；在 Functions 上單次約 200–400 ms，
  配合登入 rate limit 可接受。

**存法：單一 `PasswordHash nvarchar(256)` 欄位存 PHC 風格字串**，而非 hash + salt 分欄：

```
$pbkdf2-sha256$i=600000$<base64(salt)>$<base64(hash)>
```

- 演算法與參數隨雜湊一起走 → **可逐使用者漸進升級**：登入驗證成功後，若字串內的參數落後於目前
  設定，就用明文重算一次並寫回。分欄方案要升級必須加 `Iterations`、`Algorithm` 欄位並跑 migration。
- 未來換 Argon2id 只需支援 `$argon2id$...` 前綴，新舊帳號可共存，不需一次性強制全員改密碼。
- 一個欄位不會出現「salt 更新了但 hash 沒更新」的不一致狀態。

（選配）**Pepper**：把密碼先做 `HMAC-SHA256(password, pepperFromKeyVault)` 再餵給 PBKDF2。DB 外洩
但 Key Vault 未洩時無法離線破解；代價是輪替 pepper 需全員重設密碼。**預設關閉。**

### 14.3 表定義

```
Members
  Id                    uniqueidentifier PK DEFAULT NEWSEQUENTIALID()
  Email                 nvarchar(320)
  EmailNormalized       nvarchar(320) UNIQUE
  EmailDomain           AS LOWER(SUBSTRING(Email, CHARINDEX('@', Email) + 1, 320)) PERSISTED
  PasswordHash          nvarchar(256)
  PasswordChangedAt     datetime2(3) NULL
  MustChangePassword    bit NOT NULL DEFAULT 0
  SecurityStamp         uniqueidentifier
  FullName              nvarchar(160)
  CompanyName           nvarchar(200)
  JobRole               tinyint (MemberJobRole)
  JobRoleOther          nvarchar(120) NULL       -- JobRole = Other 時
  Phone                 nvarchar(40) NULL
  CountryCode           char(2) NULL
  PreferredCulture      nvarchar(10) FK→Cultures
  Status                tinyint (MemberStatus)
  EmailVerifiedAt       datetime2(3) NULL
  ApprovedAt            datetime2(3) NULL
  ReviewNote            nvarchar(600) NULL       -- 審核備註／拒絕理由（業務資料）
  ConsentedPrivacyAt    datetime2(3)
  ConsentPolicyVersion  nvarchar(20)
  MarketingOptInAt      datetime2(3) NULL
  FailedLoginCount      tinyint NOT NULL DEFAULT 0
  LockoutEndsAt         datetime2(3) NULL
  LastLoginAt           datetime2(3) NULL
  CreatedAt, UpdatedAt, PublishedAt

MemberRefreshTokens
  Id uniqueidentifier PK, MemberId FK→Members (CASCADE), TokenHash char(64),
  ExpiresAt, RevokedAt NULL, ReplacedByTokenHash char(64) NULL, CreatedAt

MemberTokens                            -- 一表兩用，避免兩張近乎相同的表
  Id uniqueidentifier PK, MemberId FK→Members (CASCADE),
  Purpose tinyint (MemberTokenPurpose),  -- EmailVerification=1 / PasswordReset=2
  TokenHash char(64), ExpiresAt, ConsumedAt datetime2(3) NULL, CreatedAt

BusinessDomainRules                     -- 「Accounts are verified against a business domain」
  Id int PK, Domain nvarchar(255) UNIQUE, Rule tinyint (BusinessDomainRule),
  Note nvarchar(300) NULL, CreatedAt, UpdatedAt, PublishedAt
```

**註冊 → 核准的狀態機**：

```
[提交註冊]
   └─ 查 BusinessDomainRules(EmailDomain)
        ├─ Block                  → 400，訊息「請使用公司信箱」（不建帳號）
        ├─ AutoApprove            → Status = PendingEmailVerification
        └─ ManualReview / 無規則  → Status = PendingEmailVerification
[點驗證信]  EmailVerifiedAt = now
   ├─ 網域 AutoApprove → Status = Approved, ApprovedAt = now
   └─ 否則             → Status = PendingApproval  → 後台審核佇列
[後台核准] Status = Approved   |   [後台拒絕] Status = Rejected + ReviewNote
[違規停權] Status = Suspended
```

只有 `Approved` 能取得 `MemberOnly` 下載並送出樣品申請。

### 14.4 Sample Requests（業務資料，保留）

```
SampleRequests
  Id                    uniqueidentifier PK DEFAULT NEWSEQUENTIALID()
  RequestNumber         nvarchar(24) UNIQUE             -- 'SR-2026-000123'
  MemberId              uniqueidentifier NOT NULL FK→Members
  SourceSampleRequestId uniqueidentifier NULL FK→SampleRequests   -- 「重下同批規格」
  Status                tinyint (SampleRequestStatus)
  ShipToName            nvarchar(160)
  ShipToCompany         nvarchar(200)
  ShipToAddressLine1    nvarchar(200)
  ShipToAddressLine2    nvarchar(200) NULL
  ShipToCity            nvarchar(120)
  ShipToState           nvarchar(120) NULL
  ShipToPostalCode      nvarchar(20)
  ShipToCountryCode     char(2)
  ShipToPhone           nvarchar(40)
  ProjectName           nvarchar(200) NULL
  TargetApplication     nvarchar(500) NULL
  MemberNote            nvarchar(2000) NULL
  InternalNote          nvarchar(max) NULL
  SubmittedAt / ReviewedAt / ApprovedAt / ShippedAt /
  DeliveredAt / CancelledAt / RejectedAt        datetime2(3) NULL
  RejectionReason       nvarchar(600) NULL
  Carrier               nvarchar(80) NULL
  TrackingNumber        nvarchar(80) NULL
  TrackingUrl           nvarchar(512) NULL
  ExternalOrderNumber   nvarchar(64) NULL       -- 預留給未來 ERP 對接
  CreatedAt, UpdatedAt, PublishedAt

SampleRequestItems
  Id                  int PK
  SampleRequestId     uniqueidentifier FK→SampleRequests (CASCADE)
  ProductId           int NULL FK→Products
  CategoryId          int NULL FK→Categories
  GradeCode           nvarchar(64) NULL        -- 'VR-AC 360-A'（產品被 archive 也留得住）
  ProductNameSnapshot nvarchar(200)            -- 送出當下的名稱快照
  RequestedSpec       nvarchar(1000) NULL      -- '±0.05mm die-cut, 6mm port'
  LotSpecReference    nvarchar(128) NULL       -- 實際出貨批號，支援「重下同批規格」
  Quantity            int
  Unit                nvarchar(32)             -- 'sheets' / 'm²' / 'pcs'
  ShippedQuantity     int NULL
  SortOrder
  CreatedAt, UpdatedAt
```

狀態歷程用**每階段一個時間戳**表達，不建 `SampleRequestStatusHistory`（見 [0.7](#07-不留-log)）。

---

## 15 多對多關聯總表

| Join table | 左 | 右 | 額外欄位 | 服務的畫面 |
| --- | --- | --- | --- | --- |
| `ProductSolutions` | Products | Solutions | `SortOrder` | 產品線頁 Where it is used / Solution 頁關聯產品 |
| `SolutionCategories` | Solutions | Categories | `SortOrder` | Solution 索引卡的產品線 chip |
| `ProductImages` | Products | MediaAssets | `SortOrder` | 產品圖庫 |
| `ArticleCategories` | Articles | Categories | — | 文章卡的產品線 chip |
| `ArticleSolutions` | Articles | Solutions | — | 文章卡的產業 chip |
| `ArticleProducts` | Articles | Products | — | 產品頁的相關文章 |
| `ArticleTagLinks` | Articles | ArticleTags | — | 舊站 knowledge / activity |
| `CertificationProducts` | Certifications | Products | — | 產品頁的合規標章 |
| `CertificationCategories` | Certifications | Categories | — | 證書涵蓋的產品線 |
| `DownloadProducts` | Downloads | Products | `SortOrder` | 產品頁 Download spec sheet |
| `DownloadCategories` | Downloads | Categories | `SortOrder` | 產品線頁的規格書 |
| `DownloadSolutions` | Downloads | Solutions | `SortOrder` | Solution 頁下載 |
| `DownloadCertifications` | Downloads | Certifications | — | 證書之外的佐證文件 |
| `DownloadArticles` | Downloads | Articles | — | Insight 文章的報告全文 |
| `UserRoles` | Users | Roles | — | 後台權限 |

PK 一律為兩個外鍵的複合鍵；兩側各建索引（左鍵為 PK 前導，右鍵另建反向索引）。

---

## 16 Enum 總表

### SQL 用 `tinyint`，EF 用 `HasConversion<byte>()`，API 輸出字串

1. `Status`、`Type` 幾乎出現在每個查詢的 WHERE 與複合索引中。`tinyint` 1 byte vs `nvarchar(20)`
   最多 40 bytes，直接影響索引頁密度與掃描成本。
2. 字串 enum 在 SQL 端受定序影響（`'Published'` vs `'published'`），且在 filtered index 的
   `WHERE Status <> 'Archived'` 上容易與 migration 產生的字面量不一致。
3. **可讀性用另一層解決**：所有 DTO 用 `JsonStringEnumConverter` + camelCase 序列化，API 對外一律
   是 `"published"`、`"opticalFilm"`。DB 數字、API 字串，兩者都拿到。

**鐵則：既有數值永不重排，新值一律往後加；刪除的值保留註解為 `-- retired`。**

**例外**：`Culture` 用 `nvarchar(10)`——它同時是複合 PK 的一部分、URL 段、`hreflang` 屬性與
`Accept-Language` 值，用數字會在每一層都需要轉換，且已有 `Cultures` 表提供完整性。
`Redirects.StatusCode` 用 `smallint`——值本身就是 HTTP 語意，不該再包一層。

| Enum | 值 |
| --- | --- |
| `ContentStatus` | Draft=0, Published=1, Archived=2 |
| `CategoryType` | OpticalFilm=1, TextileFoam=2, Acoustic=3 |
| `Culture` | *(字串)* `en`, `zh-Hant` |
| `PageTemplate` | Standard=0, Home=1, About=2, Sustainability=3, Partnership=4, Technologies=5, Contact=6, Legal=7, ResourcesHub=8, ProductsHub=9, SolutionsHub=10, MemberGateway=11 |
| `BlockType` — Content | RichText=0, Hero=1, Gallery=2, FeatureGrid=3, StepList=4, StatBand=5, MediaTextSplit=6, Quote=7, Cta=8, Accordion=9, SpecTable=10, OfferingGrid=11, LogoWall=12 |
| `BlockType` — Reference | CertificationList=100, MilestoneTimeline=101, LocationList=102, TestimonialList=103, ProcessFlowRef=104, FaqList=105, ExhibitionList=106, DownloadList=107, SolutionGrid=108, CategoryGrid=109, ArticleList=110, PartnerBrandWall=111, ProductGrid=112, ContactChannelList=113 |
| `BlockTone` | Dark=0, Light=1 |
| `ArticleType` | CompanyNews=1, ProductNews=2, Exhibition=3, CertificationNews=4, Insight=5, TechnicalArticle=6 |
| `CertificationCategory` | CompanyFactory=1, Sustainability=2, ProductCompliance=3 |
| `ProcessFlowKind` | CoreProcess=1, Manufacturing=2, CoDevelopment=3, OemOdm=4, InquiryFlow=5 |
| `LocationType` | Headquarters=1, Production=2, Sales=3, ResearchAndDevelopment=4 |
| `DownloadKind` | SpecSheet=1, WhitePaper=2, Catalogue=3, ComplianceDocument=4, Certificate=5, TestReport=6, TrendReport=7, Other=99 |
| `DownloadAccessLevel` | Public=0, MemberOnly=1, OnRequest=2 |
| `MediaAssetType` | Image=1, Video=2, Document=3, Other=99 |
| `InquiryType` | General=0, Sales=1, Technical=2, Partnership=3, SampleRequest=4, DocumentRequest=5 |
| `InquiryStatus` | New=0, InProgress=1, Responded=2, Closed=3, Spam=4 |
| `MemberStatus` | PendingEmailVerification=0, PendingApproval=1, Approved=2, Rejected=3, Suspended=4 |
| `MemberJobRole` | EngineeringRnd=1, Procurement=2, ProductManagement=3, Quality=4, Other=99 |
| `MemberTokenPurpose` | EmailVerification=1, PasswordReset=2 |
| `BusinessDomainRule` | ManualReview=0, AutoApprove=1, Block=2 |
| `SampleRequestStatus` | Draft=0, Submitted=1, UnderReview=2, Approved=3, Shipped=4, Delivered=5, Rejected=6, Cancelled=7 |
| `NavigationLocation` | Header=1, Footer=2, FooterLegal=3, Social=4, SearchChip=5 |
| `LinkTargetType` | Internal=0, External=1, Anchor=2, EntityRef=3, ContactModal=4 |
| `SettingValueKind` | Text=0, Html=1, Url=2, Number=3, Boolean=4, Json=5 |
| `RedirectStatusCode` | *(smallint，存真實 HTTP 碼)* 301, 302, 308, 410 |

`Roles.Name` 不做 enum（DB 有 `Roles` 表，值可由 Admin 新增）；JWT claim 用字串。

---

## 17 索引、唯一鍵與 Cascade

### 17.1 Archived slug 重用

採 **filtered unique index，排除 `Archived`**：

```sql
CREATE UNIQUE INDEX UX_Products_Slug ON Products(Slug) WHERE Status <> 2;
```

EF Core：`.HasIndex(p => p.Slug).IsUnique().HasFilter("[Status] <> 2")`

**為什麼不是全域 unique**：軟刪除是我們的刪除方式，全域 unique 會讓「封存 `anti-fog-film` 後
永遠不能再建同名產品」，編輯者只能改名為 `anti-fog-film-2`——這是把資料庫限制洩漏成 URL。

**三個配套，缺一不可**：

1. **路由解析順序寫死「實體 → Redirects → 404」**（[01](#01-路由地圖)）。已封存產品的舊路徑會有
   一筆 Redirect；若 slug 被新實體重用，新實體會先被命中、Redirect 自然失效——這正是我們要的
   行為（新內容取代舊內容）。
2. **Archive 時必寫 Redirect**：目標為父層索引頁（產品 → 產品線頁）；無適當目標時寫 `410`。
3. **Admin 建立／改名時做「含 Archived 的碰撞檢查」並警告（不阻擋）**，訊息：「此 slug 曾被已封存
   的『Anti-Fog Film』使用，繼續會使其 301 失效」。搭配一條**非唯一**全量索引
   `IX_Products_Slug_All ON Products(Slug)` 供此查詢。

### 17.2 索引清單

| 表 | 索引 | 型別 |
| --- | --- | --- |
| 每個 Routable / Addressable base 表 | `(Slug) WHERE Status <> 2` | **UNIQUE filtered** |
| 同上 | `(Slug)` | 非唯一（admin 碰撞檢查） |
| 每個 `*Translations` | PK `({Entity}Id, Culture)` | 叢集 |
| 每個 `*Translations` | `(Culture) INCLUDE (常用文字欄)` | 非叢集 |
| `Cultures` | `(IsDefault) WHERE IsDefault = 1` | UNIQUE filtered |
| `Categories` | `(ParentId, Type, SortOrder)` | 非叢集 |
| `Categories` | `(Type, Status, SortOrder)` | 非叢集 |
| `Products` | `(CategoryId, Status, SortOrder) INCLUDE (Slug, IsFeatured, HeroMediaAssetId)` | covering |
| `Products` | `(ParentProductId, SortOrder)` | 非叢集 |
| `Products` | `(IsFeatured, Status) WHERE IsFeatured = 1` | filtered |
| `Products` | `(LegacySourceKey) WHERE LegacySourceKey IS NOT NULL` | **UNIQUE filtered** |
| `SpecificationRows` | 每個 owner 一條 `(Owner*Id, SortOrder) WHERE Owner*Id IS NOT NULL` | filtered ×3 |
| `Articles` | `(Type, Status, PublishedAt DESC) INCLUDE (Slug, HeroMediaAssetId)` | covering（三個列表頁的主查詢） |
| `Articles` | `(PublishedAt DESC) WHERE Status = 1` | filtered |
| `Articles` | `(ExhibitionId) WHERE ExhibitionId IS NOT NULL` | filtered |
| `Articles` | `(LegacySourceKey) WHERE LegacySourceKey IS NOT NULL` | UNIQUE filtered |
| `Exhibitions` | `(EndDate DESC, StartDate) WHERE Status = 1` | filtered |
| `FaqItems` | `(FaqCategoryId, Status, SortOrder)` | 非叢集 |
| `Downloads` | `(AccessLevel, Kind, Status, SortOrder)` | 非叢集 |
| `Downloads` | `(ValidUntil) WHERE ValidUntil IS NOT NULL` | filtered |
| `Certifications` | `(Category, Status, SortOrder)` | 非叢集 |
| `ContentBlocks` | 每個 owner 一條 `(Owner*Id, SortOrder) WHERE Owner*Id IS NOT NULL` | filtered ×3 |
| `ContentBlocks` | `(OwnerPageId, Anchor) WHERE Anchor IS NOT NULL` | **UNIQUE filtered** |
| `ContentBlockItems` | `(ContentBlockId, SortOrder)` | 非叢集 |
| `NavigationItems` | `(Location, ParentId, SortOrder)` | 非叢集 |
| `Redirects` | `(FromPath)` | **UNIQUE** |
| `Redirects` | `(FromPath) WHERE IsEnabled = 1 INCLUDE (ToPath, StatusCode, TargetCulture)` | covering filtered |
| `MediaAssets` | `(Sha256) WHERE Sha256 IS NOT NULL` | 非唯一（去重提示） |
| `MediaAssets` | `(Container, IsPrivate, IsArchived)` | 非叢集 |
| `Users` | `(UsernameNormalized)` | **UNIQUE** |
| `RefreshTokens` | `(TokenHash)` | **UNIQUE** |
| `RefreshTokens` | `(UserId, ExpiresAt)` | 非叢集 |
| `Members` | `(EmailNormalized)` | **UNIQUE** |
| `Members` | `(Status, CreatedAt DESC)` | 非叢集（後台審核佇列） |
| `Members` | `(EmailDomain)` | 非叢集（網域規則比對／同公司彙整） |
| `MemberRefreshTokens` | `(TokenHash)` | **UNIQUE** |
| `MemberTokens` | `(TokenHash)` | **UNIQUE** |
| `MemberTokens` | `(MemberId, Purpose, ExpiresAt) WHERE ConsumedAt IS NULL` | filtered |
| `BusinessDomainRules` | `(Domain)` | **UNIQUE** |
| `SampleRequests` | `(RequestNumber)` | **UNIQUE** |
| `SampleRequests` | `(MemberId, CreatedAt DESC)` | 非叢集（會員的申請歷史） |
| `SampleRequests` | `(Status, SubmittedAt)` | 非叢集（後台看板） |
| `SampleRequestItems` | `(SampleRequestId, SortOrder)` | 非叢集 |
| `ContactInquiries` | `(ReferenceNumber)` | **UNIQUE** |
| `ContactInquiries` | `(Status, CreatedAt DESC)` | 非叢集 |
| 所有 join tables | PK `(左, 右)` + `(右, 左)` | 兩向 |

### 17.3 Cascade 規則

| 關係 | 行為 |
| --- | --- |
| base → `*Translations` | `CASCADE`（翻譯無獨立生命週期） |
| `ContentBlocks` → `ContentBlockItems` → items 翻譯 | `CASCADE` |
| `ProcessFlows` → `ProcessSteps` | `CASCADE` |
| `SampleRequests` → `SampleRequestItems` | `CASCADE` |
| 任何 → `MediaAssets` | `NO ACTION`（不可因刪圖而刪內容；Admin 刪圖前必須檢查引用） |
| 任何 → `Redirects` | 無 FK（Redirects 用字串路徑，刻意解耦） |
| `Categories.ParentId` self-ref | `NO ACTION`（SQL Server 不允許 self-ref cascade） |
| `Products.ParentProductId` self-ref | `NO ACTION` |
| join tables → 兩側 | `CASCADE` |
| `Members` → `SampleRequests` | `NO ACTION`（會員停權不得連帶刪除業務單據） |
| `Members` → `MemberTokens` / `MemberRefreshTokens` | `CASCADE` |

---

## 18 Seed 與舊站匯入

```bash
dotnet ef migrations add <Name> -p src/Infrastructure -s src/Functions
dotnet ef database update -s src/Functions
```

Migrations 放在 `src/Infrastructure/Migrations`，比照程式碼審查。連線字串來自 configuration /
Key Vault，**永不進版控**。

### 18.1 三層 seeder 分工

| 層 | 機制 | 內容 | 冪等鍵 |
| --- | --- | --- | --- |
| **A. Migration `HasData`** | `modelBuilder.Entity<>().HasData()` | 只放**永不變且無隨機值**的參照資料：`Cultures`、`Roles` | 固定 Id |
| **B. `BootstrapSeeder`** | 應用啟動時執行，可重複執行 | super admin、`Categories`(3)、`Solutions`(7)、`Pages`(11)、`NavigationItems`、`FaqCategories`(6)+`FaqItems`(13)、`Certifications`(9)、`ProcessFlows`+Steps、`Locations`(3)、`ContactChannels`(3)、`BusinessDomainRules`、`SiteSettings` | 自然鍵（`Slug` / `UsernameNormalized` / `Key` / `Domain`），**只 insert 缺的，不覆寫已存在的** |
| **C. `LegacyImportSeeder`** | 一次性 CLI（`dotnet run -- import-legacy`）或 Admin 觸發 | 舊站 ~118 頁內容、`blog_post.csv`、`url_redirects.csv`、`/store/*` 與 `*.html` 的 301、`官網圖片/` 上傳 Blob | `LegacySourceKey`（UNIQUE filtered index）與 `Redirects.FromPath` |

B 層**只補缺、不覆寫**——編輯者改過的內容不能被 seeder 蓋掉。

**為什麼 super admin 不能用 `HasData`**：密碼雜湊含隨機 salt，每次跑
`dotnet ef migrations add` 都會被 diff 成「值變了」而產生假 migration；且 `HasData` 會把雜湊
字面量固定寫進 migration 原始碼。改由 B 層在執行期計算。

### 18.2 Super admin

```
Roles:     Admin, Editor

Users:     Username           = sa@system.local
           UsernameNormalized = SA@SYSTEM.LOCAL
           Email              = NULL
           DisplayName        = System Administrator
           PasswordHash       = PBKDF2-HMAC-SHA256(i=600000, salt=16B CSPRNG) of "Admin@123"
                                → $pbkdf2-sha256$i=600000$<base64(salt)>$<base64(hash)>
           MustChangePassword = 0
           IsActive           = 1
           SecurityStamp      = NEWID()

UserRoles: (sa, Admin)
```

**所有環境一律使用固定密碼 `Admin@123`，不強制首次登入改密碼**（專案決策）。可用環境變數
`VICROUND_SA_INITIAL_PASSWORD` 覆寫；未設定即為 `Admin@123`。

帳號寫在 `BootstrapSeeder.SuperAdminUsername`，**不走設定、也不能用環境變數覆寫**。它是唯一
一個不套 §13 帳號字元集的帳號——`@` 不在允許字元裡，這裡刻意只把它當字串。因此**不要從後台的
「使用者」單元編輯這一列**：儲存時會過 `Usernames.Require`，回 400 格式錯誤。改密碼請走
`POST /api/admin/auth/change-password`。

改這個常數只影響「將來 seed 時寫什麼」，不會改到已存在的列；既有資料庫由
`20260912064518_RenameSuperAdminUsername` 從 `superadmin` 改名過來。若兩者不同步，升級上來的
資料庫與全新 seed 的資料庫會是兩個不同帳號。

> ⚠️ **上線前必須人工更改此密碼。** `Admin@123` 出現在本文件中，等同公開。`MustChangePassword`
> 欄位已保留（`bit NOT NULL DEFAULT 0`），若日後要改為強制首登改密碼，作法是：access token 加
> `mcp: true` claim，`fn-admin` 的 authorization filter 見到此 claim 時只放行
> `auth/change-password`、`auth/logout`、`auth/me`；改密碼成功時同時更新 `PasswordChangedAt`、
> 清 `MustChangePassword`、輪替 `SecurityStamp`、撤銷全部 `RefreshTokens`。

### 18.3 其他 seed 內容

**Categories（3 條產品線）** — 色值取自 CIS 手冊 p.8

| Slug | Type | AccentColorHex | en Name |
| --- | --- | --- | --- |
| `optical-film` | OpticalFilm=1 | `#71d6e0` | Optical Film |
| `textile-foam` | TextileFoam=2 | `#e7004b` | Textile & Foam |
| `acoustic` | Acoustic=3 | `#cfcfcd` | Acoustic |

**Solutions（7）**：`consumer-electronics`、`automotive`、`smart-healthcare`、`renewable-energy`、
`acoustic-solutions`（`IsNew = 1`）、`e-paper`、`sports-eyewear`

**Pages（11，`IsSystemPage = 1`）**：`home`、`products`、`solutions`、`technologies`、`about`、
`sustainability`（`ParentPageId` → about）、`partnership`（→ about）、`resources`、`contact`、
`privacy`、`member`

**NavigationItems** — 依 Sitemap-0819（mockup 已實作的版本）：

```
Header:      Products(→Page products)      ├ Optical Film / Textile & Foam / Acoustic  (EntityRef→Categories)
             Solutions(→Page solutions)    ├ 7 個 EntityRef→Solutions
             Technologies(→Page)           ├ Core Processes(#core-processes) / R&D(#innovation)
                                           │  / Product Compliance(#compliance)
             About Us(→Page about)
             Resources(→Page resources)    ├ News & Exhibitions / FAQ / Insights(#insights)
                                           │  / Downloads(#downloads)
Footer:      About Us, Products, Solutions, Technologies, FAQ, Downloads,
             News & Exhibitions, Contact Us
FooterLegal: Privacy & Legal
Social:      LinkedIn, YouTube            （URL 待客戶提供，見 19.9）
SearchChip:  Anti-glare film / EMI shielding foam / IP67 acoustic mesh /
             ISO 14001 certificate / Spec sheet download
```

**FaqCategories / FaqItems**：從 `faq.dc.html` seed 6 分類 + 13 題（`en` 為 `Published`，
`zh-Hant` 建 `Draft`）。

**Certifications（9）**：`iso-14001`、`bsci`、`iso-9001`(`IsPlaceholder`)、`grs`、
`sustainability-pending`(`IsPlaceholder`)、`iso-22196`、`rohs`、`reach`、`iec-ip`

**ProcessFlows（7 組）**：`core-processes`(4 步)、`co-development`(5 步)、`oem-odm`(3 步)、
`inquiry-flow`(3 步)、`manufacturing-optical-film` / `-textile-foam` / `-acoustic`（各 4 步）

**Locations（3）**：Taichung HQ / Suzhou Production / Bac Ninh Production
**ContactChannels（3）**：`sales` / `engineering` / `partners`

**BusinessDomainRules（`Block` 清單）**：`gmail.com`、`googlemail.com`、`yahoo.com`、
`yahoo.com.tw`、`hotmail.com`、`outlook.com`、`live.com`、`msn.com`、`icloud.com`、`me.com`、
`qq.com`、`163.com`、`126.com`、`sina.com`、`proton.me`、`protonmail.com`、`gmx.com`、`mail.ru`、
`naver.com`、`daum.net` + 常見拋棄式網域。

**Redirects**：`/application` → `/en/solutions`；`/{legacy}.html` → 對照表；`/store/c1/**` 與
`/store/**` → 新產品／分類 URL；`/` → `/en`。

### 18.4 舊站匯入（C 層）

來源：`reference/sbk/data/`（Weebly 匯出）＋ 線上舊站 `https://www.vicround.com/`。

> **2026-09-08 實地清點**：這份匯出比原先假設的少很多，以下為逐檔核對後的事實。
> 匯入器：`src/Infrastructure/Seeding/LegacyImport/LegacyImportSeeder.cs`，
> 執行 `dotnet VicRound.Functions.dll import-legacy`。

| 來源 | 實際內容 | 目標 |
| --- | --- | --- |
| `website-site-*-data.csv` 的 `pages` 區段 | **只有 `id` 與 `title`**（主站 226 頁、次站 97 頁）；`properties` 區段 2000 多列全是版型設定，**含長 HTML 的列數 = 0** | 只能推導舊網址 → `Redirects` |
| 線上站爬取 | 112 個真頁面（104 個 `.html`）；舊站對任何不存在的路徑都回 200＋首頁，沒有 sitemap 也沒有 404 | `Redirects` |
| `blog_post.csv` | **4 篇**，無標題列，三欄為 title / html / `{slug}.html` | `Articles`（`CompanyNews`，以 **Draft** 匯入待編輯確認）；HTML 清掉 `class` / `style` / `<font>` |
| `blog_post_tag.csv` | 3 列（`knowledge` 等） | `ArticleTags` — 尚未接 |
| `url_redirects.csv` | 5 列，格式是 **`類型,路徑`**，不是 from→to 對照 | 併入舊網址清單 |
| `官網圖片/` | 287 個檔（含 1 個 .zip），SHA-256 去重後 **212 張**；內文引用 2863 個檔名，**只有約 10% 在這裡** | Blob `public-media/legacy/*` + `MediaAssets` |
| `form_submissions.csv` + `form_submission_values.csv` | **無法使用**：133 列只有 IP 一欄（第二欄全空），692 個欄位值 **0 個非空**——Weebly 匯出時把內容抽掉了 | 不匯入 |
| `certificates.csv` | **零筆資料**，且欄位是 `id,email,country,organization,ip_address,domains`——這是 **SSL 憑證**紀錄，與產品認證無關 | 不匯入（原對應表寫錯） |

### 18.4.1 舊網址一律 301 到首頁（專案決策，2026-09-08）

舊站網址不做逐頁對照，**全部 301 到 `/en`**。

- 逐條建立 `Redirects` 列（目前 241 條）而不是用萬用規則：新站對真正不存在的網址仍要回 404，
  catch-all 會讓每個打錯的網址都回 200 首頁。
- ⚠️ **SEO 代價**：大量網址集中導向首頁會被 Google 視為 soft-404，舊頁的排名與連結權重不會傳遞。
  緩解方式是日後在後台把重要的幾條改指到對應新頁——改 `Redirects` 那一列即可，不需改程式。

**冪等做法**：`LegacySourceKey` 為鍵（媒體用 `weebly:media:{sha256}`——檔名會超過
`nvarchar(128)`，且以內容雜湊為鍵正好達成去重），已存在則**跳過**，不覆寫。

---

## 19 待客戶確認事項

以下項目不阻擋 schema 定案（欄位皆已預留），但影響上線內容與 301 對照表：

1. **Acoustic 產品線是否此版上線** — CIS 已定義第三色、mockup 有完整產品頁與 4 個 grade，但舊站
   完全沒有可匯入內容。若延後，`CategoryType = Acoustic` 仍先建但 `Status = Draft`。
2. **會員審核負責人與 SLA** — mockup 承諾「one business day」。需確認：負責人、拒絕時是否回信
   告知理由、`BusinessDomainRules` 由誰維護。
3. **樣品申請是否串 email 通知／出貨追蹤誰填／是否接 ERP** — 建議 Phase 1 由後台人工填，
   `SampleRequests.ExternalOrderNumber` 已預留供未來 ERP 對接。
4. **MemberOnly 文件的 private container + SAS** — SWA Free 的內建 CDN 無法對 origin 做認證，
   SAS URL 會繞過 CDN 直打 Blob。需確認可接受；或改用短效 CDN token（需 Front Door，屬後續升級）。
5. **Header 全站搜尋** — 現有規劃文件完全未提及搜尋，但 Header 有搜尋列與 5 個 chip。建議
   Phase 1 用 SQL `LIKE` / `CONTAINS` 搜翻譯表的 Title/Summary，或直接列為 Phase 2
   （FULLTEXT / Azure AI Search 都是新的基礎設施）。
6. **zh-Hant 內容誰產出、缺翻譯時的 fallback 政策** — 建議值見 [0.2](#02-i18n-慣例)，需客戶拍板。
7. **舊站 118 頁的 slug → 新 slug 對照表尚未產出** — 自動對照會產生錯誤 301，直接傷 SEO。建議先
   產出 CSV 給客戶確認再進 seeder。
8. **規格表填到哪一層** — mockup 只有產品線層級的 Common specifications，但會員權益寫「完整
   spec sheets、公差表、測試報告」。`SpecificationRows` 兩層都支援，但編輯工作量差約 10 倍。
9. **Footer 社群連結與 Testimonial 是否具名** — mockup 目前皆為 placeholder；具名需客戶書面授權
   （`Testimonials.AuthorName` 已設 nullable）。
10. **不留下載紀錄的取捨** — 依專案決策不建 `MemberDownloads`；但業務端可能想知道「誰下載了
    EUDR 文件包」以便跟進。若要，加一張 `MemberDownloadGrants`（記錄**授權**而非瀏覽紀錄）
    成本很低。
11. **`Exhibitions` 的「Book a meeting」目的地** — 站內 contact 表單或外部排程工具；
    `MeetingUrl` 已設 nullable，兩者皆可。
12. **Floating Button 的「AI Agent」** — 兩版 Sitemap 都有列但完全未定義，本版不建模。
