import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BlockHeading,
  BlockSection,
  FeatureGridBlock,
  MediaSlot,
  ProductComparisonTable,
  SpecTable,
  StatBandBlock,
  cardStyle,
  eyebrowStyle,
  sectionTitleStyle,
} from '@/components/blocks';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import type { ContentBlock } from '@/lib/content-api';
import { getProducts, getSolution, getSolutions } from '@/lib/content-api';
import { localizeHtml } from '@/lib/html';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 產業解決方案內頁 —— 版型逐區塊對照 `mockup/Rounded Design/solution-*.dc.html`。
 *
 * <p>
 * Acoustic 是變體：沒有「材料」卡而是**等級比較表**（內容來自那條產品線的四個等級產品，
 * 見 `ProductComparisonTable`），另有兩組驗證／應用卡片。差別全部由 CMS 的版塊決定 ——
 * 這一頁不為單一 slug 寫特例，版塊的順序也照 CMS 的排序。
 * </p>
 *
 * <p>
 * 客戶案例（`caseStudies`）排在所有版塊之後、「其他應用」之前：先講為什麼選我們，再拿實際案例佐證。
 * 沒有案例的產業整段不渲染；白／淺紫底接在最後一個實際渲染的區段之後交錯。
 * </p>
 */
type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const solution = await getSolution(locale, slug);
  if (!solution) return {};

  const banner = solution.blocks.find((block) => block.anchor === 'banner');

  return pageMetadata({
    locale,
    path: `${ROUTES.solutions}/${slug}`,
    title: solution.seo?.title ?? banner?.title ?? solution.name ?? '',
    description: solution.seo?.description ?? banner?.subtitle ?? solution.summary ?? undefined,
  });
}

