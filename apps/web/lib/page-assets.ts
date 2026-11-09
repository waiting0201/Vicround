/**
 * 版位圖。
 *
 * <p>
 * 這裡的檔案是**確認稿自帶的設計素材**（`mockup/Rounded Design/` 的產品照），
 * 和字型、圖示一樣屬於前端資產，不是 CMS 內容 —— 所以留在 repo，不進翻譯表。
 * </p>
 *
 * <p>
 * ⚠️ **banner 不在這裡。** 各頁頁首橫幅與首頁主視覺只用 CMS 的 `bannerImageUrl`，
 * 後台沒傳圖就不顯示圖帶（見 `components/PageBanner.tsx`），不拿設計素材頂替。
 * </p>
 */
/**
 * 素材根位址。空字串＝素材隨站台一起打包（本機與尚未接 Blob 時的行為）；
 * 設成 Blob 容器的公開網址時，`scripts/pack-standalone.mjs` 會把 `public/assets`
 * 排除在部署產物之外，250MB 的額度就不必花在圖片上。
 *
 * ⚠️ 兩邊是綁在一起的：這個變數有值，產物裡就沒有 `public/assets`。少改一邊
 * 就是整站版位圖 404。
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? '').replace(/\/$/, '');

/** 把 `/assets/...` 指到素材根位址。沒設 MEDIA_BASE 時原樣輸出。 */
const asset = (path: string): string => `${MEDIA_BASE}${path}`;

/** 產品線的方形情境圖（產品頁卡片與首頁交錯區用）。 */
export function categoryImage(slug: string): string | undefined {
  const images: Record<string, string> = {
    'optical-film': asset('/assets/product-optical-film.jpg'),
    'textile-foam': asset('/assets/product-textile-foam.jpg'),
    acoustic: asset('/assets/product-acoustic.jpg'),
  };
  return images[slug];
}

/**
 * 產品線的強調色。取自設計系統的 category token（`app/ds/tokens/colors.css`），
 * 不從 CMS 的 `AccentColorHex` 讀 —— 顏色是設計系統的決定，不是編輯者的內容。
 */
export const CATEGORY_ACCENT: Record<string, string> = {
  opticalFilm: 'var(--optical-500)',
  textileFoam: 'var(--textile-500)',
  acoustic: 'var(--acoustic-500)',
};

/** 產品線頁的深色情境底（mockup 的 challenge／overview 圖底）。 */
export const CATEGORY_DEEP: Record<string, string> = {
  opticalFilm: 'var(--optical-900)',
  textileFoam: 'var(--textile-900)',
  acoustic: 'var(--acoustic-900)',
};

/**
 * 產品線輔助色＝CIS p.8 各產品線的標準色與其 10% 一階的淡色（2026-11-09 客戶指定）。
 * 產品詳情頁的剖面色帶、型號 chip、應用場景色條、數值帶都用它，依產品線分色——
 * 不是 CIS p.9 那個三線共用的 2097C 紫。以產品線 slug 為鍵。
 * 注意：Cool Gray 2C 與 3105 C 當白底文字對比偏低，這是客戶指定的取捨。
 */
export const CATEGORY_CIS_COLOR: Record<string, { color: string; lightest: number }> = {
  // lightest：剖面最上層（最淡）取幾 % 的淡色。Cool Gray 2C 本身就淺，40% 在白底上幾乎看不見，
  // 所以聲學類從 60% 起跳；紡織泡棉的 1925 C 飽和度高，客戶指定最淡層壓到 20%。
  'optical-film': { color: '#71d6e0', lightest: 40 }, // PANTONE 3105 C
  'textile-foam': { color: '#e7004b', lightest: 20 }, // PANTONE 1925 C
  acoustic: { color: '#cfcfcd', lightest: 60 }, // PANTONE Cool Gray 2C
};
