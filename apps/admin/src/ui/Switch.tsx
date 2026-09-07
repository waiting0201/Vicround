import { useId, useState, type ReactNode } from 'react';
import { cx } from './cx';

export type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  id?: string;
  name?: string;
};

/**
 * 開關（例如 SiteSettings 的布林值、PartnerBrands.IsLogoWallVisible）。
 * 受控／非受控雙形式：不傳 `checked` 就自己管內部狀態，傳了就完全聽外部——跟原生
 * `<input>` 的 `value`/`defaultValue` 心智模型一致，呼叫端不用去記兩套 API。
 */
export function Switch({ checked, defaultChecked, onCheckedChange, label, disabled, id, name }: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const isControlled = checked !== undefined;
  const value = isControlled ? checked : internal;

  function handleChange(next: boolean) {
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  }

  return (
    <label
      htmlFor={inputId}
      className={cx('inline-flex items-center gap-2 text-sm text-[var(--fg-1)]', disabled && 'opacity-60')}
    >
      <span
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-[var(--radius-pill)] transition-colors"
        style={{ background: value ? 'var(--brand)' : 'var(--border-2)' }}
      >
        <input
          type="checkbox"
          role="switch"
          id={inputId}
          name={name}
          checked={value}
          disabled={disabled}
          aria-checked={value}
          onChange={(event) => handleChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-[var(--shadow-xs)] transition-transform"
          style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
        />
        <span
          className={cx(
            'pointer-events-none absolute inset-0 rounded-[var(--radius-pill)]',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
            'peer-focus-visible:outline-[var(--focus-ring)]',
          )}
        />
      </span>
      {label}
    </label>
  );
}
