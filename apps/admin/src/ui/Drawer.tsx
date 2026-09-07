import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** 通常放 取消／儲存（／發布）——見 docs/admin-ui.md「編輯頁樣式」的按鈕位置規則。 */
  footer?: ReactNode;
  width?: string;
};

/**
 * 右側滑出面板，給「清單＋編輯抽屜」型畫面用（milestones／locations／
 * partner-brands…，見 docs/admin-ui.md 畫面型別表）。
 *
 * <p>
 * 用 `createPortal` 掛到 `document.body`，避免抽屜被某個 `overflow:hidden` 的
 * 表格容器裁切。開啟時鎖住 `body` 捲動、Esc 關閉、Tab 在面板內循環（focus trap），
 * 關閉時把焦點還給觸發它的元素——這四件事任何一個抽屜都不該重寫一次，所以收在
 * 這裡而不是留給每個實作畫面各自處理。
 * </p>
 */
export function Drawer({ open, onClose, title, description, children, footer, width = '480px' }: DrawerProps) {
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="關閉面板" onClick={onClose} className="absolute inset-0 bg-[var(--surface-overlay)]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ width }}
        className="relative flex h-full max-w-[calc(100vw-2rem)] flex-col bg-[var(--surface-card)] shadow-[var(--shadow-lg)] outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-1)] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-[var(--fg-1)]">
              {title}
            </h2>
            {description && <p className="mt-1 text-xs text-[var(--fg-2)]">{description}</p>}
          </div>
          <IconButton icon="x" label="關閉" onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-[var(--border-1)] px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
