import type { TextareaHTMLAttributes } from 'react';
import { controlClass } from './cx';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

/**
 * ⚠️ **暫代富文字編輯器。** `Description` / `Body` 這類 HTML 欄位（Articles、
 * ContentBlocks…）目前先用純 `<textarea>` 直接編輯 HTML 原始碼，TipTap 之後再接
 * （見 docs/cms.md「Rich text」）。用在這些欄位時請把 `hint` 設成類似
 * 「直接輸入 HTML，暫無所見即所得編輯器」，不要讓編輯者以為這裡會被排版。
 */
export function Textarea({ error, className, rows = 4, ...rest }: TextareaProps) {
  return <textarea rows={rows} className={controlClass(error, className)} {...rest} />;
}
