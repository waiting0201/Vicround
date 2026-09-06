/**
 * 後台側欄 —— 分區依 docs/cms.md「Admin 管理的功能單元」，
 * 也就是 docs/database.md 的 14 個功能單元，而不是一張大表清單。
 *
 * <p>
 * 這份清單同時是**路由的唯一真相來源**：`App.tsx` 直接由它產生 `<Route>`，
 * 所以側欄不會出現連到 404 的項目。`type` 對應 Admin API 的 `{type}` 白名單
 * （docs/cms-api.md），路徑即 `/api/admin/{type}`。
 * </p>
 */
export type MenuItem = {
  /** 路由片段，同時是 Admin API 的 `{type}`（少數非 CRUD 畫面除外）。 */
  path: string;
  label: string;
  /** 這個畫面是否有「編輯單筆」的子路由 `/{path}/:id`。 */
  hasDetail?: boolean;
  /** 只有 Admin 角色能看（Editor 看不到）。 */
  adminOnly?: boolean;
};

export type MenuSection = { title: string; items: MenuItem[] };

export const MENU: MenuSection[] = [
  {
    title: '內容',
    items: [
      { path: 'categories', label: '產品線', hasDetail: true },
      { path: 'products', label: '產品', hasDetail: true },
      { path: 'solutions', label: '產業解決方案', hasDetail: true },
      { path: 'articles', label: '文章（News・Insight・技術文章）', hasDetail: true },
      { path: 'pages', label: '頁面與版塊', hasDetail: true },
    ],
  },
  {
    title: '資源',
    items: [
      { path: 'exhibitions', label: '展會', hasDetail: true },
      { path: 'faq-categories', label: 'FAQ 分類' },
      { path: 'faq-items', label: 'FAQ 題目', hasDetail: true },
      { path: 'downloads', label: '下載中心', hasDetail: true },
      { path: 'article-tags', label: '文章標籤' },
      { path: 'authors', label: '作者' },
    ],
  },
  {
    title: '永續',
    items: [{ path: 'certifications', label: '認證管理', hasDetail: true }],
  },
  {
    title: '公司',
    items: [
      { path: 'milestones', label: '里程碑' },
      { path: 'locations', label: '據點' },
      { path: 'testimonials', label: '客戶見證' },
      { path: 'partner-brands', label: '合作品牌' },
      { path: 'contact-channels', label: '聯絡管道' },
      { path: 'process-flows', label: '製程流程', hasDetail: true },
    ],
  },
  {
    title: '營運',
    items: [
      { path: 'members', label: '會員審核', hasDetail: true },
      { path: 'sample-requests', label: '樣品申請', hasDetail: true },
      { path: 'contact-inquiries', label: '詢問單', hasDetail: true },
      { path: 'business-domains', label: '企業網域規則' },
    ],
  },
  {
    title: '站台',
    items: [
      { path: 'navigation', label: '導覽選單' },
      { path: 'redirects', label: '轉址（301）' },
      { path: 'site-settings', label: '站台設定', adminOnly: true },
      { path: 'media', label: '媒體庫' },
      { path: 'users', label: '後台使用者', adminOnly: true },
    ],
  },
];

/** 登入後的預設落點。 */
export const HOME_PATH = 'products';

export const ALL_ITEMS: MenuItem[] = MENU.flatMap((section) => section.items);
