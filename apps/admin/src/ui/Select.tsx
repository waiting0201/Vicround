import type { SelectHTMLAttributes } from 'react';
import { cx, controlClass } from './cx';
import { Icon } from './Icon';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  error?: boolean;
  options: SelectOption[];
  /** 目前值不在 options 裡（例如尚未選擇）時顯示的提示項；本身是 disabled option。 */
  placeholder?: string;
};

/** 原生 `<select>` 包一層樣式 + 自訂箭頭圖示（原生箭頭在不同瀏覽器長得不一致）。 */
export function Select({ error, options, placeholder, className, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select className={cx(controlClass(error), 'appearance-none pr-8', className)} {...rest}>
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-3)]"
      />
    </div>
  );
}
