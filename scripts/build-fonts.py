#!/usr/bin/env python3
"""把客戶提供的原始字型檔做成自架的 woff2 子集，產出 apps/web/app/fonts.css。

為什麼要這一支
--------------
確認稿的設計系統（mockup 的 `_ds/tokens/fonts.css`）是這樣載中文字型的：

    @font-face { font-family: "GenYoGothic TW";
                 src: url('https://cdn.jsdelivr.net/gh/<個人帳號>/chinese-fonts/…-Regular.ttf'); }

三個問題：檔案是**未子集化的完整 CJK TTF（每個字重約 5.6MB）**、來源是**我們不能控制的
個人 GitHub 鏡像**、而且 `.ttf` 沒有 woff2 的壓縮（差距約 2 倍）。ds 的 readme 自己也寫了
「ACTION NEEDED: please attach the real font so we can self-host」—— 客戶素材裡本來就有
（`reference/01-CH font/源樣黑體/*.ttc`），所以這裡就把它做完。

做法
----
中文字型按 **unicode-range 分塊**（Google Fonts 對 CJK 的作法）：瀏覽器只會下載頁面上
真的出現的那幾塊，而不是整套字。英文 Geologica 是拉丁字集，一個字重一個檔就夠。

用法
----
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/build-fonts.py

字型檔本身是 OFL 授權（可自由嵌入網頁），產出的 woff2 會進版控 —— 它們是網站要對外
提供的資產，與 `reference/` 的客戶素材不同，不受「只同步 NAS」那條規則限制。
"""

from pathlib import Path
import re
import shutil
import urllib.request

from fontTools.ttLib import TTCollection, TTFont
from fontTools.subset import Subsetter, Options

ROOT = Path(__file__).resolve().parent.parent
CH_DIR = ROOT / "reference/01-CH font/源樣黑體"
EN_DIR = ROOT / "reference/02-EN font/Geologica/static"
OUT_DIR = ROOT / "apps/web/public/fonts"
CSS_OUT = ROOT / "apps/web/app/fonts.css"
ADMIN_CSS_OUT = ROOT / "apps/admin/src/fonts.css"

# 字重對應照 mockup 的 _ds/tokens/fonts.css：400=Regular、500=Medium、600/700=Bold。
# CIS 指定的 Semi Bold 在原字型裡不存在（字重只有 EL/L/N/R/M/B/H），Bold 是最接近的一階。
CH_WEIGHTS = [("R", 400), ("M", 500), ("B", 700)]

# Geologica 的字重照 ds 那支 Google Fonts 查詢字串：300;400;500;600;700;800
EN_WEIGHTS = [300, 400, 500, 600, 700, 800]

LATIN = (
    (0x0020, 0x024F),  # 基本拉丁 + 補充 + 擴充 A/B
    (0x2000, 0x206F),  # 一般標點（含破折號、引號）
    (0x20A0, 0x20BF),  # 貨幣符號
    (0x2100, 0x214F),  # 字母式符號（™ ℃）
    (0x2190, 0x21FF),  # 箭頭（版型用了 →）
    (0x2200, 0x22FF),  # 數學運算子
    (0x25A0, 0x25FF),  # 幾何圖形
    (0x2600, 0x26FF),  # 雜項符號
)

# 中文這一側額外要涵蓋的非漢字區段，與漢字分開放在第 0 塊 —— 每一頁都會用到，
# 讓它獨立成一個小檔，才不會為了一個全形逗號去下載一整塊漢字。
CJK_COMMON = (
    (0x3000, 0x303F),  # CJK 標點
    (0x3100, 0x312F),  # 注音符號
    (0xFE30, 0xFE4F),  # CJK 相容形式
    (0xFF00, 0xFFEF),  # 全形英數與標點
)

# 漢字每一塊的字數。太小 → 請求數爆炸；太大 → 一塊裡多數字用不到。
# 800 字約壓成 60–90KB woff2，是實務上常見的折衷。
CHUNK = 800

# 常用字優先。**這一步是有沒有意義的關鍵**：漢字若照字碼順序切塊，
# 一段普通中文的字會平均散落在十幾塊裡，等於整套字都要下載。
# 先用手上的繁中語料統計字頻，把高頻字集中放進前面幾塊，
# 一般頁面就只要抓「拉丁塊 + 前兩塊」。語料用 repo 自己的中文文字
# （docs、CLAUDE.md、前台字典）—— 不是網站文案，但足以代表繁中的高頻字分布。
CORPUS_GLOBS = [
    "docs/*.md",
    "CLAUDE.md",
    "apps/web/messages/zh-Hant.json",
    "design-system/design-system.md",
]
PRIORITY_CHARS = 1600


