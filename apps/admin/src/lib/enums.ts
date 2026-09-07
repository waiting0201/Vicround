/**
 * Admin API 對外一律回**字串** enum（camelCase），DB 端才是 tinyint
 * —— 見 docs/database.md §16「SQL 用 tinyint，EF 用 HasConversion<byte>()，API 輸出字串」。
 *
 * <p>
 * 所以後台從頭到尾只認字串，不做數字轉換；這裡集中管的是「字串值 → 編輯者看得懂的繁中標籤」。
 * 標籤散在各畫面裡是後台最常見的爛法：同一個 `pendingApproval` 在三個畫面被翻成三種講法。
 * </p>
 */

/** 一組可選值：值 + 標籤，順序即下拉選單的顯示順序。 */
export type Option<T extends string = string> = { value: T; label: string };

function options<T extends string>(entries: Record<T, string>): Option<T>[] {
  return (Object.keys(entries) as T[]).map((value) => ({ value, label: entries[value] }));
}

/** 語系。介面固定繁中，但**內容**有兩個語系 —— 這是內容層的東西。 */
export const CULTURES = [
  { value: 'en', label: 'English', short: 'EN' },
  { value: 'zh-Hant', label: '繁體中文', short: '繁中' },
] as const;

export type Culture = (typeof CULTURES)[number]['value'];
export const DEFAULT_CULTURE: Culture = 'en';

/* ---------------- 內容狀態 ---------------- */

export type ContentStatus = 'draft' | 'published' | 'archived';

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  draft: '草稿',
  published: '已發布',
  archived: '已封存',
};

export const CONTENT_STATUS_OPTIONS = options(CONTENT_STATUS_LABEL);

/* ---------------- 產品目錄 ---------------- */

export type CategoryType = 'opticalFilm' | 'textileFoam' | 'acoustic';

export const CATEGORY_TYPE_LABEL: Record<CategoryType, string> = {
  opticalFilm: 'Optical Film 光學膜',
  textileFoam: 'Textile & Foam 織物泡棉',
  acoustic: 'Acoustic 聲學',
};

export const CATEGORY_TYPE_OPTIONS = options(CATEGORY_TYPE_LABEL);

/* ---------------- 資源中心 ---------------- */

export type ArticleType =
  | 'companyNews'
  | 'productNews'
  | 'exhibition'
  | 'certificationNews'
  | 'insight'
  | 'technicalArticle';

export const ARTICLE_TYPE_LABEL: Record<ArticleType, string> = {
  companyNews: '公司新聞',
  productNews: '產品新聞',
  exhibition: '展會',
  certificationNews: '認證新聞',
  insight: '產業洞察',
  technicalArticle: '技術文章',
};

export const ARTICLE_TYPE_OPTIONS = options(ARTICLE_TYPE_LABEL);

/**
 * `Type` 決定 URL 前綴（docs/database.md §05），所以改 Type 等同改網址、必須寫 301。
 * 編輯頁要把這件事說出來，不能只在文件裡。
 */
export const ARTICLE_TYPE_PREFIX: Record<ArticleType, string> = {
  companyNews: '/news',
  productNews: '/news',
  exhibition: '/news',
  certificationNews: '/news',
  insight: '/insights',
  technicalArticle: '/blog',
};

/* ---------------- 下載中心 ---------------- */

export type DownloadKind =
  | 'specSheet'
  | 'whitePaper'
  | 'catalogue'
  | 'complianceDocument'
  | 'certificate'
  | 'testReport'
  | 'trendReport'
  | 'other';

export const DOWNLOAD_KIND_LABEL: Record<DownloadKind, string> = {
  specSheet: '規格書',
  whitePaper: '白皮書',
  catalogue: '型錄',
  complianceDocument: '合規文件',
  certificate: '證書',
  testReport: '測試報告',
  trendReport: '趨勢報告',
  other: '其他',
};

export const DOWNLOAD_KIND_OPTIONS = options(DOWNLOAD_KIND_LABEL);

export type DownloadAccessLevel = 'public' | 'memberOnly' | 'onRequest';

export const DOWNLOAD_ACCESS_LABEL: Record<DownloadAccessLevel, string> = {
  public: '公開',
  memberOnly: '限會員',
  onRequest: '需索取',
};

export const DOWNLOAD_ACCESS_OPTIONS = options(DOWNLOAD_ACCESS_LABEL);

