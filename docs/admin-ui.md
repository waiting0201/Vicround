# 後台介面設計規範（apps/admin）

這份文件定義 VicRound 自建 CMS 後台（`apps/admin`）的介面語言：版面骨架、27 個畫面
歸類、清單頁／編輯頁的固定樣式、元件清單與色彩語意。目的是讓實作 27 個畫面的人
**不需要每個畫面重新做設計判斷**——版型、按鈕位置、狀態顏色、文案語氣都已經決定好，
剩下的是把 `docs/database.md` 的欄位塞進固定的骨架。

配套產出：`apps/admin/src/ui/*.tsx` 是本規範對應的可編譯元件庫（React 19 +
TypeScript + Tailwind v4，只用 `apps/admin/src/ds/tokens/*.css` 既有的 design token，
沒有新增任何 npm 依賴）。本文件與元件庫互為對照——規範裡提到的每個元件都能在
`src/ui/` 找到同名檔案。

> 讀這份文件前建議先讀 [docs/cms.md](cms.md)（後台技術棧、六個分區、雙語編輯規則）
> 與 [docs/cms-api.md](cms-api.md)（Admin API 契約）。畫面欄位的最終依據永遠是
> [docs/database.md](database.md)——本文件只定版型，不重複列欄位。

---

## 1. 設計原則

1. **密度優先於留白。** 編輯者一天要看幾十列產品、幾百則詢問單，不是看一次的行銷頁。
   表格行高、欄位間距全部往緊裡調（見第 2 節「間距節奏」），前台那套「大量留白、
   `--section-pad-y` 動輒 64–128px」的行銷頁節奏在後台完全不用。
2. **狀態要能被掃過去，不能靠讀。** 一個編輯者同時開著會員審核佇列、樣品申請看板、
   詢問單三個分頁切換，每個都在追蹤「狀態」。所以 Draft/Published/會員狀態/樣品狀態
   一律用同一套 `Badge` 語意色（見第 7 節），顏色一致，眼睛掃過表格就能分類，
   不用逐字讀。
3. **雙語編輯的「缺漏」必須是視覺上的，不能是要點進去才發現。** 後台介面是繁體中文，
   但它管理的內容有 en / zh-Hant 兩份。翻譯缺漏（`docs/cms.md` 明訂的需求）用
   `Tabs` 的黃點標記在分頁列表就看得到，清單頁也要能篩選「缺 zh-Hant」——這是
   [docs/cms.md](cms.md#admin-ui-stack) 白紙黑字要的功能，不是加分項。
4. **危險動作要有摩擦力，安全動作不要。** 刪除、封存、拒絕會員、停權——這些不可逆
   或影響他人的動作一律過 `ConfirmDialog`（`tone="danger"`）。但改 slug 這種「系統會
   自動處理好」的動作（`docs/database.md §0.5` 保證寫 301）只給提示文字，不擋一個
   確認框——擋不該擋的動作，摩擦力會被使用者訓練成「看到框就狂點確定」，反而讓
   真正危險的框失去意義。
5. **元件比畫面多活得久。** 27 個畫面會隨產品需求增減，`src/ui/` 的元件不會。所有
   元件維持「樸素、單一職責」（第 6 節逐一列出 props），不做「一個元件猜所有情境」
   的過度抽象——例如 `Badge` 只管顏色，不管哪個 enum 對應哪個顏色；那張對照表放在
   第 7 節，由使用元件的那一頁自己決定。

---

## 2. 版面骨架

### 2.1 既有結構（不變）

`apps/admin/src/components/Shell.tsx` 已經是側欄＋內容區的骨架，`lib/menu.ts` 是
側欄與路由的唯一真相來源，兩者維持原樣，本規範是在既有骨架上補齊視覺與互動細節。

```
┌──────────────┬─────────────────────────────────────────────┐
│ VicRound CMS │                                               │
│──────────────│  (頂欄：檢視公開站 / 環境標示 / 使用者選單)   │
│ 內容          │───────────────────────────────────────────────│
│  產品線       │                                               │
│  產品         │   PageHeader（標題 + 麵包屑 + 動作區）        │
│  ...          │───────────────────────────────────────────────│
│──────────────│                                               │
│ 資源          │   Toolbar（搜尋 / 篩選）                      │
│  ...          │───────────────────────────────────────────────│
│──────────────│                                               │
│ 永續 / 公司 / │   Table 或該畫面型別對應的主體                │
│ 營運 / 站台   │                                               │
│              │───────────────────────────────────────────────│
│              │   Pagination                                  │
└──────────────┴─────────────────────────────────────────────┘
```

### 2.2 頂欄補齊項目

現有頂欄只有「檢視公開站」「登出」。補上：

- **環境標示**：非正式環境（`VITE_ADMIN_API_BASE` 指向非正式 API，或有
  `VITE_ADMIN_MOCK=1` 之類的旗標）在頂欄最左端放一顆 `Badge tone="warning"`
  文字「測試環境」，避免編輯者在測試環境按了「發布」以為是正式站。**登入頁
  （`routes/Login.tsx`）也要顯示同一顆 Badge**——編輯者對「這是哪個環境」的
  第一印象在登入頁就形成了，等進了 Shell 才提示已經晚了一步。
- **麵包屑**：不放頂欄，放進每個畫面的 `PageHeader`（見 3.2、5.2）——原因是麵包屑
  的內容依畫面而定（清單頁只有一層，編輯頁要有「← 回列表」),放頂欄會變成要嘛太空
  要嘛擠。
- **使用者選單**：把現有「登出」文字按鈕換成一顆頭像／姓名縮寫的 `IconButton`
  或簡易下拉，內容含「顯示登入者 Email」「登出」。`adminOnly` 選單項目
  （`site-settings`、`users`）在 Editor 角色登入時於側欄整條隱藏，不是顯示但
  disabled——不存在的選單比看得到按不動更少困惑。下拉選單開啟時套用
  `admin-pop-in`（見 2.6）微幅淡入位移，避免選單「憑空跳出」。
- **側欄收合鈕移到側欄底部**（原本跟品牌字並排在頂端）：收合後品牌區只剩一顆
  識別色塊（見 2.6 `BrandMark`），旁邊擠一顆收合鈕視覺上會打架；移到側欄最下方、
  全寬一列，收合／展開兩種狀態下都有明確、不擁擠的落點，也是多數同類後台
  （GitHub、Linear…）的慣例位置，使用者不用重新學一個新位置。

### 2.3 內容區最大寬度與間距節奏

- **清單型畫面**（Table 為主體）：內容區**不設 max-width**，跟著側欄以外的可用寬度
  走（`flex-1`）。表格欄位多（Products 有 Slug/Code/Brand/Category/Status/Featured…），
  限制寬度只會逼欄位換行。
- **表單型畫面**（編輯頁的「基本資料」卡、site-settings）：單一 `Card` 內容寬度
  上限抓 **720px**，超過這個寬度一行字太長，掃描表單欄位會變慢。多欄表單（例如
  Slug + Status 並排）用 `grid grid-cols-2 gap-4`，仍在 720px 容器內。
