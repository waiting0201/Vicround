import type { Metadata } from 'next';
import { ContactTrigger } from '@/components/ContactTrigger';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot } from '@/components/sections';
import { partnership } from '@/content/partnership';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Partnership —— 逐區塊對照 `mockup/Rounded Design/partnership.dc.html`。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, partnership);

  return pageMetadata({
    locale,
    path: ROUTES.partnership,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function PartnershipPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, partnership);

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

  const crumbs = [
    { name: t('nav.about'), path: ROUTES.about },
    { name: t('nav.partnership'), path: ROUTES.partnership },
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

        {/* ============ OEM / ODM ============ */}
        <section id="oem-odm" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.oem.eyebrow}</p>
            <h2 style={heading}>{c.oem.title}</h2>
            <p
              style={{
                margin: '16px 0 0',
                font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-muted)',
                textWrap: 'pretty',
              }}
            >
              {c.oem.lead}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
              {c.oem.steps.map((step, index) => (
                <div
                  key={step.title}
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
                  <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: '#6436ef' }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
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
                    <Icon name={step.icon} size={20} />
                  </span>
                  <span
                    style={{
                      font: "600 1.125rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {step.title}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
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

        {/* ============ 經銷／採購合作 ============ */}
        <section
          id="distribution"
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
              <p style={eyebrow}>{c.distribution.eyebrow}</p>
              <h2 style={{ ...heading, margin: 0 }}>{c.distribution.title}</h2>
              <p
                style={{
                  margin: 0,
                  font: "400 1rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-muted)',
                  textWrap: 'pretty',
                }}
              >
                {c.distribution.body}
              </p>
              <ContactTrigger className="vr-btn">
                {c.distribution.cta}
                <span aria-hidden="true">→</span>
              </ContactTrigger>
            </div>
            <ImageSlot alt={c.distribution.imageLabel} label={c.distribution.imageLabel} />
          </Container>
        </section>

        {/* ============ 客戶推薦 ============ */}
        <section id="testimonials" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.testimonials.eyebrow}</p>
            <h2 style={heading}>{c.testimonials.title}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40 }}>
              {c.testimonials.items.map((item, index) => (
                <figure
                  key={index}
                  style={{
                    margin: 0,
                    background: 'var(--page-bg)',
                    border: '1px dashed var(--page-border)',
                    borderRadius: 22,
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ font: "500 2rem/1 'Geologica', sans-serif", color: '#a184f5' }}
                  >
                    &ldquo;
                  </span>
                  <blockquote
                    style={{
                      margin: 0,
                      font: "400 1rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {item.quote}
                  </blockquote>
                  <figcaption
                    style={{
                      marginTop: 'auto',
                      font: "500 0.8125rem/1.5 'IBM Plex Mono', monospace",
                      color: 'var(--page-faint)',
                    }}
                  >
                    {item.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>

        <PageCTA locale={locale} eyebrow={c.cta.eyebrow} headline={c.cta.headline} subcopy={c.cta.subcopy} />
      </PageShell>
    </>
  );
}
