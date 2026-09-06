import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/api';
import { DEFAULT_LOCALE } from '@/lib/locale';
import { SITE_URL } from '@/lib/site';

/**
 * sitemap.xml，資料來自 `GET /api/v1/sitemap`（docs/sitemap.md）。
 *
 * <p>
 * ⚠️ **hreflang 只列該路徑真的有內容的語系。** API 的 `locales` 已經算好了 ——
 * 前端不可以自己補滿 en + zh-Hant：翻譯缺漏的頁面不會存在，那等於向搜尋引擎
 * 宣告一批 404 並在 alternates 裡互指到不存在的頁面。
 * </p>
 *
 * <p>
 * 已轉址的舊網址**不進 sitemap**，只列 canonical 的語系網址 —— 後端負責過濾。
 * </p>
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();

  return entries.flatMap((entry) =>
    entry.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${entry.path}`,
      lastModified: new Date(entry.lastModified),
      changeFrequency: entry.changeFreq as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: entry.priority,
      alternates: {
        languages: {
          ...Object.fromEntries(entry.locales.map((l) => [l, `${SITE_URL}/${l}${entry.path}`])),
          // x-default 指向預設語系；該路徑沒有 en 版本時就不宣告，而不是硬指過去產生 404
          ...(entry.locales.includes(DEFAULT_LOCALE)
            ? { 'x-default': `${SITE_URL}/${DEFAULT_LOCALE}${entry.path}` }
            : {}),
        },
      },
    })),
  );
}
