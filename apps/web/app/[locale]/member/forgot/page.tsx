import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/MemberAuthForms';
import { getMessages, translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';
import { MemberFlowShell } from '../_shell';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);

  return pageMetadata({
    locale,
    path: `${ROUTES.member}/forgot`,
    title: translator(locale)('member.forgot.title'),
    noIndex: true,
  });
}

export default async function ForgotPasswordPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const messages = getMessages(locale);

  return (
    <MemberFlowShell>
      <ForgotPasswordForm
        labels={messages.member.forgot}
        signInHref={localeHref(locale, ROUTES.member)}
      />
    </MemberFlowShell>
  );
}
