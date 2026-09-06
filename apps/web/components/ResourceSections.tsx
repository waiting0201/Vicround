import Link from 'next/link';
import { Icon } from './Icon';
import { Container } from './sections';
import type { Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';

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

/** 下載清單。連到 `/member` 而不是檔案 —— 規格書是會員限定（docs/cms-api.md）。 */
export function DownloadList({
  locale,
  items,
}: {
  locale: Locale;
  items: { slug: string; title: string; href: string }[];
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 36 }}>
      {items.map((item) => (
        <Link
          key={item.slug}
          href={localeHref(locale, item.href)}
          className="vr-download-row"
        >
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
            <Icon name="download" size={16} />
          </span>
        </Link>
      ))}
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
