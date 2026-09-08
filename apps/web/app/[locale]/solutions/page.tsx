import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { getPage, getSolutions, requirePage } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Solutions hub —— 版型對照 `mockup/Rounded Design/solutions.dc.html`；內容來自 Content API。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'solutions'), 'solutions');

  return pageMetadata({
    locale,
    path: ROUTES.solutions,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function SolutionsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const [pageData, solutionList] = await Promise.all([getPage(locale, 'solutions'), getSolutions(locale)]);
  const page = requirePage(pageData, 'solutions');
  const solutions = solutionList ?? [];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.solutions'), path: ROUTES.solutions }])} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.solutions')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        <section>
          <Container style={{ padding: '0 clamp(24px, 5vw, 80px) clamp(64px, 9vw, 120px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {solutions.map((solution) => (
                <div
                  key={solution.slug}
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
                    <Icon name={solution.iconName ?? 'layers'} size={20} />
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        font: "600 1.0625rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {solution.name}
                    </span>
                    {solution.isNew && (
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: 'rgba(100,54,239,0.1)',
                          color: '#6436ef',
                          font: "600 11px/1.4 'IBM Plex Mono', monospace",
                        }}
                      >
                        {t('common.new')}
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
                    {solution.summary ?? solution.menuNote}
                  </p>

                  <Link
                    href={localeHref(locale, `${ROUTES.solutions}/${solution.slug}`)}
                    className="vr-inline-link"
                    data-accent="true"
                  >
                    {t('solutions.explore')}
                  </Link>

                  {/* 產品線 chip 直接來自 SolutionCategories —— 不在版塊裡另抄一份 */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                    {solution.categories.map((category) => (
                      <span
                        key={category.slug}
                        style={{
                          padding: '5px 10px',
                          border: '1px solid var(--page-border)',
                          borderRadius: 999,
                          font: "400 11px/1.4 'IBM Plex Mono', monospace",
                          color: 'var(--page-muted)',
                        }}
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {page.ctaHeadline ? (
          <PageCTA
            locale={locale}
            eyebrow={page.ctaEyebrow ?? ''}
            headline={page.ctaHeadline}
            subcopy={page.ctaSubcopy ?? ''}
          />
        ) : null}
      </PageShell>
    </>
  );
}
