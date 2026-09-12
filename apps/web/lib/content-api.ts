import 'server-only';
import { apiGet, tag } from './api';
import type { Locale } from './locale';

/**
 * Content API 的型別與取值函式 —— 與 `Api/Models/Dtos/` **逐欄對應**（docs/cms-api.md）。
 *
 * <p>
 * 契約改了要同時改這裡：後端已經把 enum 輸出成 camelCase 字串、把 `Ref*Id` 解析成公開路徑、
 * 把 reference block 解析成強型別清單，所以前台不該再自己拼網址或再打第二趟 API。
 * </p>
 *
 * <p>
 * 每一支都**失敗回 null／空陣列**（見 `apiGet`）。頁面自己決定要顯示空狀態還是 `notFound()` ——
 * 後端暫時掛掉時，版型要還撐得住，而不是整站 500。
 * </p>
 */

export type Seo = { title: string | null; description: string | null; keywords: string | null };

export type Paged<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** 每個內容型別都帶這一欄：`false` = 這一列沒有該語系的翻譯，回的是預設語系（database.md §0.2）。 */
type Translated = { hasRequestedCulture: boolean };

export type SpecificationRow = {
  /** 可為 null —— 有些 chip 只有值沒有欄名（database.md §02）。 */
  label: string | null;
  value: string;
  note: string | null;
  isHighlighted: boolean;
};

export type Chip = { slug: string; name: string | null; path: string };

// ── 目錄 ──────────────────────────────────────────────────────────────────

export type CategoryType = 'opticalFilm' | 'textileFoam' | 'acoustic';

export type CategoryListItem = Translated & {
  slug: string;
  type: CategoryType;
  accentColorHex: string | null;
  iconName: string | null;
  name: string | null;
  shortName: string | null;
  menuNote: string | null;
  summary: string | null;
};

export type CategoryDetail = {
  slug: string;
  type: CategoryType;
  accentColorHex: string | null;
  iconName: string | null;
  name: string | null;
  summary: string | null;
  intro: string | null;
  description: string | null;
  seo: Seo | null;
  specifications: SpecificationRow[];
  blocks: ContentBlock[];
  products: ProductListItem[];
  solutions: SolutionListItem[];
};

export type ProductListItem = Translated & {
  slug: string;
  categorySlug: string;
  code: string | null;
  brand: string | null;
  isFeatured: boolean;
  isNew: boolean;
  name: string | null;
  summary: string | null;
  /** 系列卡的 chip（`isHighlighted`）與比較表的欄位都在這裡。 */
  specifications: SpecificationRow[];
};

export type ProductDetail = {
  slug: string;
  categorySlug: string;
  code: string | null;
  brand: string | null;
  name: string | null;
  summary: string | null;
  description: string | null;
  applicationNote: string | null;
  seo: Seo | null;
  specifications: SpecificationRow[];
};

export type SolutionListItem = Translated & {
  slug: string;
  iconName: string | null;
  isNew: boolean;
  name: string | null;
  menuNote: string | null;
  summary: string | null;
  /** 產業卡上的產品線 chip（`SolutionCategories`）。 */
  categories: Chip[];
};

export type SolutionDetail = {
  slug: string;
  iconName: string | null;
  isNew: boolean;
  name: string | null;
  summary: string | null;
  challengeTitle: string | null;
  challengeBody: string | null;
  description: string | null;
  seo: Seo | null;
  specifications: SpecificationRow[];
  blocks: ContentBlock[];
  categories: CategoryListItem[];
};

// ── 頁面與版塊 ────────────────────────────────────────────────────────────

export type BlockTone = 'dark' | 'light';

export type BlockType =
  | 'richText' | 'hero' | 'gallery' | 'featureGrid' | 'stepList' | 'statBand'
  | 'mediaTextSplit' | 'quote' | 'cta' | 'accordion' | 'specTable' | 'offeringGrid' | 'logoWall'
  | 'certificationList' | 'milestoneTimeline' | 'locationList' | 'testimonialList'
  | 'processFlowRef' | 'faqList' | 'exhibitionList' | 'downloadList' | 'solutionGrid'
  | 'categoryGrid' | 'articleList' | 'partnerBrandWall' | 'productGrid' | 'contactChannelList';

