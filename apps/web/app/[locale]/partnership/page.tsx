import type { Metadata } from 'next';
import { Fragment } from 'react';
import {
  BlockHeading,
  BlockSection,
  MediaTextSplitBlock,
  StepCards,
  TestimonialCards,
} from '@/components/blocks';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { getPage, requirePage } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * Partnership —— 版型逐區塊對照 `mockup/Rounded Design/partnership.dc.html`。
 *
 * <p>
 * OEM/ODM 的三步驟來自 `ProcessFlows`、客戶推薦來自 `Testimonials`，
 * 兩者都是 reference block —— 頁面只決定版面與順序。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'partnership'), 'partnership');

  return pageMetadata({
    locale,
    path: ROUTES.partnership,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function PartnershipPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const page = requirePage(await getPage(locale, 'partnership'), 'partnership');

  const crumbs = [
    { name: t('nav.about'), path: ROUTES.about },
    { name: t('nav.partnership'), path: ROUTES.partnership },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.partnership')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        {page.blocks.map((block, index) => (
          <Fragment key={block.anchor ?? index}>
            <BlockSection id={block.anchor ?? undefined} raised={index % 2 === 1}>
              {block.blockType === 'mediaTextSplit' ? (
                <MediaTextSplitBlock
                  block={block}
                  locale={locale}
                  imageLabel={t('common.imagePlaceholder')}
                  imageRight={index % 2 === 1}
                />
              ) : block.blockType === 'testimonialList' ? (
                <>
                  <BlockHeading block={block} />
                  <TestimonialCards testimonials={block.reference?.testimonials ?? []} />
                </>
              ) : (
                <>
                  <BlockHeading block={block} />
                  <StepCards steps={block.reference?.processFlows?.[0]?.steps ?? []} />
                </>
              )}
            </BlockSection>
          </Fragment>
        ))}

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
