import type { Metadata } from 'next';
import { PageScaffold, Todo } from '@/components/PageScaffold';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

/** 單筆樣品申請。網址用 `RequestNumber`（對外單號），不是內部 id。 */
type Params = { params: Promise<{ locale: string; requestNumber: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, requestNumber } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return pageMetadata({
    locale,
    path: `/account/sample-requests/${requestNumber}`,
    title: `${t('account.sampleRequests')} ${requestNumber}`,
    noIndex: true,
  });
}

export default async function SampleRequestPage({ params }: Params) {
  const { locale: rawLocale, requestNumber } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return (
    <PageScaffold eyebrow={t('account.sampleRequests')} title={requestNumber}>
      <Todo
        api={`GET /api/v1/account/sample-requests/${requestNumber}`}
        note="各階段時間戳、carrier / tracking、再次申請。"
      />
    </PageScaffold>
  );
}
