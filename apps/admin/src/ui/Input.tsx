import type { InputHTMLAttributes } from 'react';
import { controlClass } from './cx';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** 錯誤態只切邊框顏色，文字訊息交給外層 `<Field error>` 顯示——避免同一個錯誤講兩次。 */
  error?: boolean;
};

/** 樸素的原生 `<input>` 包裝。受控／非受控皆可——這裡不管理 value，全部透傳。 */
export function Input({ error, className, ...rest }: InputProps) {
  return <input className={controlClass(error, className)} {...rest} />;
}