/** 存取層級決定檔案存哪個 container，選錯等於把限會員文件放上 CDN。 */
export const DOWNLOAD_ACCESS_HINT: Record<DownloadAccessLevel, string> = {
  public: '檔案存 public-media，公開端直接給 CDN 網址。',
  memberOnly: '檔案存 member-documents，只有已核准會員能換到 10 分鐘有效的 SAS 連結。',
  onRequest: '公開端只給 metadata，下載按鈕導向詢問單。',
};

/* ---------------- 永續與認證 ---------------- */

export type CertificationCategory = 'companyFactory' | 'sustainability' | 'productCompliance';

export const CERTIFICATION_CATEGORY_LABEL: Record<CertificationCategory, string> = {
  companyFactory: '公司與工廠',
  sustainability: '永續',
  productCompliance: '產品合規',
};

export const CERTIFICATION_CATEGORY_OPTIONS = options(CERTIFICATION_CATEGORY_LABEL);

/* ---------------- 技術與製程 ---------------- */

export type ProcessFlowKind =
  | 'coreProcess'
  | 'manufacturing'
  | 'coDevelopment'
  | 'oemOdm'
  | 'inquiryFlow';

export const PROCESS_FLOW_KIND_LABEL: Record<ProcessFlowKind, string> = {
  coreProcess: '核心製程',
  manufacturing: '產品線製造流程',
  coDevelopment: '共同開發',
  oemOdm: 'OEM／ODM',
  inquiryFlow: '詢問流程',
};

export const PROCESS_FLOW_KIND_OPTIONS = options(PROCESS_FLOW_KIND_LABEL);

/* ---------------- 公司資訊 ---------------- */

export type LocationType = 'headquarters' | 'production' | 'sales' | 'researchAndDevelopment';

export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  headquarters: '總部',
  production: '生產',
  sales: '業務',
  researchAndDevelopment: '研發',
};

export const LOCATION_TYPE_OPTIONS = options(LOCATION_TYPE_LABEL);

/* ---------------- 詢問單 ---------------- */

export type InquiryType =
  | 'general'
  | 'sales'
  | 'technical'
  | 'partnership'
  | 'sampleRequest'
  | 'documentRequest';

export const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  general: '一般',
  sales: '業務',
  technical: '技術',
  partnership: '合作',
  sampleRequest: '樣品索取',
  documentRequest: '文件索取',
};

export const INQUIRY_TYPE_OPTIONS = options(INQUIRY_TYPE_LABEL);

export type InquiryStatus = 'new' | 'inProgress' | 'responded' | 'closed' | 'spam';

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: '未處理',
  inProgress: '處理中',
  responded: '已回覆',
  closed: '已結案',
  spam: '垃圾訊息',
};

export const INQUIRY_STATUS_OPTIONS = options(INQUIRY_STATUS_LABEL);

/* ---------------- 會員 ---------------- */

export type MemberStatus =
  | 'pendingEmailVerification'
  | 'pendingApproval'
  | 'approved'
  | 'rejected'
  | 'suspended';

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  pendingEmailVerification: '待驗證信箱',
  pendingApproval: '待審核',
  approved: '已核准',
  rejected: '已拒絕',
  suspended: '已停權',
};

export const MEMBER_STATUS_OPTIONS = options(MEMBER_STATUS_LABEL);

export type MemberJobRole =
  | 'engineeringRnd'
  | 'procurement'
  | 'productManagement'
  | 'quality'
  | 'other';

export const MEMBER_JOB_ROLE_LABEL: Record<MemberJobRole, string> = {
  engineeringRnd: '工程／研發',
  procurement: '採購',
  productManagement: '產品管理',
  quality: '品保',
  other: '其他',
};

export const MEMBER_JOB_ROLE_OPTIONS = options(MEMBER_JOB_ROLE_LABEL);

export type BusinessDomainRule = 'manualReview' | 'autoApprove' | 'block';

export const BUSINESS_DOMAIN_RULE_LABEL: Record<BusinessDomainRule, string> = {
  manualReview: '人工審核',
  autoApprove: '自動核准',
  block: '封鎖',
};

export const BUSINESS_DOMAIN_RULE_OPTIONS = options(BUSINESS_DOMAIN_RULE_LABEL);

/* ---------------- 樣品申請 ---------------- */

