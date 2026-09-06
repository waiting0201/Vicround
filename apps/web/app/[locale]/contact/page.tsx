import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot } from '@/components/sections';
import { contact } from '@/content/contact';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Contact —— 逐區塊對照 `mockup/Rounded Design/contact.dc.html`。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, contact);

  return pageMetadata({
    locale,
    path: ROUTES.contact,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function ContactPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, contact);

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.contact'), path: ROUTES.contact }])} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        {/* ============ 表單 + 直接聯絡 ============ */}
        <section>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1.15fr 1fr',
              gap: 'clamp(28px, 4vw, 64px)',
              alignItems: 'start',
            }}
          >
            <ContactForm
              privacyHref={localeHref(locale, ROUTES.privacy)}
              labels={{ ...c.form, ...c.form.fields }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2
                  style={{
                    margin: 0,
                    font: "500 1.5rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {c.direct.title}
                </h2>
                <p
                  style={{
                    margin: '12px 0 0',
                    font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-muted)',
                  }}
                >
                  {c.direct.lead}
                </p>
              </div>

              {c.direct.channels.map((channel) => (
                <div
                  key={channel.email}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '20px 22px',
                    border: '1px solid var(--page-border)',
                    borderRadius: 16,
                  }}
                >
                  <span
                    style={{
                      flex: '0 0 auto',
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'rgba(100,54,239,0.1)',
                      color: '#6436ef',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={channel.icon} size={18} />
                  </span>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {channel.title}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 4,
                        font: "500 0.875rem/1.5 'IBM Plex Mono', monospace",
                        color: '#6436ef',
                      }}
                    >
                      {channel.email}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 4,
                        font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {channel.note}
                    </span>
                  </div>
                </div>
              ))}

              <div
                style={{
                  padding: '20px 22px',
                  border: '1px dashed var(--page-border)',
                  borderRadius: 16,
                }}
              >
                <span
                  style={{
                    font: "500 12px/1.4 'IBM Plex Mono', monospace",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--page-faint)',
                  }}
                >
                  {c.direct.hurryTitle}
                </span>
                <p
                  style={{
                    margin: '10px 0 0',
                    font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {c.direct.hurryLabel}
                </p>
                <p
                  style={{
                    margin: '6px 0 0',
                    font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-muted)',
                  }}
                >
                  {c.direct.hurryBody}
                </p>
                <Link
                  href={localeHref(locale, ROUTES.downloads)}
                  className="vr-inline-link"
                  data-accent="true"
                  style={{ marginTop: 12 }}
                >
                  {t('nav.downloads')} →
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* ============ 據點 ============ */}
        <section
          id="locations"
          style={{ background: 'var(--page-raised)', borderTop: '1px solid var(--page-border)' }}
        >
          <Container style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)' }}>
            <p
              style={{
                margin: 0,
                font: "600 13px/1.2 'Geologica', sans-serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#6436ef',
              }}
            >
              {c.locations.eyebrow}
            </p>
            <h2
              style={{
                margin: '12px 0 0',
                font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {c.locations.title}
            </h2>
            <p
              style={{
                margin: '16px 0 0',
                font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-muted)',
                maxWidth: 720,
              }}
            >
              {c.locations.lead}
            </p>

            <div style={{ marginTop: 32 }}>
              <ImageSlot alt={c.locations.mapLabel} label={c.locations.mapLabel} ratio="16 / 5" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 24 }}>
              {c.locations.items.map((item) => (
                <div
                  key={item.city}
                  style={{
                    background: 'var(--page-bg)',
                    border: '1px solid var(--page-border)',
                    borderRadius: 22,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      font: "500 12px/1.4 'IBM Plex Mono', monospace",
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#6436ef',
                    }}
                  >
                    {item.kind}
                  </span>
                  <span
                    style={{
                      font: "600 1.0625rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {item.city}
                  </span>
                  <span
                    style={{
                      font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {item.address}
                  </span>
                  <span style={{ font: "500 0.875rem/1.5 'IBM Plex Mono', monospace", color: 'var(--page-muted)' }}>
                    {item.phone}
                  </span>
                  {/* TODO 地圖連結待客戶提供實際地址後補上 */}
                  <span
                    style={{
                      marginTop: 'auto',
                      font: "600 13px/1.4 'Geologica', sans-serif",
                      color: 'var(--page-faint)',
                    }}
                  >
                    {c.locations.openInMaps}
                  </span>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 送出之後 ============ */}
        <section>
          <Container style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)' }}>
            <h2
              style={{
                margin: 0,
                font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {c.process.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 36 }}>
              {c.process.steps.map((step, index) => (
                <div
                  key={step.title}
                  style={{
                    border: '1px solid var(--page-border)',
                    borderRadius: 22,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: '#6436ef' }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      font: "600 1.0625rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
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
      </PageShell>
    </>
  );
}
