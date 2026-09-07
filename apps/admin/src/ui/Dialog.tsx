import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, type ButtonVariant } from './Button';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
};

/**
 * 置中的小型 modal，給確認對話框、單一欄位的快速編輯用。焦點鎖定／Esc／還原焦點
 * 的邏輯跟 `Drawer` 是同一套規則，但 `Dialog` 是置中而非側滑——語意不同：Drawer
 * 是「切到另一個編輯情境」，Dialog 是「請先回答這個問題再繼續」，所以做成兩個
 * 元件而不是同一個元件的 variant。
 */
export function Dialog({ open, onClose, title, description, children, footer, width = '420px' }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="關閉對話框" onClick={onClose} className="absolute inset-0 bg-[var(--surface-overlay)]" />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ width }}
        className="relative flex max-h-[85vh] flex-col rounded-[var(--radius-md)] bg-[var(--surface-card)] shadow-[var(--shadow-lg)] outline-none"
      >
        <div className="px-5 pb-2 pt-5">
          <h2 id={titleId} className="text-base font-semibold text-[var(--fg-1)]">
            {title}
          </h2>
          {description && <p className="mt-1.5 text-sm text-[var(--fg-2)]">{description}</p>}
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">{children}</div>}
        {footer && <div className="flex items-center justify-end gap-2 px-5 pb-5 pt-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` 用於刪除／拒絕／停權這類不可逆或影響他人的動作。 */
  tone?: 'default' | 'danger';
  /** 送出中——鎖住兩顆按鈕，confirm 鈕換 spinner。 */
  pending?: boolean;
};

/**
 * 確認對話框——建在 `Dialog` 上，把「取消／確定」兩顆按鈕的排版與 `danger` 語意
 * 固定下來，這樣 27 個畫面裡「刪除」「發布」「拒絕」「停權」的確認框長得完全一樣，
 * 使用者不用每次重新判斷這顆紅色按鈕會不會清掉資料。文案規範見 docs/admin-ui.md
 * 「文案語氣規範」——避免空泛的「確定要執行此操作嗎？」。
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = '確定',
  cancelLabel = '取消',
  tone = 'default',
  pending,
}: ConfirmDialogProps) {
  const confirmVariant: ButtonVariant = tone === 'danger' ? 'danger' : 'primary';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
