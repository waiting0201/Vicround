import { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router';
import { ToastProvider } from '@/ui';
import { AuthSplash } from '@/components/AuthSplash';
import { Shell } from '@/components/Shell';
import { Login } from '@/routes/Login';
import { auth, refresh } from '@/lib/api';
import { HOME_PATH } from '@/lib/menu';
import { RESOURCES, type ResourceDef } from '@/lib/resources';
import { CollectionScreen } from '@/screens/CollectionScreen';
import { EditorScreen } from '@/screens/EditorScreen';
import { EntityEditor } from '@/screens/EntityEditor';
import { InquiriesScreen } from '@/screens/InquiriesScreen';
import { InquiryDetail } from '@/screens/InquiryDetail';
import { MemberDetail } from '@/screens/MemberDetail';
import { MembersScreen } from '@/screens/MembersScreen';
import { NavigationScreen } from '@/screens/NavigationScreen';
import { OrderedScreen } from '@/screens/OrderedScreen';
import { RedirectsScreen } from '@/screens/RedirectsScreen';
import { SampleRequestDetail } from '@/screens/SampleRequestDetail';
import { SampleRequestsScreen } from '@/screens/SampleRequestsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

/**
 * 後台路由。`basename` 是 `/admin` —— 後台掛在公開站底下，
 * 深層網址由 web 的 middleware rewrite 回 `index.html`（見 apps/web/middleware.ts）。
 *
 * <p>
 * 用 `createBrowserRouter`（data router）而不是宣告式的 `<BrowserRouter>`：
 * react-router v7 的 `useBlocker` 只在 data router 下可用，而「編輯到一半按了側欄
 * 就把改的東西丟掉」是後台最貴的一種錯誤（見 docs/admin-ui.md §5.9）。
 * </p>
 *
 * <p>
 * 畫面清單由 `lib/resources.ts` 產生，所以側欄、路由與資料字典不可能對不起來。
 * 每個實體的畫面型別（清單抽屜／獨立編輯頁／看板…）也寫在那一份，這裡只負責把
 * 型別對應到元件。
 * </p>
 */

/** 畫面型別 → 清單元件。型別的定義與各畫面的歸屬見 docs/admin-ui.md §3。 */
function listElement(resource: ResourceDef) {
  switch (resource.screen) {
    case 'editor':
      return <EditorScreen resource={resource} />;
    case 'ordered':
      return resource.type === 'navigation' ? (
        <NavigationScreen resource={resource} />
      ) : (
        <OrderedScreen resource={resource} />
      );
    case 'queue':
      return <MembersScreen resource={resource} />;
    case 'board':
      return <SampleRequestsScreen resource={resource} />;
    case 'inbox':
      return <InquiriesScreen resource={resource} />;
    case 'settings':
      return <SettingsScreen resource={resource} />;
    case 'collection':
    default:
      return resource.type === 'redirects' ? (
        <RedirectsScreen resource={resource} />
      ) : (
        <CollectionScreen resource={resource} />
      );
  }
}

/** 有獨立詳情頁的型別才配 `/{type}/:id` 路由；抽屜型的編輯不換網址。 */
function detailElement(resource: ResourceDef) {
  switch (resource.screen) {
    case 'editor':
      return <EntityEditor resource={resource} />;
    case 'queue':
      return <MemberDetail resource={resource} />;
    case 'board':
      return <SampleRequestDetail resource={resource} />;
    case 'inbox':
      return <InquiryDetail resource={resource} />;
    default:
      return null;
  }
}

const router = createBrowserRouter(
  [
    { path: '/login', element: <Login /> },
    {
      element: <RequireAuth />,
      children: [
        {
          element: <Shell />,
          children: [
            { index: true, element: <Navigate to={`/${HOME_PATH}`} replace /> },
            ...RESOURCES.flatMap((resource) => {
              const detail = detailElement(resource);
              return [
                { path: `/${resource.type}`, element: listElement(resource) },
                ...(detail ? [{ path: `/${resource.type}/:id`, element: detail }] : []),
              ];
            }),
          ],
        },
      ],
    },
    { path: '*', element: <Navigate to={`/${HOME_PATH}`} replace /> },
  ],
  { basename: '/admin' },
);

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
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

  if (state === 'checking') {
    return <AuthSplash />;
  }
  return state === 'in' ? <Outlet /> : <Navigate to="/login" replace />;
}
