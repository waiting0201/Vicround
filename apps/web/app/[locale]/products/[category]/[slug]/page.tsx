import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { PageCTA } from '@/components/PageCTA';
import { PageScaffold, Todo } from '@/components/PageScaffold';
import { apiGet, tag } from '@/lib/api';
import { translator } from '@/lib/i18n';
import { requireLocale, type Locale } from '@/lib/locale';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, productSchema, type ProductSchemaInput } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** 產品詳情。網址三段：`/products/{category}/{slug}`（docs/sitemap.md）。 */
type Params = { params: Promise<{ locale: string; category: string; slug: string }> };

type Product = ProductSchemaInput & {
  summary?: string | null;
  seo?: { title?: string; description?: string } | null;
  heroImageUrl?: string | null;
};

async function getProduct(locale: Locale, slug: string) {
  return apiGet<Product>(`/products/${slug}`, {
    culture: locale,
    tags: [tag.products(), tag.product(slug)],
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, category, slug } = await params;
  const locale = requireLocale(rawLocale);
  const data = await getProduct(locale, slug);

  return pageMetadata({
    locale,
    path: `${ROUTES.products}/${category}/${slug}`,
    title: data?.seo?.title ?? data?.name ?? slug,
    description: data?.seo?.description ?? data?.summary,
    image: data?.heroImageUrl ?? data?.image,
  });
}

export default async function ProductPage({ params }: Params) {
  const { locale: rawLocale, category, slug } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const data = await getProduct(locale, slug);

  if (data === null && process.env.API_STRICT === 'true') notFound();

  const path = `${ROUTES.products}/${category}/${slug}`;
  const crumbs = [
    { name: t('nav.products'), path: ROUTES.products },
    { name: data?.category?.name ?? category, path: `${ROUTES.products}/${category}` },
    { name: data?.name ?? slug, path },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      {/*
        Product schema 的 `additionalProperty` 來自 SpecificationRows —— 這是規格
        能被 AI 引擎正確引用（而不是從版面猜）的關鍵，見 docs/database.md §09。
      */}
      {data && <JsonLd data={productSchema(locale, path, data)} />}

      <PageScaffold
        eyebrow={data?.category?.name ?? category}
        title={data?.name ?? slug}
        lead={data?.summary ?? undefined}
      >
        <Breadcrumb locale={locale} items={crumbs} label={t('nav.products')} />
        <Todo
          api={`GET /api/v1/products/${slug}`}
          note="圖庫、規格表、認證、相關下載（memberOnly 需登入）、詢價表單。"
        />
      </PageScaffold>
      <PageCTA locale={locale} />
    </>
  );
}
