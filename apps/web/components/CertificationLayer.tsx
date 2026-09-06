import { CertificationDialog } from './CertificationDialog';
import { CERTIFICATIONS } from '@/content/certifications';
import { localize } from '@/lib/content';
import { translator } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';

/**
 * 把認證資料與字串在伺服器端組好，交給 client 的彈窗。
 *
 * <p>
 * 掛在 `[locale]/layout.tsx`：mockup 是逐頁 import（只有首頁與 About 有），
 * 但它在沒有事件時完全不渲染，掛全站的成本可以忽略，換來的是任何頁面的認證名稱
 * 都能點開 —— 產品頁的 compliance 表也需要。
 * </p>
 */
export function CertificationLayer({ locale }: { locale: Locale }) {
  const t = translator(locale);

  return (
    <CertificationDialog
      certifications={localize(locale, CERTIFICATIONS)}
      contactHref={localeHref(locale, ROUTES.contact)}
      labels={{
        issuer: t('certification.issuer'),
        validity: t('certification.validity'),
        scope: t('certification.scope'),
        sites: t('certification.sites'),
        placeholder: t('certification.placeholder'),
        cta: t('certification.cta'),
        close: t('contactDialog.close'),
      }}
    />
  );
}
