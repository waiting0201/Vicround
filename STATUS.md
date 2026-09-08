# 專案進度總表

> **這份文件是「做到哪裡了」的單一真相來源。** 每完成一項就更新對應那格。
>
> 分工：本檔記錄**狀態**；[CLAUDE.md](CLAUDE.md) 記錄**慣例與檢索地圖**；
> [docs/](docs/) 記錄各子系統的**設計**。三份不要互相抄，各司其職。

**最後更新**：2026-09-08

---

## 一句話現況

**前後台的版型都已完成；後端的資料層與 Content API 的第一批端點已上線，前台尚未切換過去。**

**客戶確認稿的 25 個頁面已全數實作**（`mockup/Rounded Design/` 共 31 個 `.dc.html`，
扣掉 6 個共用元件），色彩、字級、間距、互動逐項對照。對應到 `apps/web` 是 **25 條路由檔中的
19 條**（產品線與產業頁各由一支動態路由服務 3 與 7 個網址）；SEO 與 GEO 的基礎建設
（metadata／hreflang／sitemap／robots／llms.txt／六種 JSON-LD）已就緒並實測通過。
`apps/admin` 的 **27 個畫面已全數實作**（依 [docs/admin-ui.md](docs/admin-ui.md) 的 8 種畫面型別），
開發模式下吃 `src/lib/mock.ts` 的記憶體假資料，所以在後端出現之前就能操作與驗版。

**後端**是單一 `Api/` 專案（.NET 10 isolated，形狀對齊姊妹專案 NTI 的施工標準），
[docs/database.md](docs/database.md) 的 14 個功能單元全數落成 EF Core 模型 —— **77 張表**。
migration 與 seeder 已在**本機 SQL Server container 實跑通過**：77 表 / 269 索引 / 37 filtered /
17 CHECK / 162 FK 建置無誤，DB 層約束逐條實測有效。**38 項測試通過**。

**內容已進資料庫**：`apps/web/content/*.ts` 的 1355 組雙語字串與舊站 `www.vicround.com`
的可用資料都已匯入並實跑驗證（見第六節）。前台**仍在讀 `content/`** —— 要等 Content API
上線才切換，屆時整個目錄刪除。

**Content API 已上線 8 支端點**（categories／products／solutions／pages／sitemap＋health），
中英雙語與快取標頭都實跑驗過；其餘公開端點、Account API 與 Admin API 尚未實作。
CI 已有（建置＋測試＋兩道防呆），**部署與 Azure 資源尚未建立**。

---

## 圖例

| 記號 | 意思 |
| --- | --- |
| ✅ | 完成並驗證過（build／lint／實跑） |
| 🟡 | 版型或骨架完成，但資料來源、送出流程等尚未接上 |
| ⬜ | 未開始 |
| ⛔ | 被外部條件擋住（等客戶資料、等決策） |

---

## 一、總覽

| 子系統 | 狀態 | 說明 |
| --- | --- | --- |
| 前台 `apps/web` | 🟡 | 確認稿 25 頁全數實作（19 條路由檔）；資料來自暫代文案，未接 API |
| 後台 `apps/admin` | 🟡 | 27 個畫面全數實作 + 設計規格；資料來自開發用假 API，未接 Admin API |
| 設計系統 | ✅ | 客戶確認的 `_ds` 已同步進兩個 app，字型自架子集；後台介面規格見 [docs/admin-ui.md](docs/admin-ui.md) |
| SEO / GEO | ✅ | metadata、sitemap、robots、llms.txt、JSON-LD 全數實測通過 |
| Content API（`fn-public`） | 🟡 | **8 支端點已上線並實跑驗證**；articles／faq／certifications／downloads／navigation／contact 尚未做 |
| Account API（會員） | ⬜ | 未開工 |
| Admin API（`fn-admin`） | ⬜ | 未開工 |
| 資料庫 / EF Core | ✅ | 77 張表、首次 migration、三層 seeder，已於本機 SQL Server 實跑驗證 |
| 內容匯入 | ✅ | 確認稿文案（B/C 層）與舊站資料都已進庫，全數冪等 |
| 媒體 / Blob | 🟡 | 212 張舊站圖已進 `public-media`（本機 Azurite）；正式 Azure Storage 未建 |
| CI | ✅ | `.github/workflows/api.yml`：建置、38 項測試、產物防呆、migration 同步檢查 |
| 部署 / Azure 資源 | ⬜ | 尚未建立任何 Azure 資源 |

---

## 二、前台頁面

