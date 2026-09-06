import 'server-only';
import { getSitemapEntries } from './api';
import { isLocale, type Locale } from './locale';

/** 5 分鐘。hreflang 不需要即時，而每一頁的 metadata 都會問一次。 */
const TTL_MS = 5 * 60 * 1000;

let cache: { map: Map<string, Locale[]>; at: number } | null = null;
let inflight: Promise<Map<string, Locale[]>> | null = null;

/**
 * 「這個路徑有哪些語系真的看得到」的對照表，資料來自 `GET /api/v1/sitemap`。
 *
 * <p>
 * **為什麼不能寫死兩個語系**：翻譯缺漏時該語系不宣告 hreflang
 * （docs/sitemap.md、docs/database.md §0.2）。硬印 `en` + `zh-Hant` 會對搜尋引擎
 * 宣告一個不存在的替代版本，比少宣告一個語系傷害更大。
 * </p>
 *
 * <p>
 * 查不到或後端掛掉時回 `null`，呼叫端退回「只宣告自己這一個語系」。
 * </p>
 */
export async function localesOf(path: string): Promise<Locale[] | null> {
  try {
    return (await getMap()).get(normalizePath(path)) ?? null;
  } catch {
    return null;
  }
}

async function getMap(): Promise<Map<string, Locale[]>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;

  // 過期瞬間可能同時進來多個請求 —— 共用同一個 in-flight promise
  inflight ??= load()
    .then((map) => {
      cache = { map, at: Date.now() };
      return map;
    })
    .catch(() => cache?.map ?? new Map<string, Locale[]>())
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

async function load(): Promise<Map<string, Locale[]>> {
  const map = new Map<string, Locale[]>();
  for (const entry of await getSitemapEntries()) {
    const locales = entry.locales.filter(isLocale);
    if (locales.length > 0) map.set(normalizePath(entry.path), locales);
  }
  return map;
}

/** 首頁是空字串；一律去掉尾斜線，讓 `/contact/` 與 `/contact` 是同一筆。 */
function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path === '/' ? '' : path;
}
