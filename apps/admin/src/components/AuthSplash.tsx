import { useEffect, useState } from 'react';
import { Spinner } from '@/ui';
import { BrandMark } from './BrandMark';

/**
 * 重新整理後換 token 的那一瞬間（`App.tsx` 的 `RequireAuth`）。
 *
 * <p>
 * 底色與登入頁同一張（`admin-auth-backdrop`）：這一刻使用者正要落到登入頁或後台，
 * 換誰都是「進入」的畫面，不該先閃一片白底再跳到有設計的那一張。
 * </p>
 * <p>
 * 品牌標記與轉圈延遲 250ms 才出現：refresh 通常幾十毫秒就回來，立刻畫一個 logo
 * 只會變成一次閃爍——比讓人多等 250ms 更難受的是「畫面閃了一下，但來不及看清楚
 * 那是什麼」。撐過 250ms 才是真的在等，這時才需要告訴他系統沒當掉。
 * </p>
 */
export function AuthSplash() {
  const [showMark, setShowMark] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowMark(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="admin-auth-backdrop flex min-h-screen items-center justify-center p-6">
      {showMark && (
        <div className="admin-pop-in flex flex-col items-center gap-4" role="status" aria-live="polite">
          <BrandMark size="lg" />
          <span className="flex items-center gap-2 text-sm text-[var(--fg-2)]">
            <Spinner size={15} className="text-[var(--fg-3)]" />
            載入中…
          </span>
        </div>
      )}
    </div>
  );
}
