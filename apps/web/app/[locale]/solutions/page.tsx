import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { SOLUTION_PAGES } from '@/content/solution-pages';
import { solutionsHub } from '@/content/solutions-hub';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Solutions hub —— 逐區塊對照 `mockup/Rounded Design/solutions.dc.html`。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, solutionsHub);

  return pageMetadata({
    locale,
    path: ROUTES.solutions,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function SolutionsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, solutionsHub);
  const pages = localize(locale, SOLUTION_PAGES);

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.solutions'), path: ROUTES.solutions }])} />

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
          <Container style={{ padding: '0 clamp(24px, 5vw, 80px) clamp(64px, 9vw, 120px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {c.cards.map((card) => (
                <div
                  key={card.slug}
                  className="vr-solution-card"
                  style={{
                    background: 'var(--page-bg)',
                    border: '1px solid var(--page-border)',
                    borderRadius: 22,
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'rgba(100,54,239,0.1)',
                      color: '#6436ef',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={pages[card.slug]?.icon ?? 'layers'} size={20} />
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        font: "600 1.0625rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {card.title}
                    </span>
                    {card.badge && (
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: 'rgba(100,54,239,0.1)',
                          color: '#6436ef',
                          font: "600 11px/1.4 'IBM Plex Mono', monospace",
                        }}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      margin: 0,
                      font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {card.body}
                  </p>

                  <Link
                    href={localeHref(locale, `${ROUTES.solutions}/${card.slug}`)}
                    className="vr-inline-link"
                    data-accent="true"
                  >
                    {card.link}
                  </Link>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                    {card.platforms.map((platform) => (
                      <span
                        key={platform}
                        style={{
                          padding: '5px 10px',
                          border: '1px solid var(--page-border)',
                          borderRadius: 999,
                          font: "400 11px/1.4 'IBM Plex Mono', monospace",
                          color: 'var(--page-muted)',
                        }}
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <PageCTA locale={locale} eyebrow={c.cta.eyebrow} headline={c.cta.headline} subcopy={c.cta.subcopy} />
      </PageShell>
    </>
  );
}
