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
export function ArticleBody({ html }: { html: string | null }) {
  if (!html) return null;

  return <div className="vr-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** 內文的 `h2[id]` → 側欄目錄。標題與錨點都在同一份 HTML 裡，兩邊不會對不上。 */
export function tableOfContents(html: string | null): { id: string; text: string }[] {
  if (!html) return [];

  return [...html.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/g)].map(([, id, text]) => ({
    id,
    text: text.replace(/<[^>]+>/g, ''),
  }));
}
