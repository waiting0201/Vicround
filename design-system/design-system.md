# VICROUND 網站 Design System

> 本文件為 VICROUND（盈絲實業有限公司）公司網站重建專案之視覺設計規範。所有色號、字體名稱、
> 間距數值、Logo 規則等，均萃取自下列一手素材，並於段落中標註出處頁碼／檔名：
>
> - `CISGuideBook/03_瀏覽檔/VICROUND_CIS Guide BooK_瀏覽檔.pdf`（品牌識別手冊，共 44 頁內容，簡稱「CIS 手冊」，以下引用格式為「CIS p.6」）
> - `Vicround_website_ref-weyPro.pdf`（設計公司 subkarma 提案簡報，共 20 頁，簡稱「網站風格參考」）
> - `VICROUND Web Sitemap-0701.png`（網站資訊架構圖，簡稱「Sitemap」）
> - `vr-logo.png`、`Trademark&Pattern/01-Trademark PNG/*.png`、`Trademark&Pattern/02-Pattern PNG/*.png`（商標與輔助圖形檔）
>
> 凡標註「〔推估值〕」之處，代表 CIS 手冊未明確定義數位規格（例如僅有印刷 CMYK/Pantone、
> 未提供螢幕 HEX），本文件依據可得資訊合理換算，日後仍建議以印刷打樣或原始 AI 檔校色確認。

---

## 0. 專案定位與品牌個性（CIS p.3-4）

VICROUND 的品牌定位是「無所畏懼、大膽解題」的材料科技夥伴，而非保守的傳統製造商形象。
這個定位直接影響網站的視覺語彙：**不能做成溫和保守的傳統代工廠網站，也不能做成消費性電商
的花俏風格**，而應該是「高對比、俐落幾何、有自信」的 B2B 科技材料網站。

| 項目 | 內容（CIS p.3） |
| --- | --- |
| 品牌願景 Vision | 成為全球最值得信賴的夥伴，為那些被視為不可能的挑戰，找到突破性的答案 |
| 品牌承諾 Promise | 我們設計並實踐，他人連想都不敢想的解決方案 |
| 品牌價值 Value | 敏捷 Agility／夥伴 Partnership／大膽 Boldness |
| 品牌個性 Personality | 無所畏懼 Fearless／勇於探索 Curious／堅實後盾 Supportive |
| 品牌語調 Tone of Voice | 自信且充滿活力／探索且啟發人心／直接但充滿力量 |
| 品牌口號 Slogan | **Bold ideas. Real answers.** |

設計上的直接推論：大量留白＋高對比黑白＋單一強烈品牌紫作為點睛色，避免使用柔和漸層、
可愛圓潤插畫或多彩繽紛配色（CIS 手冊全書找不到漸層或插畫語彙，色彩系統是純色色塊 + 灰階）。

---

## 1. 品牌識別（Logo）摘要

### 1.1 Logo 涵義與組成
CIS 手冊在「商標設計與規範」章節（CIS p.11）說明：商標是「VICROUND 盈絲實業」的象徵精神、
品牌定位的集中表現，也是視覺識別系統的核心。Logo 有以下組成方式（CIS p.11-26）：

- **純英文標誌**：`VICROUND`（全大寫，無襯線幾何字體）
- **中文標準字①**：`盈絲實業有限公司`（完整公司名）
- **中文標準字②**：`盈絲實業`（簡稱）
- **橫式組合①-④**：`VICROUND` + 中文標準字，四種比例配置供不同版面使用
- **直式組合⑤**：直書中文＋直排英文，用於窄版直式版面（如信封側邊）

英文字標為 Logo 的主要簽署形式；中文標準字視使用情境（是否需公司全名／法律登記名稱）替換。

### 1.2 商標比例與尺寸規則（CIS p.11-26）
CIS 手冊採用嚴格的「比例法」製圖，所有比例皆以短邊為基準單位 X：

| 組合形式 | 寬長比例 | 最小使用寬度 |
| --- | --- | --- |
| 純英文 VICROUND | 8X（CIS p.11） | 橫幅不得小於 **20mm**（CIS p.11） |
| 中文標準字①（盈絲實業有限公司） | 10X（CIS p.13） | 橫幅不得小於 **35mm**（CIS p.13） |
| 中文標準字②（盈絲實業） | 5.7X（CIS p.15） | 橫幅不得小於 **20mm**（CIS p.15） |
| 橫式組合①（VICROUND + 盈絲實業） | 11.5X（CIS p.17） | 橫幅不得小於 **65mm**（CIS p.17） |
| 橫式組合②（上下疊排） | 7X（CIS p.19） | 橫幅不得小於 **45mm**（CIS p.19） |
| 橫式組合③（VICROUND + 盈絲實業有限公司） | 11.5X（CIS p.21） | 橫幅不得小於 **75mm**（CIS p.21） |
| 橫式組合④（上下疊排＋公司全名） | 11.5X（CIS p.23） | 橫幅不得小於 **45mm**（CIS p.23） |
| 直式組合⑤ | 11.8X（CIS p.25-26） | 橫幅不得小於 **40mm**（CIS p.25） |

