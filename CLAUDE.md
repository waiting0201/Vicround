# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication

- **一律使用繁體中文回應。** 無論使用者用什麼語言提問，Claude Code 在本專案中的所有回覆都必須使用繁體中文（程式碼、指令、檔案路徑、專有名詞等可保留原文）。

## Project

VicRound (盈絲實業有限公司) corporate + product-catalog website rebuild. VicRound is a
materials manufacturer with two product lines — **Optical Film** and **Textile & Foam** —
plus industry **Application** case pages, **News**, and ESG/sustainability content. The
public site is bilingual (English `en`, Traditional Chinese `zh-Hant`) and SEO-critical
(~118 indexed pages today). Content is editor-managed through a headless CMS.

> Status: greenfield. This repo currently holds planning docs only — no application code yet.
> Build the solution to match the architecture in [docs/](docs/) before writing features.

## Stack

- **Backend / CMS API** — **Azure Functions (.NET 10 isolated worker, C#)**, HTTP-triggered;
  EF Core + SQL Server
- **Frontend** — **Next.js (App Router, React/TypeScript)**, **SSR** for SEO, **locale-prefixed
  routing** (`/en`, `/zh-Hant`, default `en`)
- **CMS** — **self-built** admin app (Next.js admin area) on top of the Admin Functions API;
  no third-party/headless CMS product
- **Database** — Azure SQL Database (SQL Server)
- **Auth** — self-built **JWT** (access + refresh) issued by the Admin API; roles `Admin`/`Editor`
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
| [docs/architecture.md](docs/architecture.md) | Understanding overall layout, projects, request flow, i18n & caching strategy |
| [docs/cms-api.md](docs/cms-api.md) | Adding/changing API endpoints — public Content API vs. authenticated Admin API |
| [docs/cms.md](docs/cms.md) | The self-built CMS — admin UI stack, JWT auth flow, publish→revalidate |
| [docs/database.md](docs/database.md) | Schema, the translation-table i18n pattern, migrations, seeding |
| [docs/sitemap.md](docs/sitemap.md) | URL/route map, dynamic `sitemap.xml`, hreflang, legacy `/store/*` redirects |
| [docs/azure-deployment.md](docs/azure-deployment.md) | Provisioning, CI/CD, environments, secrets, scaling |

## Conventions (the "規範" / standards)

These are project-specific decisions a future instance can't infer from the code alone.

- **Two API surfaces, never mixed.** Public Content API (`/api/v1/**`) is read-only,
  anonymous, and cacheable. Admin API (`/api/admin/**`) is authenticated CRUD for editors.
  They are separate Function apps/triggers with separate DTOs and validation — the public app
  has no write path at all.
- **The CMS is ours.** The admin UI is a self-built Next.js area calling the Admin Functions
  API; don't pull in a third-party CMS. Content modeling lives in our SQL schema. See
  [docs/cms.md](docs/cms.md) for the CMS stack and JWT auth flow.
- **i18n via translation tables, not duplicated rows.** Every content entity has a base row
  + an `*Translation` row per culture (see [docs/database.md](docs/database.md)). Resolve
  culture from the `Accept-Language` header (fallback `en`). Never hard-code UI strings or
  content in source.
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
- **Media lives in Blob Storage**, referenced by URL in the DB — never store binaries in SQL.
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
