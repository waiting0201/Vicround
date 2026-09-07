import { cx } from './cx';

/**
 * `Spinner` 與 `Skeleton` 放同一檔——兩者都是「還沒有資料」的過場狀態，
 * 差別只在有沒有已知的版面形狀。有形狀（表格列、卡片）用 Skeleton，
 * 沒有（按鈕 loading、局部小區塊）用 Spinner。
 */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cx('animate-spin', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-[var(--radius-sm)] bg-[var(--border-1)]', className)} />;
}
