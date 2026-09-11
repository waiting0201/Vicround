import type { Metadata } from 'next';
import { OverviewScreen } from '@/components/account/AccountScreens';
import { guardLabels, memberStatusNames } from '@/lib/account-labels';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  // noIndex：會員專區不進索引，也不宣告 canonical/hreflang（見 account/layout.tsx）
  return pageMetadata({ locale, path: '/account', title: t('account.dashboard'), noIndex: true });
}

export default async function AccountPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return (
    <OverviewScreen
      locale={locale}
      guard={guardLabels(locale)}
      labels={{
        title: t('account.overview.title'),
        statusLabel: t('account.overview.statusLabel'),
        companyLabel: t('account.overview.companyLabel'),
        emailLabel: t('account.overview.emailLabel'),
        approvedLabel: t('account.overview.approvedLabel'),
        statusNames: memberStatusNames(locale),
        signOut: t('account.signOut'),
      }}
    />
  );
}
