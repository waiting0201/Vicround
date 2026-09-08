import type { Metadata } from 'next';
import { FaqAccordion } from '@/components/FaqAccordion';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { getFaq, getPage, requirePage } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, faqPageSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** FAQ —— 版型逐區塊對照 `mockup/Rounded Design/faq.dc.html`；內容來自 Content API。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'faq'), 'faq');

  return pageMetadata({
    locale,
    path: ROUTES.faq,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function FaqPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const [pageData, faqCategories] = await Promise.all([getPage(locale, 'faq'), getFaq(locale)]);
  const page = requirePage(pageData, 'faq');
  const categories = faqCategories ?? [];

  // 分類軌與清單用同一份資料 —— 題目屬於哪一類由 API 決定，前台不再自己分組。
  const items = categories.flatMap((category) =>
    category.items.map((item) => ({
      id: item.slug,
      category: category.slug,
      question: item.question ?? '',
      answer: item.answer ?? '',
      href: item.linkPath ? localeHref(locale, item.linkPath) : null,
      linkLabel: item.linkLabel,
    })),
  );

  const crumbs = [
    { name: t('nav.resources'), path: ROUTES.resources },
    { name: t('nav.faq'), path: ROUTES.faq },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      {/*
        FAQPage 是本站 GEO 的重點：Sitemap-0819 明列 FAQ 需結構化標記以利 AI 引擎引用。
        資料與畫面用同一份 items —— 兩邊不一致比沒有結構化資料更糟。
      */}
      <JsonLd
        data={faqPageSchema(items.map((item) => ({ question: item.question, answer: item.answer })))}
      />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.faq')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        <section id="faq" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(32px, 4vw, 56px) clamp(24px, 5vw, 80px) clamp(48px, 6vw, 80px)' }}>
            <FaqAccordion
              items={items}
              categories={[
                { id: 'all', label: t('faq.all') },
                ...categories.map((category) => ({ id: category.slug, label: category.name ?? category.slug })),
              ]}
              labels={{
                result: t('faq.result'),
                expandAll: t('faq.expandAll'),
                collapseAll: t('faq.collapseAll'),
              }}
            />
          </Container>
        </section>
      </PageShell>
    </>
  );
}
