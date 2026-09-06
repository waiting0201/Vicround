import { notFound } from 'next/navigation';

/**
 * 支援的語系。與後端 `Cultures` 表、Content API 的 `?culture=` 必須一致
 * （見 docs/database.md §0.2）。
 */
export const LOCALES = ['en', 'zh-Hant'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}

/**
 * 把路由參數窄化成 `Locale`。
 *
 * <p>
 * Next.js 的 typed routes 會把 `[locale]` 段的型別定成 `string`，頁面不能直接宣告成
 * `Locale`（型別對不上，build 會失敗）。所以取值之後一律過這一支。
 * </p>
 *
 * <p>
 * 不支援的語系**直接 404**，不猜、也不退回預設語系 —— `/de/products` 若回 200
 * 就會被索引成一個內容與網址不符的頁面。
 * </p>
 */
export function requireLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}

/**
 * 從 Accept-Language 挑一個支援的語系；挑不到就回預設值。
 *
 * <p>
 * ⚠️ 這只在**網址沒有語系前綴**時用得到（middleware 補前綴的那一步）。
 * 一旦路徑上有 `[locale]`，那一段就是文化的唯一真相來源 —— 見 CLAUDE.md 的
 * 「Locale lives in the URL」。不要在頁面或 API client 裡再讀一次 Accept-Language。
 * </p>
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const wanted = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of wanted) {
    // zh-Hant / zh-TW / zh-HK / zh 都導向繁體；zh-Hans（簡體）本站沒有，落回英文
    if (tag.startsWith('zh-hans') || tag === 'zh-cn') return DEFAULT_LOCALE;
    if (tag.startsWith('zh')) return 'zh-Hant';
    if (tag.startsWith('en')) return 'en';
  }

  return DEFAULT_LOCALE;
}

/** `<html lang>` 用的 BCP 47 標籤。`zh-Hant` 本身就是合法標籤，維持原樣。 */
export const HTML_LANG: Record<Locale, string> = { en: 'en', 'zh-Hant': 'zh-Hant' };

/** Open Graph 的 `og:locale` 要「語言_地區」，光給 `en` 不合規格。 */
export const OG_LOCALE: Record<Locale, string> = { en: 'en_US', 'zh-Hant': 'zh_TW' };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-Hant': '繁體中文',
};

/** 頁首切換器用的短標籤（版面只放得下兩個字元）。 */
export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  en: 'EN',
  'zh-Hant': '中',
};

/**
 * 目前這一頁在另一個語系的網址。
 *
 * <p>
 * 換掉語系前綴就好，**不需要查表**：`Slug` 掛在實體本身而非翻譯列
 * （docs/database.md §0.5），所以兩個語系的路徑結構完全相同。
 * </p>
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split('/');
  if (!isLocale(segments[1])) return `/${target}`;
  segments[1] = target;
  return segments.join('/');
}