export type ContentBlockItem = {
  iconName: string | null;
  accentColorHex: string | null;
  badge: string | null;
  linkUrl: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  linkLabel: string | null;
  value: string | null;
};

/** Reference block 解析出來的資料；只有該版塊型別對應的那一份會有值（database.md §09）。 */
export type BlockReference = {
  categories: CategoryListItem[] | null;
  solutions: SolutionListItem[] | null;
  products: ProductListItem[] | null;
  articles: ArticleListItem[] | null;
  exhibitions: Exhibition[] | null;
  faqCategories: FaqCategory[] | null;
  downloads: Download[] | null;
  certifications: Certification[] | null;
  processFlows: ProcessFlow[] | null;
  milestones: Milestone[] | null;
  locations: Location[] | null;
  testimonials: Testimonial[] | null;
  partnerBrands: PartnerBrand[] | null;
  contactChannels: ContactChannel[] | null;
};

export type ContentBlock = {
  blockType: BlockType;
  anchor: string | null;
  tone: BlockTone;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  footNote: string | null;
  settings: string | null;
  items: ContentBlockItem[];
  reference: BlockReference | null;
};

export type PageDetail = {
  slug: string;
  /** 已組好的公開路徑（不含語系前綴），例如 `/resources/faq`。 */
  path: string;
  template: string;
  /** 資訊架構上的父頁；**不是網址的一部分**（見 `path`）。 */
  parentSlug: string | null;
  /** CMS 指定的 banner 圖；沒指定時前台用 `lib/page-assets` 的設計素材。 */
  bannerImageUrl: string | null;
  title: string | null;
  eyebrow: string | null;
  subtitle: string | null;
  bannerTitle: string | null;
  bannerDescription: string | null;
  ctaEyebrow: string | null;
  ctaHeadline: string | null;
  ctaSubcopy: string | null;
  body: string | null;
  lastReviewedLabel: string | null;
  seo: Seo | null;
  blocks: ContentBlock[];
};

/**
 * 固定路由的頁面資料**必須存在**。
 *
 * <p>
 * 取不到時丟例外（→ 500）而不是 `notFound()`：後端暫時掛掉是伺服器問題，
 * 回 404 會讓搜尋引擎把一批既有網址當成已刪除。實體詳情頁才用 `notFound()` ——
 * 那裡的「查不到」真的代表這個網址不存在。
 * </p>
 */
export function requirePage(page: PageDetail | null, slug: string): PageDetail {
  if (!page) throw new Error(`Content API 取不到頁面 ${slug}。`);
  return page;
}

/** 版塊以 `anchor` 定位，不用陣列索引 —— 編輯者在後台調順序不該讓版面錯位。 */
export function block(page: PageDetail | null, anchor: string): ContentBlock | null {
  return page?.blocks.find((b) => b.anchor === anchor) ?? null;
}

// ── 導覽 ──────────────────────────────────────────────────────────────────

export type NavigationLinkType = 'internal' | 'external' | 'anchor' | 'entityRef' | 'contactModal';

export type NavigationNode = Translated & {
  linkType: NavigationLinkType;
  /** 已解析好的站內路徑（不含語系前綴）或外部網址；沒有目的地時為 null。 */
  path: string | null;
  isExternal: boolean;
  openInNewTab: boolean;
  iconName: string | null;
  label: string | null;
  note: string | null;
  menuTitle: string | null;
  ariaLabel: string | null;
  children: NavigationNode[];
};

export type NavigationLocation = 'header' | 'footer' | 'footerLegal' | 'social' | 'searchChip';

export type NavigationGroup = { location: NavigationLocation; items: NavigationNode[] };

// ── 資源中心 ──────────────────────────────────────────────────────────────

export type ArticleType =
  | 'companyNews' | 'productNews' | 'exhibition' | 'certificationNews'
  | 'insight' | 'technicalArticle';

export type Author = {
  slug: string;
  name: string | null;
  jobTitle: string | null;
  initials: string | null;
  avatarUrl: string | null;
};

export type ArticleListItem = Translated & {
  slug: string;
  type: ArticleType;
  /** 已含前綴（`/news`、`/insights`、`/blog`）。Type 決定網址，前台不要自己拼。 */
  path: string;
  publishedAt: string | null;
  readingMinutes: number | null;
  isFeatured: boolean;
  heroImageUrl: string | null;
  title: string | null;
  excerpt: string | null;
  author: Author | null;
  categories: Chip[];
  solutions: Chip[];
  tags: Chip[];
};