**網站應用換算建議**〔推估值〕：因網頁多以 px／rem 呈現，將 mm 最小尺寸換算為螢幕解析度
（約 3.78px/mm @96dpi）僅供參考，實務上建議直接以「導覽列 Logo 高度」定案：
- 桌機導覽列 Logo（純英文字標）建議高度 **28–32px**
- 手機導覽列 Logo 建議高度 **22–24px**（不得再小，避免可讀性下降）
- Favicon／App icon 若只能用局部圖形，建議使用「輔助圖形 V」單色版（見第 3 節），而非硬塞完整字標

### 1.3 安全距離（淨空範圍）
所有組合均規定：以短邊為基準 X，其周圍需保留 **0.3X ～ 0.7X**（依組合形式不同，CIS p.12,
14, 16, 18, 20, 22, 24, 26）的淨空範圍，此範圍內不可放置其他無關文字或圖象（輔助圖形除外），
避免標誌受到視覺干擾。

**網站應用**〔推估值〕：導覽列中 Logo 左右至少保留與 Logo 高度相當的留白（約等同 1X 邏輯），
不可讓選單項目、搜尋框、CTA 按鈕直接貼齊 Logo。

### 1.4 正確用法（CIS p.27）
- 一般白底 → Logo 使用 **Pantone Black C**（純黑）
- 灰階 10–40% 底色 → Logo 使用 **Pantone Black C**
- 一般黑底 → Logo 反白（**White**）
- 灰階 50–100% 底色 → Logo 反白
- 品牌紫底（Pantone 2097 C）→ Logo 反白

這是網站深色／淺色模式切換時 Logo 顏色邏輯的直接依據：**淺色背景永遠用黑色字標，深色或
品牌紫背景永遠用白色字標**，不建議使用灰階或半透明字標（會落入手冊禁止的「錯誤透明使用」）。

### 1.5 禁止用法（CIS p.28）
手冊明確列出以下 9 種禁止範例，網站與任何數位物件都必須遵守：

1. 禁止變形使用（如故意手寫感傾斜筆畫變形字體）
2. 禁止比例失調－左右擠壓
3. 禁止比例失調－上下擠壓
4. 禁止傾斜使用（旋轉／斜角放置）
5. 禁止錯誤透明使用（半透明灰階化）
6. 禁止標誌色彩錯誤使用（例如任意換成品牌紫以外的彩色，如洋紅、藍色）
7. 禁止加粗使用（改變原始字重）
8. 禁止外框線使用（描邊 outline 版）
9. （隱含）禁止在標誌 0.3–0.7X 淨空範圍內堆疊其他圖文

**對前端工程的具體提醒**：SVG Logo 檔案匯入專案後，CSS 不可對其做 `filter: grayscale()` /
`opacity` 降低於不透明、不可用 `font-weight` 或 `transform: skew/rotate` 二次處理、不可疊加
`stroke` 外框樣式。

---

## 2. 色彩系統（Colour System，CIS p.6-10）

CIS 手冊色彩系統分為「品牌標準色」「品牌行銷輔助色」與「產品標準色／輔助色」三層，且明確
規範：印刷以 Pantone 專色為準，本手冊視覺呈現（含 HTML 色號）僅供參考，正式印刷打樣需另
核對最新版 Pantone Colour Formula Guide（CIS p.6）。以下 HEX／RGB 皆為 CIS 手冊原文直接
列出的數值，非本文件推算。

### 2.1 品牌標準色 Brand Main Colours（CIS p.6）

| 名稱 | Pantone | CMYK | RGB | HEX | 用途 |
| --- | --- | --- | --- | --- | --- |
| 品牌黑 | PANTONE Black C | K100 | R0 G0 B0 | `#000000` | 主要文字、Logo 深色版、深色背景 |
| 純白 | White | K0 | R255 G255 B255 | `#ffffff` | 主要背景、Logo 淺色版 |

### 2.2 品牌行銷輔助色 Brand Secondary Colours（CIS p.7）

| 名稱 | Pantone | CMYK | RGB | HEX | 用途 |
| --- | --- | --- | --- | --- | --- |
| 品牌紫 | PANTONE 2097 C | C80 M90 Y0 K10 | R97 G69 B186 | `#5e3de7` | 行銷用強調色，CTA、連結、品牌重點強調 |

CIS 手冊特別註記（CIS p.10 行銷卡片文案）：「Purple symbolizes imagination and forward
momentum — the spark that turns bold engineering into human inspiration. Used in
marketing and events, it amplifies Vicround's innovative spirit and emotional energy,
adding a sense of discovery and aspiration to every interaction.」
→ 中譯：紫色象徵想像力與前進的動能，是把工程硬實力轉化為人性化靈感的火花，用於行銷與活動
場合，強化品牌的創新精神與情感能量。**這是全站唯一的強調色（accent color），必須節制使用**，
只用在 CTA、關鍵連結、重點強調圖形，不可大面積鋪色取代黑白基調。

### 2.3 產品分類標準色 Product Main Colours（CIS p.8）— 對應三大產品線

| 產品線 | Pantone | CMYK | RGB | HEX |
| --- | --- | --- | --- | --- |
| Optical Film 光學膜類 | PANTONE 3105 C | C50 M0 Y10 K0 | R103 G210 B224 | `#71d6e0` |
| Textile and Foam 紡織泡棉類 | PANTONE 1925 C | C0 M100 Y50 K0 | R231 G0 B75 | `#e7004b` |
| Acoustic 聲學類 | PANTONE Cool Gray 2C | C0 M0 Y0 K30 | R207 G207 B205 | `#cfcfcd` |