依 [docs/sitemap.md](docs/sitemap.md) 的 URL 結構，對照 `mockup/Rounded Design/`
（31 個 `.dc.html` ＝ 25 個頁面 ＋ 6 個共用元件）。

**數字對照**：確認稿 25 頁 → 已全數實作；`app/[locale]` 底下共 25 條路由檔，
其中 19 條有完稿版型、6 條仍是鷹架（下一節）。兩邊的「25」是巧合，不是同一個東西 ——
`products/[category]` 一支服務 3 個產品線、`solutions/[slug]` 一支服務 7 個產業頁，
而會員專區的 5 條路由在確認稿裡沒有對應頁。

### ✅ 已依確認稿實作（確認稿 25 頁全部，對應 19 條路由檔）

下表 26 列 ＝ 確認稿的 25 頁 ＋ `/resources/downloads`（確認稿把下載放在
`resources.dc.html#downloads`，本站的資訊架構另給它一個可索引網址，共用同一份清單）。

| 路由 | 對應 mockup | 底色 | 主要區塊 |
| --- | --- | --- | --- |
| `/{locale}` | `index.dc.html` | 深 | hero、三大產品交錯、產業總覽、信任牆、永續 CTA |
| `/products` | `products.dc.html` | 淺 | 三張分類卡 + 三個產品線區段 |
| `/products/optical-film` | `product-optical-film.dc.html` | 淺 | 總覽＋統計、8 個系列卡、規格表、製程、應用產業 |
| `/products/textile-foam` | `product-textile-foam.dc.html` | 淺 | 同上（6 個系列） |
| `/products/acoustic` | `product-acoustic.dc.html` | 淺 | 同上（4 個等級） |
| `/solutions` | `solutions.dc.html` | 淺 | 7 張產業卡（含 Acoustic 的 New 標記） |
| `/solutions/consumer-electronics` | `solution-consumer-electronics.dc.html` | 淺 | 課題／材料／規格／為何選我們／其他應用 |
| `/solutions/automotive` | `solution-automotive.dc.html` | 淺 | 同上 |
| `/solutions/smart-healthcare` | `solution-healthcare.dc.html` | 淺 | 同上 |
| `/solutions/renewable-energy` | `solution-renewable-energy.dc.html` | 淺 | 同上 |
| `/solutions/e-paper` | `solution-e-paper.dc.html` | 淺 | 同上 |
| `/solutions/sports-eyewear` | `solution-sports-glasses.dc.html` | 淺 | 同上 |
| `/solutions/acoustic-solutions` | `solution-acoustic.dc.html` | 淺 | **變體**：等級比較表／如何驗證／目前應用 |
| `/technologies` | `technologies.dc.html` | 淺 | 核心製程、研發與共同開發流程、法規符合表 |
| `/about` | `about-us.dc.html` | 深 | 願景、價值、歷程、製造與據點、永續、認證三分類、合作 |
| `/sustainability` | `sustainability.dc.html` | 淺 | ESG 三支柱、TRIPs、EUDR、認證卡 |
| `/partnership` | `partnership.dc.html` | 淺 | OEM/ODM 三步、經銷合作、客戶推薦 |
| `/resources` | `resources.dc.html` | 淺 | 新聞、FAQ 摘要、洞察、技術文章、下載 |
| `/resources/faq` | `faq.dc.html` | 淺 | 分類軌 + 13 題折疊 + `FAQPage` 結構化資料 |
| `/resources/downloads` | `resources.dc.html#downloads` | 淺 | 獨立頁，共用同一份下載清單 |
| `/news` | `news.dc.html` | 淺 | 分類篩選、6 則新聞、3 場展會 |
| `/news/{slug}` | `news-article.dc.html` | 淺 | 內文 + 展會資訊面板 + 上下則 + 更多新聞 |
| `/insights/{slug}`、`/blog/{slug}` | `article.dc.html` | 淺 | 文章頁首、側欄目錄、內文 block、延伸閱讀 |
| `/contact` | `contact.dc.html` | 淺 | 詢問表單、直接聯絡、三據點、送出後流程 |
| `/privacy` | `privacy.dc.html` | 淺 | 側欄目錄 + 8 條條文 |
| `/member` | `member.dc.html` | 深 | 登入／註冊分頁 + 四項會員權益 |

