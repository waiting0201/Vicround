import type { Locale } from './locale';
import { ROUTES } from './routes';

/**
 * 主導覽與 mega menu 的結構 —— 對照 `mockup/Rounded Design/Header.dc.html` 的 `pages`
 * （其註解標明依 VICROUND Web Sitemap-0819：News 歸 Resources、Sustainability 與
 * Partnership 歸 About Us，兩者都不再是一級選單）。
 *
 * <p>
 * 標籤走 `messages/{locale}.json`，路徑走 `lib/routes.ts` —— mockup 裡是寫死的英文與
 * `.dc.html` 檔名，這裡換成真的路由與雙語字串，**結構與順序不變**。
 * </p>
 *
 * <p>
 * ⚠️ Products 與 Solutions 的子項現在是寫死的 slug（來自 docs/sitemap.md 的清單）。
 * 接上 `GET /api/v1/navigation` 之後改由 `NavigationItems` 供應，順序交給編輯者排。
 * </p>
 */
export type MegaChild = {
  /** `messages` 的鍵：`mega.{group}.{key}.label` / `.note` */
  key: string;
  href: string;
};

export type NavItem = {
  /** `messages` 的 `nav.{key}`；也是 active 狀態的比對值 */
  key: string;
  href: string;
  /** 有子項才有 mega menu；`messages` 的 `megaTitle.{key}` */
  children?: MegaChild[];
};

export function navItems(): NavItem[] {
  return [
    {
      key: 'products',
      href: ROUTES.products,
      children: [
        { key: 'opticalFilm', href: `${ROUTES.products}/optical-film` },
        { key: 'textileFoam', href: `${ROUTES.products}/textile-foam` },
        { key: 'acoustic', href: `${ROUTES.products}/acoustic` },
      ],
    },
    {
      key: 'solutions',
      href: ROUTES.solutions,
      children: [
        { key: 'consumerElectronics', href: `${ROUTES.solutions}/consumer-electronics` },
        { key: 'automotive', href: `${ROUTES.solutions}/automotive` },
        { key: 'smartHealthcare', href: `${ROUTES.solutions}/smart-healthcare` },
        { key: 'renewableEnergy', href: `${ROUTES.solutions}/renewable-energy` },
        { key: 'acousticSolutions', href: `${ROUTES.solutions}/acoustic-solutions` },
        { key: 'ePaper', href: `${ROUTES.solutions}/e-paper` },
        { key: 'sportsEyewear', href: `${ROUTES.solutions}/sports-eyewear` },
      ],
    },
    {
      key: 'technologies',
      href: ROUTES.technologies,
      children: [
        { key: 'coreProcesses', href: `${ROUTES.technologies}#core-processes` },
        { key: 'innovation', href: `${ROUTES.technologies}#innovation` },
        { key: 'compliance', href: `${ROUTES.technologies}#compliance` },
      ],
    },
    { key: 'about', href: ROUTES.about },
    {
      key: 'resources',
      href: ROUTES.resources,
      children: [
        { key: 'news', href: ROUTES.news },
        { key: 'faq', href: ROUTES.faq },
        { key: 'insights', href: `${ROUTES.resources}#insights` },
        { key: 'downloads', href: ROUTES.downloads },
      ],
    },
  ];
}

/** 常用搜尋 chip（Header.dc.html 的 `searchChips`，`SearchChip` 之後由後台的導覽單元管理）。 */
export function searchChips(): MegaChild[] {
  return [
    { key: 'antiGlare', href: `${ROUTES.products}/optical-film` },
    { key: 'emiFoam', href: `${ROUTES.products}/textile-foam` },
    { key: 'acousticMesh', href: `${ROUTES.products}/acoustic` },
    { key: 'isoCert', href: ROUTES.sustainability },
    { key: 'specSheet', href: ROUTES.downloads },
  ];
}

/** Footer 連結（Footer.dc.html 的 `links`，順序照抄）。 */
export const FOOTER_LINKS = [
  'about',
  'products',
  'solutions',
  'technologies',
  'faq',
  'downloads',
  'news',
  'contact',
] as const;

export function localeHref(locale: Locale, href: string): string {
  return `/${locale}${href}`;
}
