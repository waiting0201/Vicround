import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleBody } from '@/components/ArticleBody';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { relatedArticles, sampleArticle } from '@/content/articles';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ARTICLE_PREFIX, ROUTES } from '@/lib/routes';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 技術文章 內頁 —— 逐區塊對照 `mockup/Rounded Design/article.dc.html`。
 *
 * <p>
 * ⚠️ **網址前綴由 `Articles.Type` 決定**（`/blog`）。編輯者改 Type 等同改網址，
 * 後端必須在同一 transaction 寫入 301（docs/sitemap.md）。
 * </p>
 *
 * <p>
 * 目前內文是 `content/articles.ts` 的示範文章；接上 `GET /api/v1/articles/{slug}`
 * 之後版型不變，只換資料來源。
 * </p>
 */
type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, sampleArticle);

  return pageMetadata({
    locale,
    path: `/blog/${slug}`,
    title: c.title,
    description: c.lead,
    type: 'article',
    publishedTime: c.date,
  });
}

export default async function ArticlePage({ params }: Params) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, sampleArticle);
  const related = localize(locale, relatedArticles);

  const path = `/blog/${slug}`;
  const crumbs = [
    { name: t('nav.resources'), path: ROUTES.resources },
    { name: t('nav.resources'), path: `${ROUTES.resources}#articles` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      <JsonLd
        data={articleSchema(locale, path, {
          title: c.title,
          summary: c.lead,
          publishedAt: c.date,
          author: { name: c.author.name },
        })}
      />

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
                  {c.category}
                </span>
                <span
                  style={{
                    font: "400 0.8125rem/1.4 'IBM Plex Mono', monospace",
                    color: 'var(--page-faint)',
                  }}
                >
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
                {c.author.initials}
              </div>
              <div>
                <span
                  style={{
                    display: 'block',
                    font: "600 0.9375rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {c.author.name}
                </span>
                <span
                  style={{
                    display: 'block',
                    marginTop: 2,
                    font: "400 0.8125rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-faint)',
                  }}
                >
                  {c.author.role}
                </span>
              </div>
            </div>
          </Container>

          {/* 主圖版位（正式站由 CMS 的封面圖取代） */}
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

        {/* ============ 內文 + 目錄 ============ */}
        <section>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px) clamp(48px, 6vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '240px 1fr',
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
              {c.toc.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="vr-toc-link">
                  {item.label}
                </a>
              ))}
            </nav>

            <ArticleBody blocks={c.blocks} />
          </Container>
        </section>

        {/* ============ 延伸閱讀 ============ */}
        <section style={{ background: 'var(--page-raised)', borderTop: '1px solid var(--page-border)' }}>
          <Container style={{ padding: 'clamp(48px, 7vw, 80px) clamp(24px, 5vw, 80px)' }}>
            <h2
              style={{
                margin: 0,
                font: "500 clamp(1.5rem, 2.5vw, 2rem)/1.2 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {t('article.keepReading')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 32 }}>
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={localeHref(locale, `${ARTICLE_PREFIX.technicalArticle}/${item.slug}`)}
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
                    {item.category}
                  </span>
                  <span
                    style={{
                      font: "600 1.0625rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {item.title}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {item.body}
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </PageShell>
    </>
  );
}