export default async function SolutionPage({ params }: Params) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const solution = await getSolution(locale, slug);
  if (!solution) notFound();

  const banner = solution.blocks.find((block) => block.anchor === 'banner');
  const cta = solution.blocks.find((block) => block.blockType === 'cta');

  // banner 與 CTA 有自己的位置；其餘依 CMS 的排序渲染，編輯者調順序頁面就跟著改。
  const sections = solution.blocks.filter((block) => block !== banner && block !== cta);

  // 等級比較表的內容是那條產品線的產品；只有帶 specTable 版塊的頁面需要它。
  const gradeProducts = sections.some((block) => block.blockType === 'specTable')
    ? ((await getProducts(locale, { category: solution.categories[0]?.slug, pageSize: 12 }))?.items ?? [])
    : [];

  const others = (await getSolutions(locale))?.filter((item) => item.slug !== slug) ?? [];

  // 關鍵規格不是版塊而是 SpecificationRows；照確認稿排在「為何選我們」之前。
  const specsAt = sections.findIndex((block) => block.blockType === 'statBand');

  const specsSection =
    solution.specifications.length > 0 ? (
      <BlockSection id="specs">
        <h2 style={sectionTitleStyle}>{t('spec.keySpecifications')}</h2>
        <SpecTable
          rows={solution.specifications}
          labels={{ property: t('spec.property'), value: t('spec.value'), note: t('spec.note') }}
        />
      </BlockSection>
    ) : null;

  // 案例區段的底色：接在最後一個實際渲染的區段之後交錯（空的 statBand 不算）。
  const lastRendered = sections.reduce(
    (found, block, index) => (block.blockType === 'statBand' && block.items.length === 0 ? found : index),
    -1,
  );
  const lastRaised = specsAt < 0 && specsSection ? false : lastRendered >= 0 && lastRendered % 2 === 0;
  const caseStudies = solution.caseStudies ?? [];

  const renderSection = (block: ContentBlock, index: number) => {
    const raised = index % 2 === 0;

    if (block.blockType === 'specTable') {
      return (
        <BlockSection id={block.anchor ?? undefined} raised={raised}>
          <BlockHeading block={block} />
          <ProductComparisonTable
            products={gradeProducts}
            firstColumnLabel={t('products.grade')}
            note={block.footNote}
          />
        </BlockSection>
      );
    }

    if (block.blockType === 'statBand') {
      // 空的 statBand 代表這一頁沒有這一段（Acoustic 就是這樣），不要留一個空區段
      if (block.items.length === 0) return null;

      return (
        <BlockSection id={block.anchor ?? 'proof'} raised={raised}>
          <StatBandBlock block={block} />
          <div style={{ marginTop: 40, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {solution.categories.map((category) => (
              <Link
                key={category.slug}
                href={localeHref(locale, `${ROUTES.products}/${category.slug}`)}
                className="vr-btn"
                data-variant="ghost"
                style={{ height: 46, padding: '0 22px', fontSize: 14 }}
              >
                {category.name}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </BlockSection>
      );
    }

    return (
      <BlockSection id={block.anchor ?? undefined} raised={raised}>
        <FeatureGridBlock block={block} />
      </BlockSection>
    );
  };

  const crumbs = [
    { name: t('nav.solutions'), path: ROUTES.solutions },
    { name: solution.name ?? slug, path: `${ROUTES.solutions}/${slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={banner?.eyebrow ?? t('nav.solutions')}
          title={banner?.title ?? solution.name ?? ''}
          description={banner?.subtitle ?? solution.summary ?? undefined}
          image={bannerImage(null)}
        />

        {/* ============ 課題 ============ */}
        {solution.challengeTitle ? (
          <section id="challenge" style={{ scrollMarginTop: 90 }}>
            <Container
              style={{
                padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(28px, 4vw, 64px)',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <p style={eyebrowStyle}>{t('solutions.challenge')}</p>
                <h2 style={{ ...sectionTitleStyle, maxWidth: 480 }}>{solution.challengeTitle}</h2>
                {solution.challengeBody ? (
                  <div className="vr-prose" dangerouslySetInnerHTML={{ __html: localizeHtml(locale, solution.challengeBody)! }} />
                ) : null}
              </div>
              <MediaSlot />
            </Container>
          </section>
        ) : null}

        {/* ============ 版塊（材料／等級表／驗證／應用／為何選我們）============ */}
        {sections.map((block, index) => (
          <Fragment key={block.anchor ?? index}>
            {index === specsAt ? specsSection : null}
            {renderSection(block, index)}
          </Fragment>
        ))}
        {specsAt < 0 ? specsSection : null}

        {/* ============ 客戶案例：需求 → 解法 → 成果，三張步驟卡 ============ */}
        {caseStudies.length > 0 ? (
          <BlockSection id="cases" raised={!lastRaised}>
            <h2 style={sectionTitleStyle}>{t('solutions.cases')}</h2>
            {caseStudies.map((study, caseIndex) => (
              <div
                key={study.slug}
                style={{
                  marginTop: caseIndex === 0 ? 40 : 56,
                  ...(caseIndex === 0 ? {} : { paddingTop: 56, borderTop: '1px solid var(--page-border)' }),
                }}
              >
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {study.clientName ? (
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
                      {study.clientName}
                    </span>
                  ) : null}
                  {study.projectName ? (
                    <span
                      style={{
                        borderRadius: 999,
                        padding: '5px 12px',
                        border: '1px solid rgba(20,20,31,0.14)',
                        font: "500 11px/1.4 'IBM Plex Mono', monospace",
                        letterSpacing: '0.04em',
                        color: 'var(--page-muted)',
                      }}
                    >
                      {study.projectName}
                    </span>
                  ) : null}
                </div>
                {study.title ? (
                  <h3
                    style={{
                      margin: '16px 0 0',
                      maxWidth: 820,
                      font: "500 1.5rem/1.25 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                      textWrap: 'balance',
                    }}
                  >
                    {study.title}
                  </h3>
                ) : null}
                {study.products.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
                    <span
                      style={{
                        font: "500 11px/1.4 'IBM Plex Mono', monospace",
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--page-faint)',
                      }}
                    >
                      {t('solutions.caseProducts')}
                    </span>
                    {study.products.map((product) => (
                      <Link
                        key={product.slug}
                        href={localeHref(locale, `${ROUTES.products}/${product.categorySlug}/${product.slug}`)}
                        style={{
                          borderRadius: 999,
                          padding: '5px 12px',
                          background: 'rgba(100,54,239,0.1)',
                          font: "500 12px/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                          color: '#6436ef',
                          textDecoration: 'none',
                        }}
                      >
                        {product.name ?? product.slug}
                      </Link>
                    ))}
                  </div>
                ) : null}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                    gap: 20,
                    marginTop: 28,
                  }}
                >
                  {(
                    [
                      ['solutions.caseChallenge', study.challenge],
                      ['solutions.caseSolution', study.solution],
                      ['solutions.caseResult', study.result],
                    ] as const
                  ).map(([label, body], index) => (
                    <div key={label} style={cardStyle}>
                      <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: '#6436ef' }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        style={{
                          font: "600 1rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                          color: 'var(--page-fg)',
                        }}
                      >
                        {t(label)}
                      </span>
                      {body ? (
                        <p
                          style={{
                            margin: 0,
                            font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                            color: 'var(--page-muted)',
                            textWrap: 'pretty',
                          }}
                        >
                          {body}
                        </p>
                      ) : (
                        // 成果還沒到：確認稿的待補虛線卡語彙，不留一個空白格。
                        <p
                          style={{
                            margin: 0,
                            padding: '20px 16px',
                            border: '1px dashed rgba(100,54,239,0.4)',
                            borderRadius: 14,
                            textAlign: 'center',
                            font: "500 0.875rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                            color: 'var(--page-faint)',
                          }}
                        >
                          {t('solutions.caseResultPending')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </BlockSection>
        ) : null}

        {/* ============ 其他應用 ============ */}
        <section id="other" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)' }}>
            <p style={{ ...eyebrowStyle, margin: '0 0 20px' }}>{t('solutions.other')}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={localeHref(locale, `${ROUTES.solutions}/${other.slug}`)}
                  className="vr-pill-link"
                >
                  {other.name}
                </Link>
              ))}
            </div>
          </Container>
        </section>

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
