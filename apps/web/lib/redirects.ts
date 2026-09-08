import 'server-only';

/**
 * DB 驅動的 301（`Redirects` 表）。舊站是扁平的 `.html` 網址，
 * 換成語系前綴之後**每一條路徑都變了**，這些轉址是既有 SEO 的全部（docs/sitemap.md）。
 *
 * <p>
 * 走 middleware 而不是 `next.config` 的 `redirects()`：規則是編輯者在後台維護的資料，
 * 改一條 slug 就多一列，不能每次都重新部署。
 * </p>
 *
 * <p>
 * **路由解析順序寫死：實體查詢 → 找不到才查 Redirects → 都沒有才 404。**
 * 這是 `Slug` 的 filtered unique index 能安全成立的前提（database.md §17.1），
 * 所以這一支只在 middleware 裡當「補漏」用，不可以搶在實體查詢之前。
 * </p>
 */
const API_BASE = process.env.API_BASE ?? 'http://localhost:7071/api/v1';

/** 5 分鐘。轉址表變動不頻繁，而每一個未命中的請求都會問一次。 */
const TTL_MS = 5 * 60 * 1000;

export type RedirectRule = { to: string; status: 301 | 302 | 308 | 410 };

let cache: { map: Map<string, RedirectRule>; at: number } | null = null;
let inflight: Promise<Map<string, RedirectRule>> | null = null;

export async function getRedirects(): Promise<Map<string, RedirectRule>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;

  inflight ??= load()
    .then((map) => {
      cache = { map, at: Date.now() };
      return map;
    })
    .catch(() => cache?.map ?? new Map<string, RedirectRule>())
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

async function load(): Promise<Map<string, RedirectRule>> {
  const map = new Map<string, RedirectRule>();

  try {
    const res = await fetch(`${API_BASE}/redirects`, {
      headers: { Accept: 'application/json' },
      // middleware 是 edge runtime，這裡不用 Data Cache（上面自己管 TTL）
      cache: 'no-store',
    });
    if (!res.ok) return map;

    // Content API 一律回統一信封（docs/cms-api.md），這一支是 edge middleware 用的
    // 原生 fetch，因此得自己拆一層。
    const body = (await res.json()) as {
      success?: boolean;
      data?: { items?: { from: string; to: string; statusCode?: number }[] };
    };

    for (const row of body.data?.items ?? []) {
      map.set(normalize(row.from), {
        to: row.to,
        status: (row.statusCode ?? 301) as RedirectRule['status'],
      });
    }
  } catch {
    // 後端還沒上線或暫時掛掉：沒有轉址表比整站 500 好
  }

  return map;
}

/** 比對前一律小寫、去尾斜線 —— 舊站的網址大小寫並不一致。 */
export function normalize(pathname: string): string {
  const lower = pathname.toLowerCase();
  return lower.length > 1 ? lower.replace(/\/+$/, '') : lower;
}
