import type { Metadata } from 'next';
import { PageScaffold, Todo } from '@/components/PageScaffold';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  // noIndex：會員專區不進索引，也不宣告 canonical/hreflang（見 account/layout.tsx）
  return pageMetadata({ locale, path: '/account/profile', title: t('account.profile'), noIndex: true });
}

export default async function AccountPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return (
    <PageScaffold title={t('account.profile')}>
      <Todo api="GET /api/v1/account/me、PUT /api/v1/account/me、POST /api/v1/account/change-password" note="會員資料與改密碼。" />
    </PageScaffold>
  );
}