> **色調不是全站一致**：確認稿 32 頁裡只有 index / about-us / member 三頁深色（`#0a0a12`），
> 其餘皆為淺色（`#ffffff` / `#14141f`）。實作收斂成 `components/PageShell.tsx` 的 `data-tone`，
> 版型元件一律讀 `var(--page-*)`。新增頁面前先確認 mockup 那一頁的最外層底色。

### 🟡 仍是鷹架（6 條路由檔）—— 確認稿沒有對應頁

| 路由 | 現況 | 需要什麼才能做 |
| --- | --- | --- |
| `/products/{category}/{slug}` 產品詳情 | banner + 待接 API 提示框 | 設計稿（確認稿只做到產品線頁） |
| `/account`、`/account/downloads`、`/account/profile`、`/account/sample-requests`、`/account/sample-requests/{no}` | 側欄 + 待接 API 提示框，已 `noindex` | 設計稿 + Account API（確認稿只做到 `/member`） |

---

## 三、前台基礎建設

### ✅ SEO

| 項目 | 實作位置 | 驗證 |
| --- | --- | --- |
| 每頁 metadata（title/description/canonical/hreflang/OG/Twitter） | [lib/seo.ts](apps/web/lib/seo.ts) | 實跑檢查 `/en/products` 的 head |
| hreflang 只宣告「真的有內容」的語系 | [lib/hreflang.ts](apps/web/lib/hreflang.ts) | 後端未上線時退回只宣告自身語系 |
| `sitemap.xml`（由 DB 資料產生） | [app/sitemap.ts](apps/web/app/sitemap.ts) | 回 200 / `application/xml` |
| `robots.txt`（非正式站整站 Disallow） | [app/robots.ts](apps/web/app/robots.ts) | 已含 `/admin`、`/{locale}/account`、`/*/preview` |
| 語系前綴與舊網址 301 | [middleware.ts](apps/web/middleware.ts) | `/` → 307 `/en`；410 直接回 410 |
| 發布後失效（`revalidateTag`） | [app/api/revalidate/route.ts](apps/web/app/api/revalidate/route.ts) | 無密鑰回 401 |

### ✅ GEO（AI 引擎）

| 項目 | 說明 |
| --- | --- |
| `/llms.txt` | 站台導覽 + 六條「容易被講錯的前提」；目錄從 API 動態帶出，後端掛掉退回骨架 |
| robots 明示放行檢索型 AI 爬蟲 | 7 個（OAI-SearchBot、Claude-SearchBot、PerplexityBot…）；訓練型**刻意留空**待客戶決定 |
| JSON-LD | Organization / WebSite（首頁）、BreadcrumbList（三層路由）、Product、Article、Event（展會）、FAQPage |
| FAQ 答案留在 HTML | 折疊用 `hidden` 而非條件式不渲染，爬蟲讀得到 |

### ✅ 設計系統與字型

| 項目 | 狀態 |
| --- | --- |
| token 來源 | `mockup/Rounded Design/_ds/`（客戶確認），由 `pnpm sync:tokens` 逐字複製進兩個 app |
| 根目錄 `design-system/tokens.css` | **不接程式**，僅作 CIS 溯源（已在檔頭標註） |
| 字型 | 自架子集，**第三方字型請求 0 次**；GenYoGothic TW 三字重各 36 塊 unicode-range、Geologica 六字重、IBM Plex Mono 兩字重（共 116 個 woff2） |
| 圖示 | 47 個 Lucide 內嵌（`scripts/build-icons.mjs` 產生，版本釘 0.469.0） |

---

## 四、前台程式結構

```
apps/web/
├── app/[locale]/…      25 條路由
├── app/ds/             客戶確認的設計 token（生成物，勿手改）
├── app/fonts.css       自架字型宣告（生成物，勿手改）
├── components/         21 支：Header/Footer/PageBanner/PageCTA/FaqAccordion/ArticleBody…
├── content/            17 支暫代文案（接上 CMS 後整個目錄刪除）
├── lib/                11 支：seo / schema / hreflang / api / locale / routes / nav…
├── messages/           UI 字串（en / zh-Hant）
└── public/fonts/       116 個 woff2
```

**文案狀態**：`content/*.ts` 的英文逐字取自確認稿，**繁中是暫譯，待客戶校稿**。
`node scripts/check-content-language.mjs` 會擋掉輸入法誤植（西里爾／韓文）與英文欄位混入中文。

---

## 五、後台 `apps/admin`

介面規格見 [docs/admin-ui.md](docs/admin-ui.md)（設計原則、8 種畫面型別、狀態色彩對照、文案語氣）。

