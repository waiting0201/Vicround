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
       ┌─────────────────────────────────────│  media / assets   │
       │ Azure Functions API — .NET 10 isolated└──────────────────┘
       │  fn-public /api/v1/**  (anon, read-only)
       │  fn-admin  /api/admin/** (JWT: Admin/Editor)
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

A layered split keeps the two API surfaces and the EF model independent of the Functions host.

```
src/
  Functions/           Azure Functions host (.NET 10 isolated) — HTTP triggers, DI, both surfaces
                       (fn-public + fn-admin can be one project with two trigger groups,
                        or two Function apps sharing Application/Infrastructure)
  Application/         Use-cases, DTOs, validators, mapping, culture resolution
  Domain/              Entities + translation entities, enums, domain rules
  Infrastructure/      EF Core DbContext, migrations, repositories, Blob/email clients
  web/                 Next.js app — public site (app/[locale]/**) + self-built /admin CMS area
tests/
  Functions.Tests/     integration tests against the Functions host
  Application.Tests/    unit tests
docs/                  this folder
```

The admin CMS is a route group inside the Next.js app (e.g. `app/(admin)/admin/**`), auth-
gated and pointed at the Admin API — it is *not* statically generated.

## Request flows

**Public read (SSR + Data Cache).** Request `/{locale}/{slug}` → Next.js SSR reads the locale
from the route, fetches `GET /api/v1/...?culture={locale}` tagged in the Data Cache → Application
layer joins the matching `*Translation` rows → page rendered. Cached data serves subsequent
renders; the Functions API/DB are touched on cache miss or after a publish `revalidateTag`.

**Editor write + publish.** Admin (Next.js, JWT) → `POST/PUT /api/admin/...` with bearer token →
validation → EF Core write in a transaction → on **publish**, the Admin function calls the
Next.js **`revalidateTag` webhook** (shared secret) for the affected tags in **both locales** and
bumps the sitemap `lastmod`. Publishing is a status change (`Draft`→`Published`), not a delete.

**Contact inquiry.** Public `POST /api/v1/contact` (rate-limited + anti-bot) — handled by a
dynamic Next.js server action / route that forwards to the public Function, which persists to
`ContactInquiries` and queues a notification email.

**Contact inquiry.** Public `POST /api/v1/contact` (rate-limited + anti-bot) → persist to
`ContactInquiries` → queue notification email. Never expose inquiry data on the public API.

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
- **Media** — Uploaded via Admin API to Blob Storage; the DB stores the CDN URL + metadata.
  Serve responsive/variant images via the CDN, never proxied through the API.
- **Auth** — Admin API only, **self-built JWT** (no Entra ID). `fn-admin` issues access +
  refresh tokens against `Users`/`Roles` in SQL and validates the bearer on every call;
  role-based (`Admin`, `Editor`). Public API is anonymous; the public Functions app exposes no
  admin trigger. Full flow in [cms.md](cms.md).
- **Observability** — Application Insights for the Functions API + Next.js; structured logging;
  health-check endpoint for platform probes.

## Content model (big picture)

Five content types drive almost everything (full schema in [database.md](database.md)):

1. **Category** — hierarchical; `Type` discriminates Optical Film / Textile & Foam /
   Application trees.
2. **Product** — belongs to a category; carries brand (e.g. FlexCore™), specs, gallery,
   `IsFeatured` (hot-selling).
3. **Application** — industry solution pages (automobile, healthcare, workplace…).
4. **Article** — News center posts.
5. **Page** — editor-managed standalone pages (About, Sustainability, ESG) built from content
   blocks.

Every one of these has per-culture translation rows, an editor-set slug, SEO fields, and a
publish status — that uniformity is what lets the Content API, sitemap, and admin tooling stay
generic.
