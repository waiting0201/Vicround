# Database (SQL Server)

Azure SQL Database. EF Core code-first on **.NET 10**; the model + `DbContext` live in
`Infrastructure` and are shared by both Function apps. **Migrations are the only way to change
schema.**

## The i18n pattern (read this first)

Every content entity is split into a **base table** (culture-neutral: ids, slug, status,
ordering, relations) and a **`*Translation` table** (one row per culture: `en`, `zh-Hant`).
This avoids duplicated rows, lets a slug/relation change once, and keeps "is this published"
separate from "is this translated yet."

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

Common columns on every base table: `Id`, `Slug` (unique), `Status`
(`Draft|Published|Archived`), `SortOrder`, `CreatedAt`, `UpdatedAt`, `PublishedAt`.
Common columns on every translation table: `{Entity}Id`, `Culture`, the localized text fields,
and SEO fields. PK is `({Entity}Id, Culture)`.

## Tables

**Content**

| Base | Translation | Notes |
| --- | --- | --- |
| `Categories` | `CategoryTranslations` | self-referencing `ParentId`; `Type` enum = OpticalFilm/TextileFoam/Application |
| `Products` | `ProductTranslations` | `CategoryId`, `Brand`, `IsFeatured` (hot-selling) |
| `ProductSpecifications` | `ProductSpecificationTranslations` | ordered key/value spec rows per product |
| `Applications` | `ApplicationTranslations` | industry solution pages; optional `Industry` tag |
| `Articles` | `ArticleTranslations` | News center; `PublishedAt` drives ordering |
| `Pages` | `PageTranslations` | About/Sustainability/ESG; `Template` selects layout |
| `PageBlocks` | `PageBlockTranslations` | flexible content blocks (hero/richtext/gallery) ordered within a page |

**Media & relations**

| Table | Purpose |
| --- | --- |
| `MediaAssets` | Blob/CDN url, alt text (localized via `MediaAssetTranslations`), type, dimensions |
| `ProductImages` | join `ProductId` ↔ `MediaAssetId` + `SortOrder` (gallery) |

**Operational**

| Table | Purpose |
| --- | --- |
| `ContactInquiries` | form submissions: Name, Email, Company, Phone, Message, SourceUrl, Status, CreatedAt |
| `Redirects` | `FromPath` → `ToPath`, `StatusCode` (301); covers all legacy flat `*.html` and `/store/*` URLs → new `/{locale}/...` paths |
| `NavigationItems` | header/footer menu tree (label localized, links to slug or external url) |
| `Users` / `Roles` | self-built CMS identity for **JWT** auth: email, password hash, role; `RefreshTokens` table for rotation/revocation |

## Conventions

- **Slug is unique and editor-owned.** Changing a product/page slug must insert a `Redirects`
  row (301) in the same transaction — see [sitemap.md](sitemap.md).
- **Status gates visibility.** Public API filters `Status = Published` (+ `PublishedAt <= now`
  for Articles). Admin sees everything.
- **No binaries in SQL.** `MediaAssets` stores the Blob/CDN URL + metadata only.
- **Soft-delete** content (set `Archived`) rather than hard-delete — preserves URLs/redirects.
- **Cascade carefully:** deleting a base row cascades its translations; it must NOT silently
  orphan redirects or media.
- **Indexes:** unique on each base `Slug`; index `ProductTranslations(Culture)`,
  `Articles(PublishedAt)`, `Categories(ParentId, Type)`, `Redirects(FromPath)`.

## Migrations & seeding

```bash
dotnet ef migrations add <Name> -p src/Infrastructure -s src/Functions
dotnet ef database update -s src/Functions
```

- Migrations live in `src/Infrastructure/Migrations` and are reviewed like code.
- A **data-migration seeder** imports the existing live content (the ~118 pages from the
  current site + their `/store/*` → new-path redirects) so the new site launches with parity
  and no lost SEO. Keep the seeder idempotent.
- Connection string from configuration/Key Vault — never committed.
