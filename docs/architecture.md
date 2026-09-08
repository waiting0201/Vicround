# Architecture

VicRound is a **self-built headless CMS** website: editors manage content through our own
Next.js admin app backed by the Admin Functions API; the public Next.js site consumes the
read-only Content API and **server-renders (SSR)** pages for SEO, hosted on **Azure Static Web
Apps (hybrid Next.js)**. The API is Azure Functions on **.NET 10 (isolated worker)**. SQL
Server is the system of record; Azure Blob Storage holds media. Public routes are **locale-
prefixed** (`/en`, `/zh-Hant`).

```
              ┌──────────────────────────────────────────────┐
   Visitors ─▶│ Azure Static Web Apps (Free) — built-in CDN+TLS│
              │   Next.js (SSR) · routes /[locale]/...         │
              └───────┬──────────────────────────────┬────────┘
   Editors ──────────▶│ (admin area, JWT-gated)       │ <img> src
                      │ HTTPS                          ▼
                      │                       ┌──────────────────┐
                      ▼                       │  Blob Storage     │
       ┌─────────────────────────────────────│  public-media     │
       │ Azure Functions API — .NET 10 isolated│  member-documents │
       │  fn-public /api/v1/**          (anon, read-only)  (private, SAS)
       │  fn-public /api/v1/account/**  (Member JWT, no-store)
       │  fn-admin  /api/admin/**       (Admin JWT: Admin/Editor)
       └───────────────┬─────────────────────────────┘
                       ▼
             ┌───────────────────┐
             │  Azure SQL DB      │
             └───────────────────┘
```

The public Next.js app **server-renders each route per request** (SSR), calling the Content API
for the locale in the URL. Upstream API fetches use the **Next.js Data Cache (tagged per content
path)**, so repeat traffic is served from cache and the Functions API/DB are hit on cache miss or
after a publish-time `revalidateTag`. SWA's Free plan supplies the global CDN + managed TLS;
**Azure Front Door (CDN/WAF) is a later upgrade**, not in the launch footprint.

## Solution layout

三個 API surface 共用一個 Functions 專案，靠 `AppRouter` 的三張路由表分隔；
分層由資料夾與鐵律保證，不靠專案邊界。

> **2026-09-08 決策**：後端形狀改為對齊姊妹專案 NTI 的施工標準
> （`/Users/tim/webapps/NTI/docs/10-backend-design.md`，其範本 `Jabez/Api` 已上線）。
> 原本規劃的四層專案（Domain / Application / Infrastructure / Functions）收斂成**單一 `Api/` 專案**，
> 兩個專案的形狀一致，維護時不必在兩套心智模型間切換。

```
Api/                   Azure Functions（.NET 10 isolated + ASP.NET Core Integration），namespace VicRound.Api
  Functions/           trigger binding，僅此而已 —— RouterFunction 是唯一 HTTP entry point（catch-all）
  Routing/             AppRouter 四個 partial：分派 + 授權
                         .Public.cs   /v1/**          匿名唯讀，列舉式白名單
                         .Account.cs  /v1/account/**  會員 JWT，強制 no-store
                         .Admin.cs    /admin/**       後台 JWT + 權限表（預設拒絕）
  Middleware/          ExceptionMiddleware（worker 層，非 ASP.NET Core middleware）
  Handlers/            一個單元一個；HTTP 解析／驗證／協調／ApiResponse 包裝
  Services/            跨 Handler 的共用服務（JWT／密碼／Blob）
    Dapper/            <Unit>ReadService —— 純讀取
  Models/
    Entities/          EF Core POCO（14 個功能單元的 77 張表）
    Dtos/              一單元一檔
  Data/
    VicRoundDbContext.cs + Configurations/ + Migrations/    ★ schema 權威來源
    Seeding/           B 層 BootstrapSeeder、C 層 ContentImport / LegacyImport
  Common/              ApiResponse / AppException / ErrorCodes / PermissionCodes / Constants
apps/
  web/                 Next.js app — public site only (app/[locale]/**), SSR + SEO/GEO
  admin/               Vite + React SPA — the CMS; builds into apps/web/public/admin, served /admin
tests/
  Api.Tests/           慣例守門測試（EF 模型是否符合 database.md 的全域慣例）+ 單元測試
docs/                  this folder
```

