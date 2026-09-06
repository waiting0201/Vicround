import type { MetadataRoute } from 'next';
import { IS_PRODUCTION_SITE, SITE_URL } from '@/lib/site';
import { LOCALES } from '@/lib/locale';

/**
 * **檢索型** AI 爬蟲 —— 回答問題時當場來抓、而且會附出處連結的那些。明示允許。
 *
 * <p>
 * 這是 GEO 的前提：`/llms.txt` 與 JSON-LD 寫得再好，爬不到也沒有意義。
 * 訓練型爬蟲（GPTBot、CCBot、Google-Extended…）**刻意不列**，是否放行屬於
 * 授權政策，留給客戶決定後在此明確加上，不要預設放行。
 * </p>
 */
const AI_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'DuckAssistBot',
];

/**
 * 永不索引的路徑（docs/sitemap.md）。
 * `/admin` 是後台 SPA；`/{locale}/account` 是會員專區；`/*​/preview` 是草稿預覽。
 */
const NEVER_CRAWL = [
  '/api/',
  '/admin',
  ...LOCALES.map((l) => `/${l}/account`),
  '/*/preview',
];

/**
 * robots.txt。
 *
 * <p>
 * **非正式環境整站 Disallow**：SWA 的預覽環境有自己的網址，被索引會與正式站互相稀釋。
 * 判準是 `NEXT_PUBLIC_SITE_URL` 是否為正式網域 —— 用環境變數而非 `NODE_ENV`，
 * 因為預覽環境同樣是 production build。
 * </p>
 */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION_SITE) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: NEVER_CRAWL },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: NEVER_CRAWL },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
