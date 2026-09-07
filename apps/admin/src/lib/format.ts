import { CULTURES, type Culture } from './enums';
import type { AdminRow } from './api';
import type { ResourceDef } from './resources';

/**
 * 顯示用的小工具。集中在這裡的理由很單純：日期格式、翻譯完整度這種東西
 * 一旦讓每個畫面各自為政，同一筆資料在列表與編輯頁會顯示成兩種樣子。
 */

/** 後台介面固定繁中，時間一律顯示當地時間（DB 存的是 UTC）。 */
const dateTimeFormat = new Intl.DateTimeFormat('zh-Hant', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormat = new Intl.DateTimeFormat('zh-Hant', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function formatDateTime(value: unknown): string {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormat.format(date);
}

export function formatDate(value: unknown): string {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
}

/** 「3 天前」這種相對時間，用在列表的最後更新欄，掃視比絕對時間快。 */
export function formatRelative(value: unknown): string {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '—';

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const absolute = Math.abs(diffMinutes);
  const relative = new Intl.RelativeTimeFormat('zh-Hant', { numeric: 'auto' });

  if (absolute < 60) return relative.format(diffMinutes, 'minute');
  if (absolute < 60 * 24) return relative.format(Math.round(diffMinutes / 60), 'hour');
  if (absolute < 60 * 24 * 30) return relative.format(Math.round(diffMinutes / (60 * 24)), 'day');
  return dateFormat.format(date);
}

export function formatBytes(value: unknown): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** exponent;
  return `${size < 10 && exponent > 0 ? size.toFixed(1) : Math.round(size)} ${units[exponent]}`;
}

/** slug 的規則與資料庫的 CHECK 一致：小寫英數與連字號。 */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

/**
 * 這一筆在某個語系是否算「有翻譯」。
 *
 * <p>
 * 判準是**必填的翻譯欄位有沒有值**，而不是「翻譯列存不存在」——
 * 一列只有空字串的翻譯，對前台來說跟沒有翻譯是同一件事。
 * </p>
 */
export function hasTranslation(row: AdminRow, resource: ResourceDef, culture: Culture): boolean {
  const translation = row.translations?.[culture];
  if (!translation) return false;

  const required = resource.translationFields.filter((field) => field.required);
  const checked = required.length ? required : resource.translationFields.slice(0, 1);
  return checked.every((field) => String(translation[field.name] ?? '').trim().length > 0);
}

/** 缺哪幾個語系 —— 列表的翻譯標記與「缺 zh-Hant」篩選都讀這一支。 */
export function missingCultures(row: AdminRow, resource: ResourceDef): Culture[] {
  if (!resource.hasTranslations) return [];
  return CULTURES.map((culture) => culture.value).filter((culture) => !hasTranslation(row, resource, culture));
}

/** 列表與抽屜標題：優先取目前語系的標題，缺翻譯時退回另一個語系並標示出來。 */
export function rowTitle(row: AdminRow, resource: ResourceDef, culture: Culture): string {
  if (!resource.titleFromTranslation) {
    return String(row[resource.titleField] ?? '（未命名）');
  }

  const current = row.translations?.[culture]?.[resource.titleField];
  if (current) return String(current);

  for (const fallback of CULTURES) {
    const value = row.translations?.[fallback.value]?.[resource.titleField];
    if (value) return `${value}`;
  }
  return '（未命名）';
}

/** 對照可選值取標籤；查不到就原樣顯示，不要吞掉未知值。 */
export function optionLabel(
  options: { value: string; label: string }[] | undefined,
  value: unknown,
): string {
  if (value === null || value === undefined || value === '') return '—';
  return options?.find((option) => option.value === String(value))?.label ?? String(value);
}
