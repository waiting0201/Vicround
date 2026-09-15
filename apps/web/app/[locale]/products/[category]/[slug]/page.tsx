import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CertificationCards } from '@/components/blocks';
import { JsonLd } from '@/components/JsonLd';
import { PageCTA } from '@/components/PageCTA';
import { PageScaffold } from '@/components/PageScaffold';
import { DownloadList } from '@/components/ResourceSections';
import { apiGet, tag } from '@/lib/api';
import type { Certification, Download } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale, type Locale } from '@/lib/locale';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, productSchema, type ProductSchemaInput } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** 產品詳情。網址三段：`/products/{category}/{slug}`（docs/sitemap.md）。 */
type Params = { params: Promise<{ locale: string; category: string; slug: string }> };

/** 圖庫的一張圖（`ProductImages`）。 */
type ProductImage = {
  url: string;
  altText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

/** `GET /v1/products/{slug}` 回的欄位。 */
type Product = ProductSchemaInput & {
  categorySlug?: string | null;
  summary?: string | null;
  applicationNote?: string | null;
  seo?: { title?: string; description?: string } | null;
  heroImageUrl?: string | null;
  images?: ProductImage[] | null;
  certifications?: Certification[] | null;
  downloads?: Download[] | null;
};

/** 區段小標。與規格表的 caption 同一套語彙，不另開第二種標題樣式。 */
const sectionLabel: React.CSSProperties = {
  margin: 0,
  font: "600 13px/1.2 'Geologica', sans-serif",
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#6436ef',
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

  // 與其餘實體詳情頁（category／solution／article）一致：查不到就是真的 404，
  // 不是伺服器暫時掛掉（那是 requirePage 的固定路由才有的例外）。
  if (data === null) notFound();

  // 主圖排在圖庫第一張（後端刻意不把它重複收進 `images`）。
  const gallery = [
    ...(data?.heroImageUrl ? [{ url: data.heroImageUrl, altText: data?.name ?? null } as ProductImage] : []),
    ...(data?.images ?? []),
  ];

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

        {/* 主圖與圖庫（`Products.HeroMediaAssetId` + `ProductImages`）。 */}
        {gallery.length > 0 && (
          <figure style={{ margin: '8px 0 0', display: 'grid', gap: 16 }}>
            {gallery.map((image, index) => (
              // eslint-disable-next-line @next/next/no-img-element -- 圖片優化已關閉，見 next.config.ts
              <img
                key={image.url}
                src={image.url}
                alt={image.altText ?? data?.name ?? slug}
                width={image.width ?? undefined}
                height={image.height ?? undefined}
                loading={index === 0 ? 'eager' : 'lazy'}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 22,
                  border: '1px solid var(--page-border, rgba(20,20,31,0.12))',
                  objectFit: 'cover',
                }}
              />
            ))}
            {gallery[0]?.caption && (
              <figcaption
                style={{
                  font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-faint, rgba(20,20,31,0.5))',
                }}
              >
                {gallery[0].caption}
              </figcaption>
            )}
          </figure>
        )}

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
        {/*
          認證（`CertificationProducts`）。卡片點下去開全站唯一的認證彈窗——
          說明文字只有 `Certifications` 一份，這裡不重寫。
        */}
        {data?.certifications && data.certifications.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <h2 style={sectionLabel}>{t('product.certifications')}</h2>
            <CertificationCards
              certifications={data.certifications}
              labels={{ view: t('certification.view'), pending: t('certification.pendingAction') }}
              columns={3}
            />
          </section>
        )}

        {/* 相關下載（`DownloadProducts`）。沒有就整區不出現——空狀態是下載頁的事。 */}
        {data?.downloads && data.downloads.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <h2 style={sectionLabel}>{t('product.downloads')}</h2>
            <DownloadList locale={locale} items={data.downloads} emptyLabel={t('common.emptyDownloads')} />
          </section>
        )}
      </PageScaffold>
      <PageCTA locale={locale} />
    </>
  );
}
