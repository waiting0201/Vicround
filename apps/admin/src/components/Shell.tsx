import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Badge, Drawer, Icon, IconButton, cx } from '@/ui';
import { logout } from '@/lib/api';
import { MOCK_ENABLED } from '@/lib/mock';
import { useCurrentUser } from '@/lib/queries';
import { MENU, type MenuItem } from '@/lib/menu';

/**
 * 後台外框：側欄 + 頂欄 + 內容區。
 *
 * <p>
 * 側欄由 `lib/menu.ts` 產生 —— 那份清單同時餵路由，所以側欄上的每一項都保證有對應的
 * 畫面。斷掉的選單項比「還沒做」更難理解。
 * </p>
 *
 * <p>
 * 收合狀態存在 `localStorage` 而不是跟著視窗寬度自動切換：使用者手動展開之後，
 * 因為把視窗拉窄一點就被收回去，是很惱人的行為。
 * </p>
 */

const COLLAPSE_KEY = 'vicround-admin-sidebar-collapsed';

export function Shell() {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const isAdmin = me.data?.roles?.includes('Admin') ?? false;

  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  const nav = <Nav collapsed={collapsed} isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />;

  return (
    <div className="flex min-h-screen">
      <aside
        className={cx(
          'hidden shrink-0 flex-col border-r border-[var(--border-1)] bg-[var(--surface-card)] md:flex',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-4">
          {!collapsed && (
            <Link to="/" className="truncate px-1 font-semibold text-[var(--fg-1)]">
              VicRound CMS
            </Link>
          )}
          <IconButton
            icon="panel-left"
            label={collapsed ? '展開側欄' : '收合側欄'}
            size="sm"
            onClick={() => setCollapsed((value) => !value)}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-[var(--border-1)] bg-[var(--surface-card)] px-4 py-2.5 md:px-6">
          <IconButton icon="menu" label="開啟選單" className="md:hidden" onClick={() => setMobileOpen(true)} />

          {/* 測試環境要一眼看得出來 —— 不然有人會在這裡按「發布」以為是正式站 */}
          {MOCK_ENABLED && <Badge tone="warning">測試環境（模擬資料）</Badge>}

          <div className="ml-auto flex items-center gap-2">
            <a
              href="/en"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm text-[var(--fg-2)] hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]"
            >
              <Icon name="external-link" size={14} />
              檢視公開站
            </a>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--fg-1)] hover:bg-[var(--surface-card-alt)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-medium text-[var(--brand-strong)]">
                  {(me.data?.displayName ?? '？').slice(0, 1)}
                </span>
                <span className="hidden sm:inline">{me.data?.displayName ?? '載入中…'}</span>
                <Icon name="chevron-down" size={13} className="text-[var(--fg-3)]" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 z-40 w-56 rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--surface-card)] p-1 shadow-[var(--shadow-md)]">
                  <div className="border-b border-[var(--border-1)] px-3 py-2">
                    <p className="truncate text-sm text-[var(--fg-1)]">{me.data?.email ?? '—'}</p>
                    <p className="mt-0.5 text-xs text-[var(--fg-3)]">{me.data?.roles?.join('、') ?? ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--fg-1)] hover:bg-[var(--surface-card-alt)]"
                  >
                    <Icon name="log-out" size={14} />
                    登出
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* 窄螢幕的選單直接重用抽屜元件：側滑 + Esc 關閉 + 焦點鎖定本來就是它的工作 */}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="VicRound CMS" width="280px">
        <Nav collapsed={false} isAdmin={isAdmin} onNavigate={() => setMobileOpen(false)} />
      </Drawer>
    </div>
  );
}

function Nav({
  collapsed,
  isAdmin,
  onNavigate,
}: {
  collapsed: boolean;
  isAdmin: boolean;
  onNavigate: () => void;
}) {
  return (
    <nav className="flex flex-col gap-5 px-2 pb-8">
      {MENU.map((section) => {
        // Editor 看不到 Admin 專屬的項目 —— 不存在的選單比看得到按不動更少困惑
        const items = section.items.filter((item: MenuItem) => isAdmin || !item.adminOnly);
        if (items.length === 0) return null;

        return (
          <div key={section.title} className="flex flex-col gap-0.5">
            {!collapsed && (
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-[var(--fg-3)]">
                {section.title}
              </p>
            )}
            {items.map((item) => (
              <NavLink
                key={item.type}
                to={`/${item.type}`}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm transition-colors',
                    collapsed && 'justify-center',
                    isActive
                      ? 'bg-[var(--brand-soft)] font-medium text-[var(--brand-strong)]'
                      : 'text-[var(--fg-2)] hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]',
                  )
                }
              >
                <Icon name={item.icon} size={15} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
