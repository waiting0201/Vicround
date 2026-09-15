import type { IconName } from '@/ui/Icon';
import { RESOURCES, resourceOf } from './resources';

/**
 * 後台側欄 —— 分區依 docs/cms.md「Admin 管理的功能單元」，
 * 也就是 docs/database.md 的 14 個功能單元，而不是一張大表清單。
 *
 * <p>
 * 這份清單只決定**側欄怎麼排**；路由與畫面型別由 `lib/resources.ts` 決定。兩份的
 * 交集是 `type` 這個字串（同時是 Admin API 的 `{type}`），下面的 `MENU_TYPES` 會在
 * 開發模式檢查兩邊有沒有對不起來 —— 側欄出現一個連到 404 的項目，比少一個項目更難查。
 * </p>
 */
export type MenuItem = {
  /** 路由片段，同時是 Admin API 的 `{type}`。 */
  type: string;
  label: string;
  /** 側欄收合成 64px 時只剩下圖示，所以每一項都要有一顆。 */
  icon: IconName;
  /** 只有 Admin 角色看得到（Editor 完全看不到，不是看得到但按不動）。 */
  adminOnly?: boolean;
};

export type MenuSection = { title: string; items: MenuItem[] };

export const MENU: MenuSection[] = [
  {
    title: '內容',
    items: [
      { type: 'categories', label: '產品線', icon: 'layers' },
      { type: 'products', label: '產品', icon: 'package' },
      { type: 'solutions', label: '產業解決方案', icon: 'globe' },
      { type: 'articles', label: '文章', icon: 'newspaper' },
      { type: 'pages', label: '頁面與版塊', icon: 'book-open' },
    ],
  },
  {
    title: '資源',
    items: [
      { type: 'exhibitions', label: '展會', icon: 'calendar' },
      { type: 'faq-categories', label: 'FAQ 分類', icon: 'folder' },
      { type: 'faq-items', label: 'FAQ 題目', icon: 'help-circle' },
      { type: 'downloads', label: '下載中心', icon: 'download' },
      { type: 'article-tags', label: '文章標籤', icon: 'tag' },
      { type: 'authors', label: '作者', icon: 'users' },
    ],
  },
  {
    title: '永續',
    items: [{ type: 'certifications', label: '認證管理', icon: 'award' }],
  },
  {
    title: '公司',
    items: [
      { type: 'milestones', label: '里程碑', icon: 'flag' },
      { type: 'locations', label: '據點', icon: 'map-pin' },
      { type: 'testimonials', label: '客戶見證', icon: 'quote' },
      { type: 'partner-brands', label: '合作品牌', icon: 'building' },
      { type: 'contact-channels', label: '聯絡管道', icon: 'inbox' },
      { type: 'process-flows', label: '製程流程', icon: 'git-branch' },
    ],
  },
  {
    title: '營運',
    items: [
      // 會員審核與樣品申請暫時收起來（見下方 MENULESS_TYPES）。
      { type: 'contact-inquiries', label: '詢問單', icon: 'inbox' },
    ],
  },
  {
    title: '站台',
    items: [
      { type: 'navigation', label: '導覽選單', icon: 'link' },
      { type: 'redirects', label: '轉址（301）', icon: 'arrow-up-down' },
      { type: 'site-settings', label: '站台設定', icon: 'settings', adminOnly: true },
      { type: 'users', label: '後台使用者', icon: 'users', adminOnly: true },
    ],
  },
];

/** 登入後的預設落點。編輯者一天裡打開最多次的畫面。 */
export const HOME_PATH = 'products';

export const ALL_ITEMS: MenuItem[] = MENU.flatMap((section) => section.items);

/**
 * 側欄不放入口、但資料字典裡有定義的單元。
 *
 * <p>
 * `media`：媒體庫已經退役（檔案從各欄位直接上傳），但欄位要拿它的定義去讀單筆媒體，
 * 所以 `RESOURCES` 留著它。
 * </p>
 *
 * <p>
 * `business-domains`：**規則本身照常生效**——註冊時比對網域是後端 `AccountAuthService`
 * 在做的事，跟側欄有沒有入口無關。只是這張表平常不必動（值是一次設定好的政策，不是
 * 日常內容），擺在「營運」區會跟會員審核、樣品申請、詢問單這些每天要處理的佇列搶注意力。
 * 要改規則時網址仍然打得開（`/business-domains`），把這一行搬回 `MENU` 就會再出現。
 * </p>
 *
 * <p>
 * `members`／`sample-requests`：**前台會員區已經整段隱藏**（`apps/web` 的
 * `MEMBERS_ENABLED`，預設關閉），不會再有新的會員或樣品申請進來，側欄留著只是兩列
 * 空佇列。資料與畫面都沒動——既有的資料還在，網址也還打得開
 * （`/members`、`/sample-requests`），前台重新開放時把這兩行搬回上面的「營運」區即可。
 * </p>
 *
 * <p>
 * 列在這裡，下面的對照才不會每次開發都吵一次假警報。
 * </p>
 */
const MENULESS_TYPES = ['media', 'business-domains', 'members', 'sample-requests'];

/** 側欄與資料字典必須一一對應；對不起來就是有畫面連不到，開發時就要吵出來。 */
if (import.meta.env.DEV) {
  const missingScreen = ALL_ITEMS.filter((item) => !resourceOf(item.type)).map((item) => item.type);
  const missingMenu = RESOURCES.filter(
    (resource) =>
      !MENULESS_TYPES.includes(resource.type) && !ALL_ITEMS.some((item) => item.type === resource.type),
  ).map((resource) => resource.type);

  if (missingScreen.length) console.error('側欄有項目沒有對應的畫面定義：', missingScreen);
  if (missingMenu.length) console.error('有畫面定義沒有出現在側欄：', missingMenu);
}