- **間距**：一律用 `ds/tokens/spacing.css` 的 4px 基準刻度，但只取小尺寸——
  `gap-2`(8px)／`gap-3`(12px)／`gap-4`(16px) 是表單與工具列的主力，`p-5`(20px) 是
  卡片與抽屜的標準內距。`--space-16` 以上、`--container-pad`、`--section-pad-y`
  這些前台行銷頁用的大尺度**後台不用**。
- **表格列高**：`py-3` + `text-sm`（約 44px），已寫成 `index.css` 的
  `--admin-row-h: 44px` 並在 `Table.tsx` 的 `<tr>` 直接用
  `h-[var(--admin-row-h)]` 鎖住——這個變數跟側欄寬、頂欄高一起收在
  `apps/admin/src/index.css`，不進 `ds/`（見下方說明）。不做前台那種大圖卡片式
  列表。

`--admin-sidebar-w`（240px）／`--admin-sidebar-w-collapsed`（64px）／
`--admin-topbar-h`（56px）／`--admin-row-h`（44px）四個變數定義在
`apps/admin/src/index.css`，**不放進 `ds/`**：`ds/tokens/*` 是品牌層級的色彩／
字級／圓角／陰影，前台後台共用；但「側欄多寬」「一列多高」是後台這個應用程式
自己的版面決定，前台網站沒有對應概念可以共用，寫成變數只是為了讓
`Shell.tsx`／`Table.tsx` 的排版數字有名字、有理由可查，不是要拿去給前台用。

### 2.4 響應式（1280 / 1024 / 768）

後台的主要使用情境是桌機（見任務前提「強光辦公室看一整天表格」），響應式只需要
「不壞掉」，不需要重新設計版型：

| 寬度 | 行為 |
| --- | --- |
| **≥ 1280px** | 標準版面：側欄固定 `--admin-sidebar-w`（240px，非 Tailwind 內建的
  `w-64` 256px——見上方說明）＋ 內容區。展開／收合寬度變化套用
  `admin-transition-slow`（200ms，見 2.6），不是瞬間跳動。 |
| **1024–1280px** | 側欄收合成 `--admin-sidebar-w-collapsed`（64px）只顯示 icon（`MenuItem.icon` 欄位已在 `menu.ts` 落地，每一項都配好圖示）。收合狀態存 `localStorage`，不是斷點自動切換，避免使用者手動展開後被視窗微調又收回去。收合鈕位置見 2.2。 |
| **< 768px** | 側欄改為預設隱藏，頂欄左側加一顆選單按鈕，點開時**直接重用 `ui/Drawer.tsx`**（`width="280px"`）把 `MENU` 內容滑出——不用另刻一套 mobile nav，Drawer 本來就是「側滑面板＋Esc關閉＋焦點鎖定」，語意完全符合。 |

表格在窄螢幕一律 `overflow-x-auto`（`Table` 元件已內建），不做「窄螢幕改卡片式」的
響應式表格——那對「掃描大量列」的密度優先原則是反效果，且後台幾乎不會有人用手機
操作。

### 2.6 品牌識別標記與動態節奏

- **`BrandMark`**（`apps/admin/src/components/BrandMark.tsx`）：側欄品牌區與登入頁
  共用的識別色塊——品牌紫底、`chamfer` 切角（`ds/tokens/radii.css` 既有的
  `.chamfer` 工具類，之前只有按鈕在用）、置中一個「V」字。專案沒有正式 Logo
  檔案（CIS 手冊只給色號字體規則，商標線稿不在後台授權範圍內），所以這**不是**
  冒充官方 Logo，做法比照既有的使用者頭像（單字圓形色塊），只是角形換成
  `chamfer` 呼應 CIS 手冊「V」的幾何語彙。等客戶提供正式 Logo 檔時直接換掉這個
  元件的內容即可，`Shell`／`Login` 呼叫端不用改。
  - `chamfer` **只用在 `BrandMark` 這一個地方**，不擴大套用到按鈕／卡片／表格。
    密集表格裡的按鈕要的是「一眼認得出是按鈕」的乾淨矩形，每顆都秀切角只會把
    真正的品牌識別淹沒在雜訊裡——這條界線刻意寫下來，避免下一個人看到
    `.chamfer` 覺得「這裡好像也可以用」。
  - 側欄收合成 64px 時 `BrandMark` 拿掉 `wordmark`，只留識別色塊置中——不是留白，
    因為使用者看側欄的第一件事是「這是不是我要的系統」，收合狀態不該把整個
    品牌識別藏起來。
- **登入頁的品牌與環境表情**：`routes/Login.tsx` 用 `admin-auth-backdrop`
  （`index.css`）鋪一層極細網格＋品牌紫柔光暈的純 CSS 背景，只有登入頁用——
  這一頁使用者一天只看一次（或幾次），跟密度優先的 27 個工作畫面是完全不同的
  節奏，可以承載多一點品牌表情；`Card` 也在這裡用 `elevation="md"`（見第 6 節
  `Card` 的新 prop）而非 27 個工作畫面預設的 `xs`，因為它是畫面上唯一的焦點，
  值得浮起來。
- **`AuthSplash`**（`apps/admin/src/components/AuthSplash.tsx`）：重新整理後拿 refresh
  cookie 換 token 的那一瞬間，鋪的是與登入頁同一張 `admin-auth-backdrop`——這一刻
  使用者正要落到登入頁或後台，兩邊都是「進入」的畫面，不該先閃一片白底。品牌標記
  延遲 250ms 才淡入，理由見 4.6。
- **動態節奏**：`ds/tokens/shadows.css` 定義了 `--duration-*`／`--ease-*`，
  但截至上一版視覺 pass 前，整個 admin 沒有任何地方用到——hover／focus／下拉
  選單開合全部沿用 Tailwind 預設的 150ms。這次補上 `index.css` 的
  `.admin-transition`（120ms，hover／tab 切換／下拉選單）、
  `.admin-transition-slow`（200ms，側欄收合這種有位移的動作）、
  `.admin-pop-in`（下拉選單開啟的淡入位移）、`.admin-toast-in`（Toast 進場），
  統一借用 ds 既有的節奏，不再是兩套時間曲線混用。三者都包了
  `prefers-reduced-motion: reduce` 的退場開關。
  - **`Drawer`／`Dialog` 刻意沒有加開合動畫**——這兩個是編輯者一天要開關幾十次
    的工作元件（進入編輯、跳確認框），密度優先原則下「快、沒有等待感」比
    「開合順暢」更重要，且目前的條件渲染（`if (!open) return null`）沒有
    退場動畫的掛勾，硬要做需要額外的卸載延遲狀態機，投入產出不成比例。
    Toast 與下拉選單不受這條限制，因為它們出現頻率低很多，一點緩入不會累積
    成「每次都要多等一下」的感覺。

---

## 3. 畫面型別

