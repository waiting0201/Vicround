import { cx } from './cx';
import { IconButton } from './IconButton';

export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/**
 * 「共 N 筆，顯示第 X–Y 筆」比純頁碼對編輯者更有用——找東西的時候心裡想的是
 * 「這批有多少筆」，不是「我在第幾頁」。頁碼與上一頁／下一頁只是輔助。
 */
export function Pagination({ page, pageSize, total, onPageChange, className }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className={cx('flex items-center justify-between gap-4 text-sm text-[var(--fg-2)]', className)}>
      <p>
        共 {total} 筆，顯示第 {from}–{to} 筆
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          icon="chevron-left"
          label="上一頁"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        />
        <span className="px-2 text-[var(--fg-1)]">
          {page} / {pageCount}
        </span>
        <IconButton
          icon="chevron-right"
          label="下一頁"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        />
      </div>
    </div>
  );
}
