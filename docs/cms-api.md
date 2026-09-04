# CMS API

Azure Functions, **.NET 10 isolated worker**, HTTP-triggered. Two strictly separated surfaces —
ideally two Function apps (`fn-public`, `fn-admin`) sharing the `Application`/`Infrastructure`
projects, so the public app physically has no admin/write trigger.

| | Public Content API | Admin API |
| --- | --- | --- |
| Function app | `fn-public` | `fn-admin` |
| Base path | `/api/v1` | `/api/admin` |
| Auth | Anonymous (Function `authLevel` anonymous) | self-built **JWT bearer**, roles `Admin`/`Editor` |
| Access | Read-only | Full CRUD + publish/media |
| Caching | SSR output CDN-cached by tag | No cache |
| Returns | Published content only | All statuses (Draft/Published/Archived) |
| Culture | `?culture={locale}` from the URL segment (default `en`) | Per-translation, explicit |

Each endpoint is an HTTP-triggered function; route templates give the paths below. Versioned
(`v1`) so the Next.js client can pin a contract. JSON only. `camelCase`. Errors use RFC 7807
`application/problem+json`. Keep functions thin — call into the `Application` layer.

## Content API (public, read-only)

All responses contain only the requested culture's text, the entity's slug, and SEO fields.
Pass `?culture=zh-Hant` (or `en`) — Next.js derives it from the `[locale]` URL segment.
`Accept-Language` is only a fallback when the param is absent (default `en`).

```
GET  /api/v1/navigation                      # menu tree for header/footer
GET  /api/v1/categories                       # full category tree (?type=optical-film|textile-foam|application)
GET  /api/v1/categories/{slug}

GET  /api/v1/products                          # ?category={slug}&featured=true&page=1&pageSize=24
GET  /api/v1/products/{slug}                    # detail incl. specs + gallery

GET  /api/v1/applications                       # industry solution pages
GET  /api/v1/applications/{slug}

GET  /api/v1/news                               # ?page=1&pageSize=12  (published, newest first)
GET  /api/v1/news/{slug}

GET  /api/v1/pages/{slug}                        # About / Sustainability / ESG content blocks

POST /api/v1/contact                             # inquiry form (rate-limited, anti-bot)

GET  /api/v1/sitemap                              # flat list of published URLs + lastmod (data only)
```

`sitemap.xml` and `robots.txt` are emitted by **Next.js** (`app/sitemap.ts`, `app/robots.ts`)
from this `/api/v1/sitemap` data — not hand-built XML in the API. See [sitemap.md](sitemap.md).

**Listing response shape** (paged):

```json
{
  "items": [ { "slug": "privacy-screen-filter", "name": "Privacy Screen Filter",
               "summary": "...", "heroImageUrl": "https://cdn.../...jpg", "isFeatured": true } ],
  "page": 1, "pageSize": 24, "total": 37
}
```

**Product detail** carries `name`, `summary`, `description` (HTML), `brand`, `specifications`
(ordered key/value list), `gallery` (CDN URLs), `category` (slug+name), and `seo`
(`title`, `description`, `canonicalUrl`, `alternates` for hreflang).

**Contact** request: `{ name, email, company?, phone?, message, sourceUrl }`. Validate
server-side, rate-limit by IP, verify anti-bot token, then persist + queue email. Respond
`202 Accepted` with no inquiry echo.

## Admin API (authenticated CRUD)

Mirror the content types; operate on **all** translations and statuses. Editors create a base
entity then add per-culture translations.

**Auth (self-built JWT):**

```
POST   /api/admin/auth/login             # {email,password} -> {accessToken (~15m), refreshToken}
POST   /api/admin/auth/refresh           # rotate refresh -> new access token
POST   /api/admin/auth/logout            # revoke refresh token
```

All other `/api/admin/**` calls require `Authorization: Bearer <accessToken>`; `fn-admin`
validates signature/issuer/audience/expiry and the role claim. The Next.js admin stores tokens
in **httpOnly cookies** and never exposes them to client JS. See [cms.md](cms.md).

```
GET    /api/admin/{type}                 # type ∈ categories|products|applications|articles|pages
POST   /api/admin/{type}
GET    /api/admin/{type}/{id}
PUT    /api/admin/{type}/{id}
DELETE /api/admin/{type}/{id}            # soft-delete / archive

PUT    /api/admin/{type}/{id}/translations/{culture}   # upsert one culture's content
POST   /api/admin/{type}/{id}/publish                  # Draft -> Published (purges cache, bumps sitemap)
POST   /api/admin/{type}/{id}/unpublish

POST   /api/admin/media                  # multipart upload -> Blob Storage, returns CDN url
GET    /api/admin/contact-inquiries      # triage form submissions
POST   /api/admin/redirects              # manage 301s when a slug changes
```

On publish/unpublish/slug-change the admin function calls the Next.js **`revalidateTag` webhook**
(shared secret) for the affected tags in **both locales** (`en` + `zh-Hant`), so the next request
re-renders fresh content immediately.

## Conventions

- **Slugs, not ids, in public URLs.** The public API looks up by slug; ids are internal only.
- **Publish revalidates.** Any publish/unpublish/slug change calls `revalidateTag` for the
  matching tags (both locales) and updates sitemap `lastmod`. Don't add write paths that skip this.
- **Validation lives in the Application layer** (FluentValidation or similar), shared shape
  enforced before EF writes. Controllers stay thin.
- **DTOs are per-surface.** Never return EF entities directly; never reuse an admin DTO on the
  public API (it would leak drafts/internal fields).
- **Pagination is mandatory** on every collection endpoint; default `pageSize` capped (e.g. 50).
- **OpenAPI** is generated and is the source of truth for the Next.js client; regenerate the
  typed TS client when the contract changes.
