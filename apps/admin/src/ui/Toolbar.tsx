import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * 清單頁工具列：搜尋、篩選、批次動作、新增鈕的容器。刻意只做「排排站 + 自動換行」，
 * 不做「左邊搜尋、右邊按鈕」這種固定雙欄假設——有些畫面（篩選很多的清單）左側就會
 * 佔滿一整行。要把某個項目推到最右邊，用旁邊的 `<ToolbarSpacer />`。
 */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-wrap items-center gap-3 pb-4', className)}>{children}</div>;
}

/** 把它後面的項目推到 Toolbar 最右邊，例如：搜尋／篩選在左，`新增` 按鈕在右。 */
export function ToolbarSpacer() {
  return <div className="ml-auto" />;
}
