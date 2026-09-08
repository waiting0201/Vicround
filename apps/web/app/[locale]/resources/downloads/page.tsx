import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { DownloadList, ResourceSection } from '@/components/ResourceSections';
import { block, getDownloads, getPage, requirePage } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 下載中心。
 *
 * <p>
 * mockup 把下載放在 Resources 的 `#downloads` 區段；本站的資訊架構（docs/sitemap.md）
 * 另給它一個可索引的獨立網址，因此它有自己的 `Pages` 列與同一份 `Downloads` 清單。
 * </p>
 *
 * <p>
 * ⚠️ 公開端**不回傳** `MemberOnly` 檔案的真實 URL —— 那些卡片連到 `/member`，
 * 登入後才由 Account API 換 10 分鐘的 SAS（docs/cms-api.md）。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'downloads'), 'downloads');

  return pageMetadata({
    locale,
    path: ROUTES.downloads,
    title: page.seo?.title ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function DownloadsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const [pageData, downloads] = await Promise.all([getPage(locale, 'downloads'), getDownloads(locale)]);
  const page = requirePage(pageData, 'downloads');
  const section = block(page, 'downloads');

  const crumbs = [
    { name: t('nav.resources'), path: ROUTES.resources },
    { name: t('nav.downloads'), path: ROUTES.downloads },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.resources')}
          title={section?.title ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        <ResourceSection
          id="downloads"
          eyebrow={section?.eyebrow ?? t('nav.downloads')}
          title={section?.title ?? t('nav.downloads')}
        >
          <DownloadList locale={locale} items={downloads ?? []} emptyLabel={t('common.emptyDownloads')} />
        </ResourceSection>

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
