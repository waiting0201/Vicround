import type { Locale } from './locale';

/**
 * 日期呈現。
 *
 * <p>
 * 一律用 `Intl` 依語系格式化，**不在內容裡存已格式化的字串** ——
 * 那會讓同一筆資料在兩個語系各存一份日期，改期時只改到一邊。
 * </p>
 *
 * <p>
 * 時區固定 UTC：API 回的是 UTC，若讓瀏覽器（SSR 時是伺服器）自己套本地時區，
 * 同一篇文章會因為機器所在時區不同而顯示差一天。
 * </p>
 */
const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
};

export function formatDate(locale: Locale, iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale, DATE_OPTIONS).format(new Date(iso));
}

/** 展會檔期：`Aug 26 – 28, 2026` / `2026年8月26日至28日`。 */
export function formatDateRange(locale: Locale, startIso: string, endIso: string): string {
  const format = new Intl.DateTimeFormat(locale, DATE_OPTIONS);
  const start = new Date(startIso);
  const end = new Date(endIso);
  return start.getTime() === end.getTime() ? format.format(start) : format.formatRange(start, end);
}

/** `<time dateTime>` 用的機器可讀日期（YYYY-MM-DD）。 */
export function isoDate(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/** 下載檔案大小；小數點一位，不做 KiB/KB 之爭，一律 1024 進位。 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}