26 個畫面（`apps/admin/src/lib/menu.ts` 的 `ALL_ITEMS`）收斂成 **7 種型別**。分類依據
兩個既有事實，不是憑感覺分：`menu.ts` 的 `hasDetail`（有沒有獨立 `/{type}/:id` 路由）
與 `docs/database.md` 的表分類（Routable ／ Addressable ／ Embedded、有沒有
`*Translations`）。

### 3.1 型別定義

| 型別 | 說明 | 判準 |
| --- | --- | --- |
| **A. 清單＋獨立編輯頁** | 列表 + 有自己路由的完整編輯頁（`/{type}/:id`），含 en/zh-Hant 分頁與 SEO 欄位 | `hasDetail: true` 且實體內容量大（Routable / 主要 Addressable 表） |
| **B. 清單＋編輯抽屜（含語系）** | 列表 + 右側抽屜編輯，抽屜內有 en/zh-Hant 分頁 | 無 `hasDetail`，實體有 `*Translations` |
| **C. 清單＋編輯抽屜（單語）** | 列表 + 右側抽屜編輯，抽屜內無語系分頁 | 無 `hasDetail`，實體沒有 `*Translations`（純結構資料） |
| **D. 排序清單（樹狀）** | 依 `Location` 分頁 + `ParentId` 樹狀縮排 + 抽屜編輯（含語系） | 唯一有 `ParentId` 自關聯又要跨分頁管理的實體 |
| **E. 審核佇列** | 篩選表格（預設顯示待處理）+ 獨立詳情頁 + 狀態動作按鈕 | 有審核／處理狀態機的營運資料 |
| **F. 看板** | 依狀態分欄的卡片牆 + 獨立詳情頁 | 有多階段履行流程（不只是「審核／不審核」二選一）的營運資料 |
| **G. 單一設定表單** | 沒有列表，整頁就是分區表單 | 只有 `site-settings` 這一種（key-value 表，不是列表） |

> **沒有「媒體庫」這種畫面。** 檔案一律從用到它的欄位直接上傳（`FieldControl` 的
> `MediaControl`／`MediaListControl`），上傳完就綁在那一格。理由是編輯者要的從來
> 不是「管理一櫃檔案」，而是「這個欄位要放這張圖」——先去別的畫面把檔案準備好、
> 再回來挑，中間那一趟沒有產生任何價值。`media` 資源本身仍在（欄位要靠
> `GET /admin/media/{id}` 讀回檔名與縮圖），只是不再有自己的入口。

### 3.2 27 個畫面對照表

| 分區 | 畫面（`menu.ts` label） | `path` | 型別 | 備註 |
| --- | --- | --- | --- | --- |
| 內容 | 產品線 | `categories` | A | `docs/database.md §02` |
| 內容 | 產品 | `products` | A | 含 `SpecificationRows`／`ProductImages` 子區塊（見 5.4） |
| 內容 | 產業解決方案 | `solutions` | A | |
| 內容 | 文章 | `articles` | A | 清單需要「News／Insight／技術文章」`Type` 篩選（決定 URL 前綴，改值要走 301 提示，同 slug） |
| 內容 | 頁面與版塊 | `pages` | A | 編輯頁另有「版塊」子區塊，見 5.4 |
| 資源 | 展會 | `exhibitions` | A | 日期驅動可見性，清單要能看「即將登場／已結束」 |
| 資源 | FAQ 分類 | `faq-categories` | B | |
| 資源 | FAQ 題目 | `faq-items` | A | `Ref*` 關聯欄位（見 5.3 的關聯選擇器） |
| 資源 | 下載中心 | `downloads` | A | `AccessLevel` 是核心欄位，見 7.3 |
| 資源 | 文章標籤 | `article-tags` | B | |
| 資源 | 作者 | `authors` | B | |
| 永續 | 認證管理 | `certifications` | A | 同時餵 Sustainability／About／Technologies／CertificationDialog（四處共用），編輯時提示「這筆資料同時顯示在 4 個頁面」 |
| 公司 | 里程碑 | `milestones` | B | 依 `Year`／`Month` 排序，抽屜內另有「上移／下移」（見 4.4） |
| 公司 | 據點 | `locations` | B | |
| 公司 | 客戶見證 | `testimonials` | B | `AuthorName` 可留空（未取得具名授權時） |
| 公司 | 合作品牌 | `partner-brands` | B | |
| 公司 | 聯絡管道 | `contact-channels` | B | |
| 公司 | 製程流程 | `process-flows` | A | 編輯頁內有 `ProcessSteps` 子清單（見 5.4），5 種 `Kind` 共用同一張表 |
| 營運 | 會員審核 | `members` | E | 見 5.5 |
| 營運 | 樣品申請 | `sample-requests` | F | 見 5.6 |
| 營運 | 詢問單 | `contact-inquiries` | E | 見 5.5 |
| 營運 | 企業網域規則 | `business-domains` | C | `Domain` / `Rule` / `Note`，無翻譯欄位 |
| 站台 | 導覽選單 | `navigation` | D | 見 5.7 |
| 站台 | 轉址（301） | `redirects` | C | `FromPath`／`ToPath`／`StatusCode`，見 5.8 的碰撞檢查提示 |
| 站台 | 站台設定 | `site-settings` | G | `adminOnly` |
| 站台 | 後台使用者 | `users` | C | `adminOnly`；抽屜內是「角色勾選 + 帳號啟用開關」，不含密碼欄位（密碼由使用者自己在登入後修改，Admin 不代改密碼） |

型別 A 共 10 個、型別 B 共 8 個、型別 C 共 3 個、型別 D／E／F／G 各 1–2 個，
合計 27 個，與 `ALL_ITEMS.length` 一致。

---

## 4. 清單頁樣式（型別 A / B / C / E 共用的列表部分）

### 4.1 工具列（`Toolbar`）

固定順序（由左至右）：`SearchInput` → 篩選 `Select`（依實體而定，例如 Products 的
`Category` 篩選、Articles 的 `Type` 篩選）→ 「翻譯缺漏」篩選（見 4.5）→
`ToolbarSpacer` → 批次動作（若有勾選列，見 4.6）。

**「新增{實體}」不放工具列**，它的常駐位置是 `PageHeader` 的動作區（2026-09-12 修正：
兩邊都放的話，同一頁上下相隔約 100px 會出現兩顆一模一樣的主要按鈕，使用者得停下來
判斷它們是不是同一件事）。`ResourceList` 的 `actions` 因此只餵給 `Table` 的空狀態——
清單是空的時候，出口要出現在使用者的視線落點上，而不是頁面頂端。

按鈕文案固定寫「新增{實體}」，例如「新增產品」，不要只寫「新增」——27 個畫面如果都
寫「新增」，使用者用瀏覽器分頁切換時無法從標題快速確認自己在哪個畫面。

### 4.2 表格欄位規則

- **第一欄永遠是可辨識名稱**（`Name`／`Title`／`Email`／`RequestNumber`），且是唯一
  可點擊進入編輯的欄位視覺提示（用 `text-[var(--fg-1)] font-medium`，其餘欄位用
  一般字重）。
