import type { Metadata } from 'next';
import { ArticleBody, tableOfContents } from '@/components/ArticleBody';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { getPage, requirePage } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 隱私權與法律聲明 —— 版型對照 `mockup/Rounded Design/privacy.dc.html`。
 *
 * <p>
 * 純長文，因此走 `PageTranslations.Body` 而不是版塊（database.md §09）；
 * 側欄目錄由條文的錨點產生，改條文不用另外維護一份目錄。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'privacy'), 'privacy');

  return pageMetadata({
    locale,
    path: ROUTES.privacy,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function PrivacyPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const page = requirePage(await getPage(locale, 'privacy'), 'privacy');
  const toc = tableOfContents(page.body);

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.privacy'), path: ROUTES.privacy }])} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.privacy')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
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
              {toc.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="vr-toc-link">
                  {section.text}
                </a>
              ))}
            </nav>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {page.lastReviewedLabel ? (
                <p
                  style={{
                    margin: 0,
                    font: "500 12px/1.4 'IBM Plex Mono', monospace",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--page-faint)',
                  }}
                >
                  {page.lastReviewedLabel}
                </p>
              ) : null}

              <ArticleBody html={page.body} locale={locale} />
            </div>
          </Container>
        </section>
      </PageShell>
    </>
  );
}
