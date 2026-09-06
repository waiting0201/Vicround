import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FloatingContact } from '@/components/FloatingContact';
import { CertificationLayer } from '@/components/CertificationLayer';
import { HTML_LANG, LOCALES, requireLocale } from '@/lib/locale';
import { translator } from '@/lib/i18n';

/**
 * 語系 layout。`[locale]` 段是文化的唯一真相來源（CLAUDE.md），
 * 所以驗證在這裡做一次，底下的頁面就可以直接把它當成 `Locale`。
 *
 * <p>
 * 外殼（深色底 #0a0a12、Geologica、sticky header、footer、右下浮動聯絡鈕）對應
 * `mockup/Rounded Design` 每一頁的固定結構 —— mockup 的 32 頁都是 Header + 內容 +
 * Footer + FloatingButton。**頁尾 CTA 不在這裡**：它在 mockup 是逐頁決定的
 * （首頁、contact、FAQ、news 內頁、privacy 沒有），所以由各頁自己放。
 * </p>
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // 不支援的語系在這裡就 404（requireLocale）——不要猜，也不要導到預設語系：
  // `/de/products` 若回 200 就會被索引成一個內容與網址不符的頁面
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);

  const t = translator(locale);

  return (
    <html lang={HTML_LANG[locale]}>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <a href="#main" className="sr-only focus:not-sr-only">
            {t('common.skipToContent')}
          </a>
          <SiteHeader locale={locale} />
          <main id="main" style={{ flex: 1 }}>
            {children}
          </main>
          <SiteFooter locale={locale} />
          <FloatingContact locale={locale} />
          <CertificationLayer locale={locale} />
        </div>
      </body>
    </html>
  );
}
