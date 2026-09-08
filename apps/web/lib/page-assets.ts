/**
 * 版位圖。
 *
 * <p>
 * 這裡的檔案是**確認稿自帶的設計素材**（`mockup/Rounded Design/` 的 banner 與產品照），
 * 和字型、圖示一樣屬於前端資產，不是 CMS 內容 —— 所以留在 repo，不進翻譯表。
 * </p>
 *
 * <p>
 * 客戶提供正式照片後，改成由 `MediaAssets` 供應：頁面的 `bannerImageUrl` 有值就用它，
 * 這裡只是還沒指定時的退路（見 `bannerImage`）。
 * </p>
 */
const BANNERS: Record<string, string> = {
  'optical-film': '/assets/banner-optical-film.jpg',
  'textile-foam': '/assets/banner-textile-foam.jpg',
  acoustic: '/assets/banner-acoustic.jpg',
};

const DEFAULT_BANNER = '/assets/banner-brand.jpg';

/** CMS 指定的 banner 優先；沒有就用該產品線的設計素材，再沒有就用品牌預設圖。 */
export function bannerImage(fromCms: string | null | undefined, key?: string): string {
  return fromCms || (key ? (BANNERS[key] ?? DEFAULT_BANNER) : DEFAULT_BANNER);
}

/** 產品線的方形情境圖（產品頁卡片與首頁交錯區用）。 */
export function categoryImage(slug: string): string | undefined {
  const images: Record<string, string> = {
    'optical-film': '/assets/product-optical-film.jpg',
    'textile-foam': '/assets/product-textile-foam.jpg',
    acoustic: '/assets/product-acoustic.jpg',
  };
  return images[slug];
}

export const HERO_IMAGE = '/assets/hero-banner-01.jpg';

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
