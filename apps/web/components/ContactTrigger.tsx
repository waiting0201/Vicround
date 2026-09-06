'use client';

import type { ReactNode } from 'react';

/**
 * 開啟頁首的聯絡表單。
 *
 * <p>
 * 與 mockup 相同：按鈕不自己持有表單，而是丟一個 `vicround:contact` 事件，
 * 由 Header 裡的 dialog 接手（PageCTA.dc.html 的 `openContact`）。
 * 好處是 dialog 只有一份，任何區塊都能叫它。
 * </p>
 */
export function ContactTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent('vicround:contact'))}
    >
      {children}
    </button>
  );
}
