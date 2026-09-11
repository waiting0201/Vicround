import type { Metadata } from 'next';
import { ProfileScreen } from '@/components/account/AccountScreens';
import { guardLabels, roleOptions } from '@/lib/account-labels';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return pageMetadata({ locale, path: '/account/profile', title: t('account.profile'), noIndex: true });
}

export default async function AccountProfilePage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return (
    <ProfileScreen
      locale={locale}
      guard={guardLabels(locale)}
      roleOptions={roleOptions(locale)}
      labels={{
        title: t('account.profileScreen.title'),
        name: t('account.profileScreen.name'),
        company: t('account.profileScreen.company'),
        role: t('account.profileScreen.role'),
        phone: t('account.profileScreen.phone'),
        email: t('account.profileScreen.email'),
        emailNote: t('account.profileScreen.emailNote'),
        save: t('account.profileScreen.save'),
        saved: t('account.profileScreen.saved'),
        failed: t('account.profileScreen.failed'),
      }}
    />
  );
}
