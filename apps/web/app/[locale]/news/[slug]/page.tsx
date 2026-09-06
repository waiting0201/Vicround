import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleBody } from '@/components/ArticleBody';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { newsIndex, sampleNews } from '@/content/articles';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { articleSchema, breadcrumbSchema, eventSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 新聞／展會內頁 —— 逐區塊對照 `mockup/Rounded Design/news-article.dc.html`。
 *
 * <p>
 * 與技術文章的差別是右側多了「Event details」面板（日期／場館／攤位），以及底部的
 * 上一則／下一則。掛了展會的文章會同時輸出 `Article` 與 `Event` 兩個 JSON-LD。
 * </p>
 */
type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, sampleNews);

  return pageMetadata({
    locale,
    path: `${ROUTES.news}/${slug}`,
    title: c.title,
    description: c.lead,
    type: 'article',
    publishedTime: c.date,
  });
}

export default async function NewsArticlePage({ params }: Params) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, sampleNews);
  const index = localize(locale, newsIndex);

  const path = `${ROUTES.news}/${slug}`;
  const crumbs = [
    { name: t('nav.news'), path: ROUTES.news },
    { name: c.title, path },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <JsonLd data={articleSchema(locale, path, { title: c.title, summary: c.lead, publishedAt: c.date })} />
      <JsonLd
        data={eventSchema({
          name: c.title,
          startDate: '2026-08-26',
          endDate: '2026-08-28',
          location: c.event.facts[1]?.value,
          boothNumber: c.event.facts[2]?.value,
        })}
      />

      <PageShell tone="light">
        <section>
          <Container style={{ padding: 'clamp(28px, 4vw, 48px) clamp(24px, 5vw, 80px) 0' }}>
            <Breadcrumb locale={locale} items={crumbs} label={t('common.breadcrumb')} />

            <div style={{ maxWidth: 780, marginTop: 28, paddingBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    borderRadius: 999,
                    padding: '5px 12px',
                    background: 'rgba(100,54,239,0.1)',
                    font: "500 11px/1.4 'IBM Plex Mono', monospace",
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: '#6436ef',
                  }}
                >
                  {c.category}
                </span>
                <span style={{ font: "400 0.8125rem/1.4 'IBM Plex Mono', monospace", color: 'var(--page-faint)' }}>
                  {c.meta}
                </span>
              </div>
              <h1
                style={{
                  margin: '20px 0 0',
                  font: "400 clamp(2rem, 4vw, 3rem)/1.12 'Geologica', 'GenYoGothic TW', sans-serif",
                  letterSpacing: '-0.01em',
                  color: 'var(--page-fg)',
                  textWrap: 'balance',
                }}
              >
                {c.title}
              </h1>
              <p
                style={{
                  margin: '20px 0 0',
                  font: "400 1.1875rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-muted)',
                  textWrap: 'pretty',
                }}
              >
                {c.lead}
              </p>
            </div>
          </Container>

          <div
            style={{
              width: '100%',
              aspectRatio: '21 / 9',
              background: c.heroGradient,
              display: 'flex',
              alignItems: 'flex-end',
              padding: '24px 28px',
            }}
          >
            <span
              style={{
                font: "500 12px/1.4 'IBM Plex Mono', monospace",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              {c.heroLabel}
            </span>
          </div>
        </section>

        {/* ============ 內文 + 展會資訊 ============ */}
        <section>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px) clamp(48px, 6vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1fr 320px',
              gap: 'clamp(28px, 4vw, 64px)',
              alignItems: 'start',
            }}
          >
            <ArticleBody blocks={c.blocks} />

            <aside
              style={{
                position: 'sticky',
                top: 104,
                background: 'var(--page-raised)',
                border: '1px solid var(--page-border)',
                borderRadius: 22,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <p
                style={{
                  margin: 0,
                  font: "600 1.0625rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-fg)',
                }}
              >
                {c.event.title}
              </p>
              <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {c.event.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt
                      style={{
                        font: "500 11px/1.4 'IBM Plex Mono', monospace",
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--page-faint)',
                      }}
                    >
                      {fact.label}
                    </dt>
                    <dd
                      style={{
                        margin: '6px 0 0',
                        font: "400 0.9375rem/1.55 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <Link href={localeHref(locale, ROUTES.contact)} className="vr-btn">
                {c.event.cta}
                <span aria-hidden="true">→</span>
              </Link>

              <p
                style={{
                  margin: 0,
                  font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-muted)',
                }}
              >
                {c.event.note.before}
                <Link
                  href={localeHref(locale, `${ROUTES.solutions}/acoustic-solutions`)}
                  style={{ color: '#6436ef', fontWeight: 600 }}
                >
                  {c.event.note.link}
                </Link>
                {c.event.note.after}
              </p>
            </aside>
          </Container>
        </section>

        {/* ============ 上一則／下一則 ============ */}
        <section style={{ borderTop: '1px solid var(--page-border)' }}>
          <Container style={{ padding: 'clamp(32px, 4vw, 48px) clamp(24px, 5vw, 80px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[c.prev, c.next].map((item, index) => (
                <Link
                  key={item.slug}
                  href={localeHref(locale, `${ROUTES.news}/${item.slug}`)}
                  className="vr-card-link"
                  style={{ padding: '24px', gap: 8, textAlign: index === 1 ? 'right' : 'left' }}
                >
                  <span style={{ font: "500 12px/1.4 'IBM Plex Mono', monospace", color: 'var(--page-faint)' }}>
                    {item.label}
                  </span>
                  <span
                    style={{
                      font: "600 1rem/1.45 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 更多新聞 ============ */}
        <section style={{ background: 'var(--page-raised)', borderTop: '1px solid var(--page-border)' }}>
          <Container style={{ padding: 'clamp(48px, 7vw, 80px) clamp(24px, 5vw, 80px)' }}>
            <h2
              style={{
                margin: 0,
                font: "500 clamp(1.5rem, 2.5vw, 2rem)/1.2 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {t('news.more')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 32 }}>
              {index.items.slice(0, 3).map((item) => (
                <Link
                  key={item.slug}
                  href={localeHref(locale, `${ROUTES.news}/${item.slug}`)}
                  className="vr-card-link"
                  style={{ padding: '28px 24px', gap: 12 }}
                >
                  <time
                    dateTime={item.date}
                    style={{ font: "400 0.8125rem/1.4 'IBM Plex Mono', monospace", color: 'var(--page-faint)' }}
                  >
                    {item.date}
                  </time>
                  <span
                    style={{
                      font: "600 1.0625rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </PageShell>
    </>
  );
}
