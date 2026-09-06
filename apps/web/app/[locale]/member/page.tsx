import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { MemberForms } from '@/components/MemberForms';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { member } from '@/content/member';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
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
  const c = localize(locale, member);

  return pageMetadata({
    locale,
    path: ROUTES.member,
    title: c.banner.title,
    description: c.banner.description,
  });
}

export default async function MemberPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const c = localize(locale, member);

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.member'), path: ROUTES.member }])} />

      <PageShell tone="dark">
        <PageBanner
          tone="dark"
          eyebrow={c.banner.eyebrow}
          title={c.banner.title}
          description={c.banner.description}
          image={c.banner.image}
          imageLabel={c.banner.imageLabel}
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
              privacyHref={localeHref(locale, ROUTES.privacy)}
              labels={{ tabs: c.tabs, signIn: c.signIn, register: c.register }}
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
                  {c.benefits.eyebrow}
                </p>
                <h2
                  style={{
                    margin: '12px 0 0',
                    font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: '#ffffff',
                  }}
                >
                  {c.benefits.title}
                </h2>
              </div>

              {c.benefits.items.map((item) => (
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
                    <Icon name={item.icon} size={18} />
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
                {c.benefits.footnoteBefore}
                <Link href={localeHref(locale, ROUTES.resources)} style={{ color: '#a184f5', fontWeight: 600 }}>
                  {c.benefits.footnoteLink}
                </Link>
                {c.benefits.footnoteAfter}
              </p>
            </div>
          </Container>
        </section>

        <PageCTA locale={locale} eyebrow={c.cta.eyebrow} headline={c.cta.headline} subcopy={c.cta.subcopy} />
      </PageShell>
    </>
  );
}
