# 專案進度總表

> **這份文件是「做到哪裡了」的單一真相來源。** 每完成一項就更新對應那格。
>
> 分工：本檔記錄**狀態**；[CLAUDE.md](CLAUDE.md) 記錄**慣例與檢索地圖**；
> [docs/](docs/) 記錄各子系統的**設計**。三份不要互相抄，各司其職。

**最後更新**：2026-09-06

---

## 一句話現況

**前台網站的版型已完成，後端一行都還沒寫。**

**客戶確認稿的 25 個頁面已全數實作**（`mockup/Rounded Design/` 共 31 個 `.dc.html`，
扣掉 6 個共用元件），色彩、字級、間距、互動逐項對照。對應到 `apps/web` 是 **25 條路由檔中的
19 條**（產品線與產業頁各由一支動態路由服務 3 與 7 個網址）；SEO 與 GEO 的基礎建設
（metadata／hreflang／sitemap／robots／llms.txt／六種 JSON-LD）已就緒並實測通過。
`apps/admin` 是可登入、側欄完整、畫面待實作的 Vite SPA 外框。

**尚未開始**：Azure Functions API、EF Core 與資料庫、CI/CD 與 Azure 佈署。
前台目前吃的是 `apps/web/content/*.ts` 的暫代文案，**不是 CMS**。

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
| 後台 `apps/admin` | 🟡 | 登入 + 側欄 + 27 個畫面的路由骨架；無任何實作畫面 |
| 設計系統 | ✅ | 客戶確認的 `_ds` 已同步進兩個 app，字型自架子集 |
| SEO / GEO | ✅ | metadata、sitemap、robots、llms.txt、JSON-LD 全數實測通過 |
| Content API（`fn-public`） | ⬜ | 未開工 |
| Account API（會員） | ⬜ | 未開工 |
| Admin API（`fn-admin`） | ⬜ | 未開工 |
| 資料庫 / EF Core | ⬜ | 只有 [docs/database.md](docs/database.md) 的規劃 |
| CI/CD 與 Azure | ⬜ | 無 workflow、未建任何 Azure 資源 |

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

| 項目 | 狀態 | 說明 |
| --- | --- | --- |
| 應用外框 | ✅ | Vite + React 19 + react-router，`basename="/admin"`，build 進 `apps/web/public/admin` |
| 不被索引 | ✅ | `robots.txt` Disallow + `index.html` 的 `noindex, nofollow` 雙重排除 |
| 登入頁 | 🟡 | 版面完成；access token 只放記憶體、refresh 靠 httpOnly cookie（**需後端配合 `Set-Cookie`**） |
| 側欄與路由 | ✅ | 27 個畫面依 [docs/cms.md](docs/cms.md) 的六個分區產生，含 `/{type}/:id` 編輯路由 |
| 實際畫面 | ⬜ | 全部是 `Placeholder`，只標出「這個畫面要打哪一支 API」 |

---

## 六、後端與部署

| 項目 | 狀態 | 說明 |
| --- | --- | --- |
| `src/` .NET solution | ⬜ | 尚未建立，無 `.slnx` |
| Content API `/api/v1/**` | ⬜ | 契約見 [docs/cms-api.md](docs/cms-api.md) |
| Account API `/api/v1/account/**` | ⬜ | 同上 |
| Admin API `/api/admin/**` | ⬜ | 同上 |
| EF Core / 遷移 / 種子 | ⬜ | schema 規劃見 [docs/database.md](docs/database.md)（14 個功能單元） |
| CI/CD | ⬜ | 無 `.github/workflows` |
| Azure 資源 | ⬜ | 未建立任何資源 |

---

## 七、擋住的事項

| 項目 | 擋在哪 | 影響 |
| --- | --- | --- |
| ⛔ 認證清單與證書明細 | 等客戶提供 | `content/certifications.ts` 多數欄位是 `[待客戶提供]`，About／Sustainability 的認證卡顯示待提供樣式 |
| ⛔ 版位照片與 partner logo | 等客戶提供 | 目前顯示 mockup 自己的虛線佔位框；照片依 .gitignore 政策不進 GitHub，正式站走 CMS 的 Blob 媒體庫 |
| ⛔ 產品詳情頁設計 | 確認稿沒有這一頁 | `/products/{category}/{slug}` 維持鷹架 |
| ⛔ 會員專區內頁設計 | 確認稿只到 `/member` | `/account/**` 五頁維持鷹架 |
| ⛔ 繁中文案校稿 | 等客戶 | `content/*.ts` 的繁中為暫譯 |
| ⛔ 訓練型 AI 爬蟲政策 | 等客戶決策 | `app/robots.ts` 目前只放行檢索型，訓練型不列 |
| ⛔ 後台 refresh token 的 cookie | 等後端 | 後台改為 SPA 之後，`fn-admin` 需以 `Set-Cookie` 回 httpOnly refresh token |

---

## 八、下一步的合理順序

1. 建 `src/` 的 .NET solution 與 EF Core 模型（[docs/database.md](docs/database.md) 的 14 個功能單元）
2. Content API 先做 `categories` / `products` / `solutions` / `pages` / `sitemap` 五支，讓前台可以拔掉 `content/`
3. Admin API + 後台前三個畫面（Products / Pages / Articles）
4. CI/CD 與 Azure 佈署（[docs/azure-deployment.md](docs/azure-deployment.md)）
5. Account API 與會員專區（需先補設計稿）

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
