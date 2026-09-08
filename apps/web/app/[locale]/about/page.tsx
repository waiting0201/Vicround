import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BlockHeading,
  BlockSection,
  CertificationCards,
  FeatureGridBlock,
  MediaTextSplitBlock,
  MilestoneTimeline,
  OfferingGrid,
  cardStyle,
} from '@/components/blocks';
import { CertChip } from '@/components/CertificationDialog';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { ImageSlot } from '@/components/sections';
import type { ContentBlock } from '@/lib/content-api';
import { getPage, requirePage } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * About Us —— 版型逐區塊對照 `mockup/Rounded Design/about-us.dc.html`（深色頁）。
 *
 * <p>
 * 認證分三類、據點、公司歷程都是 reference block：認證與 Sustainability／Technologies
 * 共用同一批 `Certifications`，據點與 Contact 共用同一批 `Locations`。
 * 歷程目前還沒有年份（`Milestones` 待客戶提供），因此退回版塊自帶的文字卡。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'about'), 'about');

  return pageMetadata({
    locale,
    path: ROUTES.about,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function AboutPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const page = requirePage(await getPage(locale, 'about'), 'about');
  const href = (url: string) => localeHref(locale, url);

  const certificationLabels = { view: t('certification.view'), pending: t('certification.pendingAction') };

  const renderBlock = (block: ContentBlock) => {
    switch (block.blockType) {
      case 'mediaTextSplit':
        return (
          <MediaTextSplitBlock
            block={block}
            locale={locale}
            imageLabel={t('common.imagePlaceholder')}
            imageRight={false}
          />
        );

      case 'milestoneTimeline':
        return (
          <>
            <BlockHeading block={block} />
            <MilestoneTimeline block={block} />
          </>
        );

      case 'locationList':
        return (
          <>
            <BlockHeading block={block} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(24px, 3vw, 40px)',
                marginTop: 40,
                alignItems: 'start',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(block.reference?.locations ?? []).map((location) => (
                  <div key={`${location.city}-${location.type}`} style={{ ...cardStyle, gap: 6 }}>
                    <span
                      style={{
                        font: "500 12px/1.4 'IBM Plex Mono', monospace",
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--page-accent)',
                      }}
                    >
                      {t(`locations.${location.type}`)}
                    </span>
                    <span
                      style={{
                        font: "600 1rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {location.name ?? location.city}
                    </span>
                    <span
                      style={{
                        font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {location.addressLine}
                    </span>
                  </div>
                ))}
              </div>
              <ImageSlot alt={t('common.mapPlaceholder')} label={t('common.mapPlaceholder')} ratio="2 / 1" />
            </div>
          </>
        );

      case 'certificationList':
        // 永續段落底下那一排是 chip，三個分類則是卡片
        return block.anchor === 'sustainability-certs' ? (
          <>
            <p
              style={{
                margin: 0,
                font: "500 12px/1.4 'IBM Plex Mono', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--page-faint)',
              }}
            >
              {block.title}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {(block.reference?.certifications ?? []).map((certification) => (
                <CertChip
                  key={certification.slug}
                  id={certification.slug}
                  label={certification.title ?? certification.slug}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <BlockHeading block={block} />
            <CertificationCards
              certifications={block.reference?.certifications ?? []}
              labels={certificationLabels}
            />
          </>
        );

      case 'offeringGrid':
        return (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 24,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <BlockHeading block={block} />
              </div>
              {block.ctaLabel ? (
                <Link href={localeHref(locale, ROUTES.partnership)} className="vr-dark-btn">
                  {block.ctaLabel}
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
            <OfferingGrid block={block} hrefFor={href} />
          </>
        );

      default:
        return (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 24,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <BlockHeading block={block} />
              </div>
              {block.ctaLabel ? (
                <Link href={localeHref(locale, ROUTES.sustainability)} className="vr-dark-btn">
                  {block.ctaLabel}
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
            {block.items.some((item) => item.linkUrl) ? (
              <OfferingGrid block={block} hrefFor={href} columns={Math.min(block.items.length, 4)} />
            ) : (
              <FeatureGridBlock block={{ ...block, eyebrow: null, title: null, subtitle: null }} />
            )}
          </>
        );
    }
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.about'), path: ROUTES.about }])} />

      <PageShell tone="dark">
        <PageBanner
          eyebrow={page.eyebrow ?? t('nav.about')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        {page.blocks.map((block, index) => (
          <BlockSection key={block.anchor ?? index} id={block.anchor ?? undefined} raised={index % 2 === 1}>
            {renderBlock(block)}
          </BlockSection>
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
