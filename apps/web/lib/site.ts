import type { Locale } from './locale';

/**
 * 站台絕對網址。**唯一真相來源** —— canonical、hreflang、sitemap、OG 圖、JSON-LD
 * 全部從這裡取，不要在頁面裡各自讀一次環境變數。
 *
 * 刻意**不加 `server-only`**：`NEXT_PUBLIC_` 的值本來就會進 client bundle，
 * 而麵包屑與 JSON-LD 的組裝也要用到絕對網址。
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.vicround.com';

/** 這一份部署是不是正式站。robots.txt 與 llms.txt 用它決定要不要露出。 */
export const IS_PRODUCTION_SITE = SITE_URL === 'https://www.vicround.com';

export const SITE_NAME = 'VicRound';
export const LEGAL_NAME = '盈絲實業有限公司 VicRound Industrial Co., Ltd.';

/** 內容沒有自己的圖時共用的 OG 圖（1200×630）。 */
export const OG_IMAGE_DEFAULT = `${SITE_URL}/brand/og-default.png`;

/** JSON-LD 的 `Organization.logo` 需要絕對路徑。 */
export const BRAND_LOGO_URL = `${SITE_URL}/brand/vicround-logo.png`;

/**
 * 語系無關的路徑（首頁傳 `''`）組成絕對網址。
 *
 * <p>
 * 路徑一律不帶尾斜線 —— canonical 與 sitemap 必須逐字相同，
 * 多一條斜線在 Search Console 會被當成另一個網址。
 * </p>
 */
export function absoluteUrl(locale: Locale | string, path = ''): string {
  return `${SITE_URL}/${locale}${path}`;
}

/** 相對路徑補成絕對；已經是絕對網址（Blob 上的圖）就原樣回傳。 */
export function toAbsolute(url: string): string {
  return url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
