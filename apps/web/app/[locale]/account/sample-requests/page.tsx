import type { Metadata } from 'next';
import { SampleRequestsScreen } from '@/components/account/AccountScreens';
import { guardLabels, sampleStatusNames } from '@/lib/account-labels';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return pageMetadata({
    locale,
    path: '/account/sample-requests',
    title: t('account.sampleRequests'),
    noIndex: true,
  });
}

export default async function SampleRequestsPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return (
    <SampleRequestsScreen
      locale={locale}
      guard={guardLabels(locale)}
      statusNames={sampleStatusNames(locale)}
      labels={{
        title: t('account.samples.title'),
        empty: t('account.samples.empty'),
        submitted: t('account.samples.submitted'),
        items: t('account.samples.items'),
      }}
    />
  );
}
