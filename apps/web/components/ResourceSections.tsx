import Link from 'next/link';
import { Icon } from './Icon';
import { Container } from './sections';
import type { Download } from '@/lib/content-api';
import type { Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';

/**
 * Resources 頁的共用小元件 —— 抽出來是因為 `/resources` 與 `/resources/downloads`
 * 用的是同一份下載清單（mockup 只有前者，本站的資訊架構多了一個獨立頁）。
 */
export const resourceEyebrow: React.CSSProperties = {
  margin: 0,
  font: "600 13px/1.2 'Geologica', sans-serif",
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#6436ef',
};

export const resourceHeading: React.CSSProperties = {
  margin: '12px 0 0',
  font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-fg)',
};

/**
 * 下載清單。
 *
 * <p>
 * 連到哪裡由 <code>accessLevel</code> 決定（docs/cms-api.md）：公開檔案直接給 CDN 網址、
 * 會員限定連到 <code>/member</code>（公開端根本拿不到真實網址）、需索取的連到詢問表單。
 * </p>
 */
export function DownloadList({
  locale,
  items,
  emptyLabel,
}: {
  locale: Locale;
  items: Download[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <p
        style={{
          margin: '36px 0 0',
          padding: '28px 24px',
          border: '1px dashed var(--page-border)',
          borderRadius: 22,
          font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
          color: 'var(--page-faint)',
        }}
      >
        {emptyLabel}
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 36 }}>
      {items.map((item) => {
        const href = item.fileUrl ?? (item.requiresSignIn ? localeHref(locale, ROUTES.member) : null);
        const target = href ?? localeHref(locale, item.requestUrl ?? ROUTES.contact);

        return (
          <Link key={item.slug} href={target} className="vr-download-row">
            <span
              style={{
                font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {item.title}
            </span>
            <span
              style={{
                flex: '0 0 auto',
                width: 34,
                height: 34,
                borderRadius: 999,
                background: 'rgba(100,54,239,0.12)',
                color: '#6436ef',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={item.requiresSignIn ? 'shield' : 'download'} size={16} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** 區段外殼：eyebrow + 標題（+ 右側 CTA）。 */
export function ResourceSection({
  id,
  eyebrow,
  title,
  cta,
  raised,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  cta?: React.ReactNode;
  raised?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        scrollMarginTop: 90,
        background: raised ? 'var(--page-raised)' : undefined,
        borderTop: raised ? '1px solid var(--page-border)' : undefined,
        borderBottom: raised ? '1px solid var(--page-border)' : undefined,
      }}
    >
      <Container style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p style={resourceEyebrow}>{eyebrow}</p>
            <h2 style={resourceHeading}>{title}</h2>
          </div>
          {cta}
        </div>
        {children}
      </Container>
    </section>
  );
}
