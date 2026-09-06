import type { Metadata } from 'next';
import Link from 'next/link';
import { CertChip } from '@/components/CertificationDialog';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot } from '@/components/sections';
import { about } from '@/content/about';
import { CERTIFICATIONS } from '@/content/certifications';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * About Us —— 逐區塊對照 `mockup/Rounded Design/about-us.dc.html`。
 * 這是確認稿裡三個深色頁之一（首頁、About、會員專區）。
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, about);

  return pageMetadata({
    locale,
    path: ROUTES.about,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function AboutPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, about);
  const certs = localize(locale, CERTIFICATIONS);

  const eyebrow: React.CSSProperties = {
    margin: 0,
    font: "600 13px/1.2 'Geologica', sans-serif",
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#a184f5',
  };
  const heading: React.CSSProperties = {
    margin: '12px 0 0',
    font: "500 clamp(2rem, 3.5vw, 2.75rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
    color: '#ffffff',
  };
  const card: React.CSSProperties = {
    background: '#17172a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 22,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    textDecoration: 'none',
  };
  const cardTitle: React.CSSProperties = {
    font: "600 1.125rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
    color: '#ffffff',
  };
  const cardBody: React.CSSProperties = {
    font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
    color: 'rgba(255,255,255,0.55)',
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.about'), path: ROUTES.about }])} />

      <PageShell tone="dark">
        <PageBanner
          tone="dark"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        {/* ============ 品牌願景 ============ */}
        <section id="vision" style={{ scrollMarginTop: 90 }}>
          <Container
            style={{
              padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(32px, 5vw, 72px)',
              alignItems: 'center',
            }}
          >
            <ImageSlot alt={c.vision.imageLabel} label={c.vision.imageLabel} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={eyebrow}>{c.vision.eyebrow}</p>
              <h2 style={{ ...heading, margin: 0 }}>{c.vision.title}</h2>
              <p
                style={{
                  margin: 0,
                  font: "400 1rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'rgba(255,255,255,0.62)',
                  maxWidth: 520,
                  textWrap: 'pretty',
                }}
              >
                {c.vision.body}
              </p>
            </div>
          </Container>
        </section>

        {/* ============ 品牌價值 ============ */}
        <section style={{ background: '#10101d' }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.values.eyebrow}</p>
            <h2 style={heading}>{c.values.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
              {c.values.items.map((item) => (
                <div key={item.title} style={card}>
                  <span
                    style={{
                      borderRadius: 12,
                      width: 44,
                      height: 44,
                      background: 'rgba(100,54,239,0.16)',
                      color: '#a184f5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span style={cardTitle}>{item.title}</span>
                  <span style={cardBody}>{item.body}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 發展歷程 ============ */}
        <section id="history" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.history.eyebrow}</p>
            <h2 style={heading}>{c.history.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
              {c.history.items.map((item) => (
                <div key={item.label} style={{ ...card, border: '1px dashed rgba(255,255,255,0.22)' }}>
                  <span
                    style={{
                      font: "500 13px/1.4 'IBM Plex Mono', monospace",
                      letterSpacing: '0.04em',
                      color: '#a184f5',
                    }}
                  >
                    {item.label}
                  </span>
                  <span style={cardBody}>{item.body}</span>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 製造 ============ */}
        <section id="manufacturing" style={{ background: '#10101d', scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.manufacturing.eyebrow}</p>
            <h2 style={heading}>{c.manufacturing.title}</h2>
            <p
              style={{
                margin: '16px 0 0',
                font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'rgba(255,255,255,0.62)',
                maxWidth: 720,
                textWrap: 'pretty',
              }}
            >
              {c.manufacturing.lead}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
              {c.manufacturing.capabilities.map((item) => (
                <Link key={item.title} href={localeHref(locale, item.href)} className="vr-dark-card" style={card}>
                  <span
                    style={{
                      borderRadius: 12,
                      width: 44,
                      height: 44,
                      background: 'rgba(100,54,239,0.16)',
                      color: '#a184f5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span style={cardTitle}>{item.title}</span>
                  <span style={cardBody}>{item.body}</span>
                  <span
                    style={{
                      marginTop: 'auto',
                      font: "600 13px/1.4 'Geologica', sans-serif",
                      color: '#a184f5',
                    }}
                  >
                    {item.cta} →
                  </span>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: 'clamp(36px, 4vw, 56px)' }}>
              <p
                style={{
                  margin: 0,
                  font: "500 12px/1.4 'IBM Plex Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {c.manufacturing.locationsEyebrow}
              </p>
              <h3
                style={{
                  margin: '12px 0 0',
                  font: "500 1.5rem/1.25 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: '#ffffff',
                }}
              >
                {c.manufacturing.locationsTitle}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                {c.manufacturing.locations.map((location) => (
                  <div key={location.name} style={{ ...card, border: '1px dashed rgba(255,255,255,0.22)' }}>
                    <span style={cardTitle}>{location.name}</span>
                    <span style={cardBody}>{location.note}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24 }}>
                <ImageSlot alt={c.manufacturing.mapLabel} label={c.manufacturing.mapLabel} ratio="2 / 1" />
              </div>
            </div>
          </Container>
        </section>

        {/* ============ 永續 ============ */}
        <section id="sustainability" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
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
                <p style={eyebrow}>{c.sustainability.eyebrow}</p>
                <h2 style={heading}>{c.sustainability.title}</h2>
              </div>
              <Link href={localeHref(locale, ROUTES.sustainability)} className="vr-dark-btn">
                {c.sustainability.cta}
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 'clamp(36px, 4vw, 56px)' }}>
              {c.sustainability.items.map((item) => (
                <Link key={item.title} href={localeHref(locale, item.href)} className="vr-dark-card" style={card}>
                  <span style={cardTitle}>{item.title}</span>
                  <span style={cardBody}>{item.body}</span>
                </Link>
              ))}
            </div>

            <p
              style={{
                margin: '32px 0 12px',
                font: "500 12px/1.4 'IBM Plex Mono', monospace",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              {c.sustainability.certsLabel}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {c.sustainability.certIds.map((id) => {
                const cert = certs.find((item) => item.id === id);
                return cert ? <CertChip key={id} id={id} label={cert.title} /> : null;
              })}
            </div>
          </Container>
        </section>

        {/* ============ 認證（三個分類，每張卡開彈窗） ============ */}
        <section id="certifications" style={{ background: '#10101d', scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{c.certification.eyebrow}</p>
            <h2 style={heading}>{c.certification.title}</h2>
            <p
              style={{
                margin: '16px 0 0',
                font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'rgba(255,255,255,0.62)',
                maxWidth: 720,
              }}
            >
              {c.certification.lead}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: 40 }}>
              {c.certification.groups.map((group) => (
                <div key={group.title}>
                  <h3
                    style={{
                      margin: 0,
                      font: "600 1.125rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: '#ffffff',
                    }}
                  >
                    {group.title}
                  </h3>
                  <p
                    style={{
                      margin: '8px 0 0',
                      font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'rgba(255,255,255,0.55)',
                      maxWidth: 720,
                    }}
                  >
                    {group.body}
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${group.ids.length > 3 ? 4 : 3}, 1fr)`,
                      gap: 20,
                      marginTop: 20,
                    }}
                  >
                    {group.ids.map((id) => {
                      const cert = certs.find((item) => item.id === id);
                      if (!cert) return null;
                      return (
                        <CertChip
                          key={id}
                          id={id}
                          label={cert.title}
                          description={c.certification.notes[id]}
                          action={cert.todo ? c.certification.pending : c.certification.view}
                          pending={cert.todo}
                          variant="card"
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 合作夥伴 ============ */}
        <section id="partnership" style={{ background: '#10101d', scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
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
                <p style={eyebrow}>{c.partnership.eyebrow}</p>
                <h2 style={heading}>{c.partnership.title}</h2>
              </div>
              <Link href={localeHref(locale, ROUTES.partnership)} className="vr-dark-btn">
                {c.partnership.cta}
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 'clamp(36px, 4vw, 56px)' }}>
              {c.partnership.items.map((item) => (
                <Link key={item.title} href={localeHref(locale, item.href)} className="vr-dark-card" style={card}>
                  <span style={cardTitle}>{item.title}</span>
                  <span style={cardBody}>{item.body}</span>
                  <span style={{ marginTop: 'auto', font: "600 13px/1.4 'Geologica', sans-serif", color: '#a184f5' }}>
                    {item.cta} →
                  </span>
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
