import type { ReactNode } from 'react';
import { cx } from './cx';

const ELEVATION_CLASS = {
  xs: 'shadow-[var(--shadow-xs)]',
  sm: 'shadow-[var(--shadow-sm)]',
  md: 'shadow-[var(--shadow-md)]',
} as const;

export function Card({
  title,
  description,
  actions,
  children,
  className,
  padding = true,
  elevation = 'xs',
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 設 false 讓內容自己控制內距——例如卡片裡直接放一個 Table，Table 已經有自己的邊框。 */
  padding?: boolean;
  /**
   * 陰影深度，預設 `xs`（密集表單頁的卡片只需要一條若有似無的邊界感）。
   * `md` 留給少數「獨立於工作流程之外」的畫面用，例如登入頁——那裡卡片是
   * 畫面上唯一的焦點，值得多一點浮起感；27 個工作畫面不要用 `md`，密集排列的
   * 卡片如果都浮起來，反而會互相搶視覺重量。
   */
  elevation?: keyof typeof ELEVATION_CLASS;
}) {
  return (
    <div
      className={cx(
        'rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--surface-card)]',
        ELEVATION_CLASS[elevation],
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
