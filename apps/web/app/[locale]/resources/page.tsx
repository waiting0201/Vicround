import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { DownloadList, ResourceSection } from '@/components/ResourceSections';
import { faq } from '@/content/faq';
import { resources } from '@/content/resources';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ARTICLE_PREFIX, ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Resources hub —— 逐區塊對照 `mockup/Rounded Design/resources.dc.html`。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, resources);

  return pageMetadata({
    locale,
    path: ROUTES.resources,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function ResourcesPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, resources);
  const faqItems = localize(locale, faq).items.slice(0, 4);

  const card: React.CSSProperties = {
    textDecoration: 'none',
    background: 'var(--page-bg)',
    border: '1px solid var(--page-border)',
    borderRadius: 22,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.resources'), path: ROUTES.resources }])} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        {/* ============ 新聞與展會 ============ */}
        <ResourceSection
          id="news"
          eyebrow={c.news.eyebrow}
          title={c.news.title}
          cta={
            <Link href={localeHref(locale, ROUTES.news)} className="vr-inline-link" data-accent="true">
              {c.news.cta} →
            </Link>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginTop: 36 }}>
            {/* 下一場展會 —— 資料之後來自 GET /api/v1/exhibitions?upcoming=true */}
            <div style={{ ...card, border: '1px dashed var(--page-border)' }}>
              <span
                style={{
                  font: "500 12px/1.4 'IBM Plex Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--page-faint)',
                }}
              >
                {c.news.nextLabel}
              </span>
              <span
                style={{
                  font: "600 1.125rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-fg)',
                }}
              >
                {c.news.nextName}
              </span>
              <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c.news.facts.map((fact) => (
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
                href={localeHref(locale, ROUTES.contact)}
                className="vr-inline-link"
                data-accent="true"
                style={{ marginTop: 'auto' }}
              >
                {c.news.bookCta} →
              </Link>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              {c.news.items.map((item, index) => (
                <Link key={index} href={localeHref(locale, ROUTES.news)} className="vr-card-link" style={{ ...card, borderRadius: 22 }}>
                  <span
                    style={{
                      font: "500 12px/1.4 'IBM Plex Mono', monospace",
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#6436ef',
                    }}
                  >
                    {item.kind}
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
                    {c.news.readMore}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </ResourceSection>

        {/* ============ FAQ 摘要 ============ */}
        <ResourceSection
          id="faq"
          eyebrow={c.faq.eyebrow}
          title={c.faq.title}
          raised
          cta={
            <Link href={localeHref(locale, ROUTES.faq)} className="vr-inline-link" data-accent="true">
              {c.faq.cta}
            </Link>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 36 }}>
            {faqItems.map((item) => (
              <Link key={item.id} href={localeHref(locale, `${ROUTES.faq}#${item.id}`)} className="vr-card-link" style={card}>
                <span
                  style={{
                    font: "600 1rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {item.question}
                </span>
              </Link>
            ))}
          </div>
        </ResourceSection>

        {/* ============ 產業洞察 ============ */}
        <ResourceSection id="insights" eyebrow={c.insights.eyebrow} title={c.insights.title}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginTop: 36 }}>
            {c.insights.items.map((item) => (
              <Link
                key={item.slug}
                href={localeHref(locale, `${ARTICLE_PREFIX.insight}/${item.slug}`)}
                className="vr-card-link"
                style={card}
              >
                <span
                  style={{
                    font: "600 1.125rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-muted)',
                  }}
                >
                  {item.body}
                </span>
                <span style={{ marginTop: 'auto', font: "600 13px/1.4 'Geologica', sans-serif", color: '#6436ef' }}>
                  {c.insights.cta}
                </span>
              </Link>
            ))}
          </div>
        </ResourceSection>

        {/* ============ 技術文章 ============ */}
        <ResourceSection id="articles" eyebrow={c.articles.eyebrow} title={c.articles.title} raised>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 36 }}>
            {c.articles.items.map((item) => (
              <Link
                key={item.slug}
                href={localeHref(locale, `${ARTICLE_PREFIX.technicalArticle}/${item.slug}`)}
                className="vr-card-link"
                style={card}
              >
                <span
                  style={{
                    font: "500 12px/1.4 'IBM Plex Mono', monospace",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#6436ef',
                  }}
                >
                  {item.category}
                </span>
                <span
                  style={{
                    font: "600 1.0625rem/1.45 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {item.title}
                </span>
                <span style={{ marginTop: 'auto', font: "600 13px/1.4 'Geologica', sans-serif", color: '#6436ef' }}>
                  {c.articles.cta}
                </span>
              </Link>
            ))}
          </div>
        </ResourceSection>

        {/* ============ 下載 ============ */}
        <ResourceSection id="downloads" eyebrow={c.downloads.eyebrow} title={c.downloads.title}>
          <DownloadList locale={locale} items={c.downloads.items} />
        </ResourceSection>

        <PageCTA locale={locale} eyebrow={c.cta.eyebrow} headline={c.cta.headline} subcopy={c.cta.subcopy} />
      </PageShell>
    </>
  );
}
