import type { CSSProperties } from 'react';
import { cx } from '@/ui';

/**
 * 品牌識別標記：側欄與登入頁共用同一顆「V」badge，差在尺寸與要不要帶文字組。
 *
 * <p>
 * 專案沒有正式 Logo 檔（`reference/` 的 CIS 手冊只給色號與字體規則，商標線稿
 * 不在後台的授權範圍內，見 agent memory「vicround-design-system」），所以這裡
 * **不冒充官方 Logo**，做法比照 `Shell.tsx` 既有的使用者頭像（單字圓形色塊）—— 一顆
 * 用品牌紫底、放大寫字首的識別色塊，差別只在角形用 `chamfer`（ds/tokens/radii.css
 * 定義、目前只有按鈕在用的「切角」）取代圓形，呼應 CIS 手冊裡「V」是尖角幾何圖形
 * 衍生出來的品牌語彙。等客戶提供正式 Logo 檔案時，直接替換這個元件的內容即可，
 * 呼叫端（Shell／Login）不用改。
 * </p>
 * <p>
 * `chamfer` 只用在這一個元件——不是拿去套所有按鈕／卡片。密集表格裡的按鈕要的是
 * 「一眼認得出是按鈕」的乾淨矩形，不是每顆都在展示品牌幾何，那會讓真正的品牌識別
 * 淹沒在雜訊裡。見 docs/admin-ui.md「品牌識別標記」一節。
 * </p>
 */
export function BrandMark({
  size = 'md',
  wordmark = false,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  /** 帶上「VicRound／CMS」文字組——側欄收合時關掉，只留識別色塊。 */
  wordmark?: boolean;
  className?: string;
}) {
  const dim = size === 'lg' ? 44 : size === 'sm' ? 26 : 32;
  const glyphText = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm';
  const nameText = size === 'lg' ? 'text-lg' : 'text-sm';

  return (
    <span className={cx('inline-flex min-w-0 items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cx(
          'chamfer flex shrink-0 items-center justify-center bg-[var(--brand)] font-semibold text-[var(--fg-on-brand)]',
          glyphText,
        )}
        style={
          {
            '--cut': 'var(--chamfer-sm)',
            width: dim,
            height: dim,
            fontFamily: 'var(--font-display)',
          } as CSSProperties
        }
      >
        V
      </span>
      {wordmark && (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={cx('truncate font-semibold text-[var(--fg-1)]', nameText)}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            VicRound
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-[var(--fg-3)]">
            CMS
          </span>
        </span>
      )}
    </span>
  );
}
