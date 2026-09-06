import type { ReactNode } from 'react';
import './globals.css';

/**
 * 根 layout 只是一個透傳。
 *
 * <p>
 * `<html lang>` 與導覽在 `app/[locale]/layout.tsx` 決定 —— 所有公開路由都帶語系前綴，
 * 這一層不會單獨被渲染（middleware 會先把沒帶前綴的請求導走）。
 * 後台不在這棵樹裡（它是 `public/admin/` 的 SPA），所以這裡不需要為它留任何分支。
 * </p>
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
