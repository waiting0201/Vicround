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
import { CERTIFICATIONS } from '@/content/certifications';
import { home } from '@/content/home';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { organizationSchema, webSiteSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/** 首頁 —— 逐區塊對照 `mockup/Rounded Design/index.dc.html`。 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const content = localize(locale, home);

  return pageMetadata({
    locale,
    path: '',
    title: `${content.hero.title} | VICROUND`,
    description: content.hero.lead,
  });
}

export default async function HomePage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, home);
  const certs = localize(locale, CERTIFICATIONS);

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
              src={c.hero.image}
              alt={c.hero.imageAlt}
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
          <p style={{ ...eyebrowStyle, margin: '0 0 20px', color: '#c3aefc' }}>{c.hero.eyebrow}</p>
          <h1
            style={{
              margin: 0,
              font: "400 clamp(2.75rem, 6vw, 4.5rem)/1.02 'Geologica', 'GenYoGothic TW', sans-serif",
              letterSpacing: '-0.01em',
              color: '#ffffff',
              textWrap: 'balance',
            }}
          >
            {c.hero.title}
          </h1>
          <p
            style={{
              margin: '24px 0 0',
              font: "400 1.1875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'rgba(255,255,255,0.78)',
              textWrap: 'pretty',
            }}
          >
            {c.hero.lead}
          </p>
        </Container>
      </section>

      {/* ============ 三大產品 ============ */}
      <Section id="materials">
        <SectionHeading eyebrow={c.materials.eyebrow} title={c.materials.title} />

        <div style={{ display: 'grid', gap: 'clamp(48px, 6vw, 80px)', marginTop: 'clamp(48px, 6vw, 72px)' }}>
          {c.materials.items.map((item, index) => {
            // mockup 是圖文左右交錯：01 圖左、02 圖右、03 圖左
            const imageRight = index % 2 === 1;
            const image = (
              <ImageSlot
                src={item.image}
                alt={item.alt}
                style={{ maxWidth: 480, marginLeft: imageRight ? 'auto' : undefined }}
              />
            );
            const copy = (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: item.color }}>
                  {item.index}
                </span>
                <h3
                  style={{
                    margin: 0,
                    font: "500 1.75rem/1.2 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: '#ffffff',
                  }}
                >
                  <Link
                    href={localeHref(locale, `${ROUTES.products}/${item.slug}`)}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {item.title}
                  </Link>
                </h3>
                <p style={bodyStyle}>{item.body}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {item.tags.map((tag) => (
                    <MonoChip key={tag}>{tag}</MonoChip>
                  ))}
                </div>
              </div>
            );

            return (
              <div
                key={item.slug}
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
      <Section id="industries" tone="raised" containerStyle={{ padding: 'clamp(56px, 8vw, 100px) clamp(24px, 5vw, 80px)' }}>
        <SectionHeading eyebrow={c.industries.eyebrow} title={c.industries.title} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginTop: 56 }}>
          {c.industries.items.map((item) => (
            <Link
              key={item.slug}
              href={localeHref(locale, `${ROUTES.solutions}/${item.slug}`)}
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
              <IconTile name={item.icon} />
              <span
                style={{
                  font: "600 1.25rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: '#ffffff',
                }}
              >
                {item.title}
              </span>
              <p
                style={{
                  margin: 0,
                  font: "400 0.9375rem/1.55 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                {item.body}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* ============ 信任牆 ============ */}
      <Section id="trust">
        <SectionHeading eyebrow={c.trust.eyebrow} title={c.trust.title} />

        <p style={{ ...monoLabelStyle, margin: '12px 0 0' }}>{t('certification.label')}</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
          {c.trust.certificationIds.map((id) => {
            const cert = certs.find((item) => item.id === id);
            return cert ? <CertChip key={id} id={id} label={cert.title} /> : null;
          })}
        </div>

        <p style={{ ...monoLabelStyle, margin: '32px 0 0' }}>{t('certification.partners')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 12 }}>
          {/* PartnerBrands 之後由 CMS 供應（logo 走 Blob 媒體庫），先留版位 */}
          {Array.from({ length: c.trust.partnerSlots }).map((_, index) => (
            <ImageSlot
              key={index}
              alt={c.trust.partnerLabel}
              ratio="5 / 2"
              radius={16}
            />
          ))}
        </div>

        <p style={{ ...monoLabelStyle, margin: '32px 0 0' }}>{t('certification.exhibitions')}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          {Array.from({ length: c.trust.exhibitionSlots }).map((_, index) => (
            <span
              key={index}
              style={{
                padding: '10px 18px',
                border: '1px dashed rgba(255,255,255,0.18)',
                borderRadius: 999,
                font: "400 13px/1.4 'Geologica', sans-serif",
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              {c.trust.exhibitionLabel}
            </span>
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
            <p style={eyebrowStyle}>{c.sustainability.eyebrow}</p>
            <h2
              style={{
                margin: '16px 0 0',
                font: "500 clamp(2.25rem, 4vw, 2.75rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
                color: '#ffffff',
                maxWidth: 1000,
                textWrap: 'balance',
              }}
            >
              {c.sustainability.title}
            </h2>
            <p
              style={{
                margin: '20px 0 0',
                font: "400 1.0625rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'rgba(255,255,255,0.65)',
                textWrap: 'pretty',
              }}
            >
              {c.sustainability.body}
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
              <ContactTrigger className="vr-cta-invert">
                {t('cta.button')}
                <span aria-hidden="true">→</span>
              </ContactTrigger>
            </div>
            <p
              style={{
                margin: '24px 0 0',
                font: "400 13px/1.5 'IBM Plex Mono', monospace",
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              {c.sustainability.email}
            </p>
          </div>
        </div>
      </section>
      </PageShell>
    </>
  );
}
