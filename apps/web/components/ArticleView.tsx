import Link from 'next/link';
import { ArticleBody, tableOfContents } from '@/components/ArticleBody';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import type { ArticleDetail, ArticleListItem } from '@/lib/content-api';
import { formatDate, formatDateRange, isoDate } from '@/lib/format';
import { translator } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { articleSchema, breadcrumbSchema, eventSchema } from '@/lib/schema';

/**
 * 文章內頁 —— 版型對照 `mockup/Rounded Design/article.dc.html`（`toc`）與
 * `news-article.dc.html`（`event`）。
 *
 * <p>
 * 三條路由（`/news`、`/insights`、`/blog`）共用這一支：它們的差別只有側欄與底部推薦，
 * 內容形狀完全相同（同一張 `Articles` 表，差在 `Type`，而 `Type` 決定網址前綴）。
 * </p>
 */
export function ArticleView({
  locale,
  article,
  related,
  variant,
}: {
  locale: Locale;
  article: ArticleDetail;
  related: ArticleListItem[];
  variant: 'toc' | 'event';
}) {
  const t = translator(locale);
  const toc = tableOfContents(article.body);
  const show = article.exhibition;

  const meta = [
    formatDate(locale, article.publishedAt),
    article.readingMinutes
      ? t('article.readingTime').replace('{minutes}', String(article.readingMinutes))
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const crumbs = [
    { name: t('nav.resources'), path: ROUTES.resources },
    ...(variant === 'event' ? [{ name: t('nav.news'), path: ROUTES.news }] : []),
    { name: article.title ?? article.slug, path: article.path },
  ];

  const facts = show
    ? [
        { label: t('article.eventDates'), value: formatDateRange(locale, show.startDate, show.endDate) },
        { label: t('article.eventVenue'), value: [show.venueName, show.city].filter(Boolean).join(', ') },
        { label: t('article.eventBooth'), value: show.boothNumber },
        { label: t('article.eventOnBooth'), value: show.onBoothNote },
      ].filter((fact) => fact.value)
    : [];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <JsonLd
        data={articleSchema(locale, article.path, {
          title: article.title ?? '',
          summary: article.excerpt ?? article.lead ?? undefined,
          image: article.heroImageUrl ?? undefined,
          publishedAt: article.publishedAt ?? undefined,
          updatedAt: article.updatedAt,
          author: article.author?.name ? { name: article.author.name } : undefined,
        })}
      />
      {/* 展會的日期、地點與攤位是最常被 AI 引擎引用的事實（docs/sitemap.md 的 JSON-LD 表） */}
      {show ? (
        <JsonLd
          data={eventSchema({
            name: show.name ?? show.slug,
            startDate: show.startDate,
            endDate: show.endDate,
            location: [show.venueName, show.city].filter(Boolean).join(', ') || undefined,
            boothNumber: show.boothNumber ?? undefined,
            url: show.websiteUrl ?? undefined,
          })}
        />
      ) : null}

      <PageShell tone="light">
        {/* ============ 文章頁首 ============ */}
        <section>
          <Container style={{ padding: 'clamp(28px, 4vw, 48px) clamp(24px, 5vw, 80px) 0' }}>
            <Breadcrumb locale={locale} items={crumbs} label={t('common.breadcrumb')} />

            <div style={{ marginTop: 28 }}>
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
                  {article.categories[0]?.name ?? t(`news.filters.${article.type}`)}
                </span>
                <time
                  dateTime={isoDate(article.publishedAt)}
                  style={{ font: "400 0.8125rem/1.4 'IBM Plex Mono', monospace", color: 'var(--page-faint)' }}
                >
                  {meta}
                </time>
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
                {article.title}
              </h1>
              {article.lead ? (
                <p
                  style={{
                    margin: '20px 0 0',
                    font: "400 1.1875rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-muted)',
                    textWrap: 'pretty',
                  }}
                >
                  {article.lead}
                </p>
              ) : null}
            </div>

            {article.author ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 28, paddingBottom: 32 }}>
                <div
                  style={{
                    borderRadius: 12,
                    width: 44,
                    height: 44,
                    background: 'var(--page-raised)',
                    border: '1px solid var(--page-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: "600 14px/1 'Geologica', sans-serif",
                    color: '#6436ef',
                  }}
                >
                  {article.author.initials}
                </div>
                <div>
                  <span
                    style={{
                      display: 'block',
                      font: "600 0.9375rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {article.author.name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 2,
                      font: "400 0.8125rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-faint)',
                    }}
                  >
                    {article.author.jobTitle}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ paddingBottom: 32 }} />
            )}
          </Container>

          {/* 主圖：CMS 有封面圖就鋪滿，沒有就維持 mockup 的漸層版位 */}
          <div
            style={{
              width: '100%',
              aspectRatio: '21 / 9',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '24px 28px',
              ...(article.heroImageUrl
                ? { background: `#0a0a12 url('${article.heroImageUrl}') center center / cover no-repeat` }
                : { background: 'linear-gradient(150deg, #1c568e 0%, #11385f 60%, #0d0d18 100%)' }),
            }}
          >
            {article.heroImageUrl ? null : (
              <span
                style={{
                  font: "500 12px/1.4 'IBM Plex Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {t('article.heroPlaceholder')}
              </span>
            )}
          </div>
        </section>

        {/* ============ 內文 + 側欄 ============ */}
        <section>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px) clamp(48px, 6vw, 80px)',
              display: 'grid',
              gridTemplateColumns: variant === 'event' ? '1fr 320px' : '240px 1fr',
              gap: 'clamp(28px, 4vw, 64px)',
              alignItems: 'start',
            }}
          >
            {variant === 'toc' ? (
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
                <p
                  style={{
                    margin: '0 0 8px 18px',
                    font: "500 11px/1.4 'IBM Plex Mono', monospace",
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--page-faint)',
                  }}
                >
                  {t('article.contents')}
                </p>
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="vr-toc-link">
                    {item.text}
                  </a>
                ))}
              </nav>
            ) : null}

            <ArticleBody html={article.body} />

            {variant === 'event' && show ? (
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
                  {t('article.eventTitle')}
                </p>
                <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {facts.map((fact) => (
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

                <Link
                  href={show.meetingUrl ?? localeHref(locale, ROUTES.contact)}
                  className="vr-btn"
                >
                  {show.ctaLabel ?? t('article.eventCta')}
                  <span aria-hidden="true">→</span>
                </Link>
              </aside>
            ) : null}
          </Container>
        </section>

        {/* ============ 上一則／下一則 ============ */}
        {article.previous || article.next ? (
          <section style={{ borderTop: '1px solid var(--page-border)' }}>
            <Container style={{ padding: 'clamp(32px, 4vw, 48px) clamp(24px, 5vw, 80px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[
                  { link: article.previous, label: t('article.previous'), align: 'left' as const },
                  { link: article.next, label: t('article.next'), align: 'right' as const },
                ]
                  .filter((entry) => entry.link)
                  .map((entry) => (
                    <Link
                      key={entry.link!.slug}
                      href={localeHref(locale, entry.link!.path)}
                      className="vr-card-link"
                      style={{ padding: '24px', gap: 8, textAlign: entry.align }}
                    >
                      <span style={{ font: "500 12px/1.4 'IBM Plex Mono', monospace", color: 'var(--page-faint)' }}>
                        {entry.label}
                      </span>
                      <span
                        style={{
                          font: "600 1rem/1.45 'Geologica', 'GenYoGothic TW', sans-serif",
                          color: 'var(--page-fg)',
                        }}
                      >
                        {entry.link!.title}
                      </span>
                    </Link>
                  ))}
              </div>
            </Container>
          </section>
        ) : null}

        {/* ============ 延伸閱讀 ============ */}
        {related.length > 0 ? (
          <section style={{ background: 'var(--page-raised)', borderTop: '1px solid var(--page-border)' }}>
            <Container style={{ padding: 'clamp(48px, 7vw, 80px) clamp(24px, 5vw, 80px)' }}>
              <h2
                style={{
                  margin: 0,
                  font: "500 clamp(1.5rem, 2.5vw, 2rem)/1.2 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-fg)',
                }}
              >
                {variant === 'event' ? t('news.more') : t('article.keepReading')}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 32 }}>
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={localeHref(locale, item.path)}
                    className="vr-card-link"
                    style={{ padding: '28px 24px', gap: 12 }}
                  >
                    <span
                      style={{
                        borderRadius: 999,
                        width: 'fit-content',
                        padding: '5px 10px',
                        background: 'rgba(100,54,239,0.1)',
                        font: "500 11px/1.4 'IBM Plex Mono', monospace",
                        textTransform: 'uppercase',
                        color: '#6436ef',
                      }}
                    >
                      {item.categories[0]?.name ?? t(`news.filters.${item.type}`)}
                    </span>
                    <span
                      style={{
                        font: "600 1.0625rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {item.title}
                    </span>
                    {item.excerpt ? (
                      <p
                        style={{
                          margin: 0,
                          font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                          color: 'var(--page-muted)',
                        }}
                      >
                        {item.excerpt}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        ) : null}
      </PageShell>
    </>
  );
}
