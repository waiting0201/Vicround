import { useState, type ReactNode } from 'react';
import { cx } from './cx';

export type TabItem = {
  key: string;
  label: ReactNode;
  /** `warning` = 該分頁有缺漏（主要用途：語系分頁的「翻譯缺漏」標記，見 docs/admin-ui.md）。 */
  indicator?: 'warning' | 'none';
};

export type TabsProps = {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (key: string) => void;
  className?: string;
};

/**
 * 通用分頁切換器——不是「語系分頁元件」，語系只是它最主要的用途（en / zh-Hant）。
 * **這裡只管哪個分頁被選中，不管分頁內容**：因為要讓外層知道目前選了哪個分頁才能
 * 決定渲染哪組表單欄位，雙語編輯頁請一律用受控寫法（傳 `value` + `onValueChange`），
 * 不要用 `defaultValue` 非受控模式。
 */
export function Tabs({ items, value, defaultValue, onValueChange, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.key);
  const active = value ?? internal;

  function select(key: string) {
    if (value === undefined) setInternal(key);
    onValueChange?.(key);
  }

  return (
    <div role="tablist" className={cx('flex items-center gap-1 border-b border-[var(--border-1)]', className)}>
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => select(item.key)}
            className={cx(
              'admin-transition -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-[var(--brand)] text-[var(--fg-1)]'
                : 'border-transparent text-[var(--fg-2)] hover:text-[var(--fg-1)]',
            )}
          >
            {item.label}
            {item.indicator === 'warning' && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--warning-500)]"
                role="img"
                aria-label="缺漏"
                title="這個分頁有缺漏（例如尚未翻譯）"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
