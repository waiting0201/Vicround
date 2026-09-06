import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot } from '@/components/sections';
import { technologies } from '@/content/technologies';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Technologies —— 逐區塊對照 `mockup/Rounded Design/technologies.dc.html`。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, technologies);

  return pageMetadata({
    locale,
    path: ROUTES.technologies,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function TechnologiesPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, technologies);

  const eyebrow: React.CSSProperties = {
    margin: 0,
    font: "600 13px/1.2 'Geologica', sans-serif",
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#6436ef',
  };
  const heading: React.CSSProperties = {
    margin: '12px 0 0',
    font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
    color: 'var(--page-fg)',
  };
  const card: React.CSSProperties = {
    background: 'var(--page-bg)',
    border: '1px solid var(--page-border)',
    borderRadius: 22,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.technologies'), path: ROUTES.technologies }])} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        {/* ============ 核心製程 ============ */}
        <section id="core-processes" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.core.eyebrow}</p>
            <h2 style={heading}>{c.core.title}</h2>
            <p
              style={{
                margin: '16px 0 0',
                font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-muted)',
                maxWidth: 620,
                textWrap: 'pretty',
              }}
            >
              {c.core.lead}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
              {c.core.steps.map((step, index) => (
                <div key={step.title} style={card}>
                  <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: '#6436ef' }}>
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
                    {step.title}
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(32px, 5vw, 72px)',
                alignItems: 'center',
                marginTop: 'clamp(36px, 4vw, 56px)',
              }}
            >
              <ImageSlot alt={c.core.imageLabel} label={c.core.imageLabel} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3
                  style={{
                    margin: 0,
                    font: "600 1.25rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {c.core.qc.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-muted)',
                  }}
                >
                  {c.core.qc.body}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {c.core.qc.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--page-border)',
                        borderRadius: 999,
                        font: "400 12px/1.4 'IBM Plex Mono', monospace",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ============ 研發與材料創新 ============ */}
        <section
          id="innovation"
          style={{
            background: 'var(--page-raised)',
            scrollMarginTop: 90,
            borderTop: '1px solid var(--page-border)',
            borderBottom: '1px solid var(--page-border)',
          }}
        >
          <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.innovation.eyebrow}</p>
            <h2 style={heading}>{c.innovation.title}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
              {c.innovation.items.map((item) => (
                <div key={item.title} style={{ ...card, padding: '32px 28px' }}>
                  <span
                    style={{
                      font: "600 1.125rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {item.body}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 'clamp(36px, 4vw, 56px)',
                background: 'var(--page-bg)',
                border: '1px solid var(--page-border)',
                borderRadius: 22,
                padding: 'clamp(28px, 3vw, 40px)',
              }}
            >
              <p
                style={{
                  margin: '0 0 24px',
                  font: "500 12px/1.4 'IBM Plex Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--page-faint)',
                }}
              >
                {c.innovation.flowTitle}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {c.innovation.flow.map((step, index) => (
                  <div key={step.title} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ height: 4, borderRadius: 999, background: step.bar }} />
                    <span style={{ font: "500 12px/1.4 'IBM Plex Mono', monospace", color: '#6436ef' }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {step.title}
                    </span>
                    <span
                      style={{
                        font: "400 0.8125rem/1.55 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {step.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ============ 產品法規符合 ============ */}
        <section id="compliance" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.compliance.eyebrow}</p>
            <h2 style={heading}>{c.compliance.title}</h2>
            <p
              style={{
                margin: '16px 0 0',
                font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-muted)',
                maxWidth: 720,
                textWrap: 'pretty',
              }}
            >
              {c.compliance.leadBefore}
              <Link href={localeHref(locale, ROUTES.sustainability)} style={{ color: '#6436ef', fontWeight: 600 }}>
                {c.compliance.leadLink}
              </Link>
              {c.compliance.leadAfter}
            </p>

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
                  font: "400 0.875rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--page-raised)' }}>
                    {c.compliance.columns.map((column) => (
                      <th
                        key={column}
                        style={{
                          textAlign: 'left',
                          padding: '16px 20px',
                          font: "600 12px/1.4 'IBM Plex Mono', monospace",
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--page-muted)',
                          borderBottom: '1px solid var(--page-border)',
                        }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.compliance.rows.map((row, index) => (
                    <tr key={row.standard} style={{ background: index % 2 === 1 ? '#faf9fd' : 'var(--page-bg)' }}>
                      <td
                        style={{
                          padding: '16px 20px',
                          color: 'var(--page-fg)',
                          borderBottom: '1px solid rgba(20,20,31,0.08)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.standard}
                      </td>
                      <td
                        style={{
                          padding: '16px 20px',
                          color: 'var(--page-muted)',
                          borderBottom: '1px solid rgba(20,20,31,0.08)',
                        }}
                      >
                        {row.scope}
                      </td>
                      <td
                        style={{
                          padding: '16px 20px',
                          color: 'var(--page-muted)',
                          borderBottom: '1px solid rgba(20,20,31,0.08)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.doc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        <PageCTA locale={locale} eyebrow={c.cta.eyebrow} headline={c.cta.headline} subcopy={c.cta.subcopy} />
      </PageShell>
    </>
  );
}