> 注意：目前公司網站架構（見 Sitemap）只有兩大主要產品線 Optical Film、Textile & Foam，
> 加上 Application 案例頁；但 CIS 手冊定義了第三個色彩分類「Acoustic 聲學類」，且 Sitemap
> 中「Solution 解決方案」也確實列出 Acoustic Solutions 為獨立品類。建議網站的產品分類色彩
> 系統直接沿用此三色，日後擴充聲學產品線時色彩系統無需重新定義。

### 2.4 產品輔助色 Products Secondary Colours（CIS p.9）
品牌紫 `PANTONE 2097 C` (`#5e3de7`) 同時作為三個產品色的共通輔助色，與各產品主色成對使用
（CIS p.9-10）。也就是說，**紫色是連接「品牌」與「產品分類」兩層色彩系統的橋樑色**。

### 2.5 中性灰階（CIS p.6, p.27）
CIS 手冊以黑色 100%→0% 及白色 100%→0% 各分 10 階呈現灰階漸變（CIS p.6），並在商標色彩
使用規範頁（CIS p.27）具體示範：
- 灰階 10–40%（淺灰）→ 標誌用黑色
- 灰階 50–100%（深灰／近黑）→ 標誌用白色

**〔推估值〕數位灰階 token 換算**：CIS 手冊僅提供百分比色階示意，未提供每一階的 HEX。
以下為根據「黑 100%→白 0%」線性內插的網頁中性灰階建議值，供 UI 元件（邊框、次要文字、
背景分層）使用，日後如有更精確的印刷灰票可再校正：

| Token | 百分比（黑） | 換算 HEX〔推估值〕 | 建議用途 |
| --- | --- | --- | --- |
| `--neutral-900` | 90% | `#1a1a1a` | 深色模式主背景 / 深色文字強調 |
| `--neutral-800` | 80% | `#333333` | 標題文字（淺色底） |
| `--neutral-700` | 70% | `#4d4d4d` | 內文文字 |
| `--neutral-600` | 60% | `#666666` | 次要文字 |
| `--neutral-500` | 50% | `#808080` | 停用狀態文字、圖說 |
| `--neutral-400` | 40% | `#999999` | 邊框（深） |
| `--neutral-300` | 30% | `#b3b3b3` | 邊框（一般） |
| `--neutral-200` | 20% | `#cccccc` | 分隔線 |
| `--neutral-100` | 10% | `#e6e6e6` | 卡片底色、hover 底 |
| `--neutral-50` | 5% | `#f2f2f2` | 頁面淺灰背景區塊 |

### 2.6 色彩使用規則總結
1. 主色永遠是「黑＋白」，紫色是唯一強調色，三個產品色僅在對應產品線頁面／卡片標籤使用。
2. 禁止任意變更色彩系統（CIS p.6 明文規定），不可自行发明漸層色或新增第二個強調色。
3. 網站 Dark Mode／Light Mode 的切換邏輯直接對應 CIS p.27 的「Logo 顏色隨底色切換」規則：
   淺底用黑字＋黑 Logo，深底用白字＋白 Logo，紫底一律搭白字。

---

## 3. 輔助圖形（Pattern／V 圖騰）系統

### 3.1 圖形來源與構成（CIS p.33-37；`Trademark&Pattern/02-Pattern PNG/`）
VICROUND 的輔助圖形核心是取自 Logo 中「V」字母的三角形／人字形（chevron）造型，CIS 手冊
明訂「不可自行重繪、變形，僅可等比例縮放至適當尺寸應用，以求圖型之標準化與統一性」（CIS p.33）。
共有四種圖形：

| 圖形 | 說明（CIS p.33-37） | 色彩規則 |
| --- | --- | --- |
| 品牌輔助圖形（單一 V） | 單層人字形線條 | 純色：黑（CIS p.34）或品牌紫 `#5e3de7`（`VICROUND-pattern-2097C.png` 實色示範，即為此圖形之紫色版） |
| Optical Film 產品圖形（雙層疊 V） | 兩層同心 V 形，漸縮向下收尖 | Pantone 2097 C `#5e3de7` + Pantone 3105 C `#71d6e0`（CIS p.35） |
| Textile and Foam 產品圖形（線條交錯三角） | 橫線＋斜線構成的三角框架，帶有「V」字暗紋 | Pantone 2097 C `#5e3de7` + Pantone 1925 C `#e7004b`（CIS p.36） |
| Acoustic 產品圖形（圓點陣列三角） | 由大小不一圓點排列成三角形，模擬聲波擴散 | Pantone 2097 C `#5e3de7` + Pantone Cool Gray 2C `#cfcfcd`（CIS p.37） |

素材庫中的三個 pattern 檔案（`VICROUND-pattern-2097C.png`／`-BK.png`／`-WH.png`）即為「品牌
輔助圖形（單一 V）」的三種色版：品牌紫、黑、白，分別對應淺底、一般文件、深底三種使用情境。

### 3.2 最小使用尺寸（CIS p.34-37）
所有輔助圖形最小使用尺寸不得小於 **20mm**（CIS p.34, 35, 36, 37 皆同此規定）。
〔推估值〕網站應用建議：作為裝飾圖形時，單邊最小顯示尺寸不小於 **24px**（避免點陣圖形類的
聲學圖案在縮小時圓點糊成一團、細節消失）。

