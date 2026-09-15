import { useCallback, useEffect, useId, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Badge, Drawer, Icon, IconButton, cx } from '@/ui';
import { logout } from '@/lib/api';
import { MOCK_ENABLED } from '@/lib/mock';
import { useCurrentUser } from '@/lib/queries';
import { MENU, type MenuItem, type MenuSection } from '@/lib/menu';
import { BrandMark } from './BrandMark';

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
 * 因為把視窗拉窄一點就被收回去，是很惱人的行為。側欄分區的收合（accordion）同理。
 * </p>
 */

const COLLAPSE_KEY = 'vicround-admin-sidebar-collapsed';
/** 尾巴的 `-v2` 是因為預設值改過（改成只開第一個分區）。沿用舊鍵的話，已經
    在用的人存的是「一個都沒收」，新的預設對他們永遠不會生效。 */
const SECTIONS_KEY = 'vicround-admin-sidebar-sections-v2';

/** 第一次進後台的樣子：只開第一個分區（「內容」，也是 `HOME_PATH` 的所在地）。 */
function defaultClosedSections(): Set<string> {
  return new Set(MENU.slice(1).map((section) => section.title));
}

/**
 * 記的是「哪幾個分區被**收起來**」，不是「哪幾個是展開的」。
 *
 * <p>
 * 兩者不對稱：之後在 `menu.ts` 加一個新分區時，記展開清單會讓那個分區對所有舊使用者
 * 都是收起來的（清單裡沒有它）——新功能上線第一天沒有人看得到入口。記收合清單則
 * 之後新增的分區一律是展開的，使用者要收才收。
 * </p>
 *
 * <p>
 * 只有**還沒存過**才套預設值（見 `defaultClosedSections`）。存過就照使用者自己的
 * 安排——「我上次把它打開了，回來又被關上」比預設值不合口味惱人得多。
 * </p>
 */
function readClosedSections(): Set<string> {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    if (raw === null) return defaultClosedSections();
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    // 手動改壞、或無痕模式擋下 localStorage —— 側欄不該因此整個開不起來
    return defaultClosedSections();
  }
}

