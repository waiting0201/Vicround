# Sitemap, URLs & SEO

The current live site is flat and bilingual on one URL (`/about.html`, …). The new site uses
**locale-prefixed clean URLs** — `/en/...` and `/zh-Hant/...`, default locale `en`. Every legacy
path must 301 to its new equivalent, so existing SEO is preserved. The sitemap is generated
from the DB, never hand-edited.

資訊架構依 **Sitemap-0819**（即 `mockup/Rounded Design/` 已實作的版本）：Technologies 為一級，
News 歸 Resources，Sustainability / Partnership 歸 About Us。

## URL structure

```
/                          → 301 redirect to /en  (or locale-detect, then /{locale})
/{locale}                  home                            locale ∈ en | zh-Hant

/{locale}/products                     Products hub        (Page)
/{locale}/products/{category}          產品線              (Category type=OpticalFilm|TextileFoam|Acoustic)
/{locale}/products/{category}/{slug}   產品                (Product)
                                       e.g. privacy-screen-filter, anti-fog-film, anti-glare-film,
                                       paper-like-film, flexible-glass, antimicrobial-film,
                                       craft-gaming (FlexCore™), mouse-pad, acoustic-panels …

/{locale}/solutions                    Solutions index     (Page)
/{locale}/solutions/{slug}             產業解決方案        (Solution)
                                       consumer-electronics, automotive, smart-healthcare,
                                       renewable-energy, acoustic-solutions, e-paper, sports-eyewear

/{locale}/technologies                 Technologies        (Page + ProcessFlows + Certifications)
/{locale}/about                        About Us            (Page)
/{locale}/sustainability               Sustainability      (Page, ParentPageId → about)
/{locale}/partnership                  Partnership         (Page, ParentPageId → about)

/{locale}/resources                    Resources hub       (Page)
/{locale}/resources/faq                FAQ                 (Page + FaqItems)
/{locale}/resources/downloads          技術規格下載        (Page + Downloads)
/{locale}/news                         News & Exhibitions  (Article list)
/{locale}/news/{slug}                  新聞／展會          (Article, Type ∈ CompanyNews|ProductNews|
                                                            Exhibition|CertificationNews)
/{locale}/insights/{slug}              產業洞察／趨勢報告  (Article, Type = Insight)
/{locale}/blog/{slug}                  技術文章            (Article, Type = TechnicalArticle)

/{locale}/contact                      Contact form        (Page)
/{locale}/privacy                      Privacy & Legal     (Page)
/{locale}/member                       會員登入／註冊      (Page)
/{locale}/member/forgot                忘記密碼            noindex
/{locale}/member/verify?token=         驗證信落地頁        noindex（信裡的連結）
/{locale}/member/reset?token=          重設密碼落地頁      noindex（信裡的連結）
/{locale}/search?q=                    站內搜尋結果        noindex
/{locale}/account/**                   會員專區            noindex
/admin/**                              後台 CMS            noindex
```

Routing in Next.js App Router: `app/[locale]/(site)/...` with a typed segment per content type
(e.g. `app/[locale]/products/[category]/[slug]/page.tsx`). The last segment is the entity `Slug`
(see [database.md](database.md)); pages are server-rendered (SSR) for the locale in the URL. The
`[locale]` segment is validated against the supported set and is the single source of truth for
culture. `generateStaticParams` may be used to warm common routes, but rendering is SSR.

