import type { Metadata } from 'next';
import { CertChip } from '@/components/CertificationDialog';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot } from '@/components/sections';
import { sustainability } from '@/content/sustainability';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * Sustainability —— 逐區塊對照 `mockup/Rounded Design/sustainability.dc.html`。
 * 資訊架構上掛在 About Us 底下（Sitemap-0819）。
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, sustainability);

  return pageMetadata({
    locale,
    path: ROUTES.sustainability,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function SustainabilityPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, sustainability);

  const eyebrow: React.CSSProperties = {
    margin: 0,
    font: "600 13px/1.2 'Geologica', sans-serif",
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#6436ef',
  };
  const heading: React.CSSProperties = {
    margin: '12px 0 0',
    font: "500 clamp(2rem, 3.5vw, 2.75rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
    color: 'var(--page-fg)',
  };
  const paragraph: React.CSSProperties = {
    margin: 0,
    font: "400 1rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
    color: 'var(--page-muted)',
    maxWidth: 520,
    textWrap: 'pretty',
  };

  const crumbs = [
    { name: t('nav.about'), path: ROUTES.about },
    { name: t('nav.sustainability'), path: ROUTES.sustainability },
  ];

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

        {/* ============ ESG 成果 ============ */}
        <section id="esg" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.esg.eyebrow}</p>
            <h2 style={heading}>{c.esg.title}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
              {c.esg.pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  style={{
                    background: 'var(--page-bg)',
                    border: '1px solid var(--page-border)',
                    borderRadius: 22,
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
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
                    <Icon name={pillar.icon} size={20} />
                  </span>
                  <span
                    style={{
                      font: "600 1.125rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {pillar.title}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>

            <p
              style={{
                margin: '24px 0 0',
                font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-faint)',
              }}
            >
              {c.esg.note}
            </p>
          </Container>
        </section>

        {/* ============ 碳足跡管理 ============ */}
        <section
          id="carbon"
          style={{ background: 'var(--page-raised)', scrollMarginTop: 90, borderTop: '1px solid var(--page-border)' }}
        >
          <Container
            style={{
              padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(32px, 5vw, 72px)',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={eyebrow}>{c.carbon.eyebrow}</p>
              <h2 style={{ ...heading, margin: 0 }}>{c.carbon.title}</h2>
              {c.carbon.paragraphs.map((text) => (
                <p key={text} style={paragraph}>
                  {text}
                </p>
              ))}
            </div>
            <ImageSlot alt={c.carbon.imageLabel} label={c.carbon.imageLabel} />
          </Container>
        </section>

        {/* ============ EUDR ============ */}
        <section id="eudr" style={{ scrollMarginTop: 90 }}>
          <Container
            style={{
              padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(32px, 5vw, 72px)',
              alignItems: 'center',
            }}
          >
            <ImageSlot alt={c.eudr.imageLabel} label={c.eudr.imageLabel} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={eyebrow}>{c.eudr.eyebrow}</p>
              <h2 style={{ ...heading, margin: 0 }}>{c.eudr.title}</h2>
              {c.eudr.paragraphs.map((text) => (
                <p key={text} style={paragraph}>
                  {text}
                </p>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 認證與標準 ============ */}
        <section id="certifications" style={{ background: 'var(--page-raised)' }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.certifications.eyebrow}</p>
            <h2 style={heading}>{c.certifications.title}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
              {/* 點卡片開同一個認證彈窗（見 components/CertificationDialog.tsx） */}
              {c.certifications.items.map((item) => (
                <CertChip
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  description={item.body}
                  variant="card"
                />
              ))}
            </div>
          </Container>
        </section>

        <PageCTA locale={locale} eyebrow={c.cta.eyebrow} headline={c.cta.headline} subcopy={c.cta.subcopy} />
      </PageShell>
    </>
  );
}
