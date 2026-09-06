import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { NewsList } from '@/components/NewsList';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { newsIndex } from '@/content/articles';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, eventSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** News & Exhibitions 列表 —— 逐區塊對照 `mockup/Rounded Design/news.dc.html`。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, newsIndex);

  return pageMetadata({
    locale,
    path: ROUTES.news,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function NewsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, newsIndex);

  const label = (id: string) => c.categories.find((item) => item.id === id)?.label ?? id;

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.news'), path: ROUTES.news }])} />
      {/*
        展會輸出 Event —— 日期、地點、攤位是最常被問、也最常被 AI 引擎引用的事實
        （docs/sitemap.md 的 JSON-LD 表）。日期之後由 `Exhibitions` 的 Start/EndDate 提供。
      */}
      {c.events.items.map((event) => (
        <JsonLd
          key={event.name}
          data={eventSchema({ name: event.name, startDate: event.date, location: event.body })}
        />
      ))}

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        {/* ============ 最新消息 ============ */}
        <section id="news" style={{ scrollMarginTop: 90 }}>
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
              {c.listEyebrow}
            </p>
            <h2
              style={{
                margin: '12px 0 0',
                font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {c.listTitle}
            </h2>

            <NewsList
              categories={c.categories}
              readMore={c.readMore}
              items={c.items.map((item) => ({
                ...item,
                categoryLabel: label(item.category),
                href: localeHref(locale, `${ROUTES.news}/${item.slug}`),
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
            <p
              style={{
                margin: 0,
                font: "600 13px/1.2 'Geologica', sans-serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#6436ef',
              }}
            >
              {c.events.eyebrow}
            </p>
            <h2
              style={{
                margin: '12px 0 0',
                font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {c.events.title}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 36 }}>
              {c.events.items.map((event) => (
                <div
                  key={event.name}
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
                    {event.date}
                  </span>
                  <span
                    style={{
                      font: "600 1.125rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {event.name}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {event.body}
                  </p>
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