def frequent_han():
    """從 repo 的繁中語料統計漢字字頻，回傳由高到低排序的字碼清單。"""
    from collections import Counter

    counter = Counter()
    for pattern in CORPUS_GLOBS:
        for path in ROOT.glob(pattern):
            for char in path.read_text(encoding="utf-8", errors="ignore"):
                cp = ord(char)
                if 0x3400 <= cp <= 0x9FFF or 0xF900 <= cp <= 0xFAFF:
                    counter[cp] += 1
    return [cp for cp, _ in counter.most_common()]


def ranges_to_set(ranges):
    out = set()
    for start, end in ranges:
        out.update(range(start, end + 1))
    return out


def subset(font, codepoints, dest):
    """把 font 子集成只含 codepoints 的字，輸出 woff2。回傳實際保留的字碼。"""
    covered = sorted(set(font.getBestCmap()) & codepoints)
    if not covered:
        return []

    options = Options()
    options.flavor = "woff2"
    options.desubroutinize = True
    # 版權與授權資訊必須留著（OFL 的要求），其餘 name 記錄可丟
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    options.layout_features = ["*"]

    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes=covered)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(dest)
    return covered


def fmt_ranges(codepoints):
    """把字碼清單壓成 CSS 的 unicode-range 語法（連續段合併成 A-B）。"""
    parts, start, prev = [], None, None
    for cp in codepoints:
        if start is None:
            start = prev = cp
            continue
        if cp == prev + 1:
            prev = cp
            continue
        parts.append((start, prev))
        start = prev = cp
    if start is not None:
        parts.append((start, prev))
    return ", ".join(
        f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}" for a, b in parts
    )


def fetch_plex_mono():
    """抓 IBM Plex Mono 的 latin 子集（400/500）存成本地檔，回傳 face 定義。"""
    url = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
    # ⚠️ UA 要**完整的**瀏覽器字串：只寫 "Mozilla/5.0 Chrome/120" 的話 Google 會判定成
    # 舊瀏覽器，回傳 .ttf 且不帶子集註解，解析結果會是空的（而且不會報錯）。
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        },
    )
    css = urllib.request.urlopen(request, timeout=30).read().decode()

    faces = []
    # 每個 @font-face 前面都有一行 /* latin */ 之類的註解標明子集名稱
    blocks = re.findall(
        r"/\* (\S+) \*/\s*@font-face \{(.*?)\}", css, re.S
    )
    for subset_name, body in blocks:
        if subset_name != "latin":
            continue  # 站上不會出現越南文或西里爾字母
        weight = int(re.search(r"font-weight:\s*(\d+)", body).group(1))
        src = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        ranges = re.search(r"unicode-range:\s*([^;]+);", body).group(1).strip()

        dest = OUT_DIR / f"ibm-plex-mono-{weight}.woff2"
        dest.write_bytes(urllib.request.urlopen(src, timeout=30).read())
        faces.append(("IBM Plex Mono", weight, dest.name, ranges))
        print(f"{dest.name}: {dest.stat().st_size // 1024}KB（Google Fonts 官方子集）")

    return faces


