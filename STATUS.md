# 專案進度總表

> **這份文件是「做到哪裡了」的單一真相來源。** 每完成一項就更新對應那格。
>
> 分工：本檔記錄**狀態**；[CLAUDE.md](CLAUDE.md) 記錄**慣例與檢索地圖**；
> [docs/](docs/) 記錄各子系統的**設計**。三份不要互相抄，各司其職。

**最後更新**：2026-09-08

---

## 一句話現況

**前台、後台與會員專區都已接上自己的 API；剩下的是上線收尾（素材、網域）。**

**客戶確認稿的 25 個頁面已全數實作**（`mockup/Rounded Design/` 共 31 個 `.dc.html`，
扣掉 6 個共用元件），色彩、字級、間距、互動逐項對照。對應到 `apps/web` 是 **25 條路由檔中的
19 條**（產品線與產業頁各由一支動態路由服務 3 與 7 個網址）；SEO 與 GEO 的基礎建設
（metadata／hreflang／sitemap／robots／llms.txt／六種 JSON-LD）已就緒並實測通過。
`apps/admin` 的 **26 個畫面已全數實作**（依 [docs/admin-ui.md](docs/admin-ui.md) 的 7 種畫面型別），
開發模式下吃 `src/lib/mock.ts` 的記憶體假資料，所以在後端出現之前就能操作與驗版。

**後端**是單一 `Api/` 專案（.NET 10 isolated，形狀對齊姊妹專案 NTI 的施工標準），
[docs/database.md](docs/database.md) 的 14 個功能單元全數落成 EF Core 模型 —— **77 張表**。
migration 與 seeder 已在**本機 SQL Server container 實跑通過**：77 表 / 269 索引 / 37 filtered /
17 CHECK / 162 FK 建置無誤，DB 層約束逐條實測有效。**53 項測試通過**。

**內容已進資料庫且前台已切換過去**：確認稿的 1355 組雙語字串與舊站 `www.vicround.com`
的可用資料都已匯入（見第六節），`apps/web/content/` 已刪除。確認稿本身以
`Api/Data/Seeding/ContentImport/confirmed-copy.json` 進版控，新環境仍能用 `import-content`
灌入同一份文案。

**Content API 的公開端點已全數上線**（20 支，見第六節）；**Admin API 也已上線**
（登入 + 27 個單元的 CRUD）。**Account API 也已上線**（16 支：註冊／登入／換發／驗證信／
忘記密碼／個人資料／會員下載＋SAS 連結／樣品申請）——⚠️ 但**寄信管道尚未接上**，
驗證信與重設密碼信目前只寫進遙測（`LoggingMemberNotifier`，與詢問單的通知信是同一個待辦）。

**正式環境已經跑起來**（2026-09-08）：前台 `https://green-desert-0eeb2ce1e.3.azurestaticapps.net`、
API `https://func-vicround-prod.azurewebsites.net/api`，後台在 `/admin`（經同源代理打 Admin API）。
推上 `master` 即自動部署。robots.txt 目前整站 Disallow —— 網域還沒換成 www.vicround.com。

**⛔ 但正式站目前整站破圖**（2026-09-11 實測）：8 張版位素材全部 404 —— 首頁 hero、
首頁三張產品照、22 個內頁的 banner 底圖。**版型與文案本身是對的**（25 頁逐頁文字比對，
19 頁只差 1–4 筆，且都是 mockup 的 `{{ }}` 佔位或客戶後來改過的句子），破圖是唯一的大面積落差。
成因與修法見 [docs/azure-deployment.md](docs/azure-deployment.md) 的
「前台的 build-time 變數」——**repo variable `MEDIA_BASE` 從未設定，而 `public/assets` 不在版控**，
兩邊同時落空。素材上傳 `public-media` 後設好變數、重跑 `web.yml` 即可解。

