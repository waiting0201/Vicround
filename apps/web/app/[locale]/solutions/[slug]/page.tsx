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
              <MediaSlot label={t('common.imagePlaceholder')} />
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