| 項目 | 狀態 | 說明 |
| --- | --- | --- |
| 應用外框 | ✅ | Vite + React 19 + react-router **data router**（`createBrowserRouter`，`basename="/admin"`），build 進 `apps/web/public/admin` |
| 不被索引 | ✅ | `robots.txt` Disallow + `index.html` 的 `noindex, nofollow` 雙重排除 |
| 登入頁 | 🟡 | 版面完成；access token 只放記憶體、refresh 靠 httpOnly cookie（**需後端配合 `Set-Cookie`**） |
| UI 元件庫 | ✅ | `src/ui/` 24 支（Button／Table／Drawer／Dialog／Toast／Tabs／Field…）＋內嵌 SVG 圖示，零新增套件 |
| 資料字典 | ✅ | `src/lib/resources.ts`：27 個實體的列表欄位與表單欄位，並區分**不分語系／分語系**兩層 |
| 實際畫面 | ✅ | **27 個全部實作**，見下表 |
| 開發用假 API | ✅ | `src/lib/mock.ts`：路徑形狀與 Admin API 契約一致，後端上線設 `VITE_ADMIN_MOCK=0` 即切換 |
| 接真的 Admin API | ⬜ | 等 `fn-admin`；只需要關掉假資料旗標，畫面不用改 |

### 27 個畫面

| 型別 | 畫面 | 實作 |
| --- | --- | --- |
| 清單＋獨立編輯頁 | categories／products／solutions／articles／pages／exhibitions／faq-items／downloads／certifications／process-flows | `EditorScreen` + `EntityEditor`（含子項編輯器：規格列、版塊、製程步驟） |
| 清單＋編輯抽屜 | article-tags／authors／locations／testimonials／partner-brands／contact-channels／business-domains／users | `CollectionScreen` |
| 排序清單 | faq-categories／milestones | `OrderedScreen`（上移／下移 + 批次存排序） |
| 導覽（樹狀＋位置分頁） | navigation | `NavigationScreen` |
| 審核佇列 | members | `MembersScreen` + `MemberDetail`（列上直接核准／拒絕，拒絕須填理由） |
| 收件匣 | contact-inquiries | `InquiriesScreen` + `InquiryDetail` |
| 看板 | sample-requests | `SampleRequestsScreen` + `SampleRequestDetail`（只列合法的下一個狀態，不做拖曳） |
| 媒體庫 | media | `MediaScreen`（縮圖網格 + 上傳，上傳前先選公開／私有容器） |
| 轉址 | redirects | `RedirectsScreen`（存檔前先算轉址鏈與環，鏈會自動壓平成最終目標） |
| 站台設定 | site-settings | `SettingsScreen`（依 key 前綴自動分區，分語系設定另有語系分頁） |

### 已處理的跨畫面規則

| 規則 | 實作位置 |
| --- | --- |
| 雙語編輯與**翻譯缺漏標示**（分頁黃點、清單語系欄、「缺 zh-Hant」篩選） | `components/EntityForm.tsx`、`components/ResourceList.tsx`、`lib/format.ts` |
| 改 slug 會寫 301 的提示 | `screens/EntityEditor.tsx` |
| 未存變更離開攔截（站內導覽 + 關閉分頁） | `useBlocker` + `beforeunload`，見 `lib/draft.ts` |
| 發布／取消發布／封存的具體後果寫在確認框裡 | `components/RecordActions.tsx` |
| Editor 角色看不到 `adminOnly` 項目 | `components/Shell.tsx` |
| 測試環境標示 | `components/Shell.tsx`（假資料模式時顯示） |

## 六、後端與部署

`Api/` 是單一 Azure Functions 專案，形狀對齊 NTI 的施工標準（見 [docs/architecture.md](docs/architecture.md)）。

