import 'server-only';
import type { Metadata } from 'next';
import { DEFAULT_LOCALE, OG_LOCALE, type Locale } from './locale';
import { localesOf } from './hreflang';
import { absoluteUrl, IS_PRODUCTION_SITE, OG_IMAGE_DEFAULT, SITE_NAME, toAbsolute } from './site';

/**
 * 每一頁的 metadata 產生器（docs/sitemap.md「Per-page SEO requirements」）。
 *
 * <p>
 * 六項綁在一起：title / description / canonical / hreflang / Open Graph / Twitter。
 * 頁面**一律**透過這一支產生 metadata，不要各自手寫 —— 手寫的結果是有些頁面
 * 少了 canonical、有些少了 OG 圖，而這種缺漏在瀏覽器上看不出來。
 * </p>
 */
export type PageMetaInput = {
  locale: Locale;
  /** **不含語系前綴**的路徑，首頁傳 `''`。與 sitemap 的 `path` 同一格式。 */
  path?: string;
  title: string;
  description?: string | null;
  /** 內容自己的圖（CMS 的 `OgImageMediaAssetId` 或封面）。沒有就用全站預設 OG 圖。 */
  image?: string | null;
  /** 文章頁傳 `article`，其餘不用傳。 */
  type?: 'website' | 'article';
  publishedTime?: string | null;
  modifiedTime?: string | null;
  /** 覆寫 hreflang 語系清單。只有**不在 sitemap 裡**的頁面需要傳。 */
  locales?: Locale[];
  /** 會員區、預覽頁等不可索引的路由傳 `true`。 */
  noIndex?: boolean;
};

export async function pageMetadata(input: PageMetaInput): Promise<Metadata> {
  const { locale, path = '', title, type = 'website' } = input;

  const url = absoluteUrl(locale, path);
  const description = input.description ?? undefined;

  // 非正式站一律不可索引，與 `app/robots.ts` 同一個判準（`IS_PRODUCTION_SITE`）。
  //
  // robots.txt 只是「請不要抓」——被外部連結到時仍可能被索引，**noindex 才是真正的
  // 攔截**。而且 robots.txt 可能根本不是我們回的：測試網域掛在 Cloudflare 後面時，
  // 它的 managed robots.txt 會蓋掉這一份。meta 標籤在頁面裡，蓋不掉。
  //
  // 判準綁在 SITE_URL 上，所以正式網域上線那天這一條會自己消失，不必記得回來刪。
  if (input.noIndex || !IS_PRODUCTION_SITE) {
    // 不可索引的頁面不宣告 canonical/hreflang —— 那是「請索引這一頁」的訊號，
    // 與 noindex 互相矛盾。
    return {
      title,
      description,
      robots: { index: false, follow: false, nocache: true },
    };
  }

  // 只宣告真的有內容的語系；查不到就只宣告自己這一個（見 lib/hreflang.ts）
  const locales = input.locales ?? (await localesOf(path)) ?? [locale];

  const languages: Record<string, string> = Object.fromEntries(
    locales.map((l) => [l, absoluteUrl(l, path)]),
  );
  // x-default 指向預設語系；該路徑沒有預設語系版本時就不宣告
  if (locales.includes(DEFAULT_LOCALE)) {
    languages['x-default'] = absoluteUrl(DEFAULT_LOCALE, path);
  }

  const image = input.image ? toAbsolute(input.image) : OG_IMAGE_DEFAULT;

  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      title,
      description,
      // 尺寸只在用預設圖時宣告 —— CMS 上傳的圖比例不固定，寫死會讓預覽被裁錯
      images: input.image ? [{ url: image }] : [{ url: image, width: 1200, height: 630 }],
      ...(type === 'article'
        ? {
            ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
            ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