### 3.3 使用時機與網頁應用建議
CIS 手冊定義輔助圖形「適用於公司內部事務用品、文件、印刷物、簡報、文宣等等，目的在於營造
鮮明的企業個性」（CIS p.33）。將此原則轉譯到網站情境：

- **色彩版本選用邏輯**：
  - 品牌輔助圖形（單一 V，黑/白/紫）→ 用於品牌類、公司類頁面（首頁 Hero、About Us、Footer 裝飾角）
  - 三種產品分類圖形 → 只在對應產品線頁面使用（Optical Film 頁用雙層 V、Textile & Foam 頁用
    交錯三角、Acoustic 內容區用圓點三角），**不可混用**，讓使用者透過圖形色彩即可辨識目前瀏覽的產品線
- **可能的網頁應用方式**：
  1. **背景紋理**：大尺寸、低不透明度（建議 4–8%）的品牌輔助圖形置於區塊背景右下角或右上角，
     呼應 CIS 手冊扉頁與章節頁的滿版大 V 字構圖（CIS p.2, 5, 10, 32 皆有大幅 V 字满版設計）
  2. **章節／區塊分隔元素**：仿照 CIS 手冊每個大章節前的全黑底＋巨大紫色 V 字轉場頁（CIS p.5,
     10, 32），首頁或長頁面（如 About Us、Sustainability）可用小尺寸同構圖作為 section 分隔裝飾
  3. **產品分類視覺標籤**：產品卡片、麵包屑、篩選標籤旁可放置對應產品線的小型圖形 icon
     （20-24px），輔助文字之外的快速視覺辨識
  4. **Loading／狀態指示**：Acoustic 的圓點陣列圖形天然適合作為 loading 動畫的視覺靈感
     （但目前僅聲學類頁面／元件適用，不建議全站通用）
  5. **404／空狀態頁**：可用去彩度（灰階）的品牌輔助圖形作為錯誤頁或空狀態插畫的底圖元素

---

## 4. 字體系統（Font Type，CIS p.31；網站風格參考 p.9）

### 4.1 英文字體：Geologica
CIS 手冊「字型使用規範」明確指定（CIS p.31）：

> 英文字型：**Geologica**（提供字重 Thin｜ExtraLight｜Light｜Regular｜Medium｜SemiBold｜Bold）

品牌口號「Bold ideas. Real answers.」在 Slogan 系統頁（CIS p.29-30）明確標示使用 **Geologica
(Regular)**，字級最小不得小於 60mm（橫式單行）或 40mm（橫式雙行）；網站風格參考簡報
（p.9）則指出網站主要標題使用 **Geologica Semi Bold**。

**Geologica 是 Google Fonts 開放字體**（SIL Open Font License）：
**https://fonts.google.com/specimen/Geologica**（2026-07-01 由使用者確認）。可變字重涵蓋
Thin(100) 到 Black(900)，可直接透過 `next/font/google` 在 Next.js 專案中引入，具備完整網頁
授權，無需額外購買字體授權，是本專案**唯一需要且已可直接落地的英文字體**。

### 4.2 中文字體：源樣黑體 GenYoGothic
CIS 手冊指定（CIS p.31）：

> 中文字型：**源樣黑體 GenYoGothic**（提供字重 N/R/M/B，即 Normal／Regular／Medium／Bold）

商標中文標準字部分另註記「視使用情況，中文標準字可以使用『源樣黑體 R』替代」（CIS p.13, 15,
17, 19, 21, 23, 25）。網站風格參考簡報（p.9）確認網站標題中文字重為 **源樣黑體 Semi Bold**。

**GenYoGothic（源樣黑體）授權說明**：源樣黑體／源氣黑體（GenYo/Genki Gothic）是衍生自
Adobe／Google 泛中日韓黑體「Source Han Sans／思源黑體」的開源專案，公開倉庫為
**https://github.com/buttaiwan/genyog-font**（已於 2026-07-01 由使用者確認提供，取代本文件
先前「授權來源不明」的推測）。該專案採 **SIL Open Font License 1.1**，與其上游 Source Han
Sans 相同授權，允許免費商用、重製與修改，**無網頁內嵌授權疑慮**。

> **實作注意**：該倉庫僅提供 **OTF／TTC（字型集合檔）格式**，未附 WOFF／WOFF2 或現成的
> `@font-face` 樣式表；正式導入網站前需自行用字型轉檔工具（如 `fonttools`／
> google-webfonts-helper）轉出 WOFF2 並建立子集化（subsetting，繁中全字集直接內嵌會過大），
> 不能像 Google Fonts 字體一樣直接以 `next/font/google` 引入。

若不想自架轉檔與 `@font-face`，仍可採用以下免授權疑慮的替代方案：

| 優先序 | 字體 | 說明 |
| --- | --- | --- |
| 1 | **源樣黑體 GenYoGothic**（`buttaiwan/genyog-font`，SIL OFL 1.1） | CIS 手冊原始指定字體，品牌還原度最高；需自行轉 WOFF2 並子集化後自架 `@font-face` |
| 2 | **思源黑體 Noto Sans TC**（Google Fonts） | 與源樣黑體同源（皆衍生自 Source Han Sans），字重完整（Thin 到 Black 共 7 級），視覺骨架幾乎一致，`next/font/google` 可直接引入，零額外建置成本 |
| 3 | Source Han Sans TC | Adobe/Google 原始版本，Google Fonts 亦有收錄 |

