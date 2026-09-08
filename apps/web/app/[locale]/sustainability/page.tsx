import type { Metadata } from 'next';
import { Fragment } from 'react';
import {
  BlockHeading,
  BlockSection,
  CertificationCards,
  FeatureGridBlock,
  MediaTextSplitBlock,
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
 * Sustainability —— 版型逐區塊對照 `mockup/Rounded Design/sustainability.dc.html`。
 *
 * <p>
 * 認證卡的資料來自 `Certifications`（reference block），與 About、Technologies 同一份；
 * 版塊順序由 CMS 決定，深淺底色交錯。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'sustainability'), 'sustainability');

  return pageMetadata({
    locale,
    path: ROUTES.sustainability,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function SustainabilityPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const page = requirePage(await getPage(locale, 'sustainability'), 'sustainability');

  const crumbs = [
    { name: t('nav.about'), path: ROUTES.about },
    { name: t('nav.sustainability'), path: ROUTES.sustainability },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.sustainability')}
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
              ) : block.blockType === 'certificationList' ? (
                <>
                  <BlockHeading block={block} />
                  <CertificationCards
                    certifications={block.reference?.certifications ?? []}
                    labels={{ view: t('certification.view'), pending: t('certification.pendingAction') }}
                  />
                </>
              ) : (
                <>
                  <FeatureGridBlock block={block} columns={3} />
                  {block.footNote ? (
                    <p
                      style={{
                        margin: '24px 0 0',
                        font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-faint)',
                      }}
                    >
                      {block.footNote}
                    </p>
                  ) : null}
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
