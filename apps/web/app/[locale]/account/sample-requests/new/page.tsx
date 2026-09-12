import type { Metadata } from 'next';
import { NewSampleRequestScreen } from '@/components/account/AccountScreens';
import { guardLabels } from '@/lib/account-labels';
import { getProducts } from '@/lib/content-api';
import { getMessages, translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

/**
 * 新增樣品申請。
 *
 * <p>
 * 產品選單在**伺服器端**用公開的 Content API 取好再傳下去：那是可快取的公開內容，
 * 沒有理由讓瀏覽器再打一次，也不該混進會員專區的 `no-store` 路徑（docs/cms-api.md）。
 * 表單本身仍是 client 元件 —— 送出走 Account API，帶會員 JWT。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return pageMetadata({
    locale,
    path: '/account/sample-requests/new',
    title: t('account.newSample.title'),
    noIndex: true,
  });
}

export default async function NewSampleRequestPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const messages = getMessages(locale);

  // 一次取滿：選單要能選到所有產品，分頁在這裡只會讓人找不到自己要的那一個。
  const products = await getProducts(locale, { pageSize: 200 });

  return (
    <NewSampleRequestScreen
      locale={locale}
      guard={guardLabels(locale)}
      labels={messages.account.newSample}
      products={(products?.items ?? []).map((product) => ({
        slug: product.slug,
        name: product.name ?? product.slug,
      }))}
    />
  );
}