**建議實作策略**：若專案時程／建置流程允許自架字型（WOFF2 轉檔＋子集化＋`@font-face`），
優先採用 **GenYoGothic** 以完整還原 CIS 手冊指定字體；若追求開發效率、零建置成本，
採用 **Noto Sans TC**（`next/font/google` 直接引入，提供 Regular / Medium / Bold 對應 CIS
規範的 R/M/B），視覺效果與源樣黑體差異極小。兩者皆無授權風險，可依專案階段擇一，
不再需要額外洽談 Web Font License。

### 4.3 字級尺度建議（響應式）

CIS 手冊未提供網頁 UI 字級尺度表（僅提供印刷 Logo／標語的 mm 級最小尺寸），以下為
〔推估值〕，依網站風格參考所示的「Angular Design、高對比、科技感」B2B 材料網站調性，
並考慮中英文混排一致基線設計：

| 用途 | 桌機 (≥1024px) | 平板 (768–1023px) | 手機 (<768px) | 字重 |
| --- | --- | --- | --- | --- |
| Hero 主標題 (H1) | 56–64px / 1.1 | 40–48px / 1.15 | 32–36px / 1.2 | Geologica SemiBold／源樣黑體(或Noto Sans TC) SemiBold |
| 頁面標題 (H2) | 36–40px / 1.2 | 30–32px / 1.25 | 26–28px / 1.3 | SemiBold |
| 區塊標題 (H3) | 24–28px / 1.3 | 22–24px / 1.35 | 20–22px / 1.4 | Medium/SemiBold |
| 卡片標題 (H4) | 18–20px / 1.4 | 18px / 1.4 | 16–18px / 1.4 | Medium |
| 內文 (Body) | 16px / 1.7 | 16px / 1.7 | 15px / 1.7 | Regular |
| 輔助/註解文字 (Caption) | 13–14px / 1.5 | 13–14px / 1.5 | 12–13px / 1.5 | Regular |
| 按鈕文字 | 15–16px / 1.2 | 15px / 1.2 | 14–15px / 1.2 | Medium/SemiBold |
| 導覽列項目 | 15px / 1.2 | — (漢堡選單) | — (漢堡選單) | Medium |

> 中文內文行高刻意設定高於英文慣例（1.7 而非常見的 1.5），原因見第 7 節雙語排版注意事項。

---

## 5. 版面與網格（Layout & Grid）

### 5.1 版面調性依據
- 網站風格參考（p.14, 16, 18）明確定義兩個平行的版面關鍵字：**Angular Design（角度設計）**
  與 **Rounded Corners（圓角）**——文件原文：
  - 「以直角與斜角切版，展現俐落幾何線條，傳達精準、專業且具科技感的視覺語彙」（p.14）
  - 「頁面視窗以圓角邊框表現，呈現現代、俐落、數位的感覺」（p.18）
- 提案簡報中的參考網站截圖（p.15, 17, 19）皆為**深色背景為主、高對比、大字重標題、產品/
  設備特寫攝影**的科技/工業風格網站（如 AKOR 智慧安防、VISIOS LED 解決方案、neebo 硬體
  裝置品牌），與 VICROUND 材料科技廠的定位高度吻合。
- 因此網頁版面應同時運用「銳角切割」與「圓角卡片」兩種語彙，並非互斥：**大範圍色塊／Hero
  區塊可用斜角切邊（呼應 Logo V 字），內容卡片、按鈕、輸入框則用圓角**，兩者分工明確、不混用
  在同一元件上。

### 5.2 響應式網格建議〔推估值，CIS 手冊未定義網頁網格〕

| 斷點 | 寬度範圍 | 欄數 | Container 最大寬度 | 邊界留白 (Margin) | 欄距 (Gutter) |
| --- | --- | --- | --- | --- | --- |
| Mobile | < 768px | 4 欄 | 100% | 16–20px | 16px |
| Tablet | 768–1023px | 8 欄 | 100% | 32px | 20px |
| Desktop | 1024–1439px | 12 欄 | 1140px | 40px | 24px |
| Large Desktop | ≥ 1440px | 12 欄 | 1280–1320px | auto (置中) | 24–32px |

### 5.3 間距尺度（Spacing Scale）〔推估值，建議採 4px 基準的等比尺度〕

```
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 (px)
```

- 元件內部間距（padding）：4–24px 區間
- 元件之間（同一區塊內卡片、表單欄位）：16–32px
- Section 與 Section 之間的垂直間距：桌機 96–128px，手機 48–64px
- 呼應 CIS 手冊 Logo 淨空邏輯（以短邊 X 為基準留白）：任何 CTA 按鈕、圖片、卡片與相鄰元素
  的留白，建議不小於該元素高度的 0.3 倍，避免視覺擁擠

### 5.4 頁面資訊架構（依 Sitemap 圖）

Sitemap 顯示的網站頁面結構（`VICROUND Web Sitemap-0701.png`）：

