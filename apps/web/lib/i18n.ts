import 'server-only';
import { DEFAULT_LOCALE, type Locale } from './locale';
import en from '@/messages/en.json';
import zhHant from '@/messages/zh-Hant.json';

/**
 * UI 字串字典。**內容**（產品、文章、頁面版塊）不走這裡 —— 那些由 API 依 culture 回傳
 * （CLAUDE.md「i18n via translation tables」）。這裡只放版型上的固定標籤。
 *
 * <p>
 * **語言純度**：`en.json` 不得出現中文、`zh-Hant.json` 不得出現英文
 * （品牌名、產品線名、認證縮寫、型號除外）。
 * </p>
 */
export type Messages = typeof en;

const DICTIONARIES: Record<Locale, Messages> = {
  en,
  'zh-Hant': zhHant as Messages,
};

export function getMessages(locale: Locale): Messages {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/** `t('nav.products')` 形式的取值；查不到就回鍵名本身（缺字串會在畫面上看得見）。 */
export function translator(locale: Locale) {
  const messages = getMessages(locale);
  return (key: string): string => {
    const value = key
      .split('.')
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], messages);
    return typeof value === 'string' ? value : key;
  };
}