| 項目 | 狀態 | 說明 |
| --- | --- | --- |
| `Api/` 專案 | ✅ | `VicRound.slnx`：`Api/VicRound.Api.csproj` + `tests/Api.Tests`；namespace `VicRound.Api` |
| Router 與授權 | ✅ | `RouterFunction` catch-all + `AppRouter` 三張表：公開白名單（未登記 404）、會員 JWT（強制 no-store）、後台 81 個權限碼（**預設拒絕**，未登記 403） |
| 回應信封 / 例外 | ✅ | `ApiResponse<T>` + `ErrorCodes` + `AppException`；`ExceptionMiddleware` 把 SQL 約束違反轉成 409 而非 500 |
| JWT | 🟡 | `JwtService`（HS256、雙 issuer/audience/金鑰）可驗證；**登入端點尚未實作** |
| EF Core 模型 | ✅ | 14 個功能單元 → **77 張表**，schema 權威為 `Api/Data/Migrations/` |
| 首次 migration | ✅ | `InitialCreate`；已套用於本機 SQL Server，`has-pending-model-changes` 為 no changes |
| 三層 seeder / 匯入 | ✅ | A 層 `HasData`、B 層 `BootstrapSeeder`、C 層 `ContentImportSeeder` 與 `LegacyImportSeeder`，全部冪等 |
| **Content API** `/api/v1/**` | 🟡 | **8 支已上線並實跑驗證**：`categories`(2)、`products`(2)、`solutions`(2)、`pages/{slug}`、`sitemap`，外加 `health`。中英雙語、分頁、快取標頭、404/400 錯誤碼皆已驗 |
| Account API `/api/v1/account/**` | ⬜ | Router 已驗 member token 並強制 `no-store`；Handler 未實作 |
| Admin API `/api/admin/**` | ⬜ | Router 與權限表已就緒；Handler 未實作 |
| CI | ✅ | `.github/workflows/api.yml`：建置（0 warning 閘）、38 項測試、publish、檢查產物不含 `local.settings.json`、檢查 migration 與模型同步 |
| 部署 | ⬜ | **無部署步驟**——Azure 資源尚未建立（[docs/azure-deployment.md](docs/azure-deployment.md)） |
| Azure 資源 | ⬜ | 未建立任何資源；Blob 目前指向本機 Azurite |

### 已上線的公開端點

| 端點 | 回傳 |
| --- | --- |
| `GET /api/v1/health` | 存活檢查，刻意不碰 DB |
| `GET /api/v1/categories?type=` | 3 條產品線 |
| `GET /api/v1/categories/{slug}` | 產品線詳情：規格 6、版塊 4、產品 8、關聯產業 6 |
| `GET /api/v1/products?category=&solution=&featured=&page=` | 分頁產品（18 筆，只取 family 層） |
| `GET /api/v1/products/{slug}` | 產品詳情 + 規格 |
| `GET /api/v1/solutions` | 7 個產業 |
| `GET /api/v1/solutions/{slug}` | 產業詳情：規格 5、版塊 4、產品線 chip 3 |
| `GET /api/v1/pages/{slug}` | 頁面 + 版塊（privacy 走長文 Body） |
| `GET /api/v1/sitemap` | 51 個已發佈網址 + lastmod + **真的有翻譯的語系** |

### 資料層細節

| 項目 | 內容 |
| --- | --- |
| 實體 | `Api/Models/Entities/`（24 檔）；Routable / Addressable / Embedded 三種基底類別 |
| 組態 | `Api/Data/Configurations/`；`SluggedEntityConfiguration` 與 `TranslationConfiguration` 兩個基底吸收掉 70 幾張表的樣板 |
| 已落實的慣例 | slug 用 `Latin1_General_100_CS_AS` + CHECK + 排除 Archived 的 filtered unique；翻譯表 PK `(擁有者Id, Culture)` 且 FK → `Cultures`；enum 存 `tinyint`；時間 `datetime2(3)` 預設 `SYSUTCDATETIME()`；owner triple 的「恰一非 NULL」CHECK；`Members.EmailDomain` 為 PERSISTED 計算欄位 |
| 時間戳 | `AuditingSaveChangesInterceptor`（不用 trigger —— 會與 EF 的 `OUTPUT` 衝突） |
| 密碼 | `Pbkdf2PasswordHasher`：PHC 單欄位字串，支援逐使用者漸進升級（**刻意不跟 NTI 用 BCrypt**，理由見 database.md §14.2） |
| 翻譯 fallback | 列表缺該語系時回退預設語系並回報 `hasRequestedCulture = false`（前台據此不宣告 hreflang）；詳情缺該語系直接 404（§0.2） |
| 種子 | A 層：`Cultures`(2)、`Roles`(2)。B 層：super admin、產品線 3、Solutions 7、Pages 11、Locations 3、ContactChannels 3、封鎖網域 27、SiteSettings 9、NavigationItems 36 |
| 內容匯入 | `scripts/export-content.mjs` → `import-content`：認證 9、FAQ 5/13、產品系列 18、規格列 48、製程 7/27、文章 12、展會 3、版塊 72/138。**全庫翻譯列 844** |
| 舊站匯入 | `import-legacy`：212 張圖 → Blob + `MediaAssets`、4 篇 blog → `Articles`(Draft)、241 條 301 |
| 舊站轉址工具 | `tools/crawl-legacy-site.mjs` 爬真實網址；`check-redirects` 報覆蓋率（**241/241 = 100%**，全部導首頁） |
| 測試 | `tests/Api.Tests` **38 項**：慣例守門（EF 模型）、密碼雜湊、語系解析與分頁 |
| DB 層約束實測 | slug CHECK 擋大寫／底線、filtered unique 擋重複、**封存後 slug 可重用**、owner triple 擋雙 owner 與零 owner、`EmailDomain` 自動算出、`Cultures` FK 擋未登錄語系 —— 7 項皆如文件所述 |

