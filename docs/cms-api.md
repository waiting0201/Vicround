# CMS API

Azure Functions, **.NET 10 isolated worker**, HTTP-triggered. **Three** surfaces across two
Function apps (`fn-public`, `fn-admin`) sharing the `Application`/`Infrastructure` projects, so
the public app physically has no admin trigger.

| | Public Content API | **Account API** | Admin API |
| --- | --- | --- | --- |
| Function app | `fn-public` | `fn-public`（獨立 route group） | `fn-admin` |
| Base path | `/api/v1` | `/api/v1/account` | `/api/admin` |
| Auth | Anonymous | **Member JWT** | **Admin JWT**, roles `Admin`/`Editor` |
| Access | Read-only | 只寫會員自身資料與單據 | Full CRUD + publish/media |
| Caching | SSR output CDN-cached by tag | **`Cache-Control: no-store`**，不進 Data Cache | No cache |
| Returns | Published content only | 該會員可見的資料 | All statuses (Draft/Published/Archived) |
| Culture | `?culture={locale}` from the URL segment (default `en`) | 同左 | Per-translation, explicit |
| JWT issuer / audience | — | `vicround-account` / `vicround-public-api` | `vicround-admin` / `vicround-admin-api` |

Account API 掛在 `fn-public` 而非 `fn-admin`：前台 SSR 對它是同源呼叫，掛到 admin 會讓公開站
必須知道 admin 的 base URL，等於擴大 admin 暴露面。「`fn-public` 無內容寫入路徑」的原則仍成立
—— account handler 注入 `IAccountDbContext`（只 map `Members`、`MemberTokens`、
`MemberRefreshTokens`、`SampleRequests`、`ContactInquiries`），**碰不到任何內容表**，SQL 端另用
最小權限的 DB user。詳見 [database.md §14.1](database.md#141-api-surface)。

## 回應信封與錯誤碼

**所有端點一律回傳同一個信封，禁止回裸 data**（作法對齊 NTI `docs/10-backend-design.md` §5，
實作在 `Api/Common/ApiResponse.cs`）：

```jsonc
// 成功
{ "success": true,  "code": null, "data": { ... }, "message": "Success", "errors": [], "timestamp": "..." }
// 失敗
{ "success": false, "code": "AUTH_TOKEN_INVALID", "data": null,
  "message": "缺少或無效的後台憑證。", "errors": [], "timestamp": "..." }
```

`code` 給程式判斷、`message` 給人看、`errors` 放細節。**前端一律以 `code` 分支，不得比對
`message` 字串。** 錯誤碼值域見 `Api/Common/ErrorCodes.cs`；VicRound 相對 NTI 多一個
`AUTH_MEMBER_NOT_APPROVED`（會員尚未通過審核）。

## 路由與授權

只有一個 HTTP trigger（`RouterFunction`，catch-all），`host.json` 的 `routePrefix` 為 `api`，
其餘分派集中在 `AppRouter`：

| 路徑 | 驗證 | 未登記時的行為 |
| --- | --- | --- |
| `/api/v1/**` | 匿名 | **列舉式白名單**（`AppRouter.Public.cs`），沒登記 → `404` |
| `/api/v1/account/**` | Member JWT | 強制 `Cache-Control: no-store` |
| `/api/admin/**` | Admin JWT | **預設拒絕**（`AppRouter.Admin.cs` 的權限表），沒登記 → `403` |

兩張表都是「忘了補就會壞在開發階段」的設計：新增公開端點忘了補白名單會 404（不會靜悄悄
變成公開端點），新增後台端點忘了補權限表會 403（不會靜默放行）。

Each endpoint is an HTTP-triggered function; route templates give the paths below. Versioned
(`v1`) so the Next.js client can pin a contract. JSON only. `camelCase`. Errors use RFC 7807
`application/problem+json`. Keep functions thin — call into the `Application` layer.

## Content API (public, read-only)

All responses contain only the requested culture's text, the entity's slug, and SEO fields.
Pass `?culture=zh-Hant` (or `en`) — Next.js derives it from the `[locale]` URL segment.
`Accept-Language` is only a fallback when the param is absent (default `en`).

> **實作進度（2026-09-08）**：標 ✅ 的已上線並實跑驗證，其餘尚未實作。
> 新增端點時**必須同時補 `AppRouter.Public.cs` 的白名單與分派**，否則會直接 404。

```
GET  /api/v1/navigation          ✅ ?location=header|footer|legal|social|search-chip
GET  /api/v1/categories          ✅          # ?type=optical-film|textile-foam|acoustic
GET  /api/v1/categories/{slug}   ✅ 含 specs、blocks、關聯 solutions

GET  /api/v1/products            ✅ ?category=&solution=&featured=true&page=1&pageSize=24
GET  /api/v1/products/{slug}     ✅ detail incl. specs（gallery／certifications／downloads 待補）

GET  /api/v1/solutions           ✅ 產業解決方案索引（取代舊的 /applications）
GET  /api/v1/solutions/{slug}    ✅

GET  /api/v1/technologies        ✅ process flows + product compliance 一次帶出（?kind= 可篩製程類型）

GET  /api/v1/articles            ✅ ?type=&tag=&category=&solution=&page=1&pageSize=12
GET  /api/v1/articles/{slug}     ✅ 含 chips、展會側欄與同前綴內的上下篇
GET  /api/v1/news                ✅ 別名 → /articles?type=news（相容既有規劃）

GET  /api/v1/exhibitions         ✅ ?upcoming=true|false
GET  /api/v1/faq                 ✅ ?category=（回「分類 + 其下題目」的巢狀結構）
GET  /api/v1/certifications      ✅ ?category=company-factory|sustainability|product-compliance
GET  /api/v1/downloads           ✅ ?kind=&product=&category=&solution=

GET  /api/v1/pages/{slug}        ✅ blocks（reference block 的解析待補）

POST /api/v1/contact             ✅ inquiry form (rate-limited, anti-bot)

GET  /api/v1/sitemap             ✅ 已發佈網址 + lastmod + 真的有翻譯的語系（XML 由 Next.js 產）
GET  /api/v1/search              # ?q=  ← Phase 待定，見 database.md §19.5
```

`milestones` / `locations` / `testimonials` / `partner-brands` / `contact-channels`
**不給獨立 public 端點** —— 它們一律由 `/api/v1/pages/{slug}` 的 reference block 解析後一併回傳，
減少 SSR 往返。

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

**Product detail** carries `name`, `code`, `brand`, `summary`, `description` (HTML),
`parentProduct` (slug+name，型號掛在 family 之下時), `specifications` (ordered
label/value/note list), `gallery` (CDN URLs), `category` (slug+name), `solutions`,
`certifications`, `downloads`, and `seo` (`title`, `description`, `canonicalUrl`, `alternates`
for hreflang).

**Download DTO** 依 `accessLevel` 回不同內容 —— 公開端**永不**回 `MemberOnly` 檔案的真實 URL：

| `accessLevel` | 回傳 |
| --- | --- |
| `public` | `fileUrl`（public container 的 CDN URL） |
| `memberOnly` | metadata + `fileUrl: null` + `requiresSignIn: true` |
| `onRequest` | metadata + `fileUrl: null` + `requestUrl: "/contact?download={slug}"` |

`MemberOnly` 的實際檔案存於 private container，只能透過
`POST /api/v1/account/downloads/{slug}/link` 換取 **10 分鐘有效的 Blob SAS URL**。

**Contact** request: `{ type?, name, email, company, phone?, categorySlug?, productLineOther?,
productSlug?, downloadSlug?, application?, targetSpec?, message?, sourceUrl, culture, consent,
antiBotToken?, website? }`. Respond `202 Accepted` with
`{ "referenceNumber": "INQ-2026-000431" }` and no other echo。實作要點：

- **必填只有 `name` / `company` / `email` / `sourceUrl` / `consent`。** `message` 是選填 ——
  客戶確認稿的表單上根本沒有這個欄位（只有應用與目標規格），要求必填會讓實際的表單送不出去。
- `type` 未給時由內容推斷：帶了 `downloadSlug` 就是 `documentRequest`，否則 `general`。
  `categorySlug` / `productSlug` / `downloadSlug` 有給就必須查得到，查不到回 `400`
  （不靜默存 `null`）。
- 依 `type` 自動指派 `ContactChannels` 的收件窗口；沒有對應窗口就留空由後台分派。
- 三道防線依序是：**蜜罐 `website`**（真人看不到，有值即 `BOT_CHECK_FAILED`，不花 siteverify 的
  往返）→ **以 IP 為鍵的限流**（記憶體內滑動窗，10 分鐘 10 次，**不落 DB**；每個 Functions
  執行個體各算各的）→ **anti-bot token**（Cloudflare Turnstile；未設定
  `AntiBot:TurnstileSecret` 時放行並記警告，驗證服務掛掉時也放行）。
- `ConsentPolicyVersion` 取自 `SiteSettings` 的 `privacy.policyVersion`。
- ⚠️ **通知信尚未實作**——單據已落庫、後台收件匣看得到，寄信待 Communication Services /
  SMTP 設定就緒後補上（`ContactInquiryService` 內已標 TODO）。

## Account API (member-authenticated)

```
POST /api/v1/account/register                  POST /api/v1/account/verify-email
POST /api/v1/account/login                     POST /api/v1/account/resend-verification
POST /api/v1/account/refresh                   POST /api/v1/account/forgot-password
POST /api/v1/account/logout                    POST /api/v1/account/reset-password
GET  /api/v1/account/me                        POST /api/v1/account/change-password
PUT  /api/v1/account/me

GET  /api/v1/account/downloads                 # 會員可見清單（含 memberOnly）
POST /api/v1/account/downloads/{slug}/link     # 換取 10 分鐘 SAS URL

GET  /api/v1/account/sample-requests           # ?status=&page=
POST /api/v1/account/sample-requests
GET  /api/v1/account/sample-requests/{requestNumber}
POST /api/v1/account/sample-requests/{requestNumber}/reorder
```

只有 `Members.Status = Approved` 能取得 `MemberOnly` 下載並送出樣品申請；其餘狀態回 `403` 並附
目前狀態（`pendingEmailVerification` / `pendingApproval` / `rejected` / `suspended`）。註冊時先比對
`BusinessDomainRules`，`Block` 網域直接回 `400`（不建帳號）。註冊 → 核准狀態機見
[database.md §14.3](database.md#143-表定義)。

Account 端點一律 `Cache-Control: no-store`，**不得**進 Next.js Data Cache，也不得帶 revalidate tag。

## Admin API (authenticated CRUD)

Mirror the content types; operate on **all** translations and statuses. Editors create a base
entity then add per-culture translations.

**Auth (self-built JWT):**

```
POST   /api/admin/auth/login             # {email,password} -> {accessToken (~15m), refreshToken}
POST   /api/admin/auth/refresh           # rotate refresh -> new access token
POST   /api/admin/auth/logout            # revoke refresh token
POST   /api/admin/auth/change-password   # 改密碼；輪替 SecurityStamp、撤銷全部 refresh token
GET    /api/admin/auth/me
```

All other `/api/admin/**` calls require `Authorization: Bearer <accessToken>`; `fn-admin`
validates signature/issuer/audience/expiry and the role claim. The admin SPA keeps the access
token **in memory only** and relies on an **httpOnly refresh cookie** issued by `fn-admin`;
nothing is written to `localStorage`. See [cms.md](cms.md).

```
GET    /api/admin/{type}
POST   /api/admin/{type}
GET    /api/admin/{type}/{id}
PUT    /api/admin/{type}/{id}
DELETE /api/admin/{type}/{id}            # soft-delete / archive（必同時寫 301 或 410）

PUT    /api/admin/{type}/{id}/translations/{culture}   # upsert one culture's content
POST   /api/admin/{type}/{id}/publish                  # Draft -> Published (purges cache, bumps sitemap)
POST   /api/admin/{type}/{id}/unpublish
POST   /api/admin/{type}/reorder                       # 批次 SortOrder
```

**`{type}` 白名單**（對應 [database.md](database.md) 的功能單元）：

```
categories | products | solutions | articles | article-tags | authors |
pages | content-blocks | faq-categories | faq-items | exhibitions |
certifications | downloads | process-flows | milestones | locations |
testimonials | partner-brands | contact-channels | navigation | redirects |
media | site-settings | users | members | sample-requests |
contact-inquiries | business-domains
```

**非 CRUD 端點：**

```
POST   /api/admin/media                            # multipart upload -> Blob, returns url/asset id
GET    /api/admin/media                            # ?search=&type=&unused=true（找未被引用的媒體）
POST   /api/admin/members/{id}/approve
POST   /api/admin/members/{id}/reject              # {reviewNote}
POST   /api/admin/members/{id}/suspend
POST   /api/admin/members/{id}/reactivate
PUT    /api/admin/sample-requests/{id}/status      # 含 carrier / trackingNumber / trackingUrl
POST   /api/admin/legacy-import/run                # 觸發 LegacyImportSeeder（僅 Admin 角色）
```

`media` 上傳需指定 container：`public-media`（預設）或 `member-documents`（`IsPrivate = 1`，
只能經由 SAS 取得）。

On publish/unpublish/slug-change the admin function calls the Next.js **`revalidateTag` webhook**
(shared secret) for the affected tags in **both locales** (`en` + `zh-Hant`), so the next request
re-renders fresh content immediately.

## Conventions

- **Slugs, not ids, in public URLs.** The public API looks up by slug; ids are internal only.
- **Three surfaces, never mixed.** Public 匿名唯讀、Account 只能寫會員自身資料與單據、Admin 才有
  內容寫入權。DTO 各自獨立，不共用。
- **Publish revalidates.** Any publish/unpublish/slug change calls `revalidateTag` for the
  matching tags (both locales) and updates sitemap `lastmod`. Don't add write paths that skip this.
- **URL 變更必寫 301。** 改 slug、封存內容、或變更 `Articles.Type`（`Type` 決定 URL 前綴）都必須在
  同一 transaction 內寫入 `Redirects`。見 [database.md §0.5](database.md#05-slug-是內容不是衍生值)。
- **Validation lives in the Application layer** (FluentValidation or similar), shared shape
  enforced before EF writes. Controllers stay thin.
- **DTOs are per-surface.** Never return EF entities directly; never reuse an admin DTO on the
  public API (it would leak drafts/internal fields).
- **Enum 對外一律字串。** DB 存 `tinyint`，DTO 用 `JsonStringEnumConverter` 序列化成 camelCase
  （`"published"`、`"opticalFilm"`、`"memberOnly"`）。
- **Pagination is mandatory** on every collection endpoint; default `pageSize` capped (e.g. 50).
- **OpenAPI** is generated and is the source of truth for the Next.js client; regenerate the
  typed TS client when the contract changes.
