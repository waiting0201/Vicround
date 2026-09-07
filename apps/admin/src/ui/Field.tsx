import type { ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';

/**
 * label ＋ 說明 ＋ 錯誤的標準包裝。**不做自動 id 注入**（不用 `cloneElement`
 * 塞 id 給 children）——那種寫法遇到巢狀元件、條件渲染的 children 很容易悄悄失效，
 * 而 id 對不上時 `<label>` 只是看起來正常，鍵盤／螢幕閱讀器使用者才會發現壞掉。
 * 改成呼叫端自己決定 input 的 `id` 並透過 `htmlFor` 對應，兩邊都看得到、對不對得起來
 * 一眼可查。
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium text-[var(--fg-1)]">
        {label}
        {required && (
          <span className="text-[var(--danger-500)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-[var(--danger-500)]" role="alert">
          <Icon name="circle-alert" size={13} />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--fg-3)]">{hint}</p>
      ) : null}
    </div>
  );
}
