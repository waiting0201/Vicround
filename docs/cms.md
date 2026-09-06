# Self-built CMS

There is **no third-party CMS** (no Strapi / Sanity / Contentful / Umbraco). The "CMS" is three
of our own layers:

1. **Content model** — our SQL schema (base + `*Translation` tables) in [database.md](database.md).
   This *is* the CMS's content types.
2. **Admin API** — `fn-admin` in Azure Functions (.NET 10), `/api/admin/**`, JWT-protected. See
   [cms-api.md](cms-api.md).
3. **Admin UI** — a self-built **Vite + React SPA** (`apps/admin`), built into
   `apps/web/public/admin` and served at `/admin` on the same origin. **Not** indexed
   (robots `Disallow` + `<meta name="robots" content="noindex, nofollow">`), locale-independent
   (editor UI in one language; it edits *both* content locales). It is not part of the Next.js
   route tree — see [architecture.md](architecture.md) for why.

## Admin UI stack

| Concern | Choice |
| --- | --- |
| Framework | Vite + React 19 + TypeScript, `react-router` (`basename="/admin"`) |
| UI / styling | shadcn/ui + Tailwind |
| Forms + validation | React Hook Form + Zod |
| Data tables | TanStack Table (sort / paginate / filter) |
| Server state | TanStack Query against the Admin API |
| Rich text | TipTap → stores HTML for product/article/page bodies |
| Media upload | upload widget → `POST /api/admin/media` → Blob Storage → returns CDN/Blob URL |
| Bilingual editing | one edit screen per entity with `en` / `zh-Hant` tabs writing both translation rows；分頁上標示**翻譯缺漏**（該 culture 尚無 translation 列），列表頁可用「缺 zh-Hant」篩選 |

The admin app talks only to `/api/admin/**`; it never queries SQL directly.

## Admin 管理的功能單元

後台畫面依 [database.md](database.md) 的功能單元分區，而非一張大表清單：

| 分區 | 畫面 |
| --- | --- |
| 內容 | Categories（三條產品線）／Products（含規格列、圖庫）／Solutions／Articles（News・Insight・Blog 三種 `Type`）／Pages + ContentBlocks |
| 資源 | Exhibitions（展會，日期驅動可見性）／FAQ 分類與題目／Downloads（**含版本與 `AccessLevel` 上傳**）／Article tags・Authors |
| 永續 | **Certifications 管理**（發證機構、證號、效期、範疇、證書 PDF；同時餵 Sustainability、About、Technologies 的 Product Compliance 表與 CertificationDialog） |
| 公司 | Milestones／Locations／Testimonials／PartnerBrands／ContactChannels／ProcessFlows |
| 營運 | **Members 審核佇列**（PendingApproval → Approve／Reject＋理由／Suspend）／**Sample requests 看板**（狀態 + carrier/tracking）／Contact inquiries triage／BusinessDomainRules |
| 站台 | Navigation（Header・Footer・Legal・Social・SearchChip 五個 `Location`）／Redirects／SiteSettings／Media library／Users |

**Reference block 的編輯體驗**：插入「認證清單」時編輯者是**選分類與數量**，不是手抄一遍
ISO 14001 —— block 只存查詢參數，資料仍來自 `Certifications`。這是內容不會兩處不同步的原因，
判準見 [database.md §09](database.md#09-頁面與版塊)。

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
         → access token 回在 response body（SPA 只放記憶體）；refresh token 由 fn-admin
           以 Set-Cookie 寫成 httpOnly, Secure, SameSite=Strict（Path=/api/admin/auth）
call     every /api/admin/** request carries the access token; fn-admin validates
         signature / iss / aud / exp + role claim, authorizes per endpoint
refresh  POST /api/admin/auth/refresh  → rotate refresh, mint new access
logout   POST /api/admin/auth/logout   → revoke refresh row, clear cookies
```

**Rules**

- **Refresh token 只存在 httpOnly cookie**；**access token 只存在記憶體**（模組層變數）——
  兩者都不得進 `localStorage` / `sessionStorage`。後台是 SPA，重新整理後記憶體是空的，
  由 `POST /auth/refresh` 帶著 cookie 換一顆新的 access token，所以「維持登入」不需要
  在瀏覽器留下任何長期憑證。前後端同源（`/admin` 與 `/api` 同一網域）是這個做法成立的前提。
- Authorize by role on the server: `Editor` can author/publish content; `Admin` additionally
  manages users, redirects, and settings.
- The public app (`fn-public`) has **no** auth and no write path — JWT exists only on `fn-admin`.
- JWT signing key, issuer, and audience come from **Key Vault**; rotate the key without code
  changes.
- Rate-limit `auth/login`; lock out / back off on repeated failures（`FailedLoginCount` /
  `LockoutEndsAt` 是 `Users` 上的**狀態欄位**，本專案不建 `LoginAttempts` 之類的稽核表）。
- **`SecurityStamp` 輪替**：改密碼、停用帳號或撤銷授權時輪替 `Users.SecurityStamp`，並撤銷該
  使用者全部 `RefreshTokens`，令既發出的 token 立即失效。
- **密碼雜湊**：PBKDF2-HMAC-SHA256（i=600,000、salt 16B、key 32B），存成單一 PHC 字串欄位
  `$pbkdf2-sha256$i=600000$<salt>$<hash>`，可逐使用者漸進升級參數。理由與細節見
  [database.md §14.2](database.md#142-密碼雜湊users-與-members-共用同一格式)。
- **後台 `Users` 與前台 `Members` 完全隔離**：不同表、不同 issuer/audience、不同簽章金鑰、不同
  cookie。`fn-admin` 只信任 admin audience，account handler 只信任 member audience；拿到對方的
  token 一律 `401`。前台會員系統見 [database.md §14](database.md#14-前台會員members)。

## Publish → revalidate

On any publish / unpublish / slug change, `fn-admin` calls the Next.js **`revalidateTag`**
webhook (shared secret in Key Vault) for the affected content tags in **both locales**, so SSR
pages pick up fresh data without a redeploy. This is the only coupling from the API back into
the web app — keep it behind the shared secret. See [architecture.md](architecture.md) and
[sitemap.md](sitemap.md).
