import { HeaderClient, type HeaderModel } from './HeaderClient';
import { translator } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';
import { localeHref, navItems, searchChips } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';

/**
 * 頁首 —— 版型逐項對照 `mockup/Rounded Design/Header.dc.html`（rounded 變體）。
 *
 * <p>
 * 這一層是 Server Component：只負責把字典與路由組成模型。互動（mega menu、搜尋面板、
 * 聯絡表單）在 `HeaderClient`，因為 `lib/i18n.ts` 是 `server-only`，字串不能在 client 取。
 * </p>
 */
export function SiteHeader({ locale }: { locale: Locale }) {
  const t = translator(locale);

  const model: HeaderModel = {
    locale,
    homeHref: `/${locale}`,
    contactHref: localeHref(locale, ROUTES.contact),
    memberHref: localeHref(locale, ROUTES.member),
    privacyHref: localeHref(locale, ROUTES.privacy),
    contactLabel: t('nav.contact'),
    memberLabel: t('nav.member'),
    searchLabel: t('search.label'),
    languageLabel: t('common.language'),
    items: navItems().map((item) => ({
      key: item.key,
      label: t(`nav.${item.key}`),
      href: localeHref(locale, item.href),
      menuTitle: item.children ? t(`megaTitle.${item.key}`) : undefined,
      children: item.children?.map((child) => ({
        label: t(`mega.${item.key}.${child.key}.label`),
        note: t(`mega.${item.key}.${child.key}.note`),
        href: localeHref(locale, child.href),
      })),
    })),
    search: {
      placeholder: t('search.placeholder'),
      submit: t('search.submit'),
      frequent: t('search.frequent'),
      chips: searchChips().map((chip) => ({
        label: t(`search.chips.${chip.key}`),
        href: localeHref(locale, chip.href),
      })),
    },
    dialog: {
      eyebrow: t('contactDialog.eyebrow'),
      title: t('contactDialog.title'),
      name: t('contactDialog.name'),
      namePlaceholder: t('contactDialog.namePlaceholder'),
      company: t('contactDialog.company'),
      companyPlaceholder: t('contactDialog.companyPlaceholder'),
      email: t('contactDialog.email'),
      emailPlaceholder: t('contactDialog.emailPlaceholder'),
      productLine: t('contactDialog.productLine'),
      productLines: [
        t('mega.products.opticalFilm.label'),
        t('mega.products.textileFoam.label'),
        t('mega.products.acoustic.label'),
        t('contactDialog.productLineOther'),
      ],
      application: t('contactDialog.application'),
      applicationPlaceholder: t('contactDialog.applicationPlaceholder'),
      targetSpec: t('contactDialog.targetSpec'),
      targetSpecPlaceholder: t('contactDialog.targetSpecPlaceholder'),
      consent: t('contactDialog.consent'),
      consentLink: t('contactDialog.consentLink'),
      consentSuffix: t('contactDialog.consentSuffix'),
      submit: t('contactDialog.submit'),
      sentTitle: t('contactDialog.sentTitle'),
      sentBody: t('contactDialog.sentBody'),
      close: t('contactDialog.close'),
    },
  };

  return <HeaderClient model={model} />;
}
