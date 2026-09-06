import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { privacy } from '@/content/privacy';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Privacy & Legal —— 逐區塊對照 `mockup/Rounded Design/privacy.dc.html`（側欄目錄 + 條文）。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, privacy);

  return pageMetadata({
    locale,
    path: ROUTES.privacy,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function PrivacyPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, privacy);

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.privacy'), path: ROUTES.privacy }])} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        <section>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px) clamp(48px, 6vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gap: 'clamp(28px, 4vw, 64px)',
              alignItems: 'start',
            }}
          >
            <nav
              style={{
                position: 'sticky',
                top: 104,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                borderLeft: '1px solid var(--page-border)',
              }}
            >
              {c.sections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="vr-toc-link">
                  {section.title}
                </a>
              ))}
            </nav>

            <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 36 }}>
              <p
                style={{
                  margin: 0,
                  font: "500 12px/1.4 'IBM Plex Mono', monospace",
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--page-faint)',
                }}
              >
                {c.updated}
              </p>

              {c.sections.map((section) => (
                <div key={section.id} id={section.id} style={{ scrollMarginTop: 104 }}>
                  <h2
                    style={{
                      margin: 0,
                      font: "500 1.375rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {section.title}
                  </h2>
                  <p
                    style={{
                      margin: '14px 0 0',
                      font: "400 1rem/1.8 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {section.body}
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
