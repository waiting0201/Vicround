/**
 * 極簡的 class 組合工具，取代 clsx / tailwind-merge。
 *
 * <p>
 * 本專案刻意不新增 npm 套件（見 docs/admin-ui.md「不新增 npm 套件」）。這裡的用法
 * 全部是「固定 class + 條件 class」，不存在需要 tailwind-merge 那種「後面的 class
 * 覆蓋前面同屬性 class」的合併場景，十行函式就夠，不需要引入完整套件。
 * </p>
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * 表單控制項（Input / Textarea / Select）共用的樣式基準，避免三個檔案各寫一份、
 * 改一次要改三處。`error` 只切邊框顏色，不切背景 —— 密集表格旁邊一次可能有十幾個
 * 輸入框，錯誤用背景色會在頁面上「爆」出太多紅色，邊框已經足夠明顯。
 */
export function controlClass(error?: boolean, extra?: string): string {
  return cx(
    'w-full rounded-[var(--radius-sm)] border bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--fg-1)]',
    'outline-none transition-colors placeholder:text-[var(--fg-3)]',
    'disabled:cursor-not-allowed disabled:bg-[var(--surface-card-alt)] disabled:text-[var(--fg-3)]',
    error
      ? 'border-[var(--danger-500)] focus:border-[var(--danger-500)]'
      : 'border-[var(--border-1)] focus:border-[var(--brand)]',
    extra,
  );
}