```
VICROUND WEBSITE
├─ Header 頁首：About Us / Solution / Products / Resources / Sustainability / Partnership
├─ Homepage 首頁：Banner/Video → 品牌口號 → 三大應用領域導引
│                 → 解決方案總覽(依產業:3C/汽車/醫療/太陽能) → 客戶信任牆 → 永續承諾+CTA
├─ About Us 關於我們：品牌故事與願景 / 核心價值與團隊文化 / 發展歷程與里程碑 / 全球據點與產能
├─ Solution 解決方案：Consumer Electronics / Automotive / Smart Healthcare /
│                     Renewable Energy / Acoustic Solutions / E-Paper / Sports Glasses
├─ Products 產品：Optical Film 光學膜類 / Textile & Foam 紡織泡棉類 / Acoustic 聲學類
├─ Resources 知識中心：部落格/技術文章 / 產業洞察/趨勢報告 / FAQ(結構化資料) / 技術規格下載
├─ Sustainability 永續發展：ESG成果 / 碳足跡管理 / EUDR法規應對 / 認證與標準
├─ Partnership 合作夥伴：OEM/ODM服務說明 / 經銷採購合作 / 客戶見證案例
└─ Footer 頁尾：Logo / Privacy & Legal / News & Events / Contact Us / 社群媒體
```

> 與 CLAUDE.md 專案說明中「Optical Film、Textile & Foam 兩大產品線 + Application 案例頁 +
> News + ESG」的描述相比，此份 Sitemap 版本更完整，多出獨立的 **Solution（依產業別的應用
> 情境頁）**、**Resources 知識中心（含技術白皮書下載、FAQ 結構化資料，明顯針對 AI 搜尋引擎
> 優化）**、**Partnership（B2B 採購/OEM專頁）**。建議以此 Sitemap 為準進行資訊架構規劃，
> 因其為最新日期（0701）版本。FAQ 頁特別標註「結構化資料標記，利於AI引擎引用」，代表網站
> SEO 策略需涵蓋 AI 搜尋（GEO, Generative Engine Optimization）而不僅是傳統 SEO。

---

## 6. 核心元件視覺方向

以下元件方向皆延伸自 CIS 手冊的色彩／字體規範與網站風格參考的版面語彙，尚無 CIS 手冊直接
定義網頁元件規格，故標記為〔推估值〕，但色彩與字體本身有明確出處依據。

### 6.1 導覽列 (Header/Navbar)
- 背景：預設白色或極淺灰 `#f2f2f2`；深色模式版本用品牌黑 `#000000`
- Logo：左側，純英文字標（黑或白，依背景切換，遵循 CIS p.27 規則）
- 選單項目：Geologica Medium／Noto Sans TC Medium，15px，字距略寬（letter-spacing 0.02em）
  提升科技感；hover 狀態用品牌紫 `#5e3de7` 底線或文字變色，不建議用背景色塊（避免過於商業化）
- CTA 按鈕（如「聯絡我們」）：品牌紫實心圓角按鈕，圓角 6–8px，與選單其餘純文字項目形成對比
- 導覽列高度：桌機 72–80px，手機 56–64px；滾動時可縮減高度並加極淡陰影
  （`box-shadow: 0 1px 8px rgba(0,0,0,0.06)`）與背景毛玻璃效果，強化「精密科技」質感

### 6.2 頁尾 (Footer)
- 背景：品牌黑 `#000000`，文字白／淺灰階（`--neutral-300` 等級），CIS 手冊大量使用黑底白字
  的章節頁設計（CIS p.2, 5, 10, 32 皆為黑底），頁尾採同樣手法呼應品牌手冊調性
- 結構依 Sitemap：Logo → Privacy & Legal → News & Events → Contact Us → 社群媒體圖示
- 社群圖示：線框風格（outline icon），hover 時填色為品牌紫
- 右下角或整體背景可疊加低透明度（4–6%）的品牌輔助圖形（V 字紋理）作為裝飾，呼應 CIS 手冊
  扉頁與章節頁滿版 V 字構圖

### 6.3 產品卡片 (Product Card — Optical Film／Textile & Foam／Acoustic)
- 卡片圓角：12–16px（對應「Rounded Corners」語彙）
- 卡片圖片區：材料特寫攝影（見第 8 節），滿版置頂，比例建議 4:3 或 1:1
- 卡片內文區：白底或極淺灰底，標題 Medium 字重，搭配一枚對應產品線色彩的小型分類標籤
  （Optical Film 用 `#71d6e0`、Textile & Foam 用 `#e7004b`、Acoustic 用 `#cfcfcd`），
  標籤本身可用該色 15% 透明度作底、原色文字，維持專業感而非鮮豔糖果色觀感
- Hover 狀態：卡片整體輕微上浮（`transform: translateY(-4px)`）＋陰影加深，圖片可搭配
  極輕微縮放（`scale(1.03)`），忌用旋轉或翻轉等花俏動效（不符合精密材料調性）

### 6.4 產業應用案例卡片 (Application/Solution Card)
- 對應 Sitemap 中「Solution 解決方案」依產業分類（3C、汽車、醫療、太陽能、聲學、電子紙、
  運動眼鏡）
- 建議採用比產品卡片更「重攝影、輕文字」的比例（圖片佔卡片 65–70% 高度），因應用案例頁的
  核心目的是建立情境代入感（例如車用抗污膜、醫療防護膜的實際應用畫面）
- 卡片邊角建議採用「斜切角」（呼應 Angular Design 語彙，CIS p.14 提及的直角與斜角切版），
  與產品卡片的純圓角做出區隔，讓使用者能從版型潛意識分辨「這是產品」還是「這是應用情境」

### 6.5 新聞卡片 (News Card)
- 版面簡潔、以文字為主：日期（Caption 字級，`--neutral-500`）→ 標題（H4，最多兩行，超出
  以 ellipsis 截斷）→ 摘要（Body，1.6 行高，最多 2-3 行）
