import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot, bodyStyle } from '@/components/sections';
import { getCategories, getPage, getProducts, requirePage } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { CATEGORY_ACCENT, bannerImage, categoryImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Products hub —— 版型逐區塊對照 `mockup/Rounded Design/products.dc.html`；內容來自 Content API。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'products'), 'products');

  return pageMetadata({
    locale,
    path: ROUTES.products,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function ProductsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const [pageData, categoryList] = await Promise.all([getPage(locale, 'products'), getCategories(locale)]);
  const page = requirePage(pageData, 'products');
  const categories = categoryList ?? [];

  // 每條產品線的兩三個代表系列。它們是 Products，不是另一份文案 ——
  // 產品線頁與這裡因此永遠講同一件事。
  const families = await Promise.all(
    categories.map((category) => getProducts(locale, { category: category.slug, pageSize: 3 })),
  );

  const crumbs = [{ name: t('nav.products'), path: ROUTES.products }];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.products')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        {/* ============ 三張分類卡 ============ */}
        <section>
          <Container style={{ padding: 'clamp(24px, 3vw, 48px) clamp(24px, 5vw, 80px) clamp(48px, 6vw, 80px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={localeHref(locale, `${ROUTES.products}/${category.slug}`)}
                  className="vr-card-link"
                >
                  <ImageSlot src={categoryImage(category.slug)} alt={category.name ?? ''} ratio="8 / 5" radius={0} />
                  <div style={{ padding: '22px 24px 26px' }}>
                    <span
                      style={{
                        font: "600 1.1875rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {category.name}
                    </span>
                    <p
                      style={{
                        margin: '8px 0 0',
                        font: "400 0.9375rem/1.55 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {category.summary ?? category.menuNote}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 三個產品線區段（圖文左右交錯） ============ */}
        {categories.map((category, index) => {
          const imageRight = index % 2 === 1;
          const image = (
            <ImageSlot
              src={categoryImage(category.slug)}
              alt={category.name ?? ''}
              style={{ maxWidth: 480, marginLeft: imageRight ? 'auto' : undefined }}
            />
          );
          const copy = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span
                style={{
                  font: "500 14px/1 'IBM Plex Mono', monospace",
                  color: CATEGORY_ACCENT[category.type] ?? '#6436ef',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2
                style={{
                  margin: 0,
                  font: "500 2rem/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-fg)',
                }}
              >
                {category.name}
              </h2>
              <p style={bodyStyle}>{category.summary}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
                {(families[index]?.items ?? []).map((product) => (
                  <div key={product.slug}>
                    <span
                      style={{
                        font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {product.name}
                      {product.code ? ` (${product.code})` : ''}
                    </span>
                    <p
                      style={{
                        margin: '4px 0 0',
                        font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {product.summary}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={localeHref(locale, `${ROUTES.products}/${category.slug}`)}
                className="vr-inline-link"
                style={{ marginTop: 8 }}
              >
                {t('products.viewRange').replace('{name}', category.name ?? '')}
              </Link>
              <Link
                href={localeHref(locale, ROUTES.downloads)}
                className="vr-inline-link"
                data-accent="true"
                style={{ marginTop: 8 }}
              >
                {t('products.specSheet')}
              </Link>
            </div>
          );

          return (
            <section
              key={category.slug}
              id={category.slug}
              style={{ background: index % 2 === 1 ? 'var(--page-raised)' : undefined, scrollMarginTop: 90 }}
            >
              <Container
                style={{
                  padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)',
                  display: 'grid',
                  gridTemplateColumns: imageRight ? '1fr 0.85fr' : '0.85fr 1fr',
                  gap: 'clamp(32px, 5vw, 72px)',
                  alignItems: 'center',
                }}
              >
                {imageRight ? copy : image}
                {imageRight ? image : copy}
              </Container>
            </section>
          );
        })}

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
