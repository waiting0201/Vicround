import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { products } from '@/content/products';
import { SOLUTION_PAGES } from '@/content/solution-pages';
import { SOLUTION_NAMES } from '@/content/solutions';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale, type Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 產業解決方案內頁 —— 逐區塊對照七支 `solution-*.dc.html`。
 *
 * <p>
 * 六頁共用同一組區塊（課題 → 材料 → 規格 → 為何選我們 → 其他應用）；
 * Acoustic Solutions 那頁把中段換成「網布等級表 + 如何驗證 + 目前應用」，
 * 所以下面依內容有無決定渲染哪些段，而不是為它另開一支頁面。
 * </p>
 */
type Params = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return Object.keys(SOLUTION_PAGES).map((slug) => ({ slug }));
}

function solution(locale: Locale, slug: string) {
  const source = SOLUTION_PAGES[slug];
  return source ? localize(locale, source) : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const c = solution(locale, slug);
  if (!c) return {};

  return pageMetadata({
    locale,
    path: `${ROUTES.solutions}/${slug}`,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function SolutionPage({ params }: Params) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = solution(locale, slug);

  if (!c) notFound();

  const names = localize(locale, SOLUTION_NAMES);
  const lineNames = Object.fromEntries(
    localize(locale, products).lines.map((line) => [line.slug, line.title]),
  );
  const crumbs = [
    { name: t('nav.solutions'), path: ROUTES.solutions },
    { name: names[slug] ?? slug, path: `${ROUTES.solutions}/${slug}` },
  ];

  const sectionTitleStyle: React.CSSProperties = {
    margin: 0,
    font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
    color: 'var(--page-fg)',
  };
  const cardStyle: React.CSSProperties = {
    background: 'var(--page-bg)',
    border: '1px solid var(--page-border)',
    borderRadius: 22,
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  };
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

  const challengeCopy = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 18, height: 2, background: c.accent, display: 'inline-block' }} />
        <p
          style={{
            margin: 0,
            font: "600 13px/1.2 'Geologica', sans-serif",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: c.accent,
          }}
        >
          {c.challenge.eyebrow}
        </p>
      </div>
      <h2 style={{ ...sectionTitleStyle, maxWidth: 480, textWrap: 'balance' }}>{c.challenge.title}</h2>
      {c.challenge.paragraphs.map((paragraph) => (
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
    </div>
  );

  /* 課題區的圖是實心色塊佔位（mockup 尚無素材），底色逐頁不同 */
  const challengeImage = (
    <div
      style={{
        borderRadius: 22,
        aspectRatio: '4 / 3',
        background: c.challenge.imageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          font: "500 12px/1.4 'IBM Plex Mono', monospace",
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        {c.challenge.imageLabel}
      </span>
    </div>
  );

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image="/assets/banner-brand.jpg"
          imageLabel={c.banner.imageLabel}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px clamp(24px, 5vw, 80px) 0' }}>
          <Breadcrumb locale={locale} items={crumbs} label={t('common.breadcrumb')} />
        </div>

        {/* ============ 課題 ============ */}
        <section id="challenge" style={{ scrollMarginTop: 90 }}>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 72px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(32px, 5vw, 72px)',
              alignItems: 'center',
            }}
          >
            {c.challenge.imageFirst ? challengeImage : challengeCopy}
            {c.challenge.imageFirst ? challengeCopy : challengeImage}
          </Container>
        </section>

        {/* ============ 材料（六頁）／網布等級（Acoustic） ============ */}
        {c.materials && (
          <section
            id="materials"
            style={{
              background: 'var(--page-raised)',
              scrollMarginTop: 90,
              borderTop: '1px solid var(--page-border)',
              borderBottom: '1px solid var(--page-border)',
            }}
          >
            <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
              <h2 style={sectionTitleStyle}>{c.materials.title}</h2>
              <p
                style={{
                  margin: '16px 0 0',
                  font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-muted)',
                  textWrap: 'pretty',
                }}
              >
                {c.materials.lead}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
                {c.materials.items.map((item) => (
                  <div key={item.name} style={cardStyle}>
                    <span
                      style={{
                        borderRadius: 12,
                        width: 44,
                        height: 44,
                        background: 'rgba(100,54,239,0.1)',
                        color: '#6436ef',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={item.icon} size={20} />
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
                      <span
                        style={{
                          borderRadius: 999,
                          padding: '5px 10px',
                          border: '1px solid var(--page-border)',
                          font: "400 11px/1.4 'IBM Plex Mono', monospace",
                          color: 'var(--page-muted)',
                        }}
                      >
                        {item.platform}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {c.grades && (
          <section
            id="grades"
            style={{
              background: 'var(--page-raised)',
              scrollMarginTop: 90,
              borderTop: '1px solid var(--page-border)',
              borderBottom: '1px solid var(--page-border)',
            }}
          >
            <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
              <h2 style={sectionTitleStyle}>{c.grades.title}</h2>
              <p
                style={{
                  margin: '16px 0 0',
                  font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-muted)',
                }}
              >
                {c.grades.lead}
              </p>
              <div
                style={{
                  marginTop: 40,
                  overflowX: 'auto',
                  border: '1px solid var(--page-border)',
                  borderRadius: 22,
                  background: 'var(--page-bg)',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    minWidth: 720,
                    borderCollapse: 'collapse',
                    font: "400 0.875rem/1.5 'IBM Plex Mono', monospace",
                  }}
                >
                  <thead>
                    <tr style={{ background: 'var(--page-raised)' }}>
                      {c.grades.columns.map((column) => (
                        <th key={column} style={thStyle}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {c.grades.rows.map((row, index) => (
                      <tr key={row[0]} style={index % 2 === 1 ? { background: 'rgba(20,20,31,0.03)' } : undefined}>
                        {row.map((cell, cellIndex) => (
                          <td key={cell} style={cellIndex === 0 ? { ...tdStyle, color: 'var(--page-fg)' } : tdStyle}>
                            {cell}
                          </td>
                        ))}
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
                {c.grades.note}
              </p>
            </Container>
          </section>
        )}

        {/* ============ 關鍵規格 ============ */}
        {c.specs && (
          <section id="specs" style={{ scrollMarginTop: 90 }}>
            <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
              <h2 style={sectionTitleStyle}>{c.specs.title}</h2>
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
            </Container>
          </section>
        )}

        {/* ============ Acoustic 專用：如何驗證 / 目前應用 ============ */}
        {c.cards?.map((group, groupIndex) => (
          <section
            key={group.title}
            style={{
              background: groupIndex % 2 === 0 ? undefined : 'var(--page-raised)',
              borderTop: groupIndex % 2 === 0 ? undefined : '1px solid var(--page-border)',
              scrollMarginTop: 90,
            }}
          >
            <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
              <h2 style={sectionTitleStyle}>{group.title}</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${group.items.length > 3 ? 4 : 3}, 1fr)`,
                  gap: 20,
                  marginTop: 40,
                }}
              >
                {group.items.map((item) => (
                  <div key={item.name} style={cardStyle}>
                    <span
                      style={{
                        borderRadius: 12,
                        width: 44,
                        height: 44,
                        background: 'rgba(100,54,239,0.1)',
                        color: '#6436ef',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={item.icon} size={20} />
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
                  </div>
                ))}
              </div>
            </Container>
          </section>
        ))}

        {/* ============ 為何選我們 ============ */}
        {c.why && c.why.stats.length > 0 && (
          <section
            id="proof"
            style={{ background: 'var(--page-raised)', scrollMarginTop: 90, borderTop: '1px solid var(--page-border)' }}
          >
            <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>
              <h2 style={sectionTitleStyle}>{c.why.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
                {c.why.stats.map((stat) => (
                  <div key={stat.label} style={{ ...cardStyle, gap: 10 }}>
                    <span
                      style={{
                        font: "500 clamp(2rem, 3.5vw, 2.75rem)/1 'Geologica', sans-serif",
                        color: c.accent,
                      }}
                    >
                      {stat.value}
                    </span>
                    <span
                      style={{
                        font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {stat.label}
                    </span>
                    <p
                      style={{
                        margin: 0,
                        font: "400 0.875rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {stat.body}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 40, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {c.why.lines.map((line) => (
                  <Link
                    key={line}
                    href={localeHref(locale, `${ROUTES.products}/${line}`)}
                    className="vr-btn"
                    data-variant="ghost"
                    style={{ height: 46, padding: '0 22px', fontSize: 14 }}
                  >
                    {lineNames[line]}
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* ============ 其他應用 ============ */}
        <section id="other" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)' }}>
            <p
              style={{
                margin: '0 0 20px',
                font: "600 13px/1.2 'Geologica', sans-serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#6436ef',
              }}
            >
              {t('solutions.other')}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {Object.keys(SOLUTION_PAGES)
                .filter((other) => other !== slug)
                .map((other) => (
                  <Link
                    key={other}
                    href={localeHref(locale, `${ROUTES.solutions}/${other}`)}
                    className="vr-pill-link"
                  >
                    {names[other]}
                  </Link>
                ))}
            </div>
          </Container>
        </section>

        <PageCTA locale={locale} eyebrow={c.cta.eyebrow} headline={c.cta.headline} subcopy={c.cta.subcopy} />
      </PageShell>
    </>
  );
}
