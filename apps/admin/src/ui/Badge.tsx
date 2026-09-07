import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * Badge 只負責「六種語意色調」，不負責知道『Draft 對應哪個顏色』——那張對照表
 * 因實體而異（ContentStatus / MemberStatus / SampleRequestStatus 各有一組值），
 * 寫死在元件裡會讓 Badge 認得所有 enum，也綁死翻譯字串。對照表放在
 * docs/admin-ui.md「色彩與狀態語意對照表」，由呼叫端決定某個狀態該用哪個 tone
 * 與哪個中文字——Badge 本身保持笨。
 */
export type BadgeTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--surface-card-alt)] text-[var(--fg-2)]',
  brand: 'bg-[var(--brand-soft)] text-[var(--brand-strong)]',
  info: 'bg-[var(--info-50)] text-[var(--info-500)]',
  success: 'bg-[var(--success-50)] text-[var(--success-500)]',
  warning: 'bg-[var(--warning-50)] text-[var(--warning-500)]',
  danger: 'bg-[var(--danger-50)] text-[var(--danger-500)]',
};

export type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
  /** 前綴實心圓點，用於「狀態」語意（草稿／發布…）；純分類標籤（產品線 chip）不用。 */
  dot?: boolean;
  className?: string;
};

export function Badge({ tone = 'neutral', children, dot, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