- **狀態欄一律用 `Badge`**，靠左對齊（不要靠右，狀態是要被掃描的資訊，不是數字）。
- **語系完整度欄**（型別 A／B 才有）：一個小圖示欄，顯示 `globe`
  圖示＋已翻譯語系數，例如「2/2」（綠）或「1/2」（`Badge tone="warning"`)。
- **操作欄固定在最右**，用 `IconButton`（`pencil` 開編輯 / `trash-2` 刪除），
  型別 A 的「編輯」直接是整列可點擊（`onRowClick`），操作欄只留「刪除」。
- **數字／日期靠右對齊**（`align: 'right'`），文字靠左——這是最基本的表格判讀慣例，
  27 個畫面要一致。

### 4.3 分頁

`Pagination` 元件，`pageSize` 預設 **50**（對齊 `docs/cms-api.md`「Pagination is
mandatory」的預設上限）。不做「捲動載入更多」——密集表格配捲動載入會讓使用者失去
「這批總共幾筆」的感覺，且無法回到瀏覽器上一頁保留頁碼。

### 4.4 批次排序

只有 `SortOrder` 有實際影響前台呈現的實體才需要（型別 B 的公司資訊五張表、
`ProcessSteps`、`ContentBlockItems` 等）。**用上移／下移兩顆 `IconButton`
（`chevron-up` / `chevron-down`），不做拖曳排序**——原因：

1. 專案不裝任何拖放套件（不裝 dnd-kit 之類），手刻符合無障礙（鍵盤可操作、
   螢幕閱讀器讀得出「上移」）的拖曳排序成本高、容易做出只能滑鼠操作的半殘版本。
2. 上移／下移的操作結果與拖曳完全等價（都是改一個整數 `SortOrder`），使用者心智
   負擔更低，且天生鍵盤可達。
3. `Icon.tsx` 保留了 `grip-vertical` 圖示——**留給實作階段**：如果之後想升級成
   拖曳，視覺上的把手已經有了，只是先不接拖曳邏輯。

排序欄只在**沒有啟用搜尋、篩選、欄位排序**時出現在表格最左側（一欄小小的
上下箭頭）；一旦使用者打了關鍵字或點了欄位排序，這欄自動隱藏並用一行提示
（`text-xs text-[var(--fg-3)]`）「清除搜尋與排序即可調整順序」——因為「排序」在
搜尋結果裡沒有意義（使用者看到的不是完整、依 SortOrder 排列的清單）。

### 4.5 翻譯缺漏篩選

型別 A／B 的 `Toolbar` 固定加一顆 `Select`（選項：全部／缺 zh-Hant／缺 en），
對應 `docs/cms.md` 明訂的「列表頁可用『缺 zh-Hant』篩選」。前端送出
`?missingCulture=zh-Hant` 之類的查詢參數（實際參數名由打 API 的那一層決定，
UI 只負責提供這顆篩選器）。

### 4.6 空狀態／載入中／錯誤三態

三態全部**內建在 `ui/Table.tsx`**，不需要每個畫面各自判斷，見第 6 節 `Table` 的
props（`loading` / `error` / `rows.length === 0`）。文案規則見第 8 節。

沒有走 `Table` 的畫面（詳情頁、看板、設定頁、抽屜內容）一律用 `LoadingBlock`
（`ui/Loading.tsx`），**不要各自寫一行置中的「載入中…」**——每頁自己決定留白與字級的
結果，是切換畫面時載入狀態長得都不一樣，像是不同的系統在回應。

重新整理後換 token 的那一刻（`App.tsx` 的 `RequireAuth`）用 `AuthSplash`：底色與登入頁
同一張，品牌標記**延遲 250ms 才出現**。refresh 通常幾十毫秒就回來，立刻畫一個 logo
只會變成一次閃爍；撐過 250ms 才是真的在等，這時才需要告訴使用者系統沒當掉。

---

## 5. 編輯頁樣式

### 5.1 型別 A（獨立編輯頁）整體版面

```
┌─────────────────────────────────────────────────────────┐
│ ← 回列表  ›  {實體名稱}                                    │  PageHeader
│ {顯示名稱或「新增中」}          [刪除] [取消發布/發布] [儲存] │
├─────────────────────────────────────────────────────────┤
│ Card「基本資料」（不分語系）                                 │
│   Slug、Status、SortOrder、關聯選擇器（Category/Parent…）、  │
│   Hero 圖片、旗標（IsFeatured/IsNew…）——依實體而定           │
├─────────────────────────────────────────────────────────┤
│ Tabs：English ● │ 繁體中文 ⚠                                │
│ Card「內容（{culture}）」                                    │
│   Name/Title、Summary、Description（Textarea 暫代富文字）、  │
│   SEO 區塊（SeoTitle/SeoDescription/SeoKeywords，預設收合）  │
├─────────────────────────────────────────────────────────┤
│ （若實體有子清單，如 SpecificationRows／ProcessSteps）        │
│ Card「規格列」/「步驟」— 見 5.4                              │
└─────────────────────────────────────────────────────────┘
```

### 5.2 基本資料卡 vs 語系分頁卡：怎麼切

判準直接對齊 `docs/database.md` 的 base table／`*Translations` 分法：**base 表的
欄位進「基本資料」卡，`*Translations` 表的欄位進語系分頁卡。** 不需要每個實體另外
判斷——資料庫已經幫忙分好了。SEO 四欄（`SeoTitle`/`SeoDescription`/`SeoKeywords`/
`OgImageMediaAssetId`）雖然在 `*Translations` 表裡，但 `OgImageMediaAssetId` 是媒體
選擇器、不是文字輸入，跟其他三個文字欄位放在同一個可收合的「SEO」子區塊
（預設收合，因為多數人不會每次都改）。

### 5.3 翻譯缺漏的視覺標示

- `Tabs` 的 `indicator="warning"`（黃點）——只要該語系分頁一次都還沒被儲存過就標記，
  跟「內容是否完整」無關（不做逐欄位檢查「還缺哪個欄位」那麼細，缺一整份翻譯
  跟缺一個欄位是兩件事，後者由必填欄位的紅字錯誤處理，見 `Field`）。
- 分頁面板頂端額外放一條 `Badge tone="warning"` 加文字「此語系尚未建立翻譯」——
  黃點在分頁列可能被忽略，切進分頁後要再提醒一次使用者「這是空的，不是資料遺失」。
- 清單頁的「語系完整度」欄（4.2）是同一份資料的彙總視圖。

### 5.4 關聯欄位與子清單

- **單一關聯**（`CategoryId`、`ParentProductId`、`AuthorId`…）：用 `Select`，選項
  文案顯示可辨識名稱而非 Id（例如顯示「Optical Film」不是「3」）。
