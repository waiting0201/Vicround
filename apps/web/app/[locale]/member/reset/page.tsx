import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/MemberAuthForms';
import { getMessages, translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { MemberFlowShell } from '../_shell';

/** 重設密碼信的落地頁（`/{locale}/member/reset?token=`）。 */
type Params = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);

  return pageMetadata({
    locale,
    path: `${ROUTES.member}/reset`,
    title: translator(locale)('member.reset.title'),
    noIndex: true,
  });
}

export default async function ResetPasswordPage({ params, searchParams }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const messages = getMessages(locale);

  return (
    <MemberFlowShell>
      <ResetPasswordForm
        labels={messages.member.reset}
        token={(await searchParams).token?.trim() ?? null}
        signInHref={localeHref(locale, ROUTES.member)}
        forgotHref={localeHref(locale, `${ROUTES.member}/forgot`)}
      />
    </MemberFlowShell>
  );
}