**預覽網域已綁**：`vicround.4webdemo.com`（SWA 自訂網域，DNS 在 Cloudflare 且開 proxy）。
因此該網域的 robots.txt 與頁面裡的 email 都被 Cloudflare 改寫過，不是本站輸出——
排查前先看 [docs/azure-deployment.md](docs/azure-deployment.md) 的「CDN 在 SWA 前面時」。

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
| 前台 `apps/web` | ✅ | 確認稿 25 頁全數實作（19 條路由檔）**且全部改吃 Content API**；暫代文案目錄已刪 |
| 後台 `apps/admin` | 🟡 | 27 個畫面全數實作；**Admin API 已上線**，開發時設 `VITE_ADMIN_MOCK=0` 即打真的後端（27 個單元實跑通過），尚未在瀏覽器逐畫面驗收 |
| 設計系統 | ✅ | 客戶確認的 `_ds` 已同步進兩個 app，字型自架子集；後台介面規格見 [docs/admin-ui.md](docs/admin-ui.md) |
| SEO / GEO | ✅ | metadata、sitemap、robots、llms.txt、JSON-LD 全數實測通過 |
| Content API（`fn-public`） | ✅ | **19 支端點已上線並實跑驗證**（含 contact 寫入與 reference block 解析）；只剩 `/search` 待定 Phase |
| Account API（會員） | 🟡 | 16 支端點已實作並通過建置與測試；**寄信未接**、尚未在實際環境跑過完整註冊流程 |
| Admin API（`fn-admin`） | ✅ | 登入 + 27 個單元共用的 CRUD、轉址、快取失效、媒體上傳、審核動作 |
| 資料庫 / EF Core | ✅ | 77 張表、首次 migration、三層 seeder，已於本機 SQL Server 實跑驗證 |
| 內容匯入 | ✅ | 確認稿文案（B/C 層）與舊站資料都已進庫，全數冪等 |
| 媒體 / Blob | 🟡 | 正式 `stvicroundprod` 已建、`public-media` 為公開讀；**版位素材尚未上傳**（實測 404，見上方說明） |
| CI | ✅ | `.github/workflows/api.yml`：建置、87 項測試、產物防呆、migration 同步檢查 |
| 部署 / Azure 資源 | ✅ | `VicRoundUS`（westus2）：Function App、SWA、SQL、Storage、App Insights；前後台都已上線 |

---

## 二、前台頁面

依 [docs/sitemap.md](docs/sitemap.md) 的 URL 結構，對照 `mockup/Rounded Design/`
（31 個 `.dc.html` ＝ 25 個頁面 ＋ 6 個共用元件）。

**數字對照**：確認稿 25 頁 → 已全數實作；`app/[locale]` 底下共 25 條路由檔，
其中 19 條有完稿版型、6 條仍是鷹架（下一節）。兩邊的「25」是巧合，不是同一個東西 ——
`products/[category]` 一支服務 3 個產品線、`solutions/[slug]` 一支服務 7 個產業頁，
而會員專區的 5 條路由在確認稿裡沒有對應頁。

### ✅ 已依確認稿實作，且全部改吃 Content API（確認稿 25 頁全部，對應 19 條路由檔）

下表 26 列 ＝ 確認稿的 25 頁 ＋ `/resources/downloads`（確認稿把下載放在
`resources.dc.html#downloads`，本站的資訊架構另給它一個可索引網址，共用同一份清單）。

**資料來源的分工**：頁面的 banner／CTA／版塊來自 `/v1/pages/{slug}`；版塊若是
reference block（`BlockType` ≥ 100），資料由後端解析自強型別表（認證、據點、製程、
FAQ、展會、文章、下載…），因此「這一區顯示哪幾筆」是編輯者調的查詢參數。
清單頁另打對應的實體端點。UI 標籤留在 `messages/{locale}.json`。

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

### ✅ 原本的 6 條鷹架已全部接上 API（2026-09-11）

確認稿沒有這幾頁，因此版型沿用會員專區殼層既有的 Tailwind 語彙，沒有自創第二套視覺。

（這 6 條沒有接 API，因為還沒有設計稿；`/products/{category}/{slug}` 的資料端點
`GET /v1/products/{slug}` 其實已經可用。）

