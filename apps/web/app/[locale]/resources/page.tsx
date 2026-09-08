import type { Metadata } from 'next';
import Link from 'next/link';
import { cardStyle } from '@/components/blocks';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { DownloadList, ResourceSection } from '@/components/ResourceSections';
import { block, getArticles, getDownloads, getPage, requirePage } from '@/lib/content-api';
import { formatDateRange } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * Resources hub —— 版型逐區塊對照 `mockup/Rounded Design/resources.dc.html`。
 *
 * <p>
 * 五個區段的內容都由頁面的 reference block 帶出來（展會、FAQ、洞察、技術文章、下載），
 * 因此「這一區顯示哪幾筆」是編輯者在後台調的查詢參數，不是寫死在版型裡。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'resources'), 'resources');

  return pageMetadata({
    locale,
    path: ROUTES.resources,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function ResourcesPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const [pageData, latestNews, downloads] = await Promise.all([
    getPage(locale, 'resources'),
    getArticles(locale, { type: 'news', pageSize: 3 }),
    getDownloads(locale),
  ]);

  const page = requirePage(pageData, 'resources');
  const news = block(page, 'news');
  const faq = block(page, 'faq');
  const insights = block(page, 'insights');
  const articles = block(page, 'articles');
  const downloadsBlock = block(page, 'downloads');

  const nextShow = news?.reference?.exhibitions?.find((show) => show.isUpcoming);
  const faqCategories = faq?.reference?.faqCategories ?? [];

  const cardLinkStyle = { ...cardStyle, borderRadius: 22 };

  const crumbs = [{ name: t('nav.resources'), path: ROUTES.resources }];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.resources')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        {/* ============ 新聞與展會 ============ */}
        {news ? (
          <ResourceSection
            id="news"
            eyebrow={news.eyebrow ?? ''}
            title={news.title ?? ''}
            cta={
              <Link href={localeHref(locale, ROUTES.news)} className="vr-inline-link" data-accent="true">
                {news.ctaLabel} →
              </Link>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginTop: 36 }}>
              {/* 下一場展會 —— 由 ExhibitionList 版塊的查詢（upcoming）帶出來 */}
              {nextShow ? (
                <div style={{ ...cardStyle, border: '1px dashed var(--page-border)' }}>
                  <span
                    style={{
                      font: "500 12px/1.4 'IBM Plex Mono', monospace",
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--page-faint)',
                    }}
                  >
                    {t('news.nextExhibition')}
                  </span>
                  <span
                    style={{
                      font: "600 1.125rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {nextShow.name}
                  </span>
                  <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: t('article.eventDates'), value: formatDateRange(locale, nextShow.startDate, nextShow.endDate) },
                      { label: t('article.eventVenue'), value: [nextShow.venueName, nextShow.city].filter(Boolean).join(', ') },
                      { label: t('article.eventBooth'), value: nextShow.boothNumber },
                    ]
                      .filter((fact) => fact.value)
                      .map((fact) => (
                        <div key={fact.label} style={{ display: 'flex', gap: 10 }}>
                          <dt
                            style={{
                              font: "500 12px/1.6 'IBM Plex Mono', monospace",
                              color: 'var(--page-faint)',
                              minWidth: 72,
                            }}
                          >
                            {fact.label}
                          </dt>
                          <dd
                            style={{
                              margin: 0,
                              font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                              color: 'var(--page-muted)',
                            }}
                          >
                            {fact.value}
                          </dd>
                        </div>
                      ))}
                  </dl>
                  <Link
                    href={nextShow.meetingUrl ?? localeHref(locale, ROUTES.contact)}
                    className="vr-inline-link"
                    data-accent="true"
                    style={{ marginTop: 'auto' }}
                  >
                    {nextShow.ctaLabel ?? t('article.eventCta')} →
                  </Link>
                </div>
              ) : null}

              <div style={{ display: 'grid', gap: 16 }}>
                {(latestNews?.items ?? []).map((item) => (
                  <Link
                    key={item.slug}
                    href={localeHref(locale, item.path)}
                    className="vr-card-link"
                    style={cardLinkStyle}
                  >
                    <span
                      style={{
                        font: "500 12px/1.4 'IBM Plex Mono', monospace",
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#6436ef',
                      }}
                    >
                      {t(`news.filters.${item.type}`)}
                    </span>
                    <span
                      style={{
                        font: "600 1.0625rem/1.45 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {item.title}
                    </span>
                    <span style={{ font: "600 13px/1.4 'Geologica', sans-serif", color: '#6436ef' }}>
                      {t('news.readMore')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </ResourceSection>
        ) : null}

        {/* ============ FAQ 摘要 ============ */}
        {faq ? (
          <ResourceSection
            id="faq"
            eyebrow={faq.eyebrow ?? ''}
            title={faq.title ?? ''}
            raised
            cta={
              <Link href={localeHref(locale, ROUTES.faq)} className="vr-inline-link" data-accent="true">
                {faq.ctaLabel}
              </Link>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 36 }}>
              {faqCategories.flatMap((category) =>
                category.items.map((item) => (
                  <Link
                    key={item.slug}
                    href={localeHref(locale, `${ROUTES.faq}#${item.slug}`)}
                    className="vr-card-link"
                    style={cardLinkStyle}
                  >
                    <span
                      style={{
                        font: "500 12px/1.4 'IBM Plex Mono', monospace",
                        textTransform: 'uppercase',
                        color: 'var(--page-faint)',
                      }}
                    >
                      {category.name}
                    </span>
                    <span
                      style={{
                        font: "600 1rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {item.question}
                    </span>
                  </Link>
                )),
              )}
            </div>
          </ResourceSection>
        ) : null}

        {/* ============ 洞察與技術文章 ============ */}
        {[insights, articles].map((section, index) =>
          section ? (
            <ResourceSection
              key={section.anchor}
              id={section.anchor ?? undefined}
              eyebrow={section.eyebrow ?? ''}
              title={section.title ?? ''}
              raised={index === 1}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 36 }}>
                {(section.reference?.articles ?? []).map((article) => (
                  <Link
                    key={article.slug}
                    href={localeHref(locale, article.path)}
                    className="vr-card-link"
                    style={cardLinkStyle}
                  >
                    <span
                      style={{
                        font: "600 1.0625rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {article.title}
                    </span>
                    {article.excerpt ? (
                      <p
                        style={{
                          margin: 0,
                          font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                          color: 'var(--page-muted)',
                        }}
                      >
                        {article.excerpt}
                      </p>
                    ) : null}
                    <span style={{ font: "600 13px/1.4 'Geologica', sans-serif", color: '#6436ef' }}>
                      {section.ctaLabel}
                    </span>
                  </Link>
                ))}
              </div>
            </ResourceSection>
          ) : null,
        )}

        {/* ============ 下載 ============ */}
        {downloadsBlock ? (
          <ResourceSection
            id="downloads"
            eyebrow={downloadsBlock.eyebrow ?? ''}
            title={downloadsBlock.title ?? ''}
            cta={
              <Link href={localeHref(locale, ROUTES.downloads)} className="vr-inline-link" data-accent="true">
                {t('nav.downloads')} →
              </Link>
            }
          >
            <DownloadList locale={locale} items={downloads ?? []} emptyLabel={t('common.emptyDownloads')} />
          </ResourceSection>
        ) : null}

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