- **多對多關聯**（`ProductSolutions`、`ArticleTags`…）：用一組 `Checkbox` 清單
  （選項不多、如 3 條產品線／7 個產業）或帶篩選的多選 `Select`（選項多、如
  Article ↔ Products）。**不做 tag-input 元件**——那需要處理鍵盤事件、
  autocomplete、多選狀態三件事疊在一起，複雜度不對稱地高於「勾選清單」，
  而後台的多對多選項數量都在可勾選範圍內（最多幾十個）。
- **Reference block**（`docs/database.md §09`，例如「插入認證清單」）：編輯者選
  分類與數量，**不是**打開一個文字編輯器貼證書內容。UI 是一個
  `Select`（block 類型）+ 依類型變化的參數表單（例如 `CertificationList` 選
  `Category` + 顯示筆數），存進 `SettingsJson`。**這塊留給實作階段**依
  `BlockType` 白名單（`docs/database.md §16`）逐一設計參數表單，本規範只定
  「選項式 UI，不是自由文字」這個原則。
- **子清單**（`SpecificationRows`／`ProcessSteps`／`ContentBlockItems`）：編輯頁內
  用一個 `Card`，內容是精簡版 `Table`（無分頁、無搜尋，該實體通常只有個位數到
  十幾列）＋ 每列右側「上移／下移／刪除」＋ 底部「新增一列」`Button`。子清單的
  新增／刪除／排序**不需要獨立呼叫 API**（不像子清單有自己的 `/{type}/:id`）——
  整份子清單隨父層「儲存」一起送出（陣列形式），這樣使用者可以先亂排、覺得不對
  就整頁不儲存離開，不會留下半套已經送出的中繼狀態。

### 5.5 型別 E：審核佇列（`members`／`contact-inquiries`）

- 清單預設篩選在「待處理」狀態（`members` 是 `PendingApproval`；
  `contact-inquiries` 是 `New`），且**依 `CreatedAt` 由舊到新排序**（佇列語意——
  先來先審），不是預設「最新在上面」。
- 表格操作欄不是單純「編輯」，而是依狀態給對應的快速動作
  `IconButton`（例如 `members` 待審核列直接給 `check`（核准）/`x`（拒絕）兩顆），
  點擊快速動作一律過 `ConfirmDialog`（拒絕、停權需要填 `ReviewNote`，所以拒絕
  的確認框內含一個 `Textarea`，不是純文字確認）。
- 整列可點擊進入 hasDetail 的獨立詳情頁（完整資訊 + 全部歷史時間戳
  `SubmittedAt`/`ApprovedAt`/... 依 `docs/database.md §0.7` 用逐欄位時間戳表示
  歷程，UI 上就照時間戳欄位有值與否畫一條簡單的時間軸，不用另外查歷程表）。
- 詳情頁的動作按鈕位置比照 5.1 的 PageHeader 動作區，但按鈕內容換成該實體的狀態
  轉換動作（核准／拒絕／停權／重新啟用，或 `contact-inquiries` 的
  處理中／已回覆／結案／標記垃圾訊息）。

### 5.6 型別 F：看板（`sample-requests`）

```
┌────────┬────────────┬────────┬────────┬──────────┐
│ 已送出  │  審核中     │ 已核准  │ 已出貨  │  已送達   │
│ (12)   │   (5)      │  (3)   │  (2)   │   (8)    │
│ ┌────┐ │  ┌────┐    │ ┌────┐ │ ┌────┐ │ ┌────┐   │
│ │卡片│ │  │卡片│    │ │卡片│ │ │卡片│ │ │卡片│   │
│ └────┘ │  └────┘    │ └────┘ │ └────┘ │ └────┘   │
└────────┴────────────┴────────┴────────┴──────────┘
```

- 只顯示「進行中流程」的 5 個狀態欄（`Submitted`／`UnderReview`／`Approved`／
  `Shipped`／`Delivered`）；`Draft`／`Rejected`／`Cancelled` 不常駐佔欄位，改由
  看板上方一個 `Select`「顯示：進行中 / 全部 / 已中止」切換——8 欄的看板在
  1280px 寬螢幕會擠到看不清楚卡片內容，且「草稿」「已取消」通常不是編輯者每天
  要盯的東西。
- 卡片內容：`RequestNumber`、`Members.CompanyName`、品項數量、`SubmittedAt`
  相對時間、`Carrier`/`TrackingNumber` 是否已填（用一個小 `Badge` 提示「未填運送
  資訊」，`Shipped` 狀態卻沒有 `TrackingNumber` 是需要被看到的異常）。
- 看板**不支援拖曳卡片跨欄變更狀態**（同 4.4 的拖曳決策），卡片右上角一顆
  `more-horizontal` `IconButton` 開小選單列出「下一個合法狀態」（狀態機定義見
  `docs/database.md §14.4`，例如 `UnderReview` 卡片只能推進到 `Approved` 或
  `Rejected`，選單不列出不合法的跳轉），選定後過 `ConfirmDialog`。
- 點卡片本體（非選單）進入 hasDetail 的獨立詳情頁：出貨地址、`SampleRequestItems`
  子清單（比照 5.4 子清單樣式，但這裡多數欄位唯讀，因為明細是會員送出時的快照）、
  `InternalNote`（後台限定，`Textarea`）。

### 5.7 型別 D：排序清單（`navigation`）

```
Tabs: Header │ Footer │ FooterLegal │ Social │ SearchChip
┌─────────────────────────────────────────────┐
│ ▸ Products                          [↑][↓][✎]│
│    ▸ Optical Film                   [↑][↓][✎]│
│    ▸ Textile & Foam                 [↑][↓][✎]│
│    ▸ Acoustic                       [↑][↓][✎]│
│ ▸ Solutions                         [↑][↓][✎]│
│ ▸ Technologies                      [↑][↓][✎]│
│                                    [+ 新增項目] │
└─────────────────────────────────────────────┘
```

- 最外層用 `Tabs` 切換 `NavigationLocation`（5 個值），**每個 Location 各自是
  獨立的排序空間**（`SortOrder` 不跨 Location 比較）。
- 樹狀縮排：不用 `Table`（`Table` 是平面欄位表格，不適合表達縮排階層），改用
  一個手刻的清單（`Card` + 逐列 `flex` + `paddingLeft: depth * 20px`），子項目
  （`ParentId` 非空）縮排一階。上移／下移**只在同一層（同 `ParentId`）內移動**。
- 編輯（`pencil`／或整列可點擊）開 `Drawer`，內容含 `LinkType` 決定的條件欄位
  （`Internal`/`External`/`Anchor`/`EntityRef`/`ContactModal`，切換 `LinkType`
  時用 `Select` 選了之後才顯示對應的下一個欄位，其餘 `LinkType` 的欄位不佔畫面）
  ＋ en/zh-Hant 分頁（`Label`/`Note`/`MenuTitle`/`AriaLabel`）。

### 5.8 型別 C 的補充：`redirects` 的碰撞提示

