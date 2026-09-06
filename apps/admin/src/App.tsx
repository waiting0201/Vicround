import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import { Shell } from '@/components/Shell';
import { Login } from '@/routes/Login';
import { Placeholder } from '@/routes/Placeholder';
import { auth, refresh } from '@/lib/api';
import { ALL_ITEMS, HOME_PATH } from '@/lib/menu';

/**
 * 後台路由。`basename` 是 `/admin` —— 後台掛在公開站底下，
 * 深層網址由 web 的 middleware rewrite 回 `index.html`（見 apps/web/middleware.ts）。
 *
 * <p>
 * 畫面清單由 `lib/menu.ts` 產生，所以側欄與路由不可能對不起來。
 * 實作某一個畫面時，在下面加一條寫死的 `<Route>` 蓋過自動產生的那一條。
 * </p>
 */
export function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route element={<Shell />}>
            {ALL_ITEMS.map((item) => (
              <Route key={item.path} path={`/${item.path}`} element={<Placeholder item={item} />} />
            ))}
            {ALL_ITEMS.filter((item) => item.hasDetail).map((item) => (
              <Route
                key={`${item.path}-detail`}
                path={`/${item.path}/:id`}
                element={<Placeholder item={item} detail />}
              />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={`/${HOME_PATH}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * access token 只在記憶體裡，重新整理後是空的 —— 先用 httpOnly 的 refresh cookie
 * 換一顆回來再決定要不要導去登入頁，否則每次 F5 都會被踢出去。
 */
function RequireAuth() {
  const [state, setState] = useState<'checking' | 'in' | 'out'>(auth.access ? 'in' : 'checking');

  useEffect(() => {
    if (state !== 'checking') return;
    let cancelled = false;
    refresh().then((ok) => {
      if (!cancelled) setState(ok ? 'in' : 'out');
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  if (state === 'checking') return <div className="p-6 text-sm">載入中…</div>;
  return state === 'in' ? <Outlet /> : <Navigate to="/login" replace />;
}