## 七、擋住的事項

| 項目 | 擋在哪 | 影響 |
| --- | --- | --- |
| ⛔ 認證清單與證書明細 | 等客戶提供 | `content/certifications.ts` 多數欄位是 `[待客戶提供]`，About／Sustainability 的認證卡顯示待提供樣式 |
| ⛔ 版位照片與 partner logo | 等客戶提供 | 目前顯示 mockup 自己的虛線佔位框。舊站 212 張圖已在 Blob，但**內文引用的 2863 個檔名只有約 10% 在匯出裡**，其餘須另外取得 |
| ⛔ 公司歷程（Milestones） | 等客戶提供 | 確認稿是「[Add …]」佔位文字且無年份，`Milestones.Year` 必填，因此沒有建列 |
| ⛔ 規格書檔案（Downloads） | 等客戶提供 | 3 份規格書沒有實際檔案，`Downloads.MediaAssetId` 必填，因此沒有建列 |
| ⛔ 產品詳情頁設計 | 確認稿沒有這一頁 | `/products/{category}/{slug}` 維持鷹架 |
| ⛔ 會員專區內頁設計 | 確認稿只到 `/member` | `/account/**` 五頁維持鷹架 |
| ⛔ 繁中文案校稿 | 等客戶 | `content/*.ts` 的繁中為暫譯 |
| ⛔ 訓練型 AI 爬蟲政策 | 等客戶決策 | `app/robots.ts` 目前只放行檢索型，訓練型不列 |
| ⛔ 後台 refresh token 的 cookie | 等後端 | 後台改為 SPA 之後，`fn-admin` 需以 `Set-Cookie` 回 httpOnly refresh token |

---

## 八、下一步的合理順序

1. ~~建 `src/` 的 .NET solution 與 EF Core 模型~~ ✅ 2026-09-08
2. ~~在能跑的 SQL Server 上套用 migration 與 seeder~~ ✅ 2026-09-08（本機 container）
2b. ~~把確認稿文案與舊站資料匯入資料庫與 Blob~~ ✅ 2026-09-08
2c. ~~後端形狀對齊 NTI 的施工標準（Router / ApiResponse / EF+Dapper 雙軌）~~ ✅ 2026-09-08
3. ~~Content API 的 `categories` / `products` / `solutions` / `pages` / `sitemap`~~ ✅ 2026-09-08
3b. 補完其餘公開端點：`articles`、`exhibitions`、`faq`、`certifications`、`downloads`、
   `navigation`、`technologies`、`POST /contact`
3c. 前台改吃 API，刪掉 `apps/web/content/`（本專案「拔掉暫代文案」的終點）
4. Admin API —— 後台畫面已就緒，接上後把 `VITE_ADMIN_MOCK` 設成 `0` 即可
5. CI/CD 與 Azure 佈署（[docs/azure-deployment.md](docs/azure-deployment.md)）
6. Account API 與會員專區（需先補設計稿）

---

## 九、怎麼維護這份文件

- **完成一項就改一格**，不要另開新章節堆疊歷史。
- 「擋住的事項」解除時刪掉那一列，並在對應章節改成 ✅／🟡。
- 數量（幾條路由、幾支元件）用指令重數，不要憑印象寫：

  ```bash
  find 'apps/web/app/[locale]' -name page.tsx | wc -l          # 路由檔
  grep -rl 'Todo' 'apps/web/app/[locale]' | wc -l              # 仍是鷹架的
  ls 'mockup/Rounded Design'/*.dc.html | wc -l                 # 確認稿檔案（含 6 個共用元件）
  ```

  ⚠️ **路由檔數 ≠ 頁面數**：動態路由一支服務多個網址，而會員專區的路由在確認稿裡沒有對應頁。
- 狀態與設計分開：**怎麼做**寫在 `docs/`，**做到哪**寫在這裡。
