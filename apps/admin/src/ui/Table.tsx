import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import { Skeleton } from './Loading';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

export type SortDirection = 'asc' | 'desc';
export type SortState = { key: string; direction: SortDirection };

export type TableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  /** CSS width（例如 `'120px'`）。不設就讓瀏覽器依內容自動分配。 */
  width?: string;
  render?: (row: T) => ReactNode;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  /** 給了就代表整列可點——用來開編輯抽屜或導去編輯頁。 */
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
};

/**
 * 清單頁的核心元件，內建三態（loading / error / empty）而不是留給每個畫面各自處理——
 * 27 個清單畫面如果各寫一份骨架屏／錯誤畫面，視覺與文案一定會慢慢長歪。
 *
 * <p>
 * 排序是「呼叫端擁有狀態」的受控元件：`Table` 只負責畫表頭箭頭跟送出
 * `{ key, direction }`，實際排序（打 API 帶 `?sort=` 或本地 `.sort()`）由呼叫端做——
 * 有些清單排序要打 API（分頁資料），有些整批在記憶體排序即可，元件不該替兩種情境
 * 各猜一種行為。
 * </p>
 * <p>
 * 鍵盤瀏覽：`onRowClick` 存在時每列可 focus（Tab／方向鍵由瀏覽器原生 tab 序處理），
 * Enter／Space 觸發同 click。
 * </p>
 */
export function Table<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  onRowClick,
  loading,
  skeletonRows = 6,
  error,
  onRetry,
  emptyTitle = '目前沒有資料',
  emptyDescription,
  emptyAction,
  className,
}: TableProps<T>) {
  const colCount = columns.length;

  function toggleSort(column: TableColumn<T>) {
    if (!column.sortable || !onSortChange) return;
    if (!sort || sort.key !== column.key) {
      onSortChange({ key: column.key, direction: 'asc' });
      return;
    }
    if (sort.direction === 'asc') {
      onSortChange({ key: column.key, direction: 'desc' });
      return;
    }
    onSortChange(null);
  }

  return (
    <div
      className={cx(
        'overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--surface-card)]',
        className,
      )}
    >
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border-1)] bg-[var(--surface-card-alt)]">
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width, textAlign: column.align ?? 'left' }}
                className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-[var(--fg-2)]"
              >
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(column)}
                    className="inline-flex items-center gap-1 hover:text-[var(--fg-1)]"
                  >
                    {column.header}
                    <Icon
                      name={
                        sort?.key === column.key
                          ? sort.direction === 'asc'
                            ? 'chevron-up'
                            : 'chevron-down'
                          : 'arrow-up-down'
                      }
                      size={13}
                    />
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, index) => (
              <tr key={index} className="border-b border-[var(--border-1)] last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-[160px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={colCount} className="p-0">
                <ErrorState description={error} onRetry={onRetry} />
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="p-0">
                <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(event) => {
                  if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }}
                className={cx(
                  'border-b border-[var(--border-1)] outline-none last:border-0',
                  onRowClick &&
                    'cursor-pointer hover:bg-[var(--surface-card-alt)] focus-visible:bg-[var(--surface-card-alt)]',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{ textAlign: column.align ?? 'left' }}
                    className="px-4 py-3 text-[var(--fg-1)]"
                  >
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