### 分層鐵律

1. **Handler 內禁止直接寫 SQL** —— 讀走 Dapper ReadService，寫走 `VicRoundDbContext`。
2. **ReadService 禁止寫入** —— 任何 INSERT/UPDATE/DELETE 一律 EF Core。
3. **Service 禁止回傳 HTTP** —— 只有 Handler 呼叫 `ApiResponse.Ok(...)` / `Fail(...)`。
4. **Handler 內禁止重複檢查權限碼** —— 授權集中在 `AppRouter`。
5. **禁止引入**：Repository Pattern、AutoMapper、自訂 IoC 容器。
6. **DI 全部手寫在 `Program.cs`**，不用組件掃描 —— 註冊清單本身就是模組清冊。
   碰 `DbContext` / `IDbConnection` 的一律 `Scoped`，沒有例外。

> **與 NTI 的兩處刻意差異**：(1) 密碼雜湊用 PBKDF2 而非 BCrypt —— VicRound 要求零第三方
> 相依以縮短冷啟動（[database.md §14.2](database.md#142-密碼雜湊users-與-members-共用同一格式)）；
> (2) VicRound 有**兩套身分**（後台 + 前台會員），因此 `AppRouter` 驗兩種 audience，
> 而 NTI 只有後台一套。

**前台與後台是兩個獨立的 app，只共用一個網域。** `apps/web` 是公開站，每一條路由都在
`[locale]` 之下、server-render、帶完整 metadata 與 JSON-LD；`apps/admin` 是後台 SPA，
產物落在 `apps/web/public/admin`，由 web 的 `middleware.ts` 把 `/admin/**` 的深層網址
rewrite 回 `index.html`（SPA 自己接路由）。

這樣切的理由有兩個：後台的重量級套件（富文字編輯器、資料表格）不進 Next.js 的 standalone
產物 —— SWA Free 的 250MB 上限是與公開站共用的；而後台完全不需要 SSR、metadata、sitemap
與 hreflang，混在同一棵路由樹裡只會讓「哪些頁面要 SEO」變成每次新增頁面都要重想的問題。
後台以 `robots.txt` 的 `Disallow` 加 `<meta name="robots" content="noindex, nofollow">`
雙重排除索引。

## Request flows

**Public read (SSR + Data Cache).** Request `/{locale}/{slug}` → Next.js SSR reads the locale
from the route, fetches `GET /api/v1/...?culture={locale}` tagged in the Data Cache → Application
layer joins the matching `*Translation` rows → page rendered. Cached data serves subsequent
renders; the Functions API/DB are touched on cache miss or after a publish `revalidateTag`.

**Editor write + publish.** Admin (Next.js, JWT) → `POST/PUT /api/admin/...` with bearer token →
validation → EF Core write in a transaction → on **publish**, the Admin function calls the
Next.js **`revalidateTag` webhook** (shared secret) for the affected tags in **both locales** and
bumps the sitemap `lastmod`. Publishing is a status change (`Draft`→`Published`), not a delete.

**Contact inquiry.** Public `POST /api/v1/contact` (rate-limited + anti-bot) → persist to
`ContactInquiries` → queue notification email. Never expose inquiry data on the public API.

**Member read + member-only download.** `/api/v1/account/**` (Member JWT, `no-store`) → account
handler on `fn-public` with an `IAccountDbContext` limited to the member tables → for a
`MemberOnly` download it verifies `Members.Status = Approved` and mints a **10-minute Blob SAS
URL** against the private `member-documents` container. The public Content API never returns the
real URL of a member-only file.

## Cross-cutting concerns

- **i18n** — Cultures `en` and `zh-Hant`, carried in the URL's `[locale]` segment (default
  `en`). The locale flows into every content query as `?culture=`. UI labels live in Next.js
  message catalogs (e.g. next-intl); *content* lives in translation tables (see
  [database.md](database.md)).
- **SEO** — Public routes are server-rendered (SSR) under `/{locale}`. Each page exports Next.js
  `generateMetadata` emitting `<title>`, meta description, canonical (the locale URL), and
  `hreflang` alternates pointing at the other locale + `x-default`. The sitemap and robots
  rules are generated from the DB (see [sitemap.md](sitemap.md)).