`redirects` 抽屜的 `FromPath` 欄位在**其他任何實體改 slug 時是唯讀新增來源**
（正常情況下 301 是系統自動寫入，`docs/database.md §0.5`），這個畫面是給人工需要
時（例如舊站遷移、非系統自動情境）手動補登。存檔前若偵測 `ToPath` 會造成鏈或環
（`docs/database.md §10` 的「不得產生鏈／環」規則），用 `Field error` 直接擋在
表單層級，不是送出後才報 API 錯誤——這是少數需要**前端也做業務規則檢查**的畫面，
因為錯誤訊息（「這會產生轉址鏈，已自動指向最終目標 `/foo/bar`」）比單純擋下更有
幫助，值得前端先算一次。

### 5.9 未存變更的離開攔截

**這裡是一個需要主 agent 明確決定的架構問題，本規範先把兩個選項與建議寫清楚：**

- `App.tsx` 目前用 `<BrowserRouter>` + `<Routes>`（declarative mode）。
  react-router v7 的 `useBlocker`（攔截站內導覽、跳出「有未存變更」提示）**只在
  data router**（`createBrowserRouter`/`RouterProvider`）下可用，declarative
  router 不支援。
- **建議**：把 `App.tsx` 遷移到 `createBrowserRouter`（改動集中在 `App.tsx`
  一個檔案，`Shell`/`Placeholder`/路由清單本身不用大改），換取乾淨的
  `useBlocker` 支援。這是本規範建議但**不屬於本次「元件庫」交付範圍**的改動，
  請主 agent 在實作型別 A／D／E／F 的編輯頁前一併評估。
- 若暫不遷移，至少做兩層退而求其次的保護：
  1. `window.addEventListener('beforeunload', ...)`——攔得住整頁關閉／刷新
     （瀏覽器原生提示，文字不可自訂）。
  2. 側欄／麵包屑的每個導覽連結點擊時，若目前頁面有 dirty 狀態，先跳
     `ConfirmDialog`（「你有尚未儲存的變更，離開會遺失」）再放行導覽——這需要
     一個共享的「目前頁面是否 dirty」旗標，可以先簡化成一個模組層變數
     （比照 `lib/api.ts` 的 `accessToken` 做法），不需要完整的 context。

---

## 6. 元件清單

以下對照 `apps/admin/src/ui/*.tsx`。每個元件檔案開頭都有繁體中文的決策說明
（「為什麼這樣做」），這裡只列介面形狀與使用時機，細節以原始碼為準。

| 元件 | 檔案 | 用途 | 關鍵 props | 狀態 |
| --- | --- | --- | --- | --- |
| `Button` | `Button.tsx` | 主要／次要／低調／危險四種按鈕 | `variant`('primary'\|'secondary'\|'ghost'\|'danger')、`size`('sm'\|'md')、`loading`、`icon` | hover／disabled／loading（spinner 取代 icon，文字不變寬度） |
| `IconButton` | `IconButton.tsx` | 純圖示動作（表格列操作、抽屜關閉） | `icon`(IconName)、`label`(必填, aria-label)、`size`、`variant`('ghost'\|'secondary') | hover／disabled |
| `Input` | `Input.tsx` | 單行文字輸入 | 原生 `input` 全部 props + `error` | focus（邊框變品牌色）／error（邊框變危險色）／disabled |
| `Textarea` | `Textarea.tsx` | 多行文字／HTML 原始碼（暫代富文字，見 5.1） | 原生 `textarea` 全部 props + `error` | 同 `Input` |
| `Select` | `Select.tsx` | 單選下拉 | `options`(value/label/disabled)、`placeholder`、`error` | 同 `Input`；`placeholder` 是 disabled+hidden 的選項 |
| `Checkbox` | `Checkbox.tsx` | 多選、單一布林勾選 | 原生 `input[type=checkbox]` props + `label` | checked／indeterminate（原生屬性透傳）／focus-visible 外框／disabled |
| `Switch` | `Switch.tsx` | 布林開關（設定頁、`IsLogoWallVisible` 這類立即生效的旗標） | `checked`/`defaultChecked`、`onCheckedChange`、`label` | 同上，受控／非受控雙形式 |
| `Field` | `Field.tsx` | label＋說明＋錯誤的包裝 | `label`、`htmlFor`、`hint`、`error`、`required` | 有 `error` 時說明文字換成紅色錯誤訊息（兩者互斥，不疊加顯示） |
| `Badge` | `Badge.tsx` | 狀態／分類標籤 | `tone`(6 種，見第 7 節)、`dot` | 純顯示，無互動狀態 |
| `Table` | `Table.tsx` | 清單主體 | `columns`、`rows`、`rowKey`、`sort`/`onSortChange`、`onRowClick`、`loading`、`error`/`onRetry`、`emptyTitle`/`emptyDescription`/`emptyAction` | loading（skeleton 列）／error（`ErrorState`＋重試）／empty（`EmptyState`）／有資料（可排序表頭、可點擊列的 hover／focus-visible） |
| `Toolbar` / `ToolbarSpacer` | `Toolbar.tsx` | 清單頁工具列容器 | `children` | — |
| `SearchInput` | `SearchInput.tsx` | 搜尋框（內建 debounce） | `value`、`onChange`、`delay`(預設 300ms) | — |
| `Pagination` | `Pagination.tsx` | 頁碼／筆數 | `page`、`pageSize`、`total`、`onPageChange` | 首頁禁用上一頁／末頁禁用下一頁 |
| `Tabs` | `Tabs.tsx` | 分頁切換（語系分頁為主要用途） | `items`(key/label/indicator)、`value`/`onValueChange`（雙語編輯請用受控） | active／inactive／`indicator="warning"`（黃點） |
| `Drawer` | `Drawer.tsx` | 右側滑出編輯面板 | `open`、`onClose`、`title`、`description`、`footer`、`width` | 開／關（含 Esc、焦點鎖定、關閉還原焦點、鎖 body 捲動） |
| `Dialog` / `ConfirmDialog` | `Dialog.tsx` | 置中對話框／確認框 | `Dialog`: `open`/`onClose`/`title`/`footer`；`ConfirmDialog`: 額外 `onConfirm`/`tone`('default'\|'danger')/`pending` | 同 `Drawer` 的焦點管理；`pending` 時兩顆按鈕鎖住 |
| `ToastProvider` / `useToast` | `Toast.tsx` | 一次性通知（存檔成功、發布完成…） | `toast({ title, description, variant, duration })` | `variant`: `default`/`success`/`danger`，5 秒自動消失，可手動關閉 |
| `EmptyState` | `EmptyState.tsx` | 無資料畫面（`Table` 內建使用，也可獨立用） | `icon`、`title`、`description`、`action` | — |
| `ErrorState` | `ErrorState.tsx` | 錯誤畫面（`Table` 內建使用） | `title`、`description`、`onRetry` | — |
| `Spinner` / `Skeleton` / `LoadingBlock` | `Loading.tsx` | 局部載入中／骨架屏／畫面層級的等資料狀態 | `Spinner`: `size`；`Skeleton`: `className`(自訂尺寸)；`LoadingBlock`: `label`、`className` | `LoadingBlock` 用在沒有 `Table` 三態可用的畫面（見 4.6） |
| `Card` | `Card.tsx` | 內容區塊容器 | `title`、`description`、`actions`、`padding`、`elevation`('xs'\|'sm'\|'md'，預設 `xs`) | — |
| `PageHeader` | `PageHeader.tsx` | 頁首（標題＋麵包屑＋動作區） | `title`、`breadcrumbs`(label/href)、`description`、`actions` | 麵包屑用 `react-router` `Link`，不是 `<a>`（見檔內註解） |
| `Icon` | `Icon.tsx` | 內嵌 SVG 圖示 | `name`(IconName)、`size` | 目前收錄約 25 顆後台常用圖示，新增圖示直接加進 `PATHS` |

