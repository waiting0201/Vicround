# Self-built CMS

There is **no third-party CMS** (no Strapi / Sanity / Contentful / Umbraco). The "CMS" is three
of our own layers:

1. **Content model** — our SQL schema (base + `*Translation` tables) in [database.md](database.md).
   This *is* the CMS's content types.
2. **Admin API** — `fn-admin` in Azure Functions (.NET 10), `/api/admin/**`, JWT-protected. See
   [cms-api.md](cms-api.md).
3. **Admin UI** — a self-built Next.js area in the same `web/` app: `app/(admin)/admin/**`,
   server-rendered, **not** indexed (robots `Disallow`), locale-independent (editor UI in one
   language; it edits *both* content locales).

## Admin UI stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js App Router (same app, `(admin)` route group), React + TypeScript |
| UI / styling | shadcn/ui + Tailwind |
| Forms + validation | React Hook Form + Zod |
| Data tables | TanStack Table (sort / paginate / filter) |
| Server state | TanStack Query against the Admin API |
| Rich text | TipTap → stores HTML for product/article/page bodies |
| Media upload | upload widget → `POST /api/admin/media` → Blob Storage → returns CDN/Blob URL |
| Bilingual editing | one edit screen per entity with `en` / `zh-Hant` tabs writing both translation rows |

The admin app talks only to `/api/admin/**`; it never queries SQL directly.

## Authentication — self-built JWT

No Entra ID. `fn-admin` owns identity against `Users` / `Roles` / `RefreshTokens` in SQL
(see [database.md](database.md)).

**Token model**

- **Access token** — short-lived JWT (~15 min). Claims: `sub`, `email`, `role`
  (`Admin`|`Editor`), `iss`, `aud`, `exp`. Signed with a key from Key Vault (HS256 with a
  strong secret, or RS256 with a key pair).
- **Refresh token** — opaque, long-lived, **stored hashed** in `RefreshTokens`; rotated on every
  refresh and revocable (logout / compromise).

**Flow**

```
login    POST /api/admin/auth/login    {email,password}
         → verify password hash (e.g. PBKDF2/Argon2) → issue access + refresh
         → Next.js sets both as httpOnly, Secure, SameSite=Strict cookies
call     every /api/admin/** request carries the access token; fn-admin validates
         signature / iss / aud / exp + role claim, authorizes per endpoint
refresh  POST /api/admin/auth/refresh  → rotate refresh, mint new access
logout   POST /api/admin/auth/logout   → revoke refresh row, clear cookies
```

**Rules**

- Tokens live in **httpOnly cookies** — never in `localStorage` or client-readable JS.
- Authorize by role on the server: `Editor` can author/publish content; `Admin` additionally
  manages users, redirects, and settings.
- The public app (`fn-public`) has **no** auth and no write path — JWT exists only on `fn-admin`.
- JWT signing key, issuer, and audience come from **Key Vault**; rotate the key without code
  changes.
- Rate-limit `auth/login`; lock out / back off on repeated failures.

## Publish → revalidate

On any publish / unpublish / slug change, `fn-admin` calls the Next.js **`revalidateTag`**
webhook (shared secret in Key Vault) for the affected content tags in **both locales**, so SSR
pages pick up fresh data without a redeploy. This is the only coupling from the API back into
the web app — keep it behind the shared secret. See [architecture.md](architecture.md) and
[sitemap.md](sitemap.md).