- 列表頁採單欄或雙欄清單式，不需要大幅圖片主導（技術文章／產業洞察頁面更重內容深度而非
  視覺沖擊），與產品卡片的攝影導向明確做出區隔

### 6.6 CTA 按鈕 (Call-to-Action Button)
- **Primary CTA**：品牌紫 `#5e3de7` 實心底、白色文字，圓角 6–8px，字重 Medium/SemiBold，
  padding 建議 `12px 28px`（桌機）／`10px 20px`（手機）
- **Secondary CTA**：透明底、品牌黑或白邊框（依背景切換）、對應色文字，同樣圓角規格
- Hover 狀態：Primary 加深至 `#4a2fc0`〔推估值，紫色降低約 15% 明度〕；不建議使用陰影堆疊
  或漸層動畫，維持 CIS 手冊定義的「純色塊」語彙
- 按鈕內不搭配裝飾性圖示，除非是「下載」（download icon）、「外部連結」（external-link
  icon）等功能性圖示，維持俐落感

### 6.7 表單 (Form)
- 輸入框：圓角 6–8px，預設邊框 `--neutral-300`，focus 狀態邊框變為品牌紫並加 2px 外光暈
  （`box-shadow: 0 0 0 3px rgba(94,61,231,0.15)`）
- Label：Caption 字級／Medium 字重，位於輸入框上方（不採用 placeholder-as-label 模式，
  確保雙語標籤在中英文字數差異下依然清楚可讀）
- 錯誤狀態：邊框與說明文字改為語意紅色〔推估值，因 CIS 手冊未定義語意色，建議另外定義一組
  不與品牌識別衝突的功能色，例如 `#d92d20`（error）、`#12b76a`（success），僅限表單/系統
  訊息使用，不可用於品牌識別相關版位〕

### 6.8 麵包屑 (Breadcrumb)
- 極簡文字型，`--neutral-500` 顏色，以 `/` 或極簡箭頭圖示分隔，當前頁面項目使用
  `--neutral-800` 或品牌黑加粗
- 置於頁面標題正上方，字級 13–14px

### 6.9 語言切換器 (Language Switcher)
- 因應站台 `en` / `zh-Hant` locale-prefixed 路由架構，建議採用文字型切換（「EN／中文」
  並列，中間以極細分隔線區隔），置於導覽列右側、CTA 按鈕之前
- 當前語言使用品牌黑／白（依主題）較粗字重標示，非當前語言使用 `--neutral-400` 較淡顏色，
  不建議使用國旗圖示（材料科技 B2B 網站語境下，文字比國旗更精確、更符合專業調性，且繁中
  對應台灣/香港/其他地區不見得適合用單一國旗代表）

---

## 7. 圖片／攝影調性建議

CIS 手冊本身未包含攝影規範章節，但可從以下線索推導方向：
1. Slogan「Bold ideas. Real answers.」與品牌故事強調「解決他人不敢解決的難題」「創造昨日
   尚未存在的解決方案」（CIS p.4）→ 攝影應強調**真實產線／真實材料特寫**，而非空泛的商業
   握手、會議室等示意圖庫照片
2. 網站風格參考（p.15, 17）選用的對標網站截圖偏好**深色背景襯托產品特寫**、**材料/設備的
   細節微距拍攝**（如 VISIOS 的 LED 面板特寫、neebo 的產品去背特寫），符合「精密材料科技」
   定位

建議攝影調性：
- **材料特寫**：光學膜的光澤反射、紡織泡棉的纖維紋理、聲學材料的孔隙結構，採用微距或近距
  拍攝，善用材料本身在光線下的反光/透光特性（呼應 CIS 手冊與提案簡報封面大量使用的「光學
  膜捲曲反光」意象照片）
- **產線／工廠**：呈現專業、乾淨、具規模感的產線畫面，人物需穿著標準無塵/產線服裝，避免
  雜亂背景，強化「值得信賴的夥伴」定位
- **應用場景**：依產業別（3C、汽車、醫療、太陽能）分別選用該產業情境的實際應用照片，例如
  車用防眩光膜可搭配車艙儀表板特寫、醫療防護材料搭配潔淨的醫療環境
- **色調處理**：建議統一以中性偏冷色調（cool-neutral）校色，避免過度暖黃的「溫馨」調性，
  維持科技感；可在關鍵首圖疊加極淡的品牌紫色調（duotone 或色彩疊加 10-15% 透明度），
  強化品牌一致性，但不濫用在每一張圖片上

---

## 8. 雙語排版注意事項（中英文混排）

VICROUND 網站為 `en` / `zh-Hant` 雙語結構（locale-prefixed routing），且 CIS 手冊本身也是
中英文並列排版的文件（每個標題皆為「英文大寫標題　中文標題」並列格式，如「COLOUR SYSTEM
色彩系統規範」），可作為雙語排版的直接參考範本。

1. **字級不可直接套用同一數值**：中文字符視覺密度高於英文，相同 px 數值下中文會顯得比英文
   小。建議中文標題字級較英文版本略增（+1～2px），或維持相同 px 但確保中文字重不低於英文
   對應字重（例如英文 SemiBold 對應中文至少 Medium 以上，避免中文顯得單薄）。
