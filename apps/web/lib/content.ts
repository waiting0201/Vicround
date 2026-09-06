import type { Locale } from './locale';

/**
 * 頁面暫代文案的型別。
 *
 * <p>
 * ⚠️ **這裡的文字是暫代，不是最終內容。** 英文逐字取自客戶已確認的
 * `mockup/Rounded Design/`，繁中是我們先譯的版本（**待客戶校稿**）。
 * 接上 CMS 之後，這些值由 `GET /api/v1/pages/{slug}` 與各實體端點提供，
 * `content/` 底下的檔案就會被刪掉 —— 不要把它當成長期的內容來源，
 * 也不要在這裡累積新文案（新內容應該進後台）。
 * </p>
 */
export type Localized = { en: string; 'zh-Hant': string };

/** 建立雙語字串。第一個參數是確認稿的英文，第二個是暫譯。 */
export function t(en: string, zhHant: string): Localized {
  return { en, 'zh-Hant': zhHant };
}

export function text(locale: Locale, value: Localized): string {
  return value[locale];
}

/**
 * 一次把整個內容物件（含巢狀陣列）換成當前語系的字串，讓頁面不用逐欄呼叫 `text()`。
 * 非 `Localized` 的值（數字、圖片路徑、icon 名稱）原樣保留。
 */
export function localize<T>(locale: Locale, value: T): LocalizedShape<T> {
  if (Array.isArray(value)) {
    return value.map((item) => localize(locale, item as never)) as never;
  }
  if (value && typeof value === 'object') {
    if ('en' in value && 'zh-Hant' in value) return (value as Localized)[locale] as never;
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localize(locale, item as never)]),
    ) as never;
  }
  return value as never;
}

type LocalizedShape<T> = T extends Localized
  ? string
  : T extends readonly (infer U)[]
    ? LocalizedShape<U>[]
    : T extends object
      ? { [K in keyof T]: LocalizedShape<T[K]> }
      : T;

/**
 * 內容 block 經 `localize()` 之後的形狀（`Localized` 欄位全部變成 `string`）。
 * 用在文章內文那種「聯集型別 + 巢狀陣列」的資料上。
 */
export type LocalizedBlocks<T> = LocalizedShape<T>;