export type SampleRequestStatus =
  | 'draft'
  | 'submitted'
  | 'underReview'
  | 'approved'
  | 'shipped'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export const SAMPLE_REQUEST_STATUS_LABEL: Record<SampleRequestStatus, string> = {
  draft: '草稿',
  submitted: '已送出',
  underReview: '審核中',
  approved: '已核准',
  shipped: '已出貨',
  delivered: '已送達',
  rejected: '已拒絕',
  cancelled: '已取消',
};

export const SAMPLE_REQUEST_STATUS_OPTIONS = options(SAMPLE_REQUEST_STATUS_LABEL);

/** 看板的欄位順序 —— 只列會停留的狀態，`draft` 是會員端未送出的，後台看不到。 */
export const SAMPLE_REQUEST_BOARD_COLUMNS: SampleRequestStatus[] = [
  'submitted',
  'underReview',
  'approved',
  'shipped',
  'delivered',
];

/** 每個狀態對應的時間戳欄位（docs/database.md §14.4：不建歷程表，每階段一個時間戳）。 */
export const SAMPLE_REQUEST_TIMESTAMPS: { status: SampleRequestStatus; field: string; label: string }[] = [
  { status: 'submitted', field: 'submittedAt', label: '送出' },
  { status: 'underReview', field: 'reviewedAt', label: '開始審核' },
  { status: 'approved', field: 'approvedAt', label: '核准' },
  { status: 'shipped', field: 'shippedAt', label: '出貨' },
  { status: 'delivered', field: 'deliveredAt', label: '送達' },
  { status: 'rejected', field: 'rejectedAt', label: '拒絕' },
  { status: 'cancelled', field: 'cancelledAt', label: '取消' },
];

/* ---------------- 導覽與轉址 ---------------- */

export type NavigationLocation = 'header' | 'footer' | 'footerLegal' | 'social' | 'searchChip';

export const NAVIGATION_LOCATION_LABEL: Record<NavigationLocation, string> = {
  header: 'Header 主選單',
  footer: 'Footer 選單',
  footerLegal: 'Footer 法律連結',
  social: '社群連結',
  searchChip: 'Header 熱門搜尋',
};

export const NAVIGATION_LOCATION_OPTIONS = options(NAVIGATION_LOCATION_LABEL);

export type LinkTargetType = 'internal' | 'external' | 'anchor' | 'entityRef' | 'contactModal';

export const LINK_TARGET_TYPE_LABEL: Record<LinkTargetType, string> = {
  internal: '站內路徑',
  external: '外部網址',
  anchor: '頁內錨點',
  entityRef: '指向內容實體',
  contactModal: '開啟聯絡表單',
};

export const LINK_TARGET_TYPE_OPTIONS = options(LINK_TARGET_TYPE_LABEL);

/** 301／302／308 是轉址，410 是「內容永久移除且無替代」。 */
export const REDIRECT_STATUS_OPTIONS: Option<string>[] = [
  { value: '301', label: '301 永久轉址' },
  { value: '302', label: '302 暫時轉址' },
  { value: '308', label: '308 永久轉址（保留方法）' },
  { value: '410', label: '410 已永久移除' },
];

/* ---------------- 頁面與版塊 ---------------- */

export type PageTemplate =
  | 'standard'
  | 'home'
  | 'about'
  | 'sustainability'
  | 'partnership'
  | 'technologies'
  | 'contact'
  | 'legal'
  | 'resourcesHub'
  | 'productsHub'
  | 'solutionsHub'
  | 'memberGateway';

export const PAGE_TEMPLATE_LABEL: Record<PageTemplate, string> = {
  standard: '一般頁',
  home: '首頁',
  about: '關於我們',
  sustainability: '永續',
  partnership: '合作',
  technologies: '技術',
  contact: '聯絡',
  legal: '法律條文',
  resourcesHub: '資源中心',
  productsHub: '產品總覽',
  solutionsHub: '解決方案總覽',
  memberGateway: '會員入口',
};

export const PAGE_TEMPLATE_OPTIONS = options(PAGE_TEMPLATE_LABEL);

export type BlockTone = 'dark' | 'light';

export const BLOCK_TONE_LABEL: Record<BlockTone, string> = { dark: '深色', light: '淺色' };
export const BLOCK_TONE_OPTIONS = options(BLOCK_TONE_LABEL);