**尚未涵蓋、留給實作階段的元件**（不在本次交付範圍，但畫面會用到）：

- **富文字編輯器**：目前一律用 `Textarea` 暫代（見各元件檔頭註解），TipTap 之後
  接上時直接替換掉用 `Textarea` 的欄位即可，`Field` 外層包裝不用動。
- ~~**媒體選擇器**~~：已不需要。編輯頁的圖片欄位改成**直接上傳**
  （`MediaControl`，多檔用 `MediaListControl`），不再有「從既有檔案裡挑一張」
  這個動作，也就不需要媒體選擇彈窗。上傳容器由欄位定義的 `container` 決定
  （下載項目跟著存取層級走），不在上傳當下詢問。
- **關聯選擇器的搜尋型多選**（選項超過幾十筆時，例如 Article 關聯 Products）：
  5.4 提到的簡化方案（勾選清單）在選項數量大時會很長，需要一個「帶搜尋的多選
  清單」，本次沒有刻——可以用 `SearchInput` + `Checkbox` 清單組合出來，作為
  第一版堪用方案。

---

## 7. 色彩與狀態語意對照表

`Badge` 元件本身只認得 6 個 `tone`，不認得任何 enum。以下是「哪個狀態該配哪個
tone」的權威對照表，實作各畫面時直接查表，不要重新判斷。

### 7.1 六個 tone 的視覺與使用時機

| tone | token | 使用時機 |
| --- | --- | --- |
| `neutral` | `--surface-card-alt` / `--fg-2` | 不需要跳出來的狀態：草稿、已封存、已結案、中止 |
| `brand` | `--brand-soft` / `--brand-strong` | 品牌強調（非狀態語意），例如「精選」「New」這類行銷旗標的後台呈現 |
| `info` | `--info-50` / `--info-500` | 進行中、尚未有結論的狀態 |
| `success` | `--success-50` / `--success-500` | 正向、已完成的最終狀態 |
| `warning` | `--warning-50` / `--warning-500` | 需要人工關注、卡在佇列裡的狀態 |
| `danger` | `--danger-50` / `--danger-500` | 負向的最終狀態（拒絕、封鎖）或需要立即注意的異常 |

> 顏色代表「大類」（進行中／完成／需關注／中止），不是替每個 enum 值各配一個
> 獨立色——`SampleRequestStatus` 有 8 個值，8 種顏色同時出現在同一個看板上，
> 顏色本身會變成一份要背的密碼表。同一個 tone 底下用**文字**區分細節即可
> （例如 `info` 底下 `Submitted` 跟 `Shipped` 文字不同，但都在「進行中」這個大類）。

### 7.2 `ContentStatus`（Categories/Products/Solutions/Articles/Pages/Exhibitions/
FaqCategories/FaqItems/Downloads/Certifications/ProcessFlows/Milestones/Locations/
Testimonials/PartnerBrands/ContactChannels/NavigationItems 共用）

| 值 | 中文 | tone |
| --- | --- | --- |
| `Draft` | 草稿 | `neutral` |
| `Published` | 已發布 | `success` |
| `Archived` | 已封存 | `neutral` |

### 7.3 `MemberStatus`

| 值 | 中文 | tone |
| --- | --- | --- |
| `PendingEmailVerification` | 待驗證信箱 | `warning` |
| `PendingApproval` | 待審核 | `warning` |
| `Approved` | 已核准 | `success` |
| `Rejected` | 已拒絕 | `danger` |
| `Suspended` | 已停權 | `danger` |

### 7.4 `SampleRequestStatus`

| 值 | 中文 | tone |
| --- | --- | --- |
| `Draft` | 草稿 | `neutral` |
| `Submitted` | 已送出 | `info` |
| `UnderReview` | 審核中 | `warning` |
| `Approved` | 已核准 | `brand` |
| `Shipped` | 已出貨 | `info` |
| `Delivered` | 已送達 | `success` |
| `Rejected` | 已拒絕 | `danger` |
| `Cancelled` | 已取消 | `neutral` |

### 7.5 `InquiryStatus`

| 值 | 中文 | tone |
| --- | --- | --- |
| `New` | 新進 | `info` |
| `InProgress` | 處理中 | `warning` |
| `Responded` | 已回覆 | `success` |
| `Closed` | 已結案 | `neutral` |
| `Spam` | 垃圾訊息 | `danger` |

### 7.6 其他 enum

| Enum | 值 → tone |
| --- | --- |
| `BusinessDomainRule` | `Block`→`danger`「封鎖」／`ManualReview`→`neutral`「人工審核」／`AutoApprove`→`success`「自動核准」 |
| `DownloadAccessLevel` | `Public`→`neutral`「公開」／`MemberOnly`→`brand`「會員限定」／`OnRequest`→`warning`「需索取」 |
| `RedirectStatusCode` | `301`/`308`→`neutral`「永久轉址」／`302`→`info`「暫時轉址」／`410`→`danger`「已下架」 |

### 7.7 非狀態的顏色使用

- **產品線識別色**（`Categories.AccentColorHex`：Optical Film `--optical-500`／
  Textile & Foam `--textile-500`／Acoustic `--acoustic-500`）：只用在「這一列屬於
  哪條產品線」的小色點（例如 Products 清單的產品線欄，`Badge` 加一個
  `style={{ background: accentColorHex }}` 的 4px 圓點），**不要**把整個 Badge 背景
  染成產品線色——那會跟第 7.1–7.6 的狀態色系統搶視覺優先權，狀態永遠該是最先被
  看到的資訊。

---

## 8. 文案語氣規範

後台文案給的是**每天要重複看幾百次**的人，原則是「準確、具體、不浪費一次閱讀」。

### 8.1 按鈕

- 動詞開頭，帶受詞：「新增產品」不是「新增」、「刪除這筆詢問單」的按鈕本身可以
  只寫「刪除」（因為此時使用者已經在該筆資料的情境裡），但清單頁的新增鈕
  必須帶實體名稱（見 4.1）。
- 危險動作不要用委婉語：「刪除」不要寫成「移除」再讓使用者猜這是不是真的刪掉；
  但也不要嚇人，「刪除」對應的其實是軟刪除／封存（`docs/database.md`
  的刪除都是 `Archived` + 301），確認框文案要講清楚實際效果（見 8.2）。

