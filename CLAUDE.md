# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication

- **一律使用繁體中文回應。** 無論使用者用什麼語言提問，Claude Code 在本專案中的所有回覆都必須使用繁體中文（程式碼、指令、檔案路徑、專有名詞等可保留原文）。

## Project

VicRound (盈絲實業有限公司) corporate + product-catalog website rebuild. VicRound is a
materials manufacturer with three product lines — **Optical Film**, **Textile & Foam** and
**Acoustic** — plus industry **Solution** pages (7 industries; the entity formerly called
*Application*), a **Technologies** section, a **Resources** hub (News & Exhibitions, Insights,
Technical articles, FAQ, Downloads), ESG/sustainability + certifications, **Partnership**, and a
gated **member area** for spec sheets and sample requests. The public site is bilingual
(English `en`, Traditional Chinese `zh-Hant`) and SEO-critical (~118 indexed pages today).
Content is editor-managed through a headless CMS.

> Information architecture follows **Sitemap-0819**, i.e. the version implemented in
> `mockup/Rounded Design/` (32 pages).

> Status: greenfield. This repo currently holds planning docs only — no application code yet.
> Build the solution to match the architecture in [docs/](docs/) before writing features.

## Stack

- **Backend / CMS API** — **Azure Functions (.NET 10 isolated worker, C#)**, HTTP-triggered;
  EF Core + SQL Server
- **Frontend** — **Next.js (App Router, React/TypeScript)**, **SSR** for SEO, **locale-prefixed
  routing** (`/en`, `/zh-Hant`, default `en`)
- **CMS** — **self-built** admin app: a **Vite + React SPA** (`apps/admin`) built into
  `apps/web/public/admin` and served at `/admin` on the same origin, calling the Admin Functions
  API; no third-party/headless CMS product. It is deliberately *not* part of the Next.js route
  tree — the front-of-site bundle carries none of the editor's weight, and the admin carries no
  SEO machinery (2026-09-06 決定，作法對齊 EuniceMed)
- **Database** — Azure SQL Database (SQL Server)
- **Auth** — self-built **JWT** (access + refresh); two fully separate identities: Admin API
  (`Users`, roles `Admin`/`Editor`) and front-of-site members (`Members`, `/api/v1/account/**`)
- **Hosting** — Azure (Functions for the API, **Azure Static Web Apps — Free plan** hybrid-
  Next.js for the site, Blob Storage). SWA Free runs SSR on its managed backend and provides the
  built-in CDN + TLS. Caveats: hybrid Next.js is **Preview**, 250 MB app cap → build with
  `output: 'standalone'`. Azure Front Door / WAF is a **later upgrade**. See
  [docs/azure-deployment.md](docs/azure-deployment.md).

## Documentation index (the "檢索" / retrieval map)

Read the relevant doc before touching a subsystem — these capture the cross-cutting design
that no single source file makes obvious.

| Doc | Read it when |
| --- | --- |
| [STATUS.md](STATUS.md) | 想知道**做到哪裡了**（各子系統狀態、擋住的事項、下一步順序） |
| [docs/architecture.md](docs/architecture.md) | Understanding overall layout, projects, request flow, i18n & caching strategy |
| [docs/cms-api.md](docs/cms-api.md) | Adding/changing API endpoints — public Content API, member Account API, authenticated Admin API |
| [docs/cms.md](docs/cms.md) | The self-built CMS — admin UI stack, JWT auth flow, publish→revalidate |
| [docs/database.md](docs/database.md) | Schema（依 14 個功能單元分章）, the translation-table i18n pattern, migrations, seeding, super-admin seed |
| [docs/sitemap.md](docs/sitemap.md) | URL/route map, dynamic `sitemap.xml`, hreflang, JSON-LD, legacy `/store/*` + `/application` redirects |
| [docs/azure-deployment.md](docs/azure-deployment.md) | Provisioning, CI/CD, environments, secrets, scaling |

## Conventions (the "規範" / standards)

These are project-specific decisions a future instance can't infer from the code alone.

- **Three API surfaces, never mixed.** Public Content API (`/api/v1/**`) is read-only,
  anonymous, and cacheable. Account API (`/api/v1/account/**`) is member-authenticated and writes
  only member-owned rows (`no-store`, never cached). Admin API (`/api/admin/**`) is authenticated
  CRUD for editors. Separate DTOs and validation throughout — the public app has **no content
  write path** at all.
- **The CMS is ours.** The admin UI is a self-built Next.js area calling the Admin Functions
  API; don't pull in a third-party CMS. Content modeling lives in our SQL schema. See
  [docs/cms.md](docs/cms.md) for the CMS stack and JWT auth flow.
- **i18n via translation tables, not duplicated rows.** Every content entity has a base row
  + an `*Translation` row per culture (see [docs/database.md](docs/database.md)). Culture comes
  from the URL's `[locale]` segment — `Accept-Language` is only a fallback when no locale is in
  the path (default `en`). Never hard-code UI strings or content in source.
- **URLs are content, not derived.** Each entity carries an editor-set `Slug`; public paths are
  `/{locale}/{slug}` (locale ∈ `en`, `zh-Hant`). Changing a slug — or a legacy `.html`/`store`
  URL — must resolve via a 301 in the `Redirects` table; never silently break an indexed URL.
- **Locale lives in the URL.** Every public route is under a `[locale]` segment; the locale
  segment is the source of truth for culture (not `Accept-Language`). Root `/` redirects to the
  default locale. Each page links its other-locale counterpart via `hreflang`.
- **SEO is a feature, not an afterthought.** Every public page exposes title/description/
  canonical/hreflang via Next.js Metadata. Public routes are **server-rendered (SSR)** so
  crawlers get fully-rendered HTML. Upstream API fetches use the Next.js **Data Cache with
  tags**; on publish the Admin API calls a Next.js `revalidateTag` webhook (both locales) so
  content refreshes without hitting the DB on every request. The sitemap is generated from the
  DB, not hand-maintained.
- **Members are not CMS users.** The front-of-site member system (`Members`, `SampleRequests`)
  is fully isolated from the admin identity (`Users`, `Roles`): separate tables, separate JWT
  issuer/audience/signing key/cookie. A token from one surface is always `401` on the other. The
  Account API (`/api/v1/account/**`) lives on `fn-public` but can only touch the member tables —
  it has no content write path. See [docs/database.md](docs/database.md) §14.
- **No audit tables.** We keep business data (inquiries, sample requests and their per-stage
  timestamps) but build no `AuditLogs` / `ContentVersions` / `LoginAttempts` / download-history
  tables. Every table still carries `CreatedAt` / `UpdatedAt` / `PublishedAt`.
- **Strongly-typed table vs content block** is a judgement call with three written criteria
  (cross-page reuse, queryable/structured-data, own lifecycle) — see
  [docs/database.md](docs/database.md) §09. Don't add a table or a block type without checking them.
- **設計 token 的真相來源是 mockup。** 客戶已確認 `mockup/Rounded Design/` 的視覺，其
  `_ds/` 設計系統由 `pnpm sync:tokens` 逐字複製進 `apps/web/app/ds/` 與 `apps/admin/src/ds/`；
  要改視覺就改 mockup 再同步，不要直接改 app 裡的副本。根目錄 `design-system/tokens.css` 是更早
  的 CIS 推導版（另一套命名與色值），只作溯源，**不可**拿來接程式。前台全站為深色底（#0a0a12）。
- **Media lives in Blob Storage**, referenced by URL in the DB — never store binaries in SQL.
  Two containers: `public-media` (CDN URL) and `member-documents` (private, SAS-only).
- **Migrations are the only way to change schema.** Add an EF Core migration; never edit the
  DB by hand or check in ad-hoc ALTER scripts.

## Common commands

> Commands below are the intended workflow once the solution is scaffolded; adjust paths to
> the actual project names when they exist.

```bash
# API — Azure Functions (.NET 10 isolated), from src/Functions
dotnet build
func start                                   # run Functions host locally (Core Tools)
dotnet test                                  # run all tests
dotnet test --filter "FullyQualifiedName~ProductServiceTests.GetBySlug"   # single test
dotnet ef migrations add <Name> -p ../Infrastructure -s .   # add migration
dotnet ef database update                    # apply migrations

# Frontend — Next.js, from src/web
npm install
npm run dev                                  # dev server
npm run build                                # production build — must emit `output: 'standalone'` (SWA Free 250MB cap)
npm run start                                # serve production build
npm run lint
npm test                                     # unit tests (Jest/Vitest)
npm test -- product.service                  # single test file
```

## 前台頁面現況（2026-09-06）

**客戶確認稿的 25 個頁面已全數實作**（版型、色彩、字級、間距逐項對照
`mockup/Rounded Design/`），對應 `apps/web` 的 19 條路由檔。另有 6 條路由仍是鷹架，
因為**確認稿裡沒有對應頁**：

- `/{locale}/products/{category}/{slug}` 產品詳情 —— 確認稿只做到三個產品線頁
- `/{locale}/account/**`（5 條）會員專區 —— 確認稿只做到 `/member` 登入註冊入口

進度明細見 [STATUS.md](STATUS.md)。

版面文案暫存在 `apps/web/content/*.ts`：**英文逐字取自確認稿、繁中是暫譯（待客戶校稿）**。
接上 Content API 之後整個 `content/` 目錄刪除，版型元件不動。
`node scripts/check-content-language.mjs` 會擋掉輸入法誤植與英文欄位混入中文。
