import Link from 'next/link';
import { getNavigation } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';
import { FOOTER_LINKS, localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';

/**
 * 頁尾 —— 逐項對照 `mockup/Rounded Design/Footer.dc.html`
 * （#08080f 底、wordmark 22px、單列連結、圓形社群鈕、底部版權列）。
 *
 * <p>
 * 社群圖示在 mockup 是 Simple Icons 的 data URI + CSS mask —— 那是因為
 * `cdn.simpleicons.org` 撤下 LinkedIn glyph 後回 404，把按鈕變成空圓。
 * 這裡直接內嵌同一份路徑資料，不再依賴任何 CDN。
 * </p>
 */
const SOCIALS = [
  {
    name: 'LinkedIn',
    // TODO 換成 VICROUND 的實際 profile URL（mockup 也還是佔位）
    url: 'https://www.linkedin.com/',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
  },
  {
    name: 'YouTube',
    url: 'https://www.youtube.com/',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
];

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = translator(locale);

  // 頁尾三組導覽都由 `NavigationItems` 供應（footer / footerLegal / social）。
  // 社群連結目前沒有資料——網址待客戶提供，因此仍用 mockup 的佔位按鈕。
  const groups = await getNavigation(locale);
  const links = groups?.find((group) => group.location === 'footer')?.items ?? [];
  const legal = groups?.find((group) => group.location === 'footerLegal')?.items ?? [];
  const socials = groups?.find((group) => group.location === 'social')?.items ?? [];

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: '#08080f',
        fontFamily: "'Geologica', 'GenYoGothic TW', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '48px clamp(24px, 5vw, 80px) 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href={`/${locale}`}
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flex: '0 0 auto' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 同 SiteHeader：本地固定尺寸資產，圖片優化已關閉 */}
          <img
            src="/brand/vicround-wordmark-white.png"
            alt="VICROUND"
            style={{ height: 22, display: 'block' }}
          />
        </Link>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px 28px',
            flexWrap: 'wrap',
            flex: '1 1 520px',
          }}
        >
          {links.length > 0
            ? links.map((item) => (
                <Link
                  key={item.path ?? item.label}
                  href={localeHref(locale, item.path ?? '/')}
                  className="vr-footer-link"
                >
                  {item.label}
                </Link>
              ))
            : FOOTER_LINKS.map((key) => (
                <Link key={key} href={localeHref(locale, ROUTES[key])} className="vr-footer-link">
                  {t(`nav.${key}`)}
                </Link>
              ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}>
          {SOCIALS.map((social, index) => (
            <a
              key={social.name}
              href={socials[index]?.path ?? social.url}
              aria-label={social.name}
              className="vr-social"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#ffffff"
                opacity="0.75"
                aria-hidden="true"
              >
                <path d={social.path} />
              </svg>
            </a>
          ))}
        </div>
      </div>

      <div
        style={{
          maxWidth: 1280,
          margin: '32px auto 0',
          padding: '24px clamp(24px, 5vw, 80px) 28px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            font: "500 0.75rem/1.4 'Geologica', sans-serif",
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {t('site.legalName')}
        </span>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {(legal.length > 0
            ? legal.map((item) => ({ href: item.path ?? ROUTES.privacy, label: item.label ?? '' }))
            : [{ href: ROUTES.privacy, label: t('nav.privacy') }]
          ).map((item) => (
            <Link
              key={item.href}
              href={localeHref(locale, item.href)}
              style={{
                font: "400 0.8125rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