def main():
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True)

    faces = []

    # ── 英文：Geologica ────────────────────────────────────────────────
    latin = ranges_to_set(LATIN)
    names = {300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}
    for weight in EN_WEIGHTS:
        src = EN_DIR / f"Geologica-{names[weight]}.ttf"
        dest = OUT_DIR / f"geologica-{weight}.woff2"
        covered = subset(TTFont(src), latin, dest)
        faces.append(("Geologica", weight, dest.name, fmt_ranges(covered)))
        print(f"{dest.name}: {dest.stat().st_size // 1024}KB, {len(covered)} 字")

    # ── 中文：GenYoGothic TW（TTC 的第 0 個 face 是 TW，第 1 個是 JP）──
    cjk_common = ranges_to_set(CJK_COMMON)
    frequent = frequent_han()
    print(f"語料統計到 {len(frequent)} 個相異漢字，前 {PRIORITY_CHARS} 個進優先塊")
    for suffix, weight in CH_WEIGHTS:
        ttc = TTCollection(str(CH_DIR / f"GenYoGothic-{suffix}.ttc"))
        available = sorted(set(ttc.fonts[0].getBestCmap()))

        # 第 0 塊：拉丁 + 標點 + 全形（每頁都要，所以獨立成一個小檔）
        common = latin | cjk_common
        # 漢字（含擴充 A 與相容區）按字碼順序切塊；SIP 平面（U+20000+）與表情符號
        # 刻意不做 —— B2B 型錄文案用不到，做了只是多 8MB 沒人下載的檔案。
        han_set = {cp for cp in available if 0x3400 <= cp <= 0x9FFF or 0xF900 <= cp <= 0xFAFF}
        # 高頻字排前面，其餘照字碼順序接在後面
        priority = [cp for cp in frequent if cp in han_set][:PRIORITY_CHARS]
        rest = sorted(han_set - set(priority))
        han = priority + rest
        chunks = [set(han[i : i + CHUNK]) for i in range(0, len(han), CHUNK)]

        for index, codepoints in enumerate([common] + chunks):
            # 每一塊都要重新開檔：subset 會就地改動 TTFont 物件
            face = TTCollection(str(CH_DIR / f"GenYoGothic-{suffix}.ttc")).fonts[0]
            dest = OUT_DIR / f"genyogothic-tw-{weight}-{index}.woff2"
            covered = subset(face, codepoints, dest)
            if not covered:
                continue
            faces.append(("GenYoGothic TW", weight, dest.name, fmt_ranges(covered)))
        print(f"GenYoGothic TW {weight}: {len(chunks) + 1} 塊")

    # ── 等寬：IBM Plex Mono ───────────────────────────────────────────
    # 規格表與技術標籤用。客戶素材裡沒有這一支（它不是 CIS 指定字體，是設計系統
    # 為技術脈絡挑的），所以從 Google Fonts 取官方 woff2 存下來自架 ——
    # 目的與中文那邊一致：正式站不要有任何第三方字型請求。OFL 授權，可自由嵌入。
    faces += fetch_plex_mono()

    # ── 產出 CSS ──────────────────────────────────────────────────────
    lines = [
        "/* 由 scripts/build-fonts.py 產生 —— 不要手改。",
        "   來源：reference/01-CH font/源樣黑體/*.ttc 與 reference/02-EN font/Geologica/static/*.ttf",
        "   （皆為 SIL OFL 授權，可自由嵌入網頁）。",
        "",
        "   取代確認稿 _ds/tokens/fonts.css 的 CDN 版：字體家族名與字重對應完全相同，",
        "   差別只在檔案改為自架且已子集化。中文按 unicode-range 分塊，",
        "   瀏覽器只會下載頁面實際用到的那幾塊。 */",
        "",
    ]
    for family, weight, filename, ranges in faces:
        lines += [
            "@font-face {",
            f'  font-family: "{family}";',
            f"  src: url('/fonts/{filename}') format('woff2');",
            f"  font-weight: {weight};",
            "  font-style: normal;",
            "  font-display: swap;",
            f"  unicode-range: {ranges};",
            "}",
            "",
        ]

    # 600 在 mockup 是對到 Bold —— 這裡以 700 的檔案再宣告一次，維持同樣的視覺對應
    for family, weight, filename, ranges in [f for f in faces if f[0] == "GenYoGothic TW" and f[1] == 700]:
        lines += [
            "@font-face {",
            f'  font-family: "{family}";',
            f"  src: url('/fonts/{filename}') format('woff2');",
            "  font-weight: 600; /* 原字型無 Semi Bold，沿用 mockup 的作法以 Bold 代替 */",
            "  font-style: normal;",
            "  font-display: swap;",
            f"  unicode-range: {ranges};",
            "}",
            "",
        ]

    CSS_OUT.write_text("\n".join(lines))
    # 後台也用同一份字體（同一個品牌）。字檔實際由前台的 public/fonts 供應，
    # 兩者在正式站同源，所以 `/fonts/...` 的絕對路徑在 /admin 底下一樣讀得到。
    # （vite 的 5173 開發站沒有這個目錄，那時會 fallback 到系統字體，不影響功能。）
    ADMIN_CSS_OUT.write_text("\n".join(lines))
    total = sum(f.stat().st_size for f in OUT_DIR.iterdir())
    print(f"\n{len(faces)} 個 @font-face，{len(list(OUT_DIR.iterdir()))} 個檔，共 {total // 1024 // 1024}MB")
    print(f"CSS -> {CSS_OUT.relative_to(ROOT)} + {ADMIN_CSS_OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
