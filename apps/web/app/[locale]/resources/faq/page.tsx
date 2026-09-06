import type { Metadata } from 'next';
import { FaqAccordion } from '@/components/FaqAccordion';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { faq } from '@/content/faq';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, faqPageSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** FAQ —— 逐區塊對照 `mockup/Rounded Design/faq.dc.html`。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, faq);

  return pageMetadata({
    locale,
    path: ROUTES.faq,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function FaqPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, faq);

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
        data={faqPageSchema(c.items.map((item) => ({ question: item.question, answer: item.answer })))}
      />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        <section id="faq" style={{ scrollMarginTop: 90 }}>
          <Container style={{ padding: 'clamp(32px, 4vw, 56px) clamp(24px, 5vw, 80px) clamp(48px, 6vw, 80px)' }}>
            <FaqAccordion
              items={c.items.map((item) => ({ ...item, href: localeHref(locale, item.href) }))}
              categories={c.categories}
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
