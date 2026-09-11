import type { AccountGuardLabels } from '@/components/AccountGuard';
import type { MemberStatus } from '@/lib/account-client';
import type { Locale } from '@/lib/locale';
import { getMessages, translator } from '@/lib/i18n';

/**
 * 把 `messages/{locale}.json` 攤成會員專區元件要的形狀。
 *
 * <p>
 * 頁面是伺服器元件、畫面是客戶端元件，中間只能傳可序列化的值——所以在這裡把
 * translator 先攤平成純物件，而不是把函式傳過界。
 * </p>
 */
const STATUSES: MemberStatus[] = [
  'pendingEmailVerification',
  'pendingApproval',
  'approved',
  'rejected',
  'suspended',
];

const SAMPLE_STATUSES = [
  'draft',
  'submitted',
  'underReview',
  'approved',
  'shipped',
  'delivered',
  'rejected',
  'cancelled',
  'unknown',
];

/** 職務選項的值必須與後端 `MemberEnumNames.ParseJobRole` 一致。 */
const ROLE_VALUES = ['engineeringRnd', 'procurement', 'productManagement', 'quality', 'other'];

export function guardLabels(locale: Locale): AccountGuardLabels {
  const t = translator(locale);

  return {
    loading: t('account.loading'),
    signInRequired: t('account.signInRequired'),
    signInBody: t('account.signInBody'),
    signIn: t('account.signIn'),
    statusTitles: Object.fromEntries(
      STATUSES.map((status) => [status, t(`account.status.${status}.title`)]),
    ) as Record<MemberStatus, string>,
    statusBodies: Object.fromEntries(
      STATUSES.map((status) => [status, t(`account.status.${status}.body`)]),
    ) as Record<MemberStatus, string>,
  };
}

export function memberStatusNames(locale: Locale): Record<string, string> {
  const t = translator(locale);
  return Object.fromEntries(STATUSES.map((status) => [status, t(`account.status.${status}.title`)]));
}

export function sampleStatusNames(locale: Locale): Record<string, string> {
  const t = translator(locale);
  return Object.fromEntries(SAMPLE_STATUSES.map((status) => [status, t(`account.sampleStatus.${status}`)]));
}

export function roleOptions(locale: Locale): { value: string; label: string }[] {
  // `translator` 只回字串，而職務是一個陣列，所以直接讀訊息物件。
  const labels = getMessages(locale).member.register.roles;

  return ROLE_VALUES.map((value, index) => ({
    value,
    label: labels[index] ?? value,
  }));
}