/**
 * 版塊分兩種（docs/database.md §09）：
 * **Content block** 自帶文字，**Reference block** 只存查詢參數、資料來自強型別表。
 * 這個分野是「什麼都變成 block」的唯一防線，所以編輯 UI 必須把它顯示出來。
 */
export type BlockKind = 'content' | 'reference';

export type BlockTypeMeta = { value: string; label: string; kind: BlockKind; note?: string };

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { value: 'richText', label: '長文', kind: 'content' },
  { value: 'hero', label: 'Hero', kind: 'content' },
  { value: 'gallery', label: '圖庫', kind: 'content' },
  { value: 'featureGrid', label: '特色格', kind: 'content' },
  { value: 'stepList', label: '步驟清單', kind: 'content' },
  { value: 'statBand', label: '數字帶', kind: 'content' },
  { value: 'mediaTextSplit', label: '圖文左右分割', kind: 'content' },
  { value: 'quote', label: '引言', kind: 'content' },
  { value: 'cta', label: 'CTA', kind: 'content' },
  { value: 'accordion', label: '折疊清單', kind: 'content' },
  { value: 'specTable', label: '規格表', kind: 'content' },
  { value: 'offeringGrid', label: '服務格', kind: 'content' },
  { value: 'logoWall', label: 'Logo 牆', kind: 'content' },
  { value: 'certificationList', label: '認證清單', kind: 'reference', note: '資料來自「認證管理」' },
  { value: 'milestoneTimeline', label: '里程碑時間軸', kind: 'reference', note: '資料來自「里程碑」' },
  { value: 'locationList', label: '據點清單', kind: 'reference', note: '資料來自「據點」' },
  { value: 'testimonialList', label: '客戶見證', kind: 'reference', note: '資料來自「客戶見證」' },
  { value: 'processFlowRef', label: '製程流程', kind: 'reference', note: '資料來自「製程流程」' },
  { value: 'faqList', label: 'FAQ 清單', kind: 'reference', note: '資料來自「FAQ 題目」' },
  { value: 'exhibitionList', label: '展會清單', kind: 'reference', note: '資料來自「展會」' },
  { value: 'downloadList', label: '下載清單', kind: 'reference', note: '資料來自「下載中心」' },
  { value: 'solutionGrid', label: '解決方案格', kind: 'reference', note: '資料來自「產業解決方案」' },
  { value: 'categoryGrid', label: '產品線格', kind: 'reference', note: '資料來自「產品線」' },
  { value: 'articleList', label: '文章清單', kind: 'reference', note: '資料來自「文章」' },
  { value: 'partnerBrandWall', label: '合作品牌牆', kind: 'reference', note: '資料來自「合作品牌」' },
  { value: 'productGrid', label: '產品格', kind: 'reference', note: '資料來自「產品」' },
  { value: 'contactChannelList', label: '聯絡管道清單', kind: 'reference', note: '資料來自「聯絡管道」' },
];

export const BLOCK_TYPE_OPTIONS: Option[] = BLOCK_TYPES.map(({ value, label }) => ({ value, label }));

export function blockTypeMeta(value: string): BlockTypeMeta | undefined {
  return BLOCK_TYPES.find((block) => block.value === value);
}

/* ---------------- 媒體與設定 ---------------- */

export type MediaAssetType = 'image' | 'video' | 'document' | 'other';

export const MEDIA_TYPE_LABEL: Record<MediaAssetType, string> = {
  image: '圖片',
  video: '影片',
  document: '文件',
  other: '其他',
};

export const MEDIA_TYPE_OPTIONS = options(MEDIA_TYPE_LABEL);

export type SettingValueKind = 'text' | 'html' | 'url' | 'number' | 'boolean' | 'json';

export const SETTING_VALUE_KIND_LABEL: Record<SettingValueKind, string> = {
  text: '文字',
  html: 'HTML',
  url: '網址',
  number: '數字',
  boolean: '開關',
  json: 'JSON',
};

export const SETTING_VALUE_KIND_OPTIONS = options(SETTING_VALUE_KIND_LABEL);

/** 後台角色。`Editor` 管內容，`Admin` 另外管使用者、轉址與站台設定。 */
export const ROLE_OPTIONS: Option[] = [
  { value: 'Admin', label: 'Admin（含使用者與站台設定）' },
  { value: 'Editor', label: 'Editor（內容編輯與發布）' },
];