**路由解析順序（寫死，不可調換）**：`實體查詢 → 找不到才查 Redirects → 都沒有才 404`。這是
被刪除內容的舊路徑留下 410、而 slug 又能被新內容重用的前提 —— 見
[database.md §17.1](database.md#171-slug-唯一性)。

Slug 只在自己的表內唯一，跨型別由固定前綴保證不衝突。保留字 slug 清單見
[database.md §01](database.md#01-路由地圖)。

## Legacy redirects

**All legacy flat URLs must 301**, because the move to locale prefixes changes every path:

- `/{anything}.html` → `/en/{mapped-slug}` (the default locale; `hreflang` then points zh-Hant
  users at `/zh-Hant/{mapped-slug}`). The old slug → new slug mapping lives in the `Redirects`
  table, seeded from the legacy sitemap during content import.
- Old `/store/c1/...` and `/store/...` pages (2018–2024) → their new product/category URL.
- **`/application` → `/en/solutions`；`/application/{oldSlug}` → `/en/solutions/{newSlug}`**
  （逐筆）。原 `Applications` 已收斂為 `Solutions`，見
  [database.md §03](database.md#03-產業解決方案)。
- 產品路徑改為三段（`/products/{category}/{product}`），舊的
  `/optical-film/{slug}`、`/textile-foam/{slug}` 若曾對外曝光亦須 301。
- Bare `/` and any non-prefixed path → the locale-resolved equivalent.

Served by Next.js — `redirects()` in `next.config` for the static/bulk set, middleware for
DB-driven lookups. Redirected URLs are **excluded** from the sitemap; only canonical
locale URLs are listed.

**三種變更都等同 URL 變更，必須在同一 transaction 內寫入 301**（見
[database.md §0.5](database.md#05-slug-是內容不是衍生值)）：

1. 任何 Routable 實體的 `Slug` 變更
2. 刪除 Routable 實體（一律寫 `410 Gone`）
3. **`Articles.Type` 變更** —— `Type` 決定 URL 前綴（`/news` vs `/insights` vs `/blog`）

`Redirects` 不得產生鏈或環：新增 `A→B` 時若已存在 `B→C`，直接寫 `A→C` 並重寫既有指向 A 的列。

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
  翻譯缺漏時**不宣告該語系的 hreflang**（fallback 政策見
  [database.md §0.2](database.md#02-i18n-慣例)）。
- **Addressable 實體不進 sitemap** —— `Certifications`、`FaqItems`、`Exhibitions`、`ArticleTags`
  有 slug 但只用於錨點／查詢參數，不是獨立頁面。
- If the URL count grows past ~50k or for clarity, split into a sitemap index
  (Next.js `generateSitemaps` → `/sitemap/products.xml`, `/sitemap/news.xml`, …).
- `robots.txt` points to the sitemap and must `Disallow`：

```
Disallow: /admin
Disallow: /en/account
Disallow: /zh-Hant/account
Disallow: /*/preview
```

搜尋結果與信件落地頁靠**每頁的 `noIndex`**（`pageMetadata({ noIndex: true })`）而不是
`robots.txt`：前者是無限多個近乎重複的網址，後者的網址帶著一次性 token，兩種都只能靠
meta 真正攔下來——`robots.txt` 擋的是抓取，不是索引。

## Per-page SEO requirements

Every public route exports Next.js `generateMetadata`, emitting: `<title>`, meta description,
canonical (the current locale URL), `hreflang` alternates (other locale + `x-default`), and
Open Graph/Twitter tags. These values come from each entity's translation SEO fields
(`SeoTitle` / `SeoDescription` / `SeoKeywords` / `OgImageMediaAssetId`) — see
[database.md](database.md).

**JSON-LD structured data**（Sitemap 明列 FAQ 需結構化標記以利 AI 引擎引用，故 GEO 與傳統 SEO 並重）：

| 型別 | 用於 | 資料來源 |
| --- | --- | --- |
| `Organization` | Homepage | `SiteSettings` |
| `Organization`（含 `address` / `geo` / `hasMap` / `contactPoint`） | `/contact` | 總部 `Locations` + `ContactChannels` |
| `Product` | 產品頁 | `Products` + `SpecificationRows`（→ `additionalProperty`）+ `Certifications` |
| `Article` | `/news/{slug}`、`/insights/{slug}`、`/blog/{slug}` | `Articles` + `Authors` |
| `Event` | 展會 | `Exhibitions`（`startDate` / `endDate` / `location`） |
| `FAQPage` | `/resources/faq` | `FaqCategories` + `FaqItems` |
| `BreadcrumbList` | 三層路由（products / solutions / resources） | 路由本身 |

FAQ、Exhibition、SpecificationRow 之所以是強型別表而非 content block，正是因為要輸出上述結構化
資料 —— 判準見 [database.md §09](database.md#09-頁面與版塊)。
