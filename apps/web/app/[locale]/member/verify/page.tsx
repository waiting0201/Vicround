import type { Metadata } from 'next';
import { VerifyEmailScreen } from '@/components/MemberAuthForms';
import { getMessages, translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { MemberFlowShell } from '../_shell';

/**
 * 驗證信的落地頁（`/{locale}/member/verify?token=`）。
 * 網址由 `EmailMemberNotifier` 組出來，兩邊必須一致。
 */
type Params = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);

  // token 在網址上，這一頁一律不可索引。
  return pageMetadata({
    locale,
    path: `${ROUTES.member}/verify`,
    title: translator(locale)('member.verify.title'),
    noIndex: true,
  });
}

export default async function VerifyEmailPage({ params, searchParams }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const messages = getMessages(locale);

  return (
    <MemberFlowShell>
      <VerifyEmailScreen
        labels={messages.member.verify}
        token={(await searchParams).token?.trim() ?? null}
        accountHref={localeHref(locale, ROUTES.account)}
      />
    </MemberFlowShell>
  );
}
