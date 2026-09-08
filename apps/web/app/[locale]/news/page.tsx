import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { NewsList } from '@/components/NewsList';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { block, getArticles, getExhibitions, getPage, requirePage } from '@/lib/content-api';
import { formatDate, formatDateRange, isoDate } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, eventSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** News & Exhibitions 列表 —— 版型對照 `mockup/Rounded Design/news.dc.html`；內容來自 Content API。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'news'), 'news');

  return pageMetadata({
    locale,
    path: ROUTES.news,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function NewsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const [pageData, articles, exhibitions] = await Promise.all([
    getPage(locale, 'news'),
    getArticles(locale, { type: 'news', pageSize: 24 }),
    getExhibitions(locale),
  ]);

  const page = requirePage(pageData, 'news');
  const list = block(page, 'list');
  const events = block(page, 'events');
  const items = articles?.items ?? [];
  const shows = exhibitions ?? [];

  const eyebrow: React.CSSProperties = {
    margin: 0,
    font: "600 13px/1.2 'Geologica', sans-serif",
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#6436ef',
  };
  const heading: React.CSSProperties = {
    margin: '12px 0 0',
    font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
    color: 'var(--page-fg)',
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.news'), path: ROUTES.news }])} />
      {/*
        展會輸出 Event —— 日期、地點、攤位是最常被問、也最常被 AI 引擎引用的事實
        （docs/sitemap.md 的 JSON-LD 表）。日期直接來自 `Exhibitions` 的 Start/EndDate。
      */}
      {shows.map((show) => (
        <JsonLd
          key={show.slug}
          data={eventSchema({
            name: show.name ?? show.slug,
            startDate: show.startDate,
            endDate: show.endDate,
            location: [show.venueName, show.city].filter(Boolean).join(', ') || undefined,
            boothNumber: show.boothNumber ?? undefined,
            url: show.websiteUrl ?? undefined,
          })}
        />
      ))}

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.news')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        {/* ============ 最新消息 ============ */}
        <section id="news" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{list?.eyebrow}</p>
            <h2 style={heading}>{list?.title}</h2>

            <NewsList
              readMore={t('news.readMore')}
              categories={[
                { id: 'all', label: t('news.filters.all') },
                // 篩選軸就是 `Articles.Type`（它同時決定網址前綴），不另外自訂一套分類
                ...(['companyNews', 'productNews', 'exhibition', 'certificationNews'] as const)
                  .filter((type) => items.some((item) => item.type === type))
                  .map((type) => ({ id: type, label: t(`news.filters.${type}`) })),
              ]}
              items={items.map((item) => ({
                slug: item.slug,
                date: isoDate(item.publishedAt),
                dateLabel: formatDate(locale, item.publishedAt),
                category: item.type,
                categoryLabel: t(`news.filters.${item.type}`),
                title: item.title ?? '',
                excerpt: item.excerpt ?? '',
                href: localeHref(locale, item.path),
              }))}
            />
          </Container>
        </section>

        {/* ============ 展會與活動 ============ */}
        <section
          id="events"
          style={{ background: 'var(--page-raised)', scrollMarginTop: 90, borderTop: '1px solid var(--page-border)' }}
        >
          <Container style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px)' }}>
            <p style={eyebrow}>{events?.eyebrow}</p>
            <h2 style={heading}>{events?.title}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 36 }}>
              {shows.map((show) => (
                <div
                  key={show.slug}
                  style={{
                    background: 'var(--page-bg)',
                    border: '1px solid var(--page-border)',
                    borderRadius: 22,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
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
                    {formatDateRange(locale, show.startDate, show.endDate)}
                  </span>
                  <span
                    style={{
                      font: "600 1.125rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {show.name}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {show.summary ?? show.onBoothNote}
                  </p>
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
