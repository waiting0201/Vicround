import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { MEMBERS_ENABLED } from '@/lib/features';

/**
 * 會員登入／註冊／信件流程的入口守門。
 *
 * <p>
 * 這一層只做一件事：會員功能關閉時，讓整棵 `/member/**` 子樹 404。放在 layout
 * 而不是逐頁 `notFound()`，是因為子樹有五頁（登入註冊、verify、forgot、reset），
 * 逐頁寫遲早會漏掉新增的那一頁。
 * </p>
 */
export default function MemberLayout({ children }: { children: ReactNode }) {
  if (!MEMBERS_ENABLED) notFound();
  return <>{children}</>;
}
