import { LOCALES, type Locale } from './locale';

/**
 * 把 CMS 的 HTML 內文裡的**站內連結補上語系前綴**。
 *
 * <p>
 * 編輯者在後台寫的是 `/sustainability` 這種與語系無關的路徑（slug 掛在實體上，
 * 兩個語系的路徑結構相同，見 database.md §0.5）。渲染時才補前綴，
 * 內容因此不必為每個語系各存一份連結。
 * </p>
 *
 * <p>
 * 只動 `href="/..."`：外部網址、`#` 錨點與已經帶語系的路徑都原樣保留。
 * </p>
 */
export function localizeHtml(locale: Locale, html: string | null): string | null {
  if (!html) return html;

  return html.replace(/href="\/([^"]*)"/g, (match, path: string) => {
    const first = path.split(/[/#?]/)[0];
    if (path.startsWith('/') || LOCALES.includes(first as Locale)) return match;
    return `href="/${locale}/${path}"`;
  });
}
