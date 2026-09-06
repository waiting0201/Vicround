import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot, bodyStyle } from '@/components/sections';
import { products } from '@/content/products';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** Products hub —— 逐區塊對照 `mockup/Rounded Design/products.dc.html`（淺色頁）。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const c = localize(locale, products);

  return pageMetadata({
    locale,
    path: ROUTES.products,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function ProductsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, products);

  const crumbs = [{ name: t('nav.products'), path: ROUTES.products }];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
        />

        {/* ============ 三張分類卡 ============ */}
        <section>
          <Container style={{ padding: 'clamp(24px, 3vw, 48px) clamp(24px, 5vw, 80px) clamp(48px, 6vw, 80px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {c.lines.map((line) => (
                <Link
                  key={line.slug}
                  href={localeHref(locale, `${ROUTES.products}/${line.slug}`)}
                  className="vr-card-link"
                >
                  <ImageSlot src={line.image} alt={line.alt} ratio="8 / 5" radius={0} />
                  <div style={{ padding: '22px 24px 26px' }}>
                    <span
                      style={{
                        font: "600 1.1875rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {line.title}
                    </span>
                    <p
                      style={{
                        margin: '8px 0 0',
                        font: "400 0.9375rem/1.55 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {line.cardBody}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* ============ 三個產品線區段（圖文左右交錯） ============ */}
        {c.lines.map((line, index) => {
          const imageRight = index % 2 === 1;
          const image = (
            <ImageSlot
              src={line.image}
              alt={line.alt}
              style={{ maxWidth: 480, marginLeft: imageRight ? 'auto' : undefined }}
            />
          );
          const copy = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: line.color }}>
                {line.index}
              </span>
              <h2
                style={{
                  margin: 0,
                  font: "500 2rem/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-fg)',
                }}
              >
                {line.title}
              </h2>
              <p style={{ ...bodyStyle, maxWidth: 460 }}>{line.body}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
                {line.features.map((feature) => (
                  <div key={feature.title}>
                    <span
                      style={{
                        font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {feature.title}
                    </span>
                    <p
                      style={{
                        margin: '4px 0 0',
                        font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {feature.body}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href={localeHref(locale, `${ROUTES.products}/${line.slug}`)}
                className="vr-inline-link"
                style={{ marginTop: 8 }}
              >
                {c.links.viewRange.replace('{name}', line.title)}
              </Link>
              <Link
                href={localeHref(locale, ROUTES.downloads)}
                className="vr-inline-link"
                data-accent="true"
                style={{ marginTop: 8 }}
              >
                {c.links.specSheet}
              </Link>
            </div>
          );

          return (
            <section
              key={line.slug}
              id={line.anchor}
              style={{
                background: line.raised ? 'var(--page-raised)' : undefined,
                scrollMarginTop: 90,
              }}
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

        <PageCTA
          locale={locale}
          eyebrow={c.cta.eyebrow}
          headline={c.cta.headline}
          subcopy={c.cta.subcopy}
        />
      </PageShell>
    </>
  );
}