export type ArticleLink = { slug: string; path: string; title: string | null };

export type ArticleDetail = {
  slug: string;
  type: ArticleType;
  path: string;
  publishedAt: string | null;
  updatedAt: string;
  readingMinutes: number | null;
  heroImageUrl: string | null;
  title: string | null;
  excerpt: string | null;
  lead: string | null;
  body: string | null;
  pullQuote: string | null;
  pullQuoteAttribution: string | null;
  author: Author | null;
  seo: Seo | null;
  categories: Chip[];
  solutions: Chip[];
  tags: Chip[];
  exhibition: Exhibition | null;
  previous: ArticleLink | null;
  next: ArticleLink | null;
};

export type Exhibition = Translated & {
  slug: string;
  startDate: string;
  endDate: string;
  isUpcoming: boolean;
  boothNumber: string | null;
  city: string | null;
  countryCode: string | null;
  websiteUrl: string | null;
  meetingUrl: string | null;
  heroImageUrl: string | null;
  name: string | null;
  venueName: string | null;
  summary: string | null;
  description: string | null;
  onBoothNote: string | null;
  ctaLabel: string | null;
};

export type FaqItem = Translated & {
  slug: string;
  categorySlug: string;
  isFeatured: boolean;
  question: string | null;
  answer: string | null;
  linkLabel: string | null;
  linkPath: string | null;
};

export type FaqCategory = Translated & {
  slug: string;
  name: string | null;
  description: string | null;
  items: FaqItem[];
};

export type CertificationCategory = 'companyFactory' | 'sustainability' | 'productCompliance';

export type Certification = Translated & {
  slug: string;
  category: CertificationCategory;
  certificateNumber: string | null;
  issuedOn: string | null;
  validUntil: string | null;
  /** 確認稿的「[Pending client input]」虛線卡 —— 內容待客戶提供。 */
  isPlaceholder: boolean;
  logoUrl: string | null;
  title: string | null;
  shortNote: string | null;
  summary: string | null;
  issuerName: string | null;
  validityText: string | null;
  scopeText: string | null;
  sitesText: string | null;
  documentationLabel: string | null;
  document: Download | null;
  categories: Chip[];
};

export type DownloadAccessLevel = 'public' | 'memberOnly' | 'onRequest';

export type Download = Translated & {
  slug: string;
  kind: string;
  accessLevel: DownloadAccessLevel;
  /** 只有 `public` 會有值；`memberOnly` 要登入換 SAS，`onRequest` 走 `requestUrl`。 */
  fileUrl: string | null;
  requiresSignIn: boolean;
  requestUrl: string | null;
  version: string | null;
  documentDate: string | null;
  validUntil: string | null;
  fileExtension: string;
  fileSizeBytes: number;
  documentCulture: string | null;
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
};

// ── 技術與製程 ────────────────────────────────────────────────────────────

export type ProcessStep = {
  stepNumber: number;
  iconName: string | null;
  accentColorHex: string | null;
  imageUrl: string | null;
  title: string | null;
  body: string | null;
};

export type ProcessFlowKind =
  | 'coreProcess' | 'manufacturing' | 'coDevelopment' | 'oemOdm' | 'inquiryFlow';

export type ProcessFlow = Translated & {
  slug: string;
  kind: ProcessFlowKind;
  categorySlug: string | null;
  title: string | null;
  subtitle: string | null;
  intro: string | null;
  steps: ProcessStep[];
};

export type Technologies = { processFlows: ProcessFlow[]; compliance: Certification[] };

// ── 公司實體（沒有獨立端點，只由 reference block 帶出）──────────────────────

export type Milestone = Translated & {
  year: number;
  month: number | null;
  imageUrl: string | null;
  label: string | null;
  title: string | null;
  body: string | null;
};

export type Location = Translated & {
  type: string;
  countryCode: string;
  city: string;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
  imageUrl: string | null;
  name: string | null;
  addressLine: string | null;
  note: string | null;
  openingHours: string | null;
};

export type Testimonial = Translated & {
  quote: string | null;
  authorName: string | null;
  authorTitle: string | null;
  companyType: string | null;
  solutionSlug: string | null;
  brandName: string | null;
  avatarUrl: string | null;
};

