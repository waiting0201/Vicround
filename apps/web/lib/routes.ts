/**
 * 公開站的路由地圖 —— **唯一真相來源**，對應 docs/sitemap.md 的 URL structure
 * （資訊架構為 Sitemap-0819，即 `mockup/Rounded Design/` 已實作的版本）。
 *
 * <p>
 * 導覽列、麵包屑與 `/llms.txt` 全部從這裡讀。路徑寫在一個地方，改版時
 * 不會出現「選單改了但 llms.txt 還指向舊路徑」這種只有爬蟲看得到的錯誤。
 * </p>
 *
 * <p>
 * ⚠️ 這裡只放**結構固定**的路徑。實體路徑（`/products/{category}/{slug}`）
 * 由 CMS 的 slug 決定，一律從 API 取，不在這裡列舉。
 * </p>
 */
export const ROUTES = {
  home: '',
  products: '/products',
  solutions: '/solutions',
  technologies: '/technologies',
  about: '/about',
  sustainability: '/sustainability',
  partnership: '/partnership',
  resources: '/resources',
  faq: '/resources/faq',
  downloads: '/resources/downloads',
  news: '/news',
  contact: '/contact',
  search: '/search',
  privacy: '/privacy',
  member: '/member',
  account: '/account',
} as const;

export type RouteKey = keyof typeof ROUTES;

/** 主導覽（Header）。label 由 messages/{locale}.json 的 `nav.*` 提供。 */
export const PRIMARY_NAV: RouteKey[] = [
  'products',
  'solutions',
  'technologies',
  'about',
  'resources',
  'contact',
];

/** About 底下的次頁（Sitemap-0819 把 Sustainability / Partnership 歸在 About Us）。 */
export const ABOUT_CHILDREN: RouteKey[] = ['sustainability', 'partnership'];

/** Resources 次導覽（News 歸 Resources）。 */
export const RESOURCES_CHILDREN: RouteKey[] = ['faq', 'downloads', 'news'];

/**
 * 三條產品線。`Categories.Type` 的三個值（docs/database.md §02）。
 * slug 由 CMS 決定，但這三條線本身不會增減，所以顏色 token 的對應寫在這裡。
 */
export const PRODUCT_LINES = [
  { type: 'opticalFilm', colorToken: '--color-product-optical-film' },
  { type: 'textileFoam', colorToken: '--color-product-textile-foam' },
  { type: 'acoustic', colorToken: '--color-product-acoustic' },
] as const;

/** 文章三種 `Type` 各自的網址前綴 —— 改 `Type` 等同改網址，必須寫 301（sitemap.md）。 */
export const ARTICLE_PREFIX = {
  news: '/news',
  insight: '/insights',
  technicalArticle: '/blog',
} as const;
