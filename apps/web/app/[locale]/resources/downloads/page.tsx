import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { DownloadList, ResourceSection } from '@/components/ResourceSections';
import { resources } from '@/content/resources';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 下載中心。
 *
 * <p>
 * mockup 把下載放在 Resources 的 `#downloads` 區段；本站的資訊架構（docs/sitemap.md）
 * 另給它一個可索引的獨立網址，所以這一頁用同一份清單、同一組樣式。
 * </p>
 *
 * <p>
 * ⚠️ 公開端**不回傳** `MemberOnly` 檔案的真實 URL —— 卡片連到 `/member`，
 * 登入後才由 Account API 換 10 分鐘的 SAS（docs/cms-api.md）。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, resources);

  return pageMetadata({
    locale,
    path: ROUTES.downloads,
    title: `${c.downloads.title} | ${t('nav.downloads')}`,
    description: c.banner.description,
  });
}

export default async function DownloadsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, resources);

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
          eyebrow={t('nav.resources')}
          title={c.downloads.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        <ResourceSection id="downloads" eyebrow={c.downloads.eyebrow} title={c.downloads.title}>
          <DownloadList locale={locale} items={c.downloads.items} />
        </ResourceSection>

        <PageCTA locale={locale} eyebrow={c.cta.eyebrow} headline={c.cta.headline} subcopy={c.cta.subcopy} />
      </PageShell>
    </>
  );
}
