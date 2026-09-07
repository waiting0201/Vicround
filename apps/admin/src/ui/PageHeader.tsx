import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon';

export type Breadcrumb = { label: string; href?: string };

/**
 * 每個畫面頂端固定的「標題＋麵包屑＋動作區」。麵包屑用 `react-router` 的 `Link`，
 * 不是 `<a>`——後台是 SPA，用 `<a>` 會整頁重新載入，丟掉記憶體裡的 access token
 * （見 lib/api.ts 的 token 存放策略），逼使用者重新走一次 refresh。
 */
export function PageHeader({
  title,
  breadcrumbs,
  description,
  actions,
}: {
  title: string;
  breadcrumbs?: Breadcrumb[];
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-[var(--border-1)] pb-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-[var(--fg-3)]" aria-label="麵包屑">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <Icon name="chevron-right" size={12} />}
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-[var(--fg-2)]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[var(--fg-2)]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--fg-1)]">{title}</h1>
          {description && <p className="mt-1 text-sm text-[var(--fg-2)]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
