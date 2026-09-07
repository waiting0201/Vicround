import { useEffect, useState } from 'react';
import { cx, controlClass } from './cx';
import { Icon } from './Icon';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** debounce 毫秒數——每個按鍵都打 API 會在編輯者打字時洗掉列表、也浪費請求。 */
  delay?: number;
  className?: string;
};

/**
 * 受控的搜尋框，但把「打字」與「觸發查詢」分成兩個時序：畫面上即時反映按鍵，
 * 呼叫端的 `onChange`（通常接去打 API）延遲 `delay` ms 才觸發，且只在值真的
 * 改變時觸發一次。
 */
export function SearchInput({ value, onChange, placeholder = '搜尋…', delay = 300, className }: SearchInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, delay);
    return () => clearTimeout(timer);
    // eslint: value 只用來比較是否已同步，故意不放進 deps，避免外部值一更新就重置計時器
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, delay]);

  return (
    <div className={cx('relative', className)}>
      <Icon
        name="search"
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-3)]"
      />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={controlClass(false, 'pl-8')}
      />
    </div>
  );
}
