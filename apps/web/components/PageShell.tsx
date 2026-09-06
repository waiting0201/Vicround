import type { ReactNode } from 'react';

/**
 * 頁面色調外殼。
 *
 * <p>
 * mockup 每一頁最外層都寫死一組底色／文字色：22 頁是淺色（#ffffff / #14141f），
 * 首頁、About Us、會員專區這三頁是深色（#0a0a12 / #ffffff）。
 * 這一層把那組值變成 `--page-*` 變數（見 globals.css），底下所有版型元件都讀它。
 * </p>
 *
 * <p>
 * ⚠️ Header 與 Footer **永遠是深色**，不受這裡影響 —— 確認稿裡淺色頁的頁首頁尾
 * 也是深色的，那是刻意的對比。
 * </p>
 */
export function PageShell({
  tone = 'light',
  children,
}: {
  tone?: 'light' | 'dark';
  children: ReactNode;
}) {
  return (
    <div className="vr-page" data-tone={tone}>
      {children}
    </div>
  );
}
