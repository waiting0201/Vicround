import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, LOCALES, negotiateLocale } from '@/lib/locale';
import { getRedirects, normalize } from '@/lib/redirects';

/**
 * 語系前綴 + 後台 SPA + 舊網址 301。
 *
 * <p>
 * 順序是**先放行後台、再轉址、最後補語系前綴**：
 * 轉址表存的是完整舊路徑（`/optical-film.html`），若先補成
 * `/en/optical-film.html` 再比對就永遠不會命中。
 * </p>
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /*
   * 後台是 `public/admin/` 底下的 Vite SPA（BrowserRouter, basename="/admin"）。
   * 它的深層網址在伺服器上沒有對應檔案 —— 不特別處理的話會走到下面被補上語系前綴，
   * 變成 `/en/admin/products` 而 404（在後台按 F5 就會遇到）。
   * 一律 rewrite 回 SPA 進入點，路由交給前端接手。
   * 資產大多被 matcher 排除，但 `/admin/index.html` 是 `.html`（matcher 現在放它進來），
   * 所以這裡仍要自己擋一道。
   */
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // SPA 自己的 index.html 與帶副檔名的資產照原樣送出，否則會 rewrite 到自己身上。
    if (/\.[\w]+$/.test(pathname)) return NextResponse.next();
    return NextResponse.rewrite(new URL('/admin/index.html', req.url));
  }

  const rule = (await getRedirects()).get(normalize(pathname));
  if (rule) {
    if (rule.status === 410) {
      // 內容已封存且沒有適當替代目標（docs/sitemap.md）——
      // 導到首頁會讓搜尋引擎繼續回訪，410 才會讓它下架。
      return new NextResponse(null, { status: 410 });
    }
    const target = req.nextUrl.clone();
    target.pathname = rule.to;
    return NextResponse.redirect(target, rule.status);
  }

  /*
   * 舊站的網址幾乎都是 `/xxx.html` —— 轉址表 241 筆裡有 238 筆 —— 所以 `.html`
   * 必須進得到上面那段查詢（matcher 只放行 `.html` 以外的副檔名）。查不到對應
   * 規則的就讓它自然 404：沒有任何 app 路由以 `.html` 結尾，補上語系前綴只會
   * 多繞一次 307 再 404。
   */
  if (pathname.endsWith('.html')) return NextResponse.next();

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  const locale = negotiateLocale(req.headers.get('accept-language')) ?? DEFAULT_LOCALE;
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * 比對所有路徑，但排除：
     * - .swa      Azure Static Web Apps 的部署驗證路徑（/.swa/health.html）
     *             ⚠️ 不可拿掉。SWA 以該路徑確認站台起得來，被 middleware 導向
     *             就會判定部署失敗，而錯誤訊息不會指向這裡。
     * - api       Next.js 自己的 route handlers（/api/revalidate）
     * - _next     框架資產
     * - 靜態檔    有副檔名的一律放行（含 /admin/ 底下的 JS/CSS），**但 .html 除外**
     *             ⚠️ 舊站 241 條 301 裡有 238 條是 `/xxx.html`。把 `.html` 一起
     *             放行等於整批轉址永遠比不到，那些還被索引的舊網址會直接 404。
     *
     * robots.txt / sitemap.xml / llms.txt 有副檔名，同樣走這條放行。
     * /.swa/health.html 雖是 .html，由前面的 `\.swa` 先排除。
     */
    '/((?!\\.swa|api|_next/static|_next/image|favicon\\.ico|.*\\.(?!html$)[\\w]+$).*)',
  ],
};
