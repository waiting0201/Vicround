import type { Metadata } from 'next';
import Link from 'next/link';
import { CertChip } from '@/components/CertificationDialog';
import { ContactTrigger } from '@/components/ContactTrigger';
import { JsonLd } from '@/components/JsonLd';
import { PageShell } from '@/components/PageShell';
import {
  Container,
  ImageSlot,
  IconTile,
  MonoChip,
  Section,
  SectionHeading,
  bodyStyle,
  eyebrowStyle,
  monoLabelStyle,
} from '@/components/sections';
import { block, getPage, getProducts, requirePage } from '@/lib/content-api';
import { formatDateRange } from '@/lib/format';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { CATEGORY_ACCENT, HERO_IMAGE, categoryImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { organizationSchema, webSiteSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** 首頁 —— 版型逐區塊對照 `mockup/Rounded Design/index.dc.html`；內容來自 Content API。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'home'), 'home');
  const hero = block(page, 'hero');

  return pageMetadata({
    locale,
    path: '',
    title: `${page.seo?.title ?? hero?.title ?? ''} | VICROUND`,
    description: page.seo?.description ?? hero?.subtitle ?? undefined,
  });
}

export default async function HomePage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const page = requirePage(await getPage(locale, 'home'), 'home');

  const hero = block(page, 'hero');
  const materials = block(page, 'materials');
  const industries = block(page, 'industries');
  const trust = block(page, 'trust');
  const trustCerts = block(page, 'trust-certs');
  const trustPartners = block(page, 'trust-partners');
  const trustShows = block(page, 'trust-exhibitions');
  const cta = block(page, 'sustainability');

  const categories = materials?.reference?.categories ?? [];

  // 每條產品線的 chip 就是它底下的前幾個系列 —— 產品線頁與這裡因此不會各講一套
  const families = await Promise.all(
    categories.map((category) => getProducts(locale, { category: category.slug, pageSize: 3 })),
  );

  const partners = trustPartners?.reference?.partnerBrands ?? [];
  const shows = trustShows?.reference?.exhibitions ?? [];

  return (
    <>
      {/*
        Organization 與 WebSite 只在首頁宣告一次，其他頁面以 @id 參照 —— 每頁都重述
        一次公司資料會讓搜尋引擎看到互相矛盾的版本。
      */}
      <JsonLd data={organizationSchema(locale)} />
      <JsonLd data={webSiteSchema(locale)} />

      <PageShell tone="dark">
        {/* ============ Hero ============ */}
        <section id="top" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '8 / 3', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: '#000000' }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 圖片優化已關閉，見 next.config.ts */}
              <img
                src={HERO_IMAGE}
                alt={hero?.title ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* 品牌 V mark 以 5% 透明度平鋪成紋理（mockup 的 heroPattern） */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: "url('/brand/vicround-mark-white.png')",
                backgroundSize: '150px',
                backgroundRepeat: 'repeat',
                opacity: 0.05,
                pointerEvents: 'none',
              }}
            />
          </div>

          <Container style={{ padding: 'clamp(48px, 6vw, 80px) clamp(24px, 5vw, 80px) clamp(16px, 2vw, 32px)' }}>
            <p style={{ ...eyebrowStyle, margin: '0 0 20px', color: '#c3aefc' }}>{hero?.eyebrow}</p>
            <h1
              style={{
                margin: 0,
                font: "400 clamp(2.75rem, 6vw, 4.5rem)/1.02 'Geologica', 'GenYoGothic TW', sans-serif",
                letterSpacing: '-0.01em',
                color: '#ffffff',
                textWrap: 'balance',
              }}
            >
              {hero?.title}
            </h1>
            <p
              style={{
                margin: '24px 0 0',
                font: "400 1.1875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'rgba(255,255,255,0.78)',
                textWrap: 'pretty',
              }}
            >
              {hero?.subtitle}
            </p>
          </Container>
        </section>

        {/* ============ 三大產品 ============ */}
        <Section id="materials">
          <SectionHeading eyebrow={materials?.eyebrow ?? ''} title={materials?.title ?? ''} />

          <div style={{ display: 'grid', gap: 'clamp(48px, 6vw, 80px)', marginTop: 'clamp(48px, 6vw, 72px)' }}>
            {categories.map((category, index) => {
              // mockup 是圖文左右交錯：01 圖左、02 圖右、03 圖左
              const imageRight = index % 2 === 1;
              const image = (
                <ImageSlot
                  src={categoryImage(category.slug)}
                  alt={category.name ?? ''}
                  style={{ maxWidth: 480, marginLeft: imageRight ? 'auto' : undefined }}
                />
              );
              const copy = (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <span
                    style={{
                      font: "500 14px/1 'IBM Plex Mono', monospace",
                      color: CATEGORY_ACCENT[category.type] ?? '#a184f5',
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      font: "500 1.75rem/1.2 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: '#ffffff',
                    }}
                  >
                    <Link
                      href={localeHref(locale, `${ROUTES.products}/${category.slug}`)}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {category.name}
                    </Link>
                  </h3>
                  <p style={bodyStyle}>{category.summary}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(families[index]?.items ?? []).map((product) => (
                      <MonoChip key={product.slug}>{product.name ?? product.slug}</MonoChip>
                    ))}
                  </div>
                </div>
              );

              return (
                <div
                  key={category.slug}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: imageRight ? '1fr 0.85fr' : '0.85fr 1fr',
                    gap: 'clamp(32px, 5vw, 72px)',
                    alignItems: 'center',
                  }}
                >
                  {imageRight ? copy : image}
                  {imageRight ? image : copy}
                </div>
              );
            })}
          </div>
        </Section>

        {/* ============ 產業總覽 ============ */}
        <Section
          id="industries"
          tone="raised"
          containerStyle={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}
        >
          <SectionHeading eyebrow={industries?.eyebrow ?? ''} title={industries?.title ?? ''} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginTop: 56 }}>
            {(industries?.reference?.solutions ?? []).map((solution) => (
              <Link
                key={solution.slug}
                href={localeHref(locale, `${ROUTES.solutions}/${solution.slug}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 18,
                  padding: '24px 12px',
                  textDecoration: 'none',
                }}
              >
                <IconTile name={solution.iconName ?? 'layers'} />
                <span
                  style={{ font: "600 1.25rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif", color: '#ffffff' }}
                >
                  {solution.name}
                </span>
                <p
                  style={{
                    margin: 0,
                    font: "400 0.9375rem/1.55 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'rgba(255,255,255,0.55)',
                  }}
                >
                  {solution.menuNote ?? solution.summary}
                </p>
              </Link>
            ))}
          </div>
        </Section>

        {/* ============ 信任牆 ============ */}
        <Section id="trust">
          <SectionHeading eyebrow={trust?.eyebrow ?? ''} title={trust?.title ?? ''} />

          <p style={{ ...monoLabelStyle, margin: '12px 0 0' }}>{t('certification.label')}</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            {(trustCerts?.reference?.certifications ?? []).map((certification) => (
              <CertChip
                key={certification.slug}
                id={certification.slug}
                label={certification.title ?? certification.slug}
              />
            ))}
          </div>

          <p style={{ ...monoLabelStyle, margin: '32px 0 0' }}>{t('certification.partners')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 12 }}>
            {/* PartnerBrands 還沒有資料（logo 待客戶提供），先留與 mockup 相同的版位 */}
            {partners.length > 0
              ? partners.map((partner) => (
                  <ImageSlot key={partner.slug} src={partner.logoUrl} alt={partner.name ?? ''} ratio="5 / 2" radius={16} />
                ))
              : Array.from({ length: 6 }).map((_, index) => (
                  <ImageSlot key={index} alt={trustPartners?.title ?? ''} ratio="5 / 2" radius={16} />
                ))}
          </div>

          <p style={{ ...monoLabelStyle, margin: '32px 0 0' }}>{t('certification.exhibitions')}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            {shows.map((show) => (
              <Link
                key={show.slug}
                href={localeHref(locale, ROUTES.news)}
                style={{
                  padding: '10px 18px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 999,
                  font: "400 13px/1.4 'Geologica', sans-serif",
                  color: 'rgba(255,255,255,0.72)',
                  textDecoration: 'none',
                }}
              >
                {show.name} · {formatDateRange(locale, show.startDate, show.endDate)}
              </Link>
            ))}
          </div>
        </Section>

        {/* ============ 永續承諾 + CTA ============ */}
        {/* 首頁的 CTA 是自己這一個（圓角 34px 的紫色卡片），不是共用的 PageCTA */}
        <section id="cta" style={{ scrollMarginTop: 90 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(16px, 3vw, 40px) clamp(24px, 3vw, 40px)' }}>
            <div
              style={{
                background: '#1a0755',
                borderRadius: 34,
                padding: 'clamp(64px, 8vw, 110px) clamp(24px, 5vw, 80px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <p style={eyebrowStyle}>{cta?.eyebrow}</p>
              <h2
                style={{
                  margin: '16px 0 0',
                  font: "500 clamp(2.25rem, 4vw, 2.75rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: '#ffffff',
                  maxWidth: 1000,
                  textWrap: 'balance',
                }}
              >
                {cta?.title}
              </h2>
              <p
                style={{
                  margin: '20px 0 0',
                  font: "400 1.0625rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'rgba(255,255,255,0.65)',
                  textWrap: 'pretty',
                }}
              >
                {cta?.body}
              </p>
              <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
                <ContactTrigger className="vr-cta-invert">
                  {t('cta.button')}
                  <span aria-hidden="true">→</span>
                </ContactTrigger>
              </div>
              {cta?.footNote ? (
                <a
                  href={`mailto:${cta.footNote}`}
                  style={{
                    margin: '24px 0 0',
                    font: "400 13px/1.5 'IBM Plex Mono', monospace",
                    color: 'rgba(255,255,255,0.4)',
                    textDecoration: 'none',
                  }}
                >
                  {cta.footNote}
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}