export type PartnerBrand = Translated & {
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  name: string | null;
  note: string | null;
};

export type ContactChannel = Translated & {
  slug: string;
  email: string;
  phone: string | null;
  inquiryType: string;
  label: string | null;
  description: string | null;
};

// ── 取值函式 ──────────────────────────────────────────────────────────────

export function getNavigation(culture: Locale, location?: NavigationLocation) {
  return apiGet<NavigationGroup[]>('/navigation', {
    culture,
    query: { location },
    tags: [tag.navigation()],
  });
}

export function getPage(culture: Locale, slug: string) {
  return apiGet<PageDetail>(`/pages/${slug}`, { culture, tags: [tag.page(slug)] });
}

export function getCategories(culture: Locale) {
  return apiGet<CategoryListItem[]>('/categories', { culture, tags: [tag.categories()] });
}

export function getCategory(culture: Locale, slug: string) {
  return apiGet<CategoryDetail>(`/categories/${slug}`, { culture, tags: [tag.category(slug)] });
}

export function getProducts(
  culture: Locale,
  query: { category?: string; solution?: string; featured?: boolean; page?: number; pageSize?: number } = {},
) {
  return apiGet<Paged<ProductListItem>>('/products', { culture, query, tags: [tag.products()] });
}

export function getProduct(culture: Locale, slug: string) {
  return apiGet<ProductDetail>(`/products/${slug}`, { culture, tags: [tag.product(slug)] });
}

export function getSolutions(culture: Locale) {
  return apiGet<SolutionListItem[]>('/solutions', { culture, tags: [tag.solutions()] });
}

export function getSolution(culture: Locale, slug: string) {
  return apiGet<SolutionDetail>(`/solutions/${slug}`, { culture, tags: [tag.solution(slug)] });
}

export function getTechnologies(culture: Locale) {
  return apiGet<Technologies>('/technologies', { culture, tags: [tag.technologies()] });
}

export function getArticles(
  culture: Locale,
  query: { type?: string; tag?: string; category?: string; solution?: string; page?: number; pageSize?: number } = {},
) {
  return apiGet<Paged<ArticleListItem>>('/articles', {
    culture,
    query,
    tags: [tag.articles(query.type)],
  });
}

export function getArticle(culture: Locale, slug: string) {
  return apiGet<ArticleDetail>(`/articles/${slug}`, { culture, tags: [tag.article(slug)] });
}

export function getExhibitions(culture: Locale, upcoming?: boolean) {
  return apiGet<Exhibition[]>('/exhibitions', {
    culture,
    query: { upcoming },
    tags: [tag.articles('exhibitions')],
  });
}

export function getFaq(culture: Locale, category?: string) {
  return apiGet<FaqCategory[]>('/faq', { culture, query: { category }, tags: [tag.faq()] });
}

export function getCertifications(culture: Locale, category?: string) {
  return apiGet<Certification[]>('/certifications', {
    culture,
    query: { category },
    tags: [tag.certifications()],
  });
}

/**
 * 一筆搜尋結果。`kind` 決定結果卡上的分類標籤，字串與後端的
 * <c>SearchResultDto</c> 一致（product / category / solution / page / article / download / faq）。
 */
export type SearchResult = {
  kind: string;
  title: string;
  summary: string | null;
  path: string;
  hasRequestedCulture: boolean;
};

export type SearchResponse = {
  query: string;
  total: number;
  /** 還有更多結果被 limit 截掉；結果頁據此提示縮小關鍵字。 */
  hasMore: boolean;
  results: SearchResult[];
};

/**
 * 站內搜尋。**不帶 revalidate tag** —— 每個關鍵字都是獨立的一份快取，
 * 發布時無從指名失效，所以改用短 TTL（見 `apiGet` 的 `revalidate`）。
 */
export function getSearch(culture: Locale, query: string, limit = 20) {
  return apiGet<SearchResponse>('/search', {
    culture,
    query: { q: query, limit },
    revalidate: 300,
  });
}

export function getDownloads(
  culture: Locale,
  query: { kind?: string; product?: string; category?: string; solution?: string } = {},
) {
  return apiGet<Download[]>('/downloads', { culture, query, tags: [tag.downloads()] });
}