export function Shell() {
  const navigate = useNavigate();
  const me = useCurrentUser();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [closedSections, setClosedSections] = useState(readClosedSections);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(SECTIONS_KEY, JSON.stringify([...closedSections]));
    } catch {
      // 無痕模式／封鎖 storage：記不住就算了，這一輪照樣能開合
    }
  }, [closedSections]);

  const toggleSection = useCallback((title: string) => {
    setClosedSections((current) => {
      const next = new Set(current);
      if (!next.delete(title)) next.add(title);
      return next;
    });
  }, []);

  /**
   * 只展開、不收合。給「跳進一個已經被收起來的分區」用（麵包屑、直接打網址、
   * 頁面內的連結）——目前所在的頁面連在側欄上都找不到，是最容易迷路的狀態。
   * 刻意與 `toggleSection` 分開：共用一支的話，使用者手動收合正在看的那個分區時
   * 會被立刻彈開。
   */
  const revealSection = useCallback((title: string) => {
    setClosedSections((current) => {
      if (!current.has(title)) return current;
      const next = new Set(current);
      next.delete(title);
      return next;
    });
  }, []);

  const isAdmin = me.data?.roles?.includes('Admin') ?? false;

  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  const navProps = {
    isAdmin,
    closedSections,
    onToggleSection: toggleSection,
    onRevealSection: revealSection,
  };

  const nav = <Nav collapsed={collapsed} {...navProps} onNavigate={() => setMobileOpen(false)} />;

  return (
    <div className="flex min-h-screen">
      <aside
        style={{ width: collapsed ? 'var(--admin-sidebar-w-collapsed)' : 'var(--admin-sidebar-w)' }}
        className="admin-transition-slow hidden shrink-0 flex-col overflow-hidden border-r border-[var(--border-1)] bg-[var(--surface-card)] transition-[width] md:flex"
      >
        <div
          style={{ height: 'var(--admin-topbar-h)' }}
          className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border-1)] px-3"
        >
          <Link to="/" className={cx('flex min-w-0 items-center', collapsed ? 'mx-auto' : 'px-0.5')}>
            <BrandMark size="sm" wordmark={!collapsed} />
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
        <div className={cx('flex shrink-0 border-t border-[var(--border-1)] p-2', collapsed ? 'justify-center' : 'justify-start')}>
          <IconButton
            icon="panel-left"
            label={collapsed ? '展開側欄' : '收合側欄'}
            size="sm"
            onClick={() => setCollapsed((value) => !value)}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          style={{ height: 'var(--admin-topbar-h)' }}
          className="flex shrink-0 items-center gap-3 border-b border-[var(--border-1)] bg-[var(--surface-card)] px-4 md:px-6"
        >
          <IconButton icon="menu" label="開啟選單" className="md:hidden" onClick={() => setMobileOpen(true)} />

          {/* 測試環境要一眼看得出來 —— 不然有人會在這裡按「發布」以為是正式站 */}
          {MOCK_ENABLED && <Badge tone="warning">測試環境（模擬資料）</Badge>}

          <div className="ml-auto flex items-center gap-2">
            <a
              href="/en"
              target="_blank"
              rel="noreferrer"
              className="admin-transition flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm text-[var(--fg-2)] transition-colors hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]"
            >
              <Icon name="external-link" size={14} />
              檢視公開站
            </a>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                className="admin-transition flex items-center gap-2 rounded-[var(--radius-sm)] py-1.5 pl-1.5 pr-2 text-sm text-[var(--fg-1)] transition-colors hover:bg-[var(--surface-card-alt)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-medium text-[var(--brand-strong)]">
                  {(me.data?.displayName ?? '？').slice(0, 1)}
                </span>
                <span className="hidden sm:inline">{me.data?.displayName ?? '載入中…'}</span>
                <Icon
                  name="chevron-down"
                  size={13}
                  className={cx('admin-transition text-[var(--fg-3)] transition-transform', menuOpen && 'rotate-180')}
                />
              </button>

              {menuOpen && (
                <div className="admin-pop-in absolute right-0 top-11 z-40 w-56 origin-top-right rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--surface-card)] p-1 shadow-[var(--shadow-md)]">
                  <div className="border-b border-[var(--border-1)] px-3 py-2">
                    <p className="truncate text-sm text-[var(--fg-1)]">{me.data?.username ?? '—'}</p>
                    <p className="mt-0.5 text-xs text-[var(--fg-3)]">{me.data?.roles?.join('、') ?? ''}</p>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="admin-transition flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--fg-1)] transition-colors hover:bg-[var(--surface-card-alt)]"
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
        <Nav collapsed={false} {...navProps} onNavigate={() => setMobileOpen(false)} />
      </Drawer>
    </div>
  );
}

type NavProps = {
  collapsed: boolean;
  isAdmin: boolean;
  closedSections: Set<string>;
  onToggleSection: (title: string) => void;
  onRevealSection: (title: string) => void;
  onNavigate: () => void;
};

/**
 * 側欄導覽。**分區可收合（accordion）**：六個分區裡，多數編輯者一天只用其中兩三個，
 * 收起用不到的那幾個，常用的入口就不必每次都在 25 項裡面找。
 *
 * <p>
 * 分區各自獨立開合，不是「一次只能開一個」——編輯者常在「內容」與「營運」之間來回，
 * 開了一個就自動關掉另一個，等於每切一次頁就要多按一次。
 * </p>
 */