2. **行高需分別設定**：英文內文行高 1.5–1.6 已足夠，但中文內文（尤其繁體中文標點與方塊字
   特性）建議行高拉高至 1.7–1.8，避免上下文字視覺沾黏，本文件已於第 4.3 節字級表中反映此
   原則（統一抓 1.7 作為中文相容基準）。
3. **中文斷行規則**：避免標點符號（，。、」』）出現在行首（CSS `line-break: strict` 或
   `word-break: keep-all` 搭配瀏覽器原生中文斷行邏輯），禁止在專有名詞「VICROUND」、
   「盈絲實業」中間斷行；英文單字同理不可在字中換行（`overflow-wrap: normal`，避免
   `break-all` 打斷單字）。
4. **字體混排**：中英文字體須分開指定並各自對應語意字重，不可讓瀏覽器用單一字體堆疊自動
   選字（可能選到不對應的預設字重）。CSS 建議寫法：
   ```css
   font-family: "Geologica", "Noto Sans TC", sans-serif;
   ```
   讓拉丁字符優先吃 Geologica、中文字符 fallback 到 Noto Sans TC，兩者字重需在 CSS 中對應
   設定同一數值（例如都用 600 SemiBold），避免同一句話中英文字重不一致的違和感。
5. **標題長度差異**：同一句英文標題翻成中文常會變短（反之亦然），Hero 標題、卡片標題等
   版面設計時不可假設兩語言字數相同，需以「最長可能字數」抓版面高度上限，避免中文版擠壓
   換行、英文版留白過多的不對稱狀況。
6. **數字與英文縮寫的中文語境間距**：中文句子中出現的英文字母/數字（如「3C 產業」
   「ISO 14001」「OEM/ODM」）建議使用半形字元並與中文之間保留約 1/4 全形字寬的視覺間距
   （可透過 CSS `letter-spacing` 微調，或字體本身若支援 `text-spacing-trim` 屬性）。

---

## 9. 出處對照速查表

| 規範項目 | 出處 |
| --- | --- |
| 品牌願景／使命／個性／語調 | CIS 手冊 p.3 |
| 品牌故事 | CIS 手冊 p.4 |
| 品牌標準色（黑/白 HEX、CMYK、RGB） | CIS 手冊 p.6 |
| 品牌行銷輔助色（紫 `#5e3de7`） | CIS 手冊 p.7、p.10（文案原文） |
| 產品標準色（三色） | CIS 手冊 p.8 |
| 產品輔助色搭配邏輯 | CIS 手冊 p.9 |
| Logo 比例法／最小尺寸／淨空範圍 | CIS 手冊 p.11–26 |
| Logo 正確用色（依底色切換） | CIS 手冊 p.27 |
| Logo 禁止用法 9 種 | CIS 手冊 p.28 |
| 品牌口號英文字體規範（Geologica Regular）及最小字級 | CIS 手冊 p.29–30 |
| 中英文字體家族與字重（Geologica／源樣黑體） | CIS 手冊 p.31 |
| 輔助圖形四款造型與色彩配對 | CIS 手冊 p.33–37 |
| 輔助圖形最小尺寸 20mm | CIS 手冊 p.34–37 |
| 名片／信封／Email 簽名檔應用範例 | CIS 手冊 p.38–44 |
| 網站標題字重確認（Geologica SemiBold／源樣黑體 SemiBold） | 網站風格參考 p.9 |
| Angular Design（角度切版）語彙 | 網站風格參考 p.14 |
| Rounded Corners（圓角）語彙 | 網站風格參考 p.18 |
| 對標網站視覺調性（深色科技感） | 網站風格參考 p.15, 17, 19, 20 |
| 網站完整資訊架構 | `VICROUND Web Sitemap-0701.png` |
| 商標黑白版本、Pattern 三色版本 | `Trademark&Pattern/01-Trademark PNG/`、`02-Pattern PNG/` |

---

## 10. 待確認事項（建議下一步與客戶/CIS 手冊原始 AI 檔核對）

1. Pantone 轉 HEX 之精確度：CIS 手冊本身已提供 HTML 色號（非本文件推算），但手冊內文
   特別聲明「本頁與本手冊中所示範的顏色，不可作為 Pantone 顏色的標準」（CIS p.6），故
   正式印刷物（名片、信封等）仍須以最新版 Pantone Colour Formula Guide 校色；純網頁用途
   可直接採用本文件列出的 HEX 值。
2. ~~源樣黑體（GenYoGothic）的網頁字體授權範圍需另行確認~~ — **已於 2026-07-01 解決**：
   開源倉庫 https://github.com/buttaiwan/genyog-font，SIL OFL 1.1，可免費商用與網頁內嵌；
   唯倉庫僅提供 OTF/TTC，需自行轉 WOFF2 並子集化才能上線（詳見 §4.2）。仍可視專案時程
   選擇零建置成本的 Noto Sans TC 替代方案。
3. CIS 手冊未涵蓋「語意色」（成功/警告/錯誤/資訊）與「暗色模式」完整色板，本文件第 2.5
   節與 6.7 節提供之數值皆為推估建議值，建議與品牌方確認是否有偏好色調。
4. 網站風格參考 PDF 為概念方向簡報（moodboard／對標網站蒐集），並非最終網頁視覺稿，實際
   視覺設計仍需進入下一階段的頁面級視覺稿（Hi-fi mockup）驗證本文件建議之元件規格。
