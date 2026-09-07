import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/**
 * 「沒有資料」跟「查詢／篩選後沒有結果」是兩種不同的空狀態，文案不能共用
 * 同一句「目前沒有資料」——前者該引導新增，後者該引導清除篩選。呼叫端透過
 * `title`／`description`／`action` 三個 prop 各自決定文案，元件本身不猜情境。
 * 文案語氣規範見 docs/admin-ui.md。
 */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-card-alt)] text-[var(--fg-3)]">
        <Icon name={icon} size={20} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-[var(--fg-1)]">{title}</p>
        {description && <p className="text-sm text-[var(--fg-2)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