function Nav({ collapsed, isAdmin, closedSections, onToggleSection, onRevealSection, onNavigate }: NavProps) {
  const { pathname } = useLocation();

  /** 目前這一頁屬於哪個分區。`/products/3` 這種詳情頁也算在 `products` 的分區裡。 */
  const activeTitle = MENU.find((section) =>
    section.items.some((item) => pathname === `/${item.type}` || pathname.startsWith(`/${item.type}/`)),
  )?.title;

  // 從別處跳進一個收起來的分區時自動展開。只在「所在分區換了」時跑，所以使用者
  // 仍然收得起自己正在看的那一個（那不會改變 activeTitle，effect 不會再跑）。
  useEffect(() => {
    if (activeTitle) onRevealSection(activeTitle);
  }, [activeTitle, onRevealSection]);

  return (
    // pt-5 與分區之間的 gap-5 同值（20px）：第一個分區的上緣看起來就跟其他分區
    // 一樣是「一段的開頭」，而不是貼著頂欄分隔線、像那條線的標籤。
    // pb-8 則是讓最後一項捲到底時不會黏在收合鈕上。
    <nav className="flex flex-col gap-5 px-2 pb-8 pt-5">
      {MENU.map((section) => {
        // Editor 看不到 Admin 專屬的項目 —— 不存在的選單比看得到按不動更少困惑
        const items = section.items.filter((item: MenuItem) => isAdmin || !item.adminOnly);
        if (items.length === 0) return null;

        return (
          <NavSection
            key={section.title}
            section={section}
            items={items}
            collapsed={collapsed}
            // 收合成 64px 時沒有分區標題，也就沒有東西可以按 —— 那個狀態下一律全開，
            // 否則會有一半的圖示無故消失，而畫面上找不到把它們叫回來的地方。
            open={collapsed || !closedSections.has(section.title)}
            hasActive={activeTitle === section.title}
            onToggle={() => onToggleSection(section.title)}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

function NavSection({
  section,
  items,
  collapsed,
  open,
  hasActive,
  onToggle,
  onNavigate,
}: {
  section: MenuSection;
  items: MenuItem[];
  collapsed: boolean;
  open: boolean;
  hasActive: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const panelId = useId();

  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="admin-transition flex w-full items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium uppercase tracking-wider text-[var(--fg-3)] transition-colors hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]"
        >
          <span className="truncate">{section.title}</span>
          {/* 收起來的分區裡就是目前這一頁時，標題旁點一顆品牌色小點——「我在哪」
              這個訊號不能因為分區收起來就整個消失 */}
          {!open && hasActive && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]"
              role="img"
              aria-label="目前所在的頁面在這個分區裡"
            />
          )}
          <Icon
            name="chevron-down"
            size={13}
            className={cx('admin-transition ml-auto shrink-0 transition-transform', !open && '-rotate-90')}
          />
        </button>
      )}

      <div id={panelId} className="admin-accordion" data-open={open}>
        {/* 收起來時整段要退出 tab 順序：只是高度 0 的話，鍵盤使用者仍然會 tab 進
            看不見的連結，然後畫面捲到一個什麼都沒有的地方 */}
        <div inert={!open}>
          <div className="flex flex-col gap-0.5">
            {items.map((item) => (
              <NavLink
                key={item.type}
                to={`/${item.type}`}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cx(
                    'admin-transition flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm transition-colors',
                    // focus ring 畫在框線內側：分區收合用的 overflow: hidden 會把畫在
                    // 外側的那一圈裁掉（見 index.css 的 .admin-accordion）
                    'focus-visible:[outline-offset:-2px]',
                    collapsed && 'justify-center',
                    isActive
                      ? // 底色 + 左側 2px 品牌色貼邊：收合成純圖示時底色範圍很小，
                        // 多一道貼著側欄邊緣的色條，掃過去更快認出「現在在哪一頁」。
                        'bg-[var(--brand-soft)] font-medium text-[var(--brand-strong)] shadow-[inset_2px_0_0_var(--brand)]'
                      : 'text-[var(--fg-2)] hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]',
                  )
                }
              >
                <Icon name={item.icon} size={15} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
