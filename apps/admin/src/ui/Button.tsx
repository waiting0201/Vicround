import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { Spinner } from './Loading';

/**
 * 四種語意，不做第五種——後台按鈕只有四種角色：
 * 主要動作（`primary`，一個畫面通常只有一顆）、次要／取消（`secondary`）、
 * 低調的行內動作（`ghost`，例如表格列裡的小按鈕）、破壞性動作（`danger`，刪除／拒絕）。
 * 再細分只會讓實作 27 個畫面的人每次要多想一步「這顆算哪一種」。
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--brand)] text-[var(--fg-on-brand)] hover:bg-[var(--brand-strong)]',
  secondary:
    'border border-[var(--border-1)] bg-[var(--surface-card)] text-[var(--fg-1)] hover:bg-[var(--surface-card-alt)]',
  ghost: 'text-[var(--fg-2)] hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]',
  danger: 'bg-[var(--danger-500)] text-white hover:opacity-90',
};

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  /** 送出中——鎖住按鈕並換成 spinner，文字保留（不要讓按鈕寬度跳動）。 */
  loading?: boolean;
  /** 按鈕前綴圖示；loading 為 true 時會被 spinner 取代。 */
  icon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'admin-transition inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
        VARIANT_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === 'sm' ? 13 : 15} /> : icon}
      {children}
    </button>
  );
}
