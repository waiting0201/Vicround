import { localizeHtml } from '@/lib/html';
import type { Locale } from '@/lib/locale';

/**
 * 文章內文 —— 視覺逐項對照 `mockup/Rounded Design/article.dc.html`。
 *
 * <p>
 * 內文在 CMS 裡就是一段 HTML（`ArticleTranslations.Body`，由後台的編輯器產生），
 * 因此這一支只負責套上 `.vr-prose` 的 prose 樣式；標題、表格、引言的視覺仍由那份 CSS 決定。
 * </p>
 *
 * <p>
 * <b>HTML 來自後台編輯者，不是使用者輸入</b>——寫入端（Admin API）負責淨化標籤白名單，
 * 公開端只渲染。前台不再做一次消毒，是因為那會把合法的表格與 <code>id</code> 錨點也濾掉，
 * 目錄就會失效。
 * </p>
 */
export function ArticleBody({ html, locale }: { html: string | null; locale: Locale }) {
  if (!html) return null;

  return <div className="vr-prose" dangerouslySetInnerHTML={{ __html: localizeHtml(locale, html)! }} />;
}

/**
 * 內文的側欄目錄。標題與錨點都在同一份 HTML 裡，兩邊不會對不上。
 * <p>
 * 錨點可能掛在 <c>h2</c> 上（文章），也可能掛在包住它的 <c>section</c> 上（隱私權條文），
 * 兩種都認。
 * </p>
 */
export function tableOfContents(html: string | null): { id: string; text: string }[] {
  if (!html) return [];

  // 目錄是純文字（React 會再跳脫一次），因此標籤要拔掉、實體要還原，
  // 否則 `Cookies &amp; Analytics` 會在畫面上變成 `Cookies &amp;amp; Analytics`。
  const strip = (value: string) =>
    value
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();

  const headings = [...html.matchAll(/<h2 id="([^"]+)"[^>]*>(.*?)<\/h2>/g)].map(([, id, text]) => ({
    id,
    text: strip(text),
  }));

  if (headings.length > 0) return headings;

  return [...html.matchAll(/<section id="([^"]+)"[^>]*>\s*<h2[^>]*>(.*?)<\/h2>/g)].map(([, id, text]) => ({
    id,
    text: strip(text),
  }));
}
