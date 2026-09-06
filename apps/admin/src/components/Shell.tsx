import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { logout } from '@/lib/api';
import { MENU } from '@/lib/menu';

/**
 * 後台外框：側欄 + 內容區。
 *
 * <p>
 * 側欄由 `lib/menu.ts` 產生 —— 那份清單同時餵路由，所以側欄上的每一項
 * 都保證有對應的畫面（哪怕現在還是 placeholder）。斷掉的選單項比「還沒做」更難理解。
 * </p>
 */
export function Shell() {
  const navigate = useNavigate();

  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-[var(--border-1)] bg-[var(--surface-card)]">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="font-semibold">
            VicRound CMS
          </Link>
        </div>

        <nav className="flex flex-col gap-6 px-2 pb-8 text-sm">
          {MENU.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              <p className="px-2 text-xs uppercase tracking-wider text-[var(--fg-3)]">
                {section.title}
              </p>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={`/${item.path}`}
                  className={({ isActive }) =>
                    `rounded px-2 py-1.5 ${isActive ? 'bg-[var(--brand-soft)] font-medium' : 'hover:bg-[var(--surface-card-alt)]'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-[var(--border-1)] px-6 py-3 text-sm">
          <a href="/en" target="_blank" rel="noreferrer">
            檢視公開站
          </a>
          <button type="button" onClick={signOut}>
            登出
          </button>
        </header>
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
