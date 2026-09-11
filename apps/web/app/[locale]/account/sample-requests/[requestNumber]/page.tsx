import type { Metadata } from 'next';
import { SampleRequestDetailScreen } from '@/components/account/AccountScreens';
import { guardLabels, sampleStatusNames } from '@/lib/account-labels';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Params = { params: Promise<{ locale: string; requestNumber: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, requestNumber } = await params;
  const locale = requireLocale(rawLocale);

  return pageMetadata({
    locale,
    path: `/account/sample-requests/${requestNumber}`,
    title: requestNumber,
    noIndex: true,
  });
}

export default async function SampleRequestDetailPage({ params }: Params) {
  const { locale: rawLocale, requestNumber } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return (
    <SampleRequestDetailScreen
      locale={locale}
      guard={guardLabels(locale)}
      requestNumber={requestNumber}
      statusNames={sampleStatusNames(locale)}
      labels={{
        tracking: t('account.samples.tracking'),
        reorder: t('account.samples.reorder'),
        reorderFailed: t('account.samples.reorderFailed'),
        shipTo: t('account.samples.shipTo'),
        itemsTitle: t('account.samples.itemsTitle'),
        quantity: t('account.samples.quantity'),
        spec: t('account.samples.spec'),
        back: t('account.samples.back'),
        notFound: t('account.samples.notFound'),
      }}
    />
  );
}