- **Caching** — Layered: SWA built-in CDN → Next.js Data Cache (tagged per content path) → EF
  no-tracking reads on miss. Content is mostly static, so cache the API data aggressively and
  `revalidateTag` on publish. (Front Door is a later upgrade for WAF + edge cache purge.)
  **`/api/v1/account/**` is exempt** — always `Cache-Control: no-store`, never entered into the
  Data Cache and never given a revalidate tag.
- **Media** — Uploaded via Admin API to Blob Storage; the DB stores the CDN URL + metadata.
  Serve responsive/variant images via the CDN, never proxied through the API. **Two containers**:
  `public-media` (public read, CDN URL stored in `MediaAssets.Url`) and `member-documents`
  (private, `IsPrivate = 1`, `Url` is `NULL` — only reachable through a short-lived SAS minted by
  the Account API). Binaries never live in SQL.
- **Auth** — **Two independent self-built JWT identities** (no Entra ID), never mixed:
  *Admin* (`fn-admin`, `Users`/`Roles`/`RefreshTokens`, roles `Admin`/`Editor`, 15-min access
  token) and *Member* (`fn-public` account route group, `Members`/`MemberRefreshTokens`, 30-min
  access token). Different issuer, audience, signing key and cookie — a token from one surface is
  always `401` on the other. The public Content API stays anonymous and the public Functions app
  exposes no admin trigger and no content write path. Full flow in [cms.md](cms.md) and
  [database.md §14](database.md#14-前台會員members).
- **Observability** — Application Insights for the Functions API + Next.js; structured logging;
  health-check endpoint for platform probes.

## Content model (feature modules)

內容模型以 **14 個功能單元**組織（完整 schema 見 [database.md](database.md)），而非早期的五個
內容型別。以下為 big picture：

| 功能單元 | 核心實體 | 服務的頁面 |
| --- | --- | --- |
| 產品目錄 | `Categories`（三條產品線）、`Products`、`SpecificationRows` | Products hub、三個產品線頁 |
| 產業解決方案 | `Solutions`（7 個產業） | Solutions hub + 7 個 solution 頁 |
| 技術與製程 | `ProcessFlows` / `ProcessSteps` | Technologies、產品線頁的 How it is made |
| 資源中心 | `Articles`（`Type` 分 News/Insight/Blog）、`Exhibitions`、`FaqItems` | Resources、News、FAQ |
| 下載中心 | `Downloads`（三級 `AccessLevel`） | Downloads、產品頁、會員區 |
| 永續與認證 | `Certifications` | Sustainability、About、Technologies、CertificationDialog |
| 合作夥伴與公司 | `Milestones`、`Locations`、`Testimonials`、`PartnerBrands`、`ContactChannels` | About、Partnership、Contact、Homepage |
| 頁面與版塊 | `Pages`、`ContentBlocks`、`ContentBlockItems` | 所有敘事型頁面 |
| 導覽與 SEO | `NavigationItems`、`Redirects`、`SiteSettings` | Header、Footer、sitemap、301 |
| 媒體資產 | `MediaAssets` | 全站 |
| 詢問與名單 | `ContactInquiries` | Contact 表單、Header contact drawer |
| 後台身分 | `Users`、`Roles`、`RefreshTokens` | `/admin` |
| 前台會員 | `Members`、`SampleRequests`、`BusinessDomainRules` | `/member`、`/account/**` |
| Seed 與匯入 | `Cultures` + 三層 seeder | 上線內容與舊站 301 |

**三條產品線**：Optical Film、Textile & Foam、**Acoustic**（CIS 手冊 p.8 已定義第三色）。
原 `Application` 已收斂為 `Solutions`，`Categories.Type` 不再有 Application 值。

每個 Routable 實體都有 per-culture 翻譯列、編輯者設定的 slug、SEO 欄位與發佈狀態 —— 這份一致性
正是 Content API、sitemap 與後台工具能保持通用的原因。三種表分類（Routable / Addressable /
Embedded）與「強型別表 vs content block」的判準見
[database.md §0.1](database.md#01-三種表分類先分類再套慣例) 與
[§09](database.md#09-頁面與版塊)。
