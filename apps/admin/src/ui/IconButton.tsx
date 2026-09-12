import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

/**
 * 純圖示按鈕（表格列的編輯／刪除、抽屜的關閉鈕…）。`label` 是必填而非可選——
 * 圖示按鈕沒有文字內容，螢幕閱讀器只能靠 `aria-label`，這裡強制型別擋掉
 * 「忘記寫 label」這件事，而不是靠 code review 抓。
 */
export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> & {
  icon: IconName;
  label: string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'secondary';
};

export function IconButton({ icon, label, size = 'md', variant = 'ghost', className, ...rest }: IconButtonProps) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'admin-transition inline-flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--fg-2)] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        dim,
        variant === 'ghost'
          ? 'hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]'
          : 'border border-[var(--border-1)] bg-[var(--surface-card)] hover:bg-[var(--surface-card-alt)]',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 14 : 16} />
    </button>
  );
}
