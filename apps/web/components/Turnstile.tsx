'use client';

import { useEffect, useRef } from 'react';
import { TURNSTILE_SITE_KEY } from '@/lib/features';

/** Turnstile 塞進表單的隱藏欄位名稱。 */
export const TURNSTILE_FIELD = 'cf-turnstile-response';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Cloudflare Turnstile 驗證元件（詢問表單的第三道防線，見 docs/cms-api.md）。
 *
 * <p>
 * 放在 `<form>` 裡面：Turnstile 會在容器內塞一個 `cf-turnstile-response` 隱藏欄位，
 * 表單用 `FormData` 取得 token 送給後端（`antiBotToken`）。
 * 沒設 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 就不渲染 —— 後端在沒設 secret 時也會略過驗證，
 * 兩邊都沒設時表單照樣能送（本機與未配置的環境）。
 * </p>
 *
 * <p>
 * 用 explicit render 而不是 `.cf-turnstile` 的自動掃描：聯絡 dialog 是開啟時才掛載的，
 * 自動掃描只在 script 載入當下跑一次，之後才出現的容器不會被渲染。
 * token 只能用一次，送出失敗後要換一個 —— 父層遞增 `resetKey` 即重新產生。
 * </p>
 */
export function Turnstile({ locale, resetKey = 0 }: { locale: string; resetKey?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return;
        widgetId.current = turnstile.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          language: locale === 'zh-Hant' ? 'zh-tw' : 'en',
        });
      })
      // script 載不到（被擋、離線）就不顯示 —— 後端會回 bot-check 失敗，表單顯示送出失敗
      .catch(() => {});

    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [locale]);

  useEffect(() => {
    if (resetKey && widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;

  return <div ref={container} style={{ marginTop: 18, minHeight: 65 }} />;
}
