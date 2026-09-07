import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot, Section } from '@/components/sections';
import { PRODUCT_LINES } from '@/content/product-lines';
import { SOLUTION_NAMES } from '@/content/solutions';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale, type Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 產品線頁 —— 逐區塊對照 `product-optical-film / -textile-foam / -acoustic.dc.html`
 * （三頁結構相同，只有內容不同，所以在這一支動態路由裡共用版型）。
 *
 * <p>
 * ⚠️ 內容暫時來自 `content/product-lines.ts`；接上 `GET /api/v1/categories/{slug}` 之後
 * 改由 API 提供，版型不動。
 * </p>
 */
type Params = { params: Promise<{ locale: string; category: string }> };

export function generateStaticParams() {
  return Object.keys(PRODUCT_LINES).map((category) => ({ category }));
}

function line(locale: Locale, category: string) {
  const source = PRODUCT_LINES[category];
  return source ? localize(locale, source) : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, category } = await params;
  const locale = requireLocale(rawLocale);
  const c = line(locale, category);
  if (!c) return {};

  return pageMetadata({
    locale,
    path: `${ROUTES.products}/${category}`,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function ProductLinePage({ params }: Params) {
  const { locale: rawLocale, category } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = line(locale, category);

  // 三條產品線之外的 slug 一律 404 —— 之後改成「API 查不到才 404」
  if (!c) notFound();

  const solutionNames = localize(locale, SOLUTION_NAMES);
  const crumbs = [
    { name: t('nav.products'), path: ROUTES.products },
    { name: c.banner.eyebrow.split('·').pop()?.trim() ?? category, path: `${ROUTES.products}/${category}` },
  ];

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '16px 20px',
    font: "600 12px/1.4 'IBM Plex Mono', monospace",
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--page-muted)',
    borderBottom: '1px solid var(--page-border)',
    whiteSpace: 'nowrap',
  };
  const tdStyle: React.CSSProperties = {
    padding: '16px 20px',
    color: 'var(--page-muted)',
    borderBottom: '1px solid rgba(20,20,31,0.08)',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px clamp(24px, 5vw, 80px) 0' }}>
          <Breadcrumb locale={locale} items={crumbs} label={t('common.breadcrumb')} />
        </div>

        {/* ============ Overview ============ */}
        <section id="overview" style={{ scrollMarginTop: 90 }}>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 72px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(32px, 5vw, 72px)',
              alignItems: 'center',
            }}
          >
            <ImageSlot src={c.overview.image} alt={c.overview.alt} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2
                style={{
                  margin: 0,
                  font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-fg)',
                  maxWidth: 480,
                  textWrap: 'balance',
                }}
              >
                {c.overview.title}
              </h2>
              {c.overview.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  style={{
                    margin: 0,
                    font: "400 1rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-muted)',
                    textWrap: 'pretty',
                  }}
                >
                  {paragraph}
                </p>
              ))}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 20,
                  marginTop: 12,
                  paddingTop: 28,
                  borderTop: '1px solid var(--page-border)',
                }}
              >
                {c.overview.stats.map((stat) => (
                  <div key={stat.label}>
                    <span
                      style={{
                        display: 'block',
                        font: "500 clamp(1.75rem, 3vw, 2.25rem)/1 'Geologica', sans-serif",
                        color: c.color,
                      }}
                    >
                      {stat.value}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 8,
                        font: "500 0.8125rem/1.4 'IBM Plex Mono', monospace",
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--page-muted)',
                      }}
                    >
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ============ 產品系列 ============ */}
        <section
          id="families"
          style={{
            background: 'var(--page-raised)',
            scrollMarginTop: 90,
            borderTop: '1px solid var(--page-border)',
            borderBottom: '1px solid var(--page-border)',
          }}
        >
          <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
            <h2
              style={{
                margin: 0,
                font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {c.families.title}
            </h2>
            <p
              style={{
                margin: '16px 0 0',
                font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-muted)',
                textWrap: 'pretty',
              }}
            >
              {c.families.lead}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
              {c.families.items.map((item) => (
                <div
                  key={item.code}
                  style={{
                    background: 'var(--page-bg)',
                    border: '1px solid var(--page-border)',
                    borderRadius: 22,
                    padding: '28px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      borderRadius: 12,
                      width: 'fit-content',
                      minWidth: 48,
                      padding: '0 12px',
                      height: 32,
                      background: 'rgba(100,54,239,0.1)',
                      color: c.color,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: "500 13px/1 'IBM Plex Mono', monospace",
                    }}
                  >
                    {item.code}
                  </span>
                  <span
                    style={{
                      font: "600 1.0625rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {item.name}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.875rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {item.body}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          borderRadius: 999,
                          padding: '5px 10px',
                          border: '1px solid var(--page-border)',
                          font: "400 11px/1.4 'IBM Plex Mono', monospace",
                          color: 'var(--page-muted)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 共通規格 ============ */}
        <section id="specs" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
            <h2
              style={{
                margin: 0,
                font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {c.specs.title}
            </h2>

            {/* 窄螢幕時表格自己橫向捲動，頁面不會跟著橫捲 */}
            <div
              style={{
                marginTop: 40,
                overflowX: 'auto',
                border: '1px solid var(--page-border)',
                borderRadius: 22,
              }}
            >
              <table
                style={{
                  width: '100%',
                  minWidth: 640,
                  borderCollapse: 'collapse',
                  font: "400 0.875rem/1.5 'IBM Plex Mono', monospace",
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--page-raised)' }}>
                    <th style={thStyle}>{t('spec.property')}</th>
                    <th style={thStyle}>{t('spec.value')}</th>
                    <th style={thStyle}>{t('spec.note')}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.specs.rows.map((row, index) => (
                    <tr key={row.property} style={index % 2 === 1 ? { background: 'rgba(20,20,31,0.03)' } : undefined}>
                      <td style={{ ...tdStyle, color: 'var(--page-fg)' }}>{row.property}</td>
                      <td style={tdStyle}>{row.value}</td>
                      <td style={tdStyle}>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p
              style={{
                margin: '16px 0 0',
                font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-faint)',
              }}
            >
              {c.specs.note}
            </p>

            <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href={localeHref(locale, ROUTES.downloads)} className="vr-btn">
                {t('spec.download')}
                <span aria-hidden="true">→</span>
              </Link>
              <Link href={localeHref(locale, ROUTES.contact)} className="vr-btn" data-variant="ghost">
                {t('spec.sample')}
              </Link>
            </div>
          </Container>
        </section>

        {/* ============ 製程 ============ */}
        <section
          id="process"
          style={{ background: 'var(--page-raised)', scrollMarginTop: 90, borderTop: '1px solid var(--page-border)' }}
        >
          <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
            <h2
              style={{
                margin: 0,
                font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {c.process.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
              {c.process.steps.map((step, index) => (
                <div
                  key={step.name}
                  style={{
                    background: 'var(--page-bg)',
                    border: '1px solid var(--page-border)',
                    borderRadius: 22,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: c.color }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      borderRadius: 12,
                      width: 40,
                      height: 40,
                      background: 'rgba(100,54,239,0.1)',
                      color: '#6436ef',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={step.icon} size={18} />
                  </span>
                  <span
                    style={{
                      font: "600 1rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {step.name}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 應用於哪些產業 ============ */}
        <Section id="applications" containerStyle={{ padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)' }}>
          <p
            style={{
              margin: '0 0 20px',
              font: "600 13px/1.2 'Geologica', sans-serif",
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#6436ef',
            }}
          >
            {t('products.whereUsed')}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {c.solutions.map((slug) => (
              <Link
                key={slug}
                href={localeHref(locale, `${ROUTES.solutions}/${slug}`)}
                className="vr-pill-link"
              >
                {solutionNames[slug as keyof typeof solutionNames]}
              </Link>
            ))}
          </div>
        </Section>

        <PageCTA
          locale={locale}
          eyebrow={c.cta.eyebrow}
          headline={c.cta.headline}
          subcopy={c.cta.subcopy}
        />
      </PageShell>
    </>
  );
}
