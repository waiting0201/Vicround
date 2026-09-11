import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { JsonLd } from '@/components/JsonLd';
import { PageCTA } from '@/components/PageCTA';
import { PageScaffold } from '@/components/PageScaffold';
import { apiGet, tag } from '@/lib/api';
import { translator } from '@/lib/i18n';
import { requireLocale, type Locale } from '@/lib/locale';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, productSchema, type ProductSchemaInput } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** 產品詳情。網址三段：`/products/{category}/{slug}`（docs/sitemap.md）。 */
type Params = { params: Promise<{ locale: string; category: string; slug: string }> };

/**
 * `GET /v1/products/{slug}` 目前回的欄位。
 *
 * <p>
 * <b>沒有</b>圖庫、認證與相關下載——那些在 schema 裡有，但這支端點還沒回，
 * 所以頁面也不假裝有。等端點補上再加版塊，不要先放一個空殼在那裡。
 * </p>
 */
type Product = ProductSchemaInput & {
  categorySlug?: string | null;
  summary?: string | null;
  applicationNote?: string | null;
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
    { name: data?.category?.name ?? data?.categorySlug ?? category, path: `${ROUTES.products}/${category}` },
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
        eyebrow={data?.category?.name ?? data?.categorySlug ?? category}
        title={data?.name ?? slug}
        lead={data?.summary ?? undefined}
      >
        <Breadcrumb locale={locale} items={crumbs} label={t('nav.products')} />

        {data?.description && (
          <p style={{ margin: '0 0 8px', font: "400 1.0625rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif" }}>
            {data.description}
          </p>
        )}

        {data?.applicationNote && (
          <p
            style={{
              margin: 0,
              font: "400 0.9375rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'var(--page-fg-muted, rgba(20,20,31,0.66))',
            }}
          >
            {data.applicationNote}
          </p>
        )}

        {data?.specifications && data.specifications.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
              }}
            >
              <caption
                style={{
                  captionSide: 'top',
                  textAlign: 'left',
                  padding: '0 0 12px',
                  font: "600 13px/1.2 'Geologica', sans-serif",
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#6436ef',
                }}
              >
                {t('product.specifications')}
              </caption>
              <tbody>
                {data.specifications.map((row, index) => (
                  <tr key={index} style={{ borderTop: '1px solid rgba(20,20,31,0.12)' }}>
                    {row.label && (
                      <th
                        scope="row"
                        style={{ textAlign: 'left', padding: '12px 16px 12px 0', fontWeight: 500, width: '40%' }}
                      >
                        {row.label}
                      </th>
                    )}
                    <td colSpan={row.label ? 1 : 2} style={{ padding: '12px 0' }}>
                      {row.value}
                      {row.note && (
                        <span style={{ display: 'block', fontSize: '0.8125rem', opacity: 0.6 }}>{row.note}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageScaffold>
      <PageCTA locale={locale} />
    </>
  );
}
