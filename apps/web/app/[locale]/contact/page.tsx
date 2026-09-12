import type { Metadata } from 'next';
import Link from 'next/link';
import { BlockHeading, BlockSection, StepCards, cardStyle, sectionTitleStyle } from '@/components/blocks';
import { ContactForm } from '@/components/ContactForm';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { LocationMap } from '@/components/LocationMap';
import { PageBanner } from '@/components/PageBanner';
import { PageShell } from '@/components/PageShell';
import { Container, ImageSlot } from '@/components/sections';
import { block, getCategories, getPage, requirePage } from '@/lib/content-api';
import { getMessages, translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, organizationContactSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * Contact —— 版型逐區塊對照 `mockup/Rounded Design/contact.dc.html`。
 *
 * <p>
 * 表單送出走同源的 `/api/contact`；收件窗口、據點與「送出之後」三段都是
 * reference block，資料分別來自 `ContactChannels` / `Locations` / `ProcessFlows`。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'contact'), 'contact');

  return pageMetadata({
    locale,
    path: ROUTES.contact,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function ContactPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const messages = getMessages(locale);

  const [pageData, categoryList] = await Promise.all([getPage(locale, 'contact'), getCategories(locale)]);
  const page = requirePage(pageData, 'contact');

  const channelsBlock = block(page, 'channels');
  const hurry = block(page, 'hurry');
  const locations = block(page, 'locations');
  const process = block(page, 'what-happens-next');

  const channels = channelsBlock?.reference?.contactChannels ?? [];

  const locationList = locations?.reference?.locations ?? [];
  const headquarters = locationList.find((l) => l.type === 'headquarters');

  // 地圖只放總部（其餘據點的座標多半還沒填）；總部沒座標就找第一個有座標的據點。
  const mappedLocation =
    headquarters?.latitude != null && headquarters.longitude != null
      ? headquarters
      : locationList.find((l) => l.latitude != null && l.longitude != null);

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.contact'), path: ROUTES.contact }])} />
      {/* 實體地址、座標與收件窗口 —— 本站唯一輸出這些事實的地方（docs/sitemap.md JSON-LD） */}
      <JsonLd data={organizationContactSchema(locale, { location: headquarters, channels })} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.contact')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        {/* ============ 表單 + 直接聯絡 ============ */}
        <section>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1.15fr 1fr',
              gap: 'clamp(28px, 4vw, 64px)',
              alignItems: 'start',
            }}
          >
            <ContactForm
              privacyHref={localeHref(locale, ROUTES.privacy)}
              culture={locale}
              categories={(categoryList ?? []).map((category) => ({
                slug: category.slug,
                name: category.name ?? category.slug,
              }))}
              labels={{ ...messages.contactForm, ...messages.contactForm.fields }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ ...sectionTitleStyle, font: "500 1.5rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif" }}>
                  {channelsBlock?.title}
                </h2>
                <p
                  style={{
                    margin: '12px 0 0',
                    font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-muted)',
                  }}
                >
                  {channelsBlock?.subtitle}
                </p>
              </div>

              {channels.map((channel) => (
                <div
                  key={channel.slug}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '20px 22px',
                    border: '1px solid var(--page-border)',
                    borderRadius: 16,
                  }}
                >
                  <span
                    style={{
                      flex: '0 0 auto',
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'rgba(100,54,239,0.1)',
                      color: '#6436ef',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="mail" size={18} />
                  </span>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-fg)',
                      }}
                    >
                      {channel.label}
                    </span>
                    <a
                      href={`mailto:${channel.email}`}
                      style={{
                        display: 'block',
                        marginTop: 4,
                        font: "500 0.875rem/1.5 'IBM Plex Mono', monospace",
                        color: '#6436ef',
                        textDecoration: 'none',
                      }}
                    >
                      {channel.email}
                    </a>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 4,
                        font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {channel.description}
                    </span>
                  </div>
                </div>
              ))}

              {hurry ? (
                <div style={{ padding: '20px 22px', border: '1px dashed var(--page-border)', borderRadius: 16 }}>
                  <span
                    style={{
                      font: "500 12px/1.4 'IBM Plex Mono', monospace",
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--page-faint)',
                    }}
                  >
                    {hurry.eyebrow}
                  </span>
                  <p
                    style={{
                      margin: '10px 0 0',
                      font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {hurry.title}
                  </p>
                  <p
                    style={{
                      margin: '6px 0 0',
                      font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {hurry.body}
                  </p>
                  <Link
                    href={localeHref(locale, ROUTES.downloads)}
                    className="vr-inline-link"
                    data-accent="true"
                    style={{ marginTop: 12 }}
                  >
                    {t('nav.downloads')} →
                  </Link>
                </div>
              ) : null}
            </div>
          </Container>
        </section>

        {/* ============ 據點 ============ */}
        {locations ? (
          <BlockSection id="locations" raised>
            <BlockHeading block={locations} />

            <div style={{ marginTop: 32 }}>
              {/* 地圖釘在總部；沒有座標時退回佔位框（見 LocationMap） */}
              {mappedLocation ? (
                <LocationMap locale={locale} location={mappedLocation} ratio="16 / 5" />
              ) : (
                <ImageSlot alt={t('common.mapPlaceholder')} label={t('common.mapPlaceholder')} ratio="16 / 5" />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 24 }}>
              {locationList.map((location) => (
                <div key={`${location.city}-${location.type}`} style={{ ...cardStyle, gap: 10 }}>
                  <span
                    style={{
                      font: "500 12px/1.4 'IBM Plex Mono', monospace",
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#6436ef',
                    }}
                  >
                    {t(`locations.${location.type}`)}
                  </span>
                  <span
                    style={{
                      font: "600 1.0625rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {location.name ?? location.city}
                  </span>
                  <span
                    style={{
                      font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {location.addressLine}
                  </span>
                  {location.phone ? (
                    <a
                      href={`tel:${location.phone.replace(/\s+/g, '')}`}
                      style={{
                        font: "500 0.875rem/1.5 'IBM Plex Mono', monospace",
                        color: 'var(--page-muted)',
                        textDecoration: 'none',
                      }}
                    >
                      {location.phone}
                    </a>
                  ) : null}
                  {/* 總部的 MapUrl 已填；兩個生產據點要等客戶提供地址後才有連結 */}
                  {location.mapUrl ? (
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        marginTop: 'auto',
                        font: "600 13px/1.4 'Geologica', sans-serif",
                        color: '#6436ef',
                        textDecoration: 'none',
                      }}
                    >
                      {t('common.openInMaps')}
                    </a>
                  ) : (
                    <span
                      style={{
                        marginTop: 'auto',
                        font: "600 13px/1.4 'Geologica', sans-serif",
                        color: 'var(--page-faint)',
                      }}
                    >
                      {t('common.openInMaps')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </BlockSection>
        ) : null}

        {/* ============ 送出之後 ============ */}
        {process ? (
          <BlockSection id="what-happens-next">
            <h2 style={sectionTitleStyle}>{process.title}</h2>
            <StepCards steps={process.reference?.processFlows?.[0]?.steps ?? []} />
          </BlockSection>
        ) : null}
      </PageShell>
    </>
  );
}
