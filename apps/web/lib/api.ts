import 'server-only';
import type { Locale } from './locale';

/**
 * Content API（`fn-public`，`/api/v1/**`）的伺服器端 client。
 *
 * <p>
 * **快取策略**：走 Next.js Data Cache，每次取值都帶 tag（docs/architecture.md
 * 「Caching」）。發布時 `fn-admin` 打 `/api/revalidate` 讓對應 tag 失效，
 * 所以這裡可以放心用長 TTL —— 內容不會因為快取而過期，只會因為沒人發布而不變。
 * </p>
 *
 * <p>
 * ⚠️ **`/api/v1/account/**` 不可以走這一支**：會員資料一律 `no-store`、不進 Data Cache、
 * 不帶 tag（docs/cms-api.md）。那一邊請用 `accountFetch`。
 * </p>
 */
const API_BASE = process.env.API_BASE ?? 'http://localhost:7071/api/v1';

export type ApiResult<T> = T | null;

type GetOptions = {
  /** 內容文化。列表與詳情一律要帶，否則後端會落回預設語系。 */
  culture?: Locale;
  /** 這一筆資料屬於哪些 revalidate tag。發布時由 fn-admin 指名失效。 */
  tags?: string[];
  /** 查詢參數（`undefined` 的鍵會被略過）。 */
  query?: Record<string, string | number | boolean | undefined>;
};

/**
 * 取一筆內容。**失敗一律回 `null`，不丟例外。**
 *
 * <p>
 * 後端尚未實作（目前是規劃階段）或暫時掛掉時，頁面要能渲染出骨架而不是整站 500 ——
 * 呼叫端自行決定「列表顯示空狀態、詳情頁 `notFound()`」。
 * </p>
 */
export async function apiGet<T>(path: string, options: GetOptions = {}): Promise<ApiResult<T>> {
  const url = new URL(`${API_BASE}${path}`);
  if (options.culture) url.searchParams.set('culture', options.culture);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { tags: options.tags ?? [] },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * 會員專區（Account API）的呼叫。與 `apiGet` 分開是刻意的 ——
 * 這一條**永遠 `no-store`**，且必須帶會員的 access token，不共用任何快取設定。
 */
export async function accountFetch(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<Response> {
  const { accessToken, ...rest } = init;
  return fetch(`${API_BASE}/account${path}`, {
    ...rest,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...rest.headers,
    },
  });
}

/** revalidate tag 的命名規則，前後端共用同一組字串（見 docs/cms.md）。 */
export const tag = {
  navigation: () => 'navigation',
  siteSettings: () => 'site-settings',
  categories: () => 'categories',
  category: (slug: string) => `category:${slug}`,
  products: () => 'products',
  product: (slug: string) => `product:${slug}`,
  solutions: () => 'solutions',
  solution: (slug: string) => `solution:${slug}`,
  technologies: () => 'technologies',
  articles: (type?: string) => (type ? `articles:${type}` : 'articles'),
  article: (slug: string) => `article:${slug}`,
  faq: () => 'faq',
  downloads: () => 'downloads',
  certifications: () => 'certifications',
  page: (slug: string) => `page:${slug}`,
  sitemap: () => 'sitemap',
};

/** `GET /api/v1/sitemap` 的一列。sitemap.xml 與 hreflang 都以它為準。 */
export type SitemapEntry = {
  path: string;
  locales: string[];
  lastModified: string;
  changeFreq?: string;
  priority?: number;
};

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const data = await apiGet<{ items?: SitemapEntry[] } | SitemapEntry[]>('/sitemap', {
    tags: [tag.sitemap()],
  });
  if (!data) return [];
  return Array.isArray(data) ? data : (data.items ?? []);
}
