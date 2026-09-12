import type { ReactNode } from 'react';
import Link from 'next/link';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { ROUTES } from '@/lib/routes';
import { AccountProvider } from '@/components/AccountSession';

/**
 * 會員專區的殼。
 *
 * <p>
 * ⚠️ **這整棵子樹都不可索引**，三道防線缺一不可：
 * 1. `robots.txt` 的 `Disallow: /{locale}/account`（app/robots.ts）
 * 2. 每頁 metadata 的 `noIndex`（`pageMetadata({ noIndex: true })`）
 * 3. 它不會出現在 `GET /api/v1/sitemap` 的回傳裡（後端負責）
 * robots.txt 只是「請不要抓」，被連結到時仍可能被索引 —— noindex 才是真正的攔截。
 * </p>
 *
 * <p>
 * 資料一律走 Account API（`no-store`，帶會員 JWT），**不得**進 Data Cache、
 * 不得帶 revalidate tag（docs/cms-api.md）。
 * </p>
 */
export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const items = [
    { key: 'dashboard', href: `/${locale}${ROUTES.account}` },
    { key: 'downloads', href: `/${locale}${ROUTES.account}/downloads` },
    { key: 'sampleRequests', href: `/${locale}${ROUTES.account}/sample-requests` },
    { key: 'profile', href: `/${locale}${ROUTES.account}/profile` },
    { key: 'password', href: `/${locale}${ROUTES.account}/password` },
  ] as const;

  return (
    <AccountProvider>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row">
        <nav aria-label={t('nav.account')} className="flex shrink-0 flex-col gap-2 text-sm md:w-56">
          {items.map((item) => (
            <Link key={item.key} href={item.href}>
              {t(`account.${item.key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </AccountProvider>
  );
}
