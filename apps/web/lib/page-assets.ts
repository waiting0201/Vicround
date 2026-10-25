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
 * 產品詳情頁在**淺色底**上的文字用強調色（編號、數值帶、型號 chip）。
 * 取自確認稿 `product-*.dc.html` 的實際色值——500 階的亮色（`CATEGORY_ACCENT`）
 * 放在白底上對比不足，確認稿在淺色頁改用較深的一階。以產品線 slug 為鍵。
 */
export const CATEGORY_TEXT_ACCENT: Record<string, string> = {
  'optical-film': '#1f6ab4',
  'textile-foam': '#a2540f',
  acoustic: '#0f8a76',
};
