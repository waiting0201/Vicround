import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { MemberForms, MEMBER_ROLE_VALUES } from '@/components/MemberForms';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { block, getPage, requirePage } from '@/lib/content-api';
import { getMessages, translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { bannerImage } from '@/lib/page-assets';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 會員專區入口 —— 逐區塊對照 `mockup/Rounded Design/member.dc.html`（深色頁）。
 *
 * <p>
 * 這一頁**是**可索引的（它公開說明會員能拿到什麼）；登入後的 `/account/**` 才是 noindex。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'member'), 'member');

  return pageMetadata({
    locale,
    path: ROUTES.member,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

export default async function MemberPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const messages = getMessages(locale);

  const page = requirePage(await getPage(locale, 'member'), 'member');
  const benefits = block(page, 'benefits');

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.member'), path: ROUTES.member }])} />

      <PageShell tone="dark">
        <PageBanner
          tone="dark"
          eyebrow={page.eyebrow ?? t('nav.member')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        <section>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 64px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(28px, 4vw, 64px)',
              alignItems: 'start',
            }}
          >
            <MemberForms
              locale={locale}
              accountHref={localeHref(locale, ROUTES.account)}
              forgotHref={localeHref(locale, `${ROUTES.member}/forgot`)}
              roleValues={MEMBER_ROLE_VALUES}
              privacyHref={localeHref(locale, ROUTES.privacy)}
              labels={{
                tabs: messages.member.tabs,
                signIn: messages.member.signIn,
                register: messages.member.register,
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <p
                  style={{
                    margin: 0,
                    font: "600 13px/1.2 'Geologica', sans-serif",
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#a184f5',
                  }}
                >
                  {benefits?.eyebrow}
                </p>
                <h2
                  style={{
                    margin: '12px 0 0',
                    font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: '#ffffff',
                  }}
                >
                  {benefits?.title}
                </h2>
              </div>

              {(benefits?.items ?? []).map((item) => (
                <div
                  key={item.title}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '22px 24px',
                    background: '#17172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                  }}
                >
                  <span
                    style={{
                      flex: '0 0 auto',
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: 'rgba(100,54,239,0.16)',
                      color: '#a184f5',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={item.iconName ?? 'shield-check'} size={18} />
                  </span>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        font: "600 0.9375rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: '#ffffff',
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 6,
                        font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'rgba(255,255,255,0.55)',
                      }}
                    >
                      {item.body}
                    </span>
                  </div>
                </div>
              ))}

              <p
                style={{
                  margin: 0,
                  font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {t('member.footnoteBefore')}
                <Link href={localeHref(locale, ROUTES.resources)} style={{ color: '#a184f5', fontWeight: 600 }}>
                  {t('member.footnoteLink')}
                </Link>
                {t('member.footnoteAfter')}
              </p>
            </div>
          </Container>
        </section>

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
