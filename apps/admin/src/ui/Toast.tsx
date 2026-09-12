import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';
import { Icon, type IconName } from './Icon';

export type ToastVariant = 'default' | 'success' | 'danger';
export type ToastInput = { title: string; description?: string; variant?: ToastVariant; duration?: number };
type ToastRecord = ToastInput & { id: number };

type ToastContextValue = { toast: (input: ToastInput) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, IconName> = { default: 'info', success: 'check', danger: 'alert-triangle' };
const VARIANT_ICON_CLASS: Record<ToastVariant, string> = {
  default: 'text-[var(--fg-2)]',
  success: 'text-[var(--success-500)]',
  danger: 'text-[var(--danger-500)]',
};

let idSeq = 0;

/**
 * 掛在 `<Shell>` 外層一次即可（例如 `App.tsx` 的最外層），`useToast()` 在任何子元件
 * 裡呼叫。**只做「一次性通知」**——儲存成功、發布完成、刪除完成這類「講完就消失」
 * 的訊息；**不要**拿 Toast 承載需要使用者立即決定的事（那是 `ConfirmDialog` 的工作）
 * 或需要一直看得到的錯誤（那應該是頁面內的 `ErrorState`）。
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++idSeq;
      setToasts((list) => [...list, { ...input, id }]);
      const timer = setTimeout(() => dismiss(id), input.duration ?? 5000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
          aria-live="polite"
        >
          {toasts.map((item) => (
            <div
              key={item.id}
              role="status"
              className={cx(
                'admin-toast-in pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border-1)]',
                'bg-[var(--surface-card)] p-3.5 shadow-[var(--shadow-md)]',
              )}
            >
              <Icon
                name={VARIANT_ICON[item.variant ?? 'default']}
                size={16}
                className={cx('mt-0.5 shrink-0', VARIANT_ICON_CLASS[item.variant ?? 'default'])}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--fg-1)]">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs text-[var(--fg-2)]">{item.description}</p>}
              </div>
              <button
                type="button"
                aria-label="關閉通知"
                onClick={() => dismiss(item.id)}
                className="shrink-0 text-[var(--fg-3)] hover:text-[var(--fg-1)]"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast 必須在 <ToastProvider> 內使用');
  return ctx;
}
