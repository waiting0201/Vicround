import type { Metadata } from 'next';
import { PasswordScreen } from '@/components/account/AccountScreens';
import { guardLabels } from '@/lib/account-labels';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return pageMetadata({ locale, path: '/account/password', title: t('account.password'), noIndex: true });
}

export default async function AccountPasswordPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return (
    <PasswordScreen
      locale={locale}
      guard={guardLabels(locale)}
      labels={{
        title: t('account.passwordScreen.title'),
        lead: t('account.passwordScreen.lead'),
        current: t('account.passwordScreen.current'),
        next: t('account.passwordScreen.next'),
        confirm: t('account.passwordScreen.confirm'),
        submit: t('account.passwordScreen.submit'),
        saved: t('account.passwordScreen.saved'),
        mismatch: t('account.passwordScreen.mismatch'),
        failed: t('account.passwordScreen.failed'),
      }}
    />
  );
}
