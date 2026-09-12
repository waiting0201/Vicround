import { cx } from './cx';

/**
 * `Spinner`、`Skeleton` 與 `LoadingBlock` 放同一檔——三者都是「還沒有資料」的過場狀態，
 * 差別只在有沒有已知的版面形狀。有形狀（表格列、卡片）用 Skeleton，
 * 沒有（按鈕 loading、局部小區塊）用 Spinner，整個畫面區塊在等資料用 LoadingBlock。
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

/**
 * 畫面層級的「等資料」狀態：詳情頁、看板、設定頁這些沒有走 `Table`（三態內建在
 * `Table.tsx`）的畫面共用這一個。
 *
 * <p>
 * 之所以不是各畫面自己寫一行置中文字：那樣每一頁的垂直留白、字級、有沒有轉圈
 * 都靠當下的手感決定，切換畫面時載入狀態長得不一樣，會讓人以為是不同的系統在回應。
 * </p>
 */
export function LoadingBlock({ label = '載入中…', className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx('flex items-center justify-center gap-2 py-16 text-sm text-[var(--fg-2)]', className)}
    >
      <Spinner size={15} className="text-[var(--fg-3)]" />
      {label}
    </div>
  );
}