| 路由 | 現況 | 需要什麼才能做 |
| --- | --- | --- |
| `/products/{category}/{slug}` 產品詳情 | banner + 待接 API 提示框 | 設計稿（確認稿只做到產品線頁） |
| `/account`、`/account/downloads`、`/account/profile`、`/account/sample-requests`、`/account/sample-requests/{no}` | ✅ 已接 Account API（瀏覽器端取資料，`noindex` 不變） | — |

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
| 詢問表單送出（同源代理） | [app/api/contact/route.ts](apps/web/app/api/contact/route.ts) | 實跑回 202 + 受理編號；蜜罐回 `BOT_CHECK_FAILED` |
| 內容取值（拆信封、帶 tag） | [lib/api.ts](apps/web/lib/api.ts)、[lib/content-api.ts](apps/web/lib/content-api.ts) | 失敗回 null；固定路由改丟例外（500）而不是 404 |

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
├── lib/                14 支：seo / schema / hreflang / api / content-api / format / html…
├── messages/           UI 字串（en / zh-Hant）
└── public/fonts/       116 個 woff2
```

**文案來源**：全部來自 Content API。頁面取 `/v1/pages/{slug}` 的 banner／CTA／版塊，
清單取各實體端點；UI 標籤（按鈕、表單欄位、篩選鈕）留在 `messages/{locale}.json`。
繁中仍是暫譯，**待客戶校稿**——校稿改資料庫，不再改程式碼。
`node scripts/check-content-language.mjs` 會擋掉輸入法誤植（西里爾／韓文）與英文欄位混入中文。

---

## 五、後台 `apps/admin`

介面規格見 [docs/admin-ui.md](docs/admin-ui.md)（設計原則、7 種畫面型別、狀態色彩對照、文案語氣）。

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
| 轉址 | redirects | `RedirectsScreen`（存檔前先算轉址鏈與環，鏈會自動壓平成最終目標） |
| 站台設定 | site-settings | `SettingsScreen`（依 key 前綴自動分區，分語系設定另有語系分頁） |

### 已處理的跨畫面規則

| 規則 | 實作位置 |
| --- | --- |
| 雙語編輯與**翻譯缺漏標示**（分頁黃點、清單語系欄、「缺 zh-Hant」篩選） | `components/EntityForm.tsx`、`components/ResourceList.tsx`、`lib/format.ts` |
| 改 slug 會寫 301 的提示 | `screens/EntityEditor.tsx` |
| 未存變更離開攔截（站內導覽 + 關閉分頁） | `useBlocker` + `beforeunload`，見 `lib/draft.ts` |
| 發布／取消發布／刪除的具體後果寫在確認框裡（刪除是真刪，用實心 danger 鈕）| `components/RecordActions.tsx` |
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
| **Content API** `/api/v1/**` | ✅ | **19 支已上線並實跑驗證**（下表）。中英雙語、分頁、快取標頭、404/400 錯誤碼皆已驗；reference block 由後端解析成強型別資料；`/search` 待定 Phase |
| Account API `/api/v1/account/**` | 🟡 | 16 支端點實作完成（`AccountAuthService` + 三支 handler）；登入前的 8 支在 Router 白名單裡跳過 token 檢查，其餘一律驗 member token 並 `no-store` |
| **Admin API** `/api/admin/**` | ✅ | 登入（**帳號 `Username`，不是 Email**；access 15 分鐘 + httpOnly refresh、重放偵測、鎖定）、27 個單元的 CRUD（登記表驅動）、改 slug 寫 301／刪除寫 410（真刪，被參照時回 409）、發布打 revalidate webhook、媒體上傳、會員與樣品申請的狀態機。後台「使用者」單元可直接設定／重設密碼（新帳號必填，至少 12 字元） |
| CI | ✅ | `.github/workflows/api.yml`：建置（0 warning 閘）、87 項測試、publish、檢查產物不含 `local.settings.json`、檢查 migration 與模型同步 |
| 部署 | ✅ | `api.yml`：建置→測試→套 migration（臨時放行 runner IP）→部署→實打 health；`web.yml`：後台 SPA 先建→自建 standalone（`pack-standalone` 壓平＋`check-size` 250MB 閘）→`skip_app_build` 上傳→實打 `/en`、樣式表與 `/admin/` |
| Azure 資源 | ✅ | 見 [docs/azure-deployment.md](docs/azure-deployment.md) 的「已建立的資源」 |

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
| `GET /api/v1/pages/{slug}` | 頁面 + 版塊（privacy 走長文 Body）；reference block 另帶 `reference` 強型別資料 |
| `GET /api/v1/sitemap` | 53 個已發佈網址 + lastmod + **真的有翻譯的語系** |
| `GET /api/v1/redirects` | 241 條啟用中的轉址規則（middleware 用；先前這支不存在，等於轉址全部沒生效） |
| `GET /api/v1/navigation?location=` | 導覽樹（header 3 層 36 項）；`Ref*Id` 已解析成公開路徑 |
| `GET /api/v1/technologies?kind=` | 7 條製程流程（共 27 步）+ 4 條產品法規符合 |
| `GET /api/v1/articles?type=&tag=&category=&solution=&page=` | 分頁文章（12 篇）+ 產品線／產業／標籤 chip |
| `GET /api/v1/articles/{slug}` | 內文、作者、chips、展會側欄、同前綴內的上下篇 |
| `GET /api/v1/news` | `articles?type=news` 的別名（新聞家族四種 Type，6 篇） |
| `GET /api/v1/exhibitions?upcoming=` | 3 場展會，未來場次由近到遠、已結束的由新到舊 |
| `GET /api/v1/faq?category=` | 5 個分類 / 13 題，每題的延伸連結已解析成路徑 |
| `GET /api/v1/certifications?category=` | 9 張認證，含證書 PDF（依 accessLevel 決定回不回網址） |
| `GET /api/v1/downloads?kind=&product=&category=&solution=` | 目前回空陣列——**規格書檔案待客戶提供**（第七節） |
| `POST /api/v1/contact` | 建立詢問單，回 `202` + `INQ-2026-000001`；蜜罐＋IP 限流＋anti-bot 三道防線 |

### 資料層細節

| 項目 | 內容 |
| --- | --- |
| 實體 | `Api/Models/Entities/`（24 檔）；Routable / Addressable / Embedded 三種基底類別 |
| 組態 | `Api/Data/Configurations/`；`SluggedEntityConfiguration` 與 `TranslationConfiguration` 兩個基底吸收掉 70 幾張表的樣板 |
| 已落實的慣例 | slug 用 `Latin1_General_100_CS_AS` + CHECK + 全域 unique；翻譯表 PK `(擁有者Id, Culture)` 且 FK → `Cultures`；enum 存 `tinyint`；時間 `datetime2(3)` 預設 `SYSUTCDATETIME()`；owner triple 的「恰一非 NULL」CHECK；`Members.EmailDomain` 為 PERSISTED 計算欄位 |
| 時間戳 | `AuditingSaveChangesInterceptor`（不用 trigger —— 會與 EF 的 `OUTPUT` 衝突） |
| 密碼 | `Pbkdf2PasswordHasher`：PHC 單欄位字串，支援逐使用者漸進升級（**刻意不跟 NTI 用 BCrypt**，理由見 database.md §14.2） |
| 翻譯 fallback | 列表缺該語系時回退預設語系並回報 `hasRequestedCulture = false`（前台據此不宣告 hreflang）；詳情缺該語系直接 404（§0.2） |
| 種子 | A 層：`Cultures`(2)、`Roles`(2)。B 層：super admin（帳號 `sa@system.local`）、產品線 3、Solutions 7、Pages 11、Locations 3、ContactChannels 3、封鎖網域 27、SiteSettings 9、NavigationItems 36 |
| 內容匯入 | `import-content`（來源 `confirmed-copy.json`，隨 build 複製）：認證 9、FAQ 5/13、產品系列 18、規格列（含系列 chip 與等級表）、製程 7/27、文章 12、展會 3、版塊（含 reference block 的查詢參數） |
| 舊站匯入 | `import-legacy`：212 張圖 → Blob + `MediaAssets`、4 篇 blog → `Articles`(Draft)、241 條 301 |
| 舊站轉址工具 | `tools/crawl-legacy-site.mjs` 爬真實網址；`check-redirects` 報覆蓋率（**241/241 = 100%**，全部導首頁） |
| 測試 | `tests/Api.Tests` **87 項**：慣例守門（EF 模型）、密碼雜湊、後台帳號格式與正規化、語系解析與分頁、公開網址組裝、詢問表單限流、後台登記表與權限表對照 |
| DB 層約束實測 | slug CHECK 擋大寫／底線、unique 擋重複、**刪除後 slug 可重用**、owner triple 擋雙 owner 與零 owner、`EmailDomain` 自動算出、`Cultures` FK 擋未登錄語系 —— 7 項皆如文件所述 |

## 七、擋住的事項

| 項目 | 擋在哪 | 影響 |
| --- | --- | --- |
| ⛔ 認證清單與證書明細 | 等客戶提供 | `Certifications` 多數欄位待補（`IsPlaceholder` 的那張顯示待提供樣式），About／Sustainability／Technologies 三頁共用同一批 |
| ⛔ 版位照片與 partner logo | 等客戶提供 | 目前顯示 mockup 自己的虛線佔位框。舊站 212 張圖已在 Blob，但**內文引用的 2863 個檔名只有約 10% 在匯出裡**，其餘須另外取得 |
| ⛔ 公司歷程（Milestones） | 等客戶提供 | 確認稿是「[Add …]」佔位文字且無年份，`Milestones.Year` 必填，因此沒有建列 |
| ⛔ 規格書檔案（Downloads） | 等客戶提供 | 3 份規格書沒有實際檔案，`Downloads.MediaAssetId` 必填，因此沒有建列 |
| 🟡 產品詳情頁設計 | 確認稿沒有這一頁 | 已接 `GET /v1/products/{slug}`，渲染簡介／說明／規格表；**圖庫、認證與相關下載該端點還沒回**，等補上再加版塊 |
| ⛔ 寄信管道 | 等 Communication Services / SMTP | 驗證信、重設密碼信與詢問單通知信都卡在這裡 |
| ⛔ 繁中文案校稿 | 等客戶 | 翻譯表的 zh-Hant 為暫譯；校稿在後台改，不動程式 |
| ⛔ 訓練型 AI 爬蟲政策 | 等客戶決策 | `app/robots.ts` 目前只放行檢索型，訓練型不列 |
| ⛔ 後台 refresh token 的 cookie | 等後端 | 後台改為 SPA 之後，`fn-admin` 需以 `Set-Cookie` 回 httpOnly refresh token |

---

## 八、下一步的合理順序

1. ~~建 `src/` 的 .NET solution 與 EF Core 模型~~ ✅ 2026-09-08
2. ~~在能跑的 SQL Server 上套用 migration 與 seeder~~ ✅ 2026-09-08（本機 container）
2b. ~~把確認稿文案與舊站資料匯入資料庫與 Blob~~ ✅ 2026-09-08
2c. ~~後端形狀對齊 NTI 的施工標準（Router / ApiResponse / EF+Dapper 雙軌）~~ ✅ 2026-09-08
3. ~~Content API 的 `categories` / `products` / `solutions` / `pages` / `sitemap`~~ ✅ 2026-09-08
3b. ~~補完其餘公開端點：`articles`、`exhibitions`、`faq`、`certifications`、`downloads`、
   `navigation`、`technologies`、`POST /contact`~~ ✅ 2026-09-08
3c. ~~前台改吃 API，刪掉 `apps/web/content/`~~ ✅ 2026-09-08
4. ~~Admin API~~ ✅ 2026-09-08（後台開發時設 `VITE_ADMIN_MOCK=0` 即打真的後端）
4b. 後台在瀏覽器逐畫面驗收（27 個畫面 × 建立／編輯／發布／刪除），並補上
   `legacy-import/run`
5. ~~CI/CD 與 Azure 佈署~~ ✅ 2026-09-08
5b. 上線前的收尾：
   - **版位素材進 `public-media` + 設 repo 變數 `MEDIA_BASE` + 重跑 `web.yml`**
     —— 目前整站破圖，這三步缺一不可（作法見 [docs/azure-deployment.md](docs/azure-deployment.md)）
   - 綁 `www.vicround.com`（DNS + SWA 自訂網域）
   - 把 repo 變數 `SITE_URL` 改成正式網域（robots 才會開放索引；現在 canonical
     與 `sitemap.xml` 仍指向 SWA 預設網域）
   - 預覽網域 `vicround.4webdemo.com`（測試 DNS）：頁面已由 `lib/seo.ts` 強制
     `noindex`（非正式站一律如此）。**但 Cloudflare 的 managed robots.txt 仍是
     `Allow: /`**，蓋掉我們的 `Disallow: /` —— 要在 Cloudflare 關掉它才算兩道防線都在
   - 舊站 301 已在正式環境（實測 `/v1/redirects` 241 筆）✅
6. ~~Account API 與會員專區~~ ✅ 2026-09-11（寄信待接）

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
