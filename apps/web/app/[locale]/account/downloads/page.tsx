import type { Metadata } from 'next';
import { DownloadsScreen } from '@/components/account/AccountScreens';
import { guardLabels } from '@/lib/account-labels';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return pageMetadata({ locale, path: '/account/downloads', title: t('account.downloads'), noIndex: true });
}

export default async function AccountDownloadsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return (
    <DownloadsScreen
      locale={locale}
      guard={guardLabels(locale)}
      labels={{
        title: t('account.downloadsScreen.title'),
        empty: t('account.downloadsScreen.empty'),
        download: t('account.downloadsScreen.download'),
        memberOnly: t('account.downloadsScreen.memberOnly'),
        onRequest: t('account.downloadsScreen.onRequest'),
        version: t('account.downloadsScreen.version'),
        validUntil: t('account.downloadsScreen.validUntil'),
        failed: t('account.downloadsScreen.failed'),
      }}
    />
  );
}
