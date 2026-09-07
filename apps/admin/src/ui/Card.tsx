import type { ReactNode } from 'react';
import { cx } from './cx';

export function Card({
  title,
  description,
  actions,
  children,
  className,
  padding = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 設 false 讓內容自己控制內距——例如卡片裡直接放一個 Table，Table 已經有自己的邊框。 */
  padding?: boolean;
}) {
  return (
    <div
      className={cx(
        'rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--surface-card)] shadow-[var(--shadow-xs)]',
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-1)] px-5 py-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-[var(--fg-1)]">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-[var(--fg-2)]">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding ? 'p-5' : undefined}>{children}</div>
    </div>
  );
}