### 8.2 確認對話框

**不要用「確定要執行此操作嗎？」這種空話**——確認框存在的目的是讓使用者在動手前
看到「這個動作實際會發生什麼」，所以文案模板是：

```
標題：{動詞}「{實體名稱}」
說明：{這個動作實際造成的後果，具體到欄位或行為}
```

範例：

- 刪除產品：標題「刪除「Anti-Fog Film」」，說明「這個產品會被下架並保留為封存
  紀錄，原本的網址會自動轉址到「Optical Film」分類頁。此動作無法在介面上復原。」
- 拒絕會員：標題「拒絕「王小明」的註冊申請」，說明附一個 `Textarea`「請填寫拒絕
  原因，會員可以看到這則訊息」（`ReviewNote` 是會被會員看到的業務資料，不是後台
  內部備註，文案要提醒填寫的人）。
- 發布頁面：標題「發布「Sustainability」」，說明「發布後，前台會立即顯示最新內容
  （en／zh-Hant 兩個語系都會更新快取）。」——呼應 `docs/cms.md` 的 revalidateTag
  行為，讓使用者知道「發布」不是排程動作，是立即生效。

### 8.3 錯誤訊息

- 後端回 RFC 7807 `problem+json` 的 `detail`（`docs/cms-api.md`）時，**直接顯示
  `detail`**，不要在前端另外包一層「發生錯誤：」再貼上去——那是兩次「發生錯誤」
  疊在一起。
- 前端自己驗證出的錯誤（必填未填、格式不對）要講清楚**怎麼修**，不是只講「哪裡
  錯」：「Slug 只能包含小寫英文字母、數字與連字號」比「Slug 格式錯誤」更快讓人
  改對（對應 `docs/database.md §0.4` 的 Slug CHECK 約束）。
- 401 導致的自動登出（`lib/api.ts` 已處理 access token refresh 失敗的情況）要有
  獨立提示，不要讓使用者以為是「這個動作失敗了」——文案「登入已逾時，請重新
  登入」，而不是把它當一般錯誤 Toast 处理。

### 8.4 空狀態

- **完全沒有資料**（新專案、剛清空）：鼓勵動作，例如 Downloads 清單「還沒有任何
  下載檔案，上傳第一份規格書開始」+ 一顆直達新增的 `Button`。
- **篩選／搜尋後沒有結果**：引導清除條件，例如「沒有符合「防霧」的產品，試試
  清除篩選或換個關鍵字」，**不要**跟第一種情境共用「目前沒有資料」這句話——
  使用者在篩選情境下看到這句話會誤以為系統真的是空的。
- **審核佇列清空**（型別 E）：這是好消息，文案要正面，例如「目前沒有待審核的
  會員申請，做得好」，而不是用跟其他空狀態一樣的中性語氣——清空佇列是編輯者
  的工作成果，值得被講出來。

### 8.5 Toast

- 只用在動作**已經完成**的當下，不用「處理中」的 Toast（loading 狀態用按鈕本身
  的 `loading` prop）。
- 具體到做了什麼：「已儲存「Anti-Fog Film」的變更」比「儲存成功」有用——特別是
  使用者可能在同一個工作階段裡連續編輯好幾筆資料，需要靠 Toast 內容確認剛剛
  存的是哪一筆。
- 避免「操作成功」這種完全不描述動作的文案（任務需求明確禁止）。

---

## 9. 範例：型別 A 清單頁的組合方式

以下示範 `products` 清單頁大致的元件組合（示意，非完整實作，欄位/資料串接由
主 agent 依 `docs/database.md §02` 與資料層決定）：

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  PageHeader, Toolbar, ToolbarSpacer, SearchInput, Select, Table, Pagination,
  Badge, Button, IconButton,
} from '@/ui';

export function ProductsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  // const { data, isLoading, error, refetch } = useProductsQuery({ search, category, page });

  return (
    <>
      <PageHeader
        title="產品"
        actions={<Button variant="primary" icon={<span />} onClick={() => navigate('new')}>新增產品</Button>}
      />
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="搜尋產品名稱、代號…" />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="全部產品線"
          options={[
            { value: 'optical-film', label: 'Optical Film' },
            { value: 'textile-foam', label: 'Textile & Foam' },
            { value: 'acoustic', label: 'Acoustic' },
          ]}
        />
        <ToolbarSpacer />
      </Toolbar>
      <Table
        columns={[
          { key: 'name', header: '產品名稱', render: (row) => <span className="font-medium">{row.name}</span> },
          { key: 'code', header: '代號' },
          { key: 'category', header: '產品線' },
          { key: 'status', header: '狀態', render: (row) => <Badge tone={row.status === 'published' ? 'success' : 'neutral'}>{row.statusLabel}</Badge> },
          { key: 'actions', header: '', align: 'right', render: (row) => <IconButton icon="trash-2" label="刪除" size="sm" /> },
        ]}
        rows={[] /* data?.items ?? [] */}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(row.id)}
        loading={false /* isLoading */}
        error={null /* error?.message */}
        emptyTitle="還沒有任何產品"
        emptyDescription="新增第一個產品，開始建立產品目錄"
      />
      <Pagination page={page} pageSize={50} total={0 /* data?.total ?? 0 */} onPageChange={setPage} />
    </>
  );
}
```

型別 B（清單＋抽屜）的差異只在把 `navigate(row.id)` 換成 `setDrawerOpen(true)` +
把選中列存進 state，`<Drawer>` 放在同一個元件樹裡，其餘 `Toolbar`/`Table`/
`Pagination` 組合完全一樣。

---

## 10. 給主 agent 的決定清單

本規範刻意把以下決定留給實作階段，避免在「元件庫＋規格」這一步過度預判實作
細節：

1. **`App.tsx` 是否遷移到 data router**（見 5.9）——影響能否用 `useBlocker`
   做離開攔截。
2. ~~`MenuItem` 是否加 `icon` 欄位~~——已解決：`menu.ts` 的每個 `MenuItem` 都有
   `icon: IconName`，見 2.4。
3. **媒體選擇器、搜尋型多選、Reference block 參數表單**（見第 6 節「尚未涵蓋」）
   ——這三個是複合元件，需要先確定資料層（`queries`/API 回傳形狀）才能定介面。
4. **富文字編輯器換裝時機**——`Textarea` 暫代方案何時換 TipTap，換裝時哪些欄位
   優先（Article Body 使用頻率最高，建議優先）。
5. **拖曳排序是否要在之後補上**——目前是上移／下移按鈕，`grip-vertical` 圖示
   已預留但未使用。
6. 目前 `apps/admin/src/lib/` 有另一路並行進行的資料層工作（`api.ts` 的 CRUD
   封裝、`mock.ts` 假資料層）——本規範的元件與畫面型別設計上不假設任何特定的
   資料獲取方式（沒有綁定某個 hook 命名慣例），組裝時請以該資料層實際回傳的形狀
   為準，第 9 節的範例只是示意。
