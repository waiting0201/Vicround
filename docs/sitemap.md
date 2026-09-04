# Sitemap, URLs & SEO

The current live site is flat and bilingual on one URL (`/about.html`, …). The new site uses
**locale-prefixed clean URLs** — `/en/...` and `/zh-Hant/...`, default locale `en`. Every legacy
path must 301 to its new equivalent, so existing SEO is preserved. The sitemap is generated
from the DB, never hand-edited.

## URL structure

```
/                          → 301 redirect to /en  (or locale-detect, then /{locale})
/{locale}                  home                      locale ∈ en | zh-Hant
/{locale}/about            About             (Page)
/{locale}/sustainability   Sustainability    (Page)
/{locale}/esg/2024         ESG achievement   (Page)
/{locale}/news             News index        (Article list)
/{locale}/news/{slug}      News article      (Article)
/{locale}/contact          Contact form

/{locale}/optical-film                 Optical Film tree   (Category type=OpticalFilm)
/{locale}/optical-film/{slug}          e.g. privacy-screen-filter, anti-fog-film,
                                       anti-glare-film, paper-like-film, flexible-glass,
                                       tempered-glass-screen-protector, antimicrobial-film,
                                       phantom-film, light-control-film, solar-film …

/{locale}/textile-foam                 Textile & Foam tree (Category type=TextileFoam)
/{locale}/textile-foam/{slug}          e.g. craft-gaming (FlexCore™), mouse-pad, acoustic-panels

/{locale}/application                  Application index    (Category type=Application)
/{locale}/application/{slug}           e.g. automobile-film-universal-series,
                                       products-for-health-care, team-workplace,
                                       personal-workplace, curved-privacy-filter …
```

Routing in Next.js App Router: `app/[locale]/(site)/...` with a typed segment per content type
(e.g. `app/[locale]/optical-film/[slug]/page.tsx`). The last segment is the entity `Slug` (see
[database.md](database.md)); pages are server-rendered (SSR) for the locale in the URL. The
`[locale]` segment is validated against the supported set and is the single source of truth for
culture. `generateStaticParams` may be used to warm common routes, but rendering is SSR.

## Legacy redirects

**All legacy flat URLs must 301**, because the move to locale prefixes changes every path:

- `/{anything}.html` → `/en/{mapped-slug}` (the default locale; `hreflang` then points zh-Hant
  users at `/zh-Hant/{mapped-slug}`). The old slug → new slug mapping lives in the `Redirects`
  table, seeded from the legacy sitemap during content import.
- Old `/store/c1/...` and `/store/...` pages (2018–2024) → their new product/category URL.
- Bare `/` and any non-prefixed path → the locale-resolved equivalent.

Served by Next.js — `redirects()` in `next.config` for the static/bulk set, middleware for
DB-driven lookups. Redirected URLs are **excluded** from the sitemap; only canonical
locale URLs are listed.

## Generated `sitemap.xml` (Next.js)

- Emitted by **Next.js** `app/sitemap.ts`, fed by `GET /api/v1/sitemap` (data only — see
  [cms-api.md](cms-api.md)). `robots.txt` comes from `app/robots.ts`. The API returns no XML.
- **Both locale URLs are listed** for every published entity — `/en/...` and `/zh-Hant/...` are
  separate `<url>` entries.
- Each entry carries `lastModified` (entity `UpdatedAt`/`PublishedAt`); add `changeFrequency`
  / `priority` as appropriate.
- **`hreflang` between locales.** Each URL declares `alternates.languages` linking its
  counterpart in the other locale, plus `x-default` → the `en` URL. Canonical is the URL's own
  locale path. This is the clean, unambiguous setup that locale-prefixed routing gives us.
- If the URL count grows past ~50k or for clarity, split into a sitemap index
  (Next.js `generateSitemaps` → `/sitemap/products.xml`, `/sitemap/news.xml`, …).
- `robots.txt` points to the sitemap and must `Disallow` the `/admin` area and any
  preview/draft routes.

## Per-page SEO requirements

Every public route exports Next.js `generateMetadata`, emitting: `<title>`, meta description,
canonical (the current locale URL), `hreflang` alternates (other locale + `x-default`), and
Open Graph/Twitter tags. Product/Article pages add JSON-LD structured data (`Product`,
`Article`). These values come from each entity's translation SEO fields — see
[database.md](database.md).
