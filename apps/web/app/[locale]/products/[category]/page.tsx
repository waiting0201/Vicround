import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlockHeading, BlockSection, SpecTable, cardStyle, eyebrowStyle, sectionTitleStyle } from '@/components/blocks';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot, Section } from '@/components/sections';
import { getCategory, getTechnologies } from '@/lib/content-api';
import { localizeHtml } from '@/lib/html';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { CATEGORY_ACCENT, bannerImage, categoryImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 產品線頁 —— 版型逐區塊對照 `mockup/Rounded Design/product-*.dc.html`。
 *
 * <p>
 * 系列卡的 chip 是那個產品自己的 <b>highlighted 規格列</b>，不是版塊裡另抄的文字
 * （database.md §02）—— 所以這一頁與產業頁的等級表講的是同一份數值。
 * </p>
 */
type Params = { params: Promise<{ locale: string; category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, category: slug } = await params;
  const locale = requireLocale(rawLocale);
  const category = await getCategory(locale, slug);
  if (!category) return {};

  const banner = category.blocks.find((block) => block.anchor === 'banner');

  return pageMetadata({
    locale,
    path: `${ROUTES.products}/${slug}`,
    title: category.seo?.title ?? banner?.title ?? category.name ?? '',
    description: category.seo?.description ?? banner?.subtitle ?? category.summary ?? undefined,
  });
}

export default async function ProductLinePage({ params }: Params) {
  const { locale: rawLocale, category: slug } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const category = await getCategory(locale, slug);
  if (!category) notFound();

  const banner = category.blocks.find((block) => block.anchor === 'banner');
  const overview = category.blocks.find((block) => block.blockType === 'statBand');
  const families = category.blocks.find((block) => block.blockType === 'productGrid');
  const cta = category.blocks.find((block) => block.blockType === 'cta');

  // 這條產品線的「How it is made」——製程是強型別的 ProcessFlow，不是版塊文字。
  const flow = (await getTechnologies(locale))?.processFlows.find((item) => item.categorySlug === slug);

  const accent = CATEGORY_ACCENT[category.type] ?? '#6436ef';
  const crumbs = [
    { name: t('nav.products'), path: ROUTES.products },
    { name: category.name ?? slug, path: `${ROUTES.products}/${slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={banner?.eyebrow ?? t('nav.products')}
          title={banner?.title ?? category.name ?? ''}
          description={banner?.subtitle ?? category.summary ?? undefined}
          image={bannerImage(null, slug)}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px clamp(24px, 5vw, 80px) 0' }}>
          <Breadcrumb locale={locale} items={crumbs} label={t('common.breadcrumb')} />
        </div>

        {/* ============ Overview ============ */}
        {overview ? (
          <section id="overview" style={{ scrollMarginTop: 90 }}>
            <Container
              style={{
                padding: 'clamp(40px, 5vw, 72px) clamp(24px, 5vw, 80px)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(32px, 5vw, 72px)',
                alignItems: 'center',
              }}
            >
              <ImageSlot src={categoryImage(slug)} alt={category.name ?? ''} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h2 style={{ ...sectionTitleStyle, maxWidth: 480 }}>{overview.title}</h2>
                {category.intro ? (
                  <div className="vr-prose" dangerouslySetInnerHTML={{ __html: localizeHtml(locale, category.intro)! }} />
                ) : null}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.max(overview.items.length, 1)}, 1fr)`,
                    gap: 20,
                    marginTop: 12,
                    paddingTop: 28,
                    borderTop: '1px solid var(--page-border)',
                  }}
                >
                  {overview.items.map((stat) => (
                    <div key={stat.title}>
                      <span
                        style={{
                          display: 'block',
                          font: "500 clamp(1.75rem, 3vw, 2.25rem)/1 'Geologica', sans-serif",
                          color: accent,
                        }}
                      >
                        {stat.value}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          marginTop: 8,
                          font: "500 0.8125rem/1.4 'IBM Plex Mono', monospace",
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: 'var(--page-muted)',
                        }}
                      >
                        {stat.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Container>
          </section>
        ) : null}

        {/* ============ 產品系列 ============ */}
        <BlockSection id="families" raised>
          {families ? <BlockHeading block={families} /> : null}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
            {category.products.map((product) => (
              <div key={product.slug} style={{ ...cardStyle, padding: '28px 26px' }}>
                {product.code ? (
                  <span
                    style={{
                      borderRadius: 12,
                      width: 'fit-content',
                      minWidth: 48,
                      padding: '0 12px',
                      height: 32,
                      background: 'rgba(100,54,239,0.1)',
                      color: accent,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      font: "500 13px/1 'IBM Plex Mono', monospace",
                    }}
                  >
                    {product.code}
                  </span>
                ) : null}
                <span
                  style={{
                    font: "600 1.0625rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {product.name}
                </span>
                <p
                  style={{
                    margin: 0,
                    font: "400 0.875rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-muted)',
                  }}
                >
                  {product.summary}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                  {product.specifications
                    .filter((spec) => spec.isHighlighted)
                    .map((spec) => (
                      <span
                        key={spec.value}
                        style={{
                          borderRadius: 999,
                          padding: '5px 10px',
                          border: '1px solid var(--page-border)',
                          font: "400 11px/1.4 'IBM Plex Mono', monospace",
                          color: 'var(--page-muted)',
                        }}
                      >
                        {[spec.label, spec.value].filter(Boolean).join(' ')}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </BlockSection>

        {/* ============ 共通規格 ============ */}
        {category.specifications.length > 0 ? (
          <BlockSection id="specs">
            <h2 style={sectionTitleStyle}>{t('spec.commonSpecifications')}</h2>
            <SpecTable
              rows={category.specifications}
              labels={{ property: t('spec.property'), value: t('spec.value'), note: t('spec.note') }}
            />
          </BlockSection>
        ) : null}

        {/* ============ 製程 ============ */}
        {flow ? (
          <BlockSection id="process" raised>
            <h2 style={sectionTitleStyle}>{flow.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 40 }}>
              {flow.steps.map((step, index) => (
                <div key={step.title ?? index} style={cardStyle}>
                  <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: accent }}>
                    {String(step.stepNumber || index + 1).padStart(2, '0')}
                  </span>
                  {step.iconName ? (
                    <span
                      style={{
                        borderRadius: 12,
                        width: 40,
                        height: 40,
                        background: 'rgba(100,54,239,0.1)',
                        color: '#6436ef',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={step.iconName} size={18} />
                    </span>
                  ) : null}
                  <span
                    style={{
                      font: "600 1rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {step.title}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </BlockSection>
        ) : null}

        {/* ============ 應用於哪些產業 ============ */}
        <Section id="applications" containerStyle={{ padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)' }}>
          <p style={{ ...eyebrowStyle, margin: '0 0 20px' }}>{t('products.whereUsed')}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {category.solutions.map((solution) => (
              <Link
                key={solution.slug}
                href={localeHref(locale, `${ROUTES.solutions}/${solution.slug}`)}
                className="vr-pill-link"
              >
                {solution.name}
              </Link>
            ))}
          </div>
        </Section>

        {cta ? (
          <PageCTA
            locale={locale}
            eyebrow={cta.eyebrow ?? ''}
            headline={cta.title ?? ''}
            subcopy={cta.subtitle ?? ''}
          />
        ) : null}
      </PageShell>
    </>
  );
}
