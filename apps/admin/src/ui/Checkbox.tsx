import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode;
};

/**
 * 視覺上重畫方框，但底層仍是原生 `<input type="checkbox">`（用 `sr-only` 隱藏，
 * 不是 `display:none`）——保留原生的鍵盤操作（Space 切換）、表單語意
 * （`FormData` 抓得到）與螢幕閱讀器行為，只是外觀換掉。受控／非受控都行，
 * `checked` / `defaultChecked` 直接透傳給原生 input。
 */
export function Checkbox({ label, className, id, disabled, ...rest }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cx('inline-flex items-center gap-2 text-sm text-[var(--fg-1)]', disabled && 'opacity-60', className)}
    >
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input type="checkbox" id={id} disabled={disabled} className="peer sr-only" {...rest} />
        <span
          className={cx(
            'pointer-events-none h-4 w-4 rounded-[4px] border border-[var(--border-2)] bg-[var(--surface-card)]',
            'transition-colors peer-checked:border-[var(--brand)] peer-checked:bg-[var(--brand)]',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
            'peer-focus-visible:outline-[var(--focus-ring)]',
          )}
        />
        <Icon
          name="check"
          size={11}
          className="pointer-events-none absolute text-[var(--fg-on-brand)] opacity-0 peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  );
}
