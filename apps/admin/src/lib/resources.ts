import {
  ARTICLE_TYPE_OPTIONS,
  BLOCK_TONE_OPTIONS,
  BLOCK_TYPE_OPTIONS,
  BUSINESS_DOMAIN_RULE_OPTIONS,
  CATEGORY_TYPE_OPTIONS,
  CERTIFICATION_CATEGORY_OPTIONS,
  DOWNLOAD_ACCESS_OPTIONS,
  DOWNLOAD_KIND_OPTIONS,
  INQUIRY_STATUS_OPTIONS,
  INQUIRY_TYPE_OPTIONS,
  LINK_TARGET_TYPE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  MEDIA_TYPE_OPTIONS,
  MEMBER_JOB_ROLE_OPTIONS,
  MEMBER_STATUS_OPTIONS,
  NAVIGATION_LOCATION_OPTIONS,
  PAGE_TEMPLATE_OPTIONS,
  PROCESS_FLOW_KIND_OPTIONS,
  REDIRECT_STATUS_OPTIONS,
  ROLE_OPTIONS,
  SAMPLE_REQUEST_STATUS_OPTIONS,
  SETTING_VALUE_KIND_OPTIONS,
  type Option,
} from './enums';

/**
 * **後台的資料字典。**
 *
 * <p>
 * 27 個畫面若各寫一份欄位清單，欄位長度、必填、語系歸屬這些規則會在 27 個地方各長一份，
 * 而 `docs/database.md` 改一個欄位時沒有人知道要動哪幾支檔案。這裡把「這個實體有哪些欄位、
 * 哪些分語系、列表顯示哪幾欄」宣告成資料，畫面只負責畫 —— 新增一個欄位是改這一份。
 * </p>
 *
 * <p>
 * `scope` 是這份字典最重要的一欄：`base` 是 culture-neutral 的基底列（slug、狀態、關聯），
 * `translation` 是 `{Entity}Translations` 的每語系一列。兩者寫入的是**不同端點**
 * （`PUT /{type}/{id}` vs `PUT /{type}/{id}/translations/{culture}`），弄混會把英文寫進基底列。
 * </p>
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'html'
  | 'slug'
  | 'number'
  | 'boolean'
  | 'select'
  | 'date'
  | 'datetime'
  | 'email'
  | 'password'
  | 'url'
  | 'color'
  | 'icon'
  | 'json'
  | 'media'
  | 'mediaList'
  | 'reference'
  | 'multiReference';

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  /** `base` = 不分語系的基底列；`translation` = 每個語系各一份。 */
  scope: 'base' | 'translation';
  required?: boolean;
  maxLength?: number;
  options?: Option[];
  /** `reference` / `multiReference` 指向的 Admin API `{type}`。 */
  refType?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  /** 佔滿整列（預設半列）。 */
  wide?: boolean;
  readOnly?: boolean;
  /**
   * 何時才顯示這一欄。用在「選了 A 才需要填 B」的欄位（導覽項目的連結方式）——
   * 一次攤開五種連結方式的欄位，等於要編輯者自己判斷哪四個該留空。
   */
  visibleWhen?: (values: Record<string, unknown>) => boolean;
  /**
   * `media` 欄位上傳時要進哪個容器。預設 `public-media`。
   *
   * <p>
   * 可以給一個函式，依同一筆資料的其他欄位決定——下載項目就是這樣：存取層級選了
   * 限會員，檔案就必須進私有容器。**選錯的後果是把客戶的合規文件放上公開網際網路**，
   * 所以這件事由欄位定義決定，不讓上傳的人每次自己挑。
   * </p>
   */
  container?: MediaContainer | ((values: Record<string, unknown>) => MediaContainer);
  /** `media` 欄位的 `accept`。限制在檔案選擇器就先擋掉，不必等後端回 415。 */
  accept?: string;
};

export type MediaContainer = 'public-media' | 'member-documents';

/** 圖片欄位共用的 `accept`（對齊後端 AdminMediaHandler 的 AllowedTypes）。 */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml,image/avif,image/gif';

export type ColumnDef = {
  name: string;
  label: string;
  type?: 'text' | 'status' | 'badge' | 'date' | 'datetime' | 'number' | 'boolean' | 'thumb' | 'code';
  /** 這一欄的值來自翻譯列（依目前選的語系）。 */
  fromTranslation?: boolean;
  options?: Option[];
  align?: 'start' | 'end';
  width?: string;
};

/**
 * 畫面型別。決定 `routes/` 用哪一支容器元件，也決定工具列有哪些動作。
 * 型別的定義與各畫面的歸屬見 docs/admin-ui.md。
 */
export type ScreenKind =
  | 'collection' // 清單 + 右側抽屜編輯（多數小型實體）
  | 'editor' // 清單 + 獨立編輯頁（欄位多、有子項的實體）
  | 'ordered' // 清單本身就是排序（拖曳／上下移），不分頁
  | 'queue' // 審核佇列（會員）
  | 'board' // 看板（樣品申請）
  | 'inbox' // 收件匣（詢問單）
  | 'settings'; // 單一設定表單

export type ResourceDef = {
  /** 路由片段，同時是 Admin API 的 `{type}`。 */
  type: string;
  label: string;
  /** 單筆的稱呼，用在「新增○○」「刪除這筆○○」。 */
  singular: string;
  screen: ScreenKind;
  /** 列表與抽屜標題取哪個欄位；`fromTranslation` 為真時取翻譯列。 */
  titleField: string;
  titleFromTranslation?: boolean;
  /** 有 Slug（Routable / Addressable）—— 改 slug 必寫 301。 */
  hasSlug?: boolean;
  /** 有 Draft / Published / Archived 狀態與發布動作。 */
  hasStatus?: boolean;
  /** 有 SortOrder，可批次排序。 */
  hasSort?: boolean;
  /** 有翻譯列（需要語系分頁與缺漏標示）。 */
  hasTranslations?: boolean;
  /** 翻譯列含 SEO 四欄。 */
  hasSeo?: boolean;
  /** 只有 Admin 角色能進。 */
  adminOnly?: boolean;
  /** 這個畫面在做什麼、資料落在哪張表 —— 顯示在畫面上，不是留在文件裡。 */
  description: string;
  columns: ColumnDef[];
  baseFields: FieldDef[];
  translationFields: FieldDef[];
  /** 清單工具列的下拉篩選。 */
  filters?: { name: string; label: string; options: Option[] }[];
  /** 子項編輯器（規格列、版塊、步驟…），在編輯頁下半部。 */
  children?: ChildCollectionDef[];
};

export type ChildCollectionDef = {
  key: string;
  label: string;
  description: string;
  baseFields: FieldDef[];
  translationFields: FieldDef[];
};

/* --------------------------------------------------------------------------
 * 共用欄位
 * ------------------------------------------------------------------------ */

/** Routable / Addressable 的翻譯表共同 SEO 欄位（Embedded 表一律不加）。 */
const SEO_FIELDS: FieldDef[] = [
  { name: 'seoTitle', label: 'SEO 標題', type: 'text', scope: 'translation', maxLength: 200 },
  {
    name: 'seoDescription',
    label: 'SEO 描述',
    type: 'textarea',
    scope: 'translation',
    maxLength: 400,
    rows: 2,
    wide: true,
  },
  { name: 'seoKeywords', label: 'SEO 關鍵字', type: 'text', scope: 'translation', maxLength: 400, wide: true },
  { name: 'ogImageMediaAssetId', label: 'OG 分享圖', type: 'media', scope: 'translation', accept: IMAGE_ACCEPT },
];

const SLUG_FIELD: FieldDef = {
  name: 'slug',
  label: '網址片段（slug）',
  type: 'slug',
  scope: 'base',
  required: true,
  maxLength: 200,
  hint: '只能是小寫英數與連字號。改動會讓舊網址失效，系統會同時寫一筆 301。',
};

const SORT_FIELD: FieldDef = {
  name: 'sortOrder',
  label: '排序',
  type: 'number',
  scope: 'base',
  hint: '數字小的排前面。',
};

const STATUS_COLUMN: ColumnDef = { name: 'status', label: '狀態', type: 'status', width: '7rem' };
const UPDATED_COLUMN: ColumnDef = { name: 'updatedAt', label: '最後更新', type: 'datetime', width: '10rem' };

/* --------------------------------------------------------------------------
 * 一、內容
 * ------------------------------------------------------------------------ */

const categories: ResourceDef = {
  type: 'categories',
  label: '產品線',
  singular: '產品線',
  screen: 'editor',
  titleField: 'name',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: '產品分類樹：三條產品線與其子分類。決定 /{locale}/products/{category} 這一層網址。',
  columns: [
    { name: 'name', label: '名稱', fromTranslation: true },
    { name: 'type', label: '產品線', type: 'badge', options: CATEGORY_TYPE_OPTIONS, width: '12rem' },
    { name: 'slug', label: 'slug', type: 'code', width: '12rem' },
    STATUS_COLUMN,
    UPDATED_COLUMN,
  ],
  filters: [{ name: 'type', label: '產品線', options: CATEGORY_TYPE_OPTIONS }],
  baseFields: [
    SLUG_FIELD,
    { name: 'type', label: '產品線', type: 'select', scope: 'base', required: true, options: CATEGORY_TYPE_OPTIONS },
    {
      name: 'parentId',
      label: '上層分類',
      type: 'reference',
      scope: 'base',
      refType: 'categories',
      hint: '產品線本身留空；子分類指向所屬產品線。',
    },
    { name: 'accentColorHex', label: '主色', type: 'color', scope: 'base', hint: 'CIS p.8 的產品色。' },
    { name: 'iconName', label: '圖示', type: 'icon', scope: 'base' },
    { name: 'heroMediaAssetId', label: '主視覺', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'name', label: '名稱', type: 'text', scope: 'translation', required: true, maxLength: 200 },
    { name: 'shortName', label: '選單短名', type: 'text', scope: 'translation', maxLength: 80 },
    { name: 'menuNote', label: 'Mega menu 說明', type: 'text', scope: 'translation', maxLength: 160, wide: true },
    { name: 'summary', label: '摘要', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'intro', label: '產品線頁開場', type: 'html', scope: 'translation', wide: true },
    { name: 'description', label: '完整說明', type: 'html', scope: 'translation', wide: true },
    ...SEO_FIELDS,
  ],
  children: [
    {
      key: 'specifications',
      label: '共同規格',
      description: '產品線頁的「Common specifications」表，同一張 SpecificationRows 服務產品／產品線／解決方案三種 owner。',
      baseFields: [
        { name: 'isHighlighted', label: '列為亮點', type: 'boolean', scope: 'base' },
        SORT_FIELD,
      ],
      translationFields: [
        { name: 'label', label: '項目', type: 'text', scope: 'translation', required: true, maxLength: 200 },
        { name: 'value', label: '典型值', type: 'text', scope: 'translation', required: true, maxLength: 200 },
        { name: 'note', label: '量測方法／備註', type: 'text', scope: 'translation', maxLength: 400, wide: true },
      ],
    },
  ],
};

const products: ResourceDef = {
  type: 'products',
  label: '產品',
  singular: '產品',
  screen: 'editor',
  titleField: 'name',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: '產品與型號。型號以「上層產品」掛在 family 之下，卡片只顯示沒有上層的那一層。',
  columns: [
    { name: 'name', label: '名稱', fromTranslation: true },
    { name: 'code', label: '型號', type: 'code', width: '9rem' },
    { name: 'categoryId', label: '所屬分類', type: 'text', width: '11rem' },
    { name: 'isFeatured', label: '精選', type: 'boolean', width: '5rem' },
    STATUS_COLUMN,
    UPDATED_COLUMN,
  ],
  filters: [{ name: 'category', label: '分類', options: [] }],
  baseFields: [
    SLUG_FIELD,
    {
      name: 'categoryId',
      label: '所屬分類',
      type: 'reference',
      scope: 'base',
      refType: 'categories',
      required: true,
      hint: '分類決定網址 /products/{category}/{product}，所以產品只能屬於一個分類。',
    },
    {
      name: 'parentProductId',
      label: '上層產品',
      type: 'reference',
      scope: 'base',
      refType: 'products',
      hint: '細分型號掛在 family 之下；family 本身留空。',
    },
    { name: 'code', label: '型號短碼', type: 'text', scope: 'base', maxLength: 32, placeholder: 'VR-AC 360-A' },
    { name: 'brand', label: '品牌', type: 'text', scope: 'base', maxLength: 80, placeholder: 'FlexCore™' },
    { name: 'isFeatured', label: '精選（首頁／熱銷）', type: 'boolean', scope: 'base' },
    { name: 'isNew', label: '標記 New', type: 'boolean', scope: 'base' },
    { name: 'heroMediaAssetId', label: '主視覺', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    { name: 'gallery', label: '產品圖庫', type: 'mediaList', scope: 'base', wide: true, accept: IMAGE_ACCEPT },
    { name: 'solutionIds', label: '關聯產業', type: 'multiReference', scope: 'base', refType: 'solutions', wide: true },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'name', label: '名稱', type: 'text', scope: 'translation', required: true, maxLength: 200 },
    { name: 'summary', label: '摘要', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'description', label: '產品說明', type: 'html', scope: 'translation', wide: true },
    { name: 'applicationNote', label: '應用備註', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    ...SEO_FIELDS,
  ],
  children: [
    {
      key: 'specifications',
      label: '規格列',
      description: '會進 Product JSON-LD 的 additionalProperty，也是會員區完整公差表的來源 —— 這是產品資料，不是排版。',
      baseFields: [
        { name: 'isHighlighted', label: '卡片亮點', type: 'boolean', scope: 'base' },
        SORT_FIELD,
      ],
      translationFields: [
        { name: 'label', label: '項目', type: 'text', scope: 'translation', required: true, maxLength: 200 },
        { name: 'value', label: '典型值', type: 'text', scope: 'translation', required: true, maxLength: 200 },
        { name: 'note', label: '量測方法／備註', type: 'text', scope: 'translation', maxLength: 400, wide: true },
      ],
    },
  ],
};

const solutions: ResourceDef = {
  type: 'solutions',
  label: '產業解決方案',
  singular: '解決方案',
  screen: 'editor',
  titleField: 'name',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: '七個產業頁。資訊形狀是 Challenge → What we bring → Key specs → Why us，與產品分類樹不同，所以是獨立實體。',
  columns: [
    { name: 'name', label: '名稱', fromTranslation: true },
    { name: 'slug', label: 'slug', type: 'code', width: '14rem' },
    { name: 'isNew', label: 'New', type: 'boolean', width: '5rem' },
    STATUS_COLUMN,
    UPDATED_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'iconName', label: '圖示', type: 'icon', scope: 'base' },
    { name: 'isNew', label: '索引卡標記 New', type: 'boolean', scope: 'base' },
    { name: 'heroMediaAssetId', label: '主視覺', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    { name: 'categoryIds', label: '相關產品線', type: 'multiReference', scope: 'base', refType: 'categories', wide: true },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'name', label: '名稱', type: 'text', scope: 'translation', required: true, maxLength: 200 },
    { name: 'menuNote', label: 'Mega menu 說明', type: 'text', scope: 'translation', maxLength: 160 },
    { name: 'summary', label: '索引卡摘要', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'challengeTitle', label: '課題標題', type: 'text', scope: 'translation', maxLength: 300, wide: true },
    { name: 'challengeBody', label: '課題內文', type: 'html', scope: 'translation', wide: true },
    { name: 'description', label: '完整說明', type: 'html', scope: 'translation', wide: true },
    { name: 'ctaLabel', label: 'CTA 按鈕文字', type: 'text', scope: 'translation', maxLength: 80 },
    ...SEO_FIELDS,
  ],
  children: [
    {
      key: 'specifications',
      label: '關鍵規格',
      description: 'Solution 頁的「Key specifications」表。',
      baseFields: [{ name: 'isHighlighted', label: '列為亮點', type: 'boolean', scope: 'base' }, SORT_FIELD],
      translationFields: [
        { name: 'label', label: '項目', type: 'text', scope: 'translation', required: true, maxLength: 200 },
        { name: 'value', label: '典型值', type: 'text', scope: 'translation', required: true, maxLength: 200 },
        { name: 'note', label: '量測方法／備註', type: 'text', scope: 'translation', maxLength: 400, wide: true },
      ],
    },
  ],
};

const articles: ResourceDef = {
  type: 'articles',
  label: '文章',
  singular: '文章',
  screen: 'editor',
  titleField: 'title',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: 'News、Insight、技術文章共用一張表；「文章類型」決定網址前綴（/news、/insights、/blog）。',
  columns: [
    { name: 'title', label: '標題', fromTranslation: true },
    { name: 'type', label: '類型', type: 'badge', options: ARTICLE_TYPE_OPTIONS, width: '9rem' },
    { name: 'publishedAt', label: '發布時間', type: 'datetime', width: '10rem' },
    STATUS_COLUMN,
    UPDATED_COLUMN,
  ],
  filters: [{ name: 'type', label: '類型', options: ARTICLE_TYPE_OPTIONS }],
  baseFields: [
    {
      name: 'type',
      label: '文章類型',
      type: 'select',
      scope: 'base',
      required: true,
      options: ARTICLE_TYPE_OPTIONS,
      hint: '類型決定網址前綴。變更類型等同變更網址，系統會一併寫入 301。',
    },
    SLUG_FIELD,
    { name: 'authorId', label: '作者', type: 'reference', scope: 'base', refType: 'authors' },
    {
      name: 'exhibitionId',
      label: '關聯展會',
      type: 'reference',
      scope: 'base',
      refType: 'exhibitions',
      hint: '類型為「展會」時，連到展會實體以帶出 Event 結構化資料。',
    },
    { name: 'heroMediaAssetId', label: '主視覺', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    { name: 'readingMinutes', label: '閱讀分鐘數', type: 'number', scope: 'base' },
    { name: 'isFeatured', label: '資源中心置頂', type: 'boolean', scope: 'base' },
    {
      name: 'publishedAt',
      label: '發布時間',
      type: 'datetime',
      scope: 'base',
      hint: '文章的發布時間同時決定可見性與排序：時間未到不會出現在前台。',
    },
    { name: 'tagIds', label: '標籤', type: 'multiReference', scope: 'base', refType: 'article-tags', wide: true },
    { name: 'categoryIds', label: '產品線標籤', type: 'multiReference', scope: 'base', refType: 'categories', wide: true },
    { name: 'solutionIds', label: '產業標籤', type: 'multiReference', scope: 'base', refType: 'solutions', wide: true },
    { name: 'productIds', label: '相關產品', type: 'multiReference', scope: 'base', refType: 'products', wide: true },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'title', label: '標題', type: 'text', scope: 'translation', required: true, maxLength: 300, wide: true },
    { name: 'excerpt', label: '摘要', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'lead', label: '導言', type: 'textarea', scope: 'translation', maxLength: 1000, rows: 3, wide: true },
    { name: 'body', label: '內文', type: 'html', scope: 'translation', wide: true },
    { name: 'pullQuote', label: '摘句', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'pullQuoteAttribution', label: '摘句出處', type: 'text', scope: 'translation', maxLength: 160 },
    ...SEO_FIELDS,
  ],
};

const pages: ResourceDef = {
  type: 'pages',
  label: '頁面與版塊',
  singular: '頁面',
  screen: 'editor',
  titleField: 'title',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: '固定頁的文字與版塊。系統頁不可刪除；版型（Template）決定可以用哪些版塊。',
  columns: [
    { name: 'title', label: '標題', fromTranslation: true },
    { name: 'slug', label: 'slug', type: 'code', width: '12rem' },
    { name: 'template', label: '版型', type: 'badge', options: PAGE_TEMPLATE_OPTIONS, width: '10rem' },
    STATUS_COLUMN,
    UPDATED_COLUMN,
  ],
  filters: [{ name: 'template', label: '版型', options: PAGE_TEMPLATE_OPTIONS }],
  baseFields: [
    SLUG_FIELD,
    { name: 'template', label: '版型', type: 'select', scope: 'base', required: true, options: PAGE_TEMPLATE_OPTIONS },
    { name: 'parentPageId', label: '上層頁面', type: 'reference', scope: 'base', refType: 'pages' },
    {
      name: 'isSystemPage',
      label: '系統頁',
      type: 'boolean',
      scope: 'base',
      readOnly: true,
      hint: '首頁、隱私權、聯絡等頁面不可刪除。',
    },
    { name: 'heroMediaAssetId', label: '主視覺', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'title', label: '頁面標題', type: 'text', scope: 'translation', required: true, maxLength: 300, wide: true },
    { name: 'eyebrow', label: '眉標', type: 'text', scope: 'translation', maxLength: 120 },
    { name: 'subtitle', label: '副標', type: 'text', scope: 'translation', maxLength: 400 },
    { name: 'bannerTitle', label: 'Banner 標題', type: 'text', scope: 'translation', maxLength: 300 },
    { name: 'bannerDescription', label: 'Banner 說明', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2 },
    { name: 'ctaEyebrow', label: 'CTA 眉標', type: 'text', scope: 'translation', maxLength: 120 },
    { name: 'ctaHeadline', label: 'CTA 標題', type: 'text', scope: 'translation', maxLength: 300 },
    { name: 'ctaSubcopy', label: 'CTA 副文', type: 'textarea', scope: 'translation', maxLength: 400, rows: 2 },
    { name: 'body', label: '長文內容', type: 'html', scope: 'translation', wide: true, hint: '隱私權這類純長文可以不用版塊。' },
    { name: 'lastReviewedLabel', label: '更新日期標示', type: 'text', scope: 'translation', maxLength: 80 },
    ...SEO_FIELDS,
  ],
  children: [
    {
      key: 'blocks',
      label: '版塊',
      description: '內容版塊自帶文字；參照版塊只存查詢條件，資料仍來自強型別表（改認證清單請去「認證管理」）。',
      baseFields: [
        { name: 'blockType', label: '版塊類型', type: 'select', scope: 'base', required: true, options: BLOCK_TYPE_OPTIONS },
        { name: 'anchor', label: '錨點', type: 'text', scope: 'base', maxLength: 64, hint: '同一頁內不可重複，例：esg。' },
        { name: 'tone', label: '底色', type: 'select', scope: 'base', options: BLOCK_TONE_OPTIONS },
        { name: 'mediaAssetId', label: '圖片', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
        { name: 'settingsJson', label: '查詢條件', type: 'json', scope: 'base', wide: true, hint: '僅參照版塊使用，且不得放任何要翻譯的文字。' },
        SORT_FIELD,
      ],
      translationFields: [
        { name: 'eyebrow', label: '眉標', type: 'text', scope: 'translation', maxLength: 120 },
        { name: 'title', label: '標題', type: 'text', scope: 'translation', maxLength: 300 },
        { name: 'subtitle', label: '副標', type: 'text', scope: 'translation', maxLength: 400, wide: true },
        { name: 'body', label: '內文', type: 'html', scope: 'translation', wide: true },
        { name: 'ctaLabel', label: 'CTA 文字', type: 'text', scope: 'translation', maxLength: 80 },
        { name: 'footNote', label: '註腳', type: 'text', scope: 'translation', maxLength: 600 },
      ],
    },
  ],
};

/* --------------------------------------------------------------------------
 * 二、資源
 * ------------------------------------------------------------------------ */

const exhibitions: ResourceDef = {
  type: 'exhibitions',
  label: '展會',
  singular: '展會',
  screen: 'editor',
  titleField: 'name',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: '展會由日期決定可見性：結束日一過就自動從「下一場」移到「展會紀錄」，所以沒有置頂旗標。',
  columns: [
    { name: 'name', label: '展會名稱', fromTranslation: true },
    { name: 'startDate', label: '開始', type: 'date', width: '8rem' },
    { name: 'endDate', label: '結束', type: 'date', width: '8rem' },
    { name: 'city', label: '城市', width: '8rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'startDate', label: '開始日期', type: 'date', scope: 'base', required: true },
    { name: 'endDate', label: '結束日期', type: 'date', scope: 'base', required: true },
    { name: 'boothNumber', label: '攤位號', type: 'text', scope: 'base', maxLength: 32 },
    { name: 'city', label: '城市', type: 'text', scope: 'base', maxLength: 80 },
    { name: 'countryCode', label: '國別代碼', type: 'text', scope: 'base', maxLength: 2, placeholder: 'TW' },
    { name: 'websiteUrl', label: '官方網站', type: 'url', scope: 'base', maxLength: 512, wide: true },
    { name: 'meetingUrl', label: '預約洽談連結', type: 'url', scope: 'base', maxLength: 512, wide: true },
    { name: 'heroMediaAssetId', label: '主視覺', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'name', label: '展會名稱', type: 'text', scope: 'translation', required: true, maxLength: 300, wide: true },
    { name: 'venueName', label: '場館', type: 'text', scope: 'translation', maxLength: 200 },
    { name: 'summary', label: '摘要', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'description', label: '說明', type: 'html', scope: 'translation', wide: true },
    { name: 'onBoothNote', label: '攤位展出說明', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'ctaLabel', label: 'CTA 文字', type: 'text', scope: 'translation', maxLength: 80 },
    ...SEO_FIELDS,
  ],
};

const faqCategories: ResourceDef = {
  type: 'faq-categories',
  label: 'FAQ 分類',
  singular: 'FAQ 分類',
  screen: 'ordered',
  titleField: 'name',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: 'FAQ 頁上方的分類軌，順序即顯示順序。',
  columns: [
    { name: 'name', label: '分類名稱', fromTranslation: true },
    { name: 'slug', label: 'slug', type: 'code', width: '12rem' },
    STATUS_COLUMN,
  ],
  baseFields: [SLUG_FIELD, SORT_FIELD],
  translationFields: [
    { name: 'name', label: '名稱', type: 'text', scope: 'translation', required: true, maxLength: 160 },
    { name: 'description', label: '說明', type: 'textarea', scope: 'translation', maxLength: 400, rows: 2, wide: true },
  ],
};

const faqItems: ResourceDef = {
  type: 'faq-items',
  label: 'FAQ 題目',
  singular: 'FAQ 題目',
  screen: 'editor',
  titleField: 'question',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: 'FAQ 會輸出 FAQPage 結構化資料給搜尋與 AI 引擎，所以答案必須是純文字內容，不要塞排版。',
  columns: [
    { name: 'question', label: '問題', fromTranslation: true },
    { name: 'faqCategoryId', label: '分類', width: '10rem' },
    { name: 'isFeatured', label: '精選', type: 'boolean', width: '5rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    { name: 'faqCategoryId', label: '分類', type: 'reference', scope: 'base', refType: 'faq-categories', required: true },
    SLUG_FIELD,
    { name: 'isFeatured', label: '資源中心顯示', type: 'boolean', scope: 'base' },
    { name: 'refProductId', label: '延伸連結：產品', type: 'reference', scope: 'base', refType: 'products' },
    { name: 'refCategoryId', label: '延伸連結：產品線', type: 'reference', scope: 'base', refType: 'categories' },
    { name: 'refSolutionId', label: '延伸連結：解決方案', type: 'reference', scope: 'base', refType: 'solutions' },
    { name: 'refPageId', label: '延伸連結：頁面', type: 'reference', scope: 'base', refType: 'pages' },
    { name: 'refDownloadId', label: '延伸連結：下載', type: 'reference', scope: 'base', refType: 'downloads' },
    {
      name: 'externalUrl',
      label: '延伸連結：外部網址',
      type: 'url',
      scope: 'base',
      maxLength: 512,
      wide: true,
      hint: '站內連結請用上面的實體選擇 —— 目標改 slug 時連結會自動跟著走。',
    },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'question', label: '問題', type: 'text', scope: 'translation', required: true, maxLength: 500, wide: true },
    { name: 'answer', label: '答案', type: 'html', scope: 'translation', required: true, wide: true },
    { name: 'linkLabel', label: '延伸連結文字', type: 'text', scope: 'translation', maxLength: 120 },
  ],
};

const downloads: ResourceDef = {
  type: 'downloads',
  label: '下載中心',
  singular: '下載項目',
  screen: 'editor',
  titleField: 'title',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: '可發布的文件實體：有版本、效期與存取層級。同一份證書的兩個版本是兩筆下載項目。',
  columns: [
    { name: 'title', label: '標題', fromTranslation: true },
    { name: 'kind', label: '類型', type: 'badge', options: DOWNLOAD_KIND_OPTIONS, width: '8rem' },
    { name: 'accessLevel', label: '存取層級', type: 'badge', options: DOWNLOAD_ACCESS_OPTIONS, width: '7rem' },
    { name: 'version', label: '版本', type: 'code', width: '6rem' },
    { name: 'validUntil', label: '有效至', type: 'date', width: '8rem' },
    STATUS_COLUMN,
  ],
  filters: [
    { name: 'kind', label: '類型', options: DOWNLOAD_KIND_OPTIONS },
    { name: 'accessLevel', label: '存取層級', options: DOWNLOAD_ACCESS_OPTIONS },
  ],
  baseFields: [
    SLUG_FIELD,
    {
      name: 'mediaAssetId',
      label: '檔案',
      type: 'media',
      scope: 'base',
      required: true,
      // 存取層級是同一張表單上的欄位，所以上傳時就能決定容器，不必事後搬檔案。
      container: (values) => (values.accessLevel === 'public' ? 'public-media' : 'member-documents'),
      accept: 'application/pdf,image/jpeg,image/png,image/webp',
      hint: '限會員與詢問後提供的檔案會存進私有容器，公開端拿不到真實網址。',
    },
    { name: 'kind', label: '文件類型', type: 'select', scope: 'base', required: true, options: DOWNLOAD_KIND_OPTIONS },
    {
      name: 'accessLevel',
      label: '存取層級',
      type: 'select',
      scope: 'base',
      required: true,
      options: DOWNLOAD_ACCESS_OPTIONS,
      hint: '限會員的檔案存在私有容器，公開端永遠拿不到真實網址。',
    },
    { name: 'version', label: '版本', type: 'text', scope: 'base', maxLength: 32, placeholder: 'Rev. C' },
    { name: 'documentDate', label: '文件日期', type: 'date', scope: 'base' },
    { name: 'validUntil', label: '有效至', type: 'date', scope: 'base', hint: '過期後自動不列出。' },
    { name: 'documentCulture', label: '檔案語言', type: 'select', scope: 'base', options: [] , hint: '留空表示語言中立。'},
    { name: 'thumbnailMediaAssetId', label: '縮圖', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    { name: 'productIds', label: '關聯產品', type: 'multiReference', scope: 'base', refType: 'products', wide: true },
    { name: 'categoryIds', label: '關聯產品線', type: 'multiReference', scope: 'base', refType: 'categories', wide: true },
    { name: 'solutionIds', label: '關聯解決方案', type: 'multiReference', scope: 'base', refType: 'solutions', wide: true },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'title', label: '標題', type: 'text', scope: 'translation', required: true, maxLength: 300, wide: true },
    { name: 'description', label: '說明', type: 'textarea', scope: 'translation', maxLength: 1000, rows: 3, wide: true },
    ...SEO_FIELDS,
  ],
};

const articleTags: ResourceDef = {
  type: 'article-tags',
  label: '文章標籤',
  singular: '標籤',
  screen: 'collection',
  titleField: 'name',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: '自由標籤只留給沒有對應實體的行銷標籤 —— 產品線與產業請用文章編輯頁的對應欄位，不要在這裡複製一份。',
  columns: [
    { name: 'name', label: '標籤', fromTranslation: true },
    { name: 'slug', label: 'slug', type: 'code', width: '12rem' },
    { name: 'isSystem', label: '系統', type: 'boolean', width: '5rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'isSystem', label: '系統標籤', type: 'boolean', scope: 'base', readOnly: true },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'name', label: '名稱', type: 'text', scope: 'translation', required: true, maxLength: 120 },
    { name: 'description', label: '說明', type: 'textarea', scope: 'translation', maxLength: 400, rows: 2, wide: true },
    ...SEO_FIELDS,
  ],
};

const authors: ResourceDef = {
  type: 'authors',
  label: '作者',
  singular: '作者',
  screen: 'collection',
  titleField: 'name',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: '文章署名。姓名與職稱要翻譯，縮寫與照片不用。',
  columns: [
    { name: 'name', label: '姓名', fromTranslation: true },
    { name: 'initials', label: '縮寫', type: 'code', width: '5rem' },
    { name: 'jobTitle', label: '職稱', fromTranslation: true },
    STATUS_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'initials', label: '縮寫', type: 'text', scope: 'base', maxLength: 4 },
    { name: 'mediaAssetId', label: '照片', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'name', label: '姓名', type: 'text', scope: 'translation', required: true, maxLength: 160 },
    { name: 'jobTitle', label: '職稱', type: 'text', scope: 'translation', maxLength: 160 },
    { name: 'bio', label: '簡介', type: 'textarea', scope: 'translation', maxLength: 1000, rows: 3, wide: true },
  ],
};

/* --------------------------------------------------------------------------
 * 三、永續
 * ------------------------------------------------------------------------ */

const certifications: ResourceDef = {
  type: 'certifications',
  label: '認證管理',
  singular: '認證',
  screen: 'editor',
  titleField: 'title',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description:
    '一筆認證同時餵永續頁的認證卡、關於我們、技術頁的合規表與認證彈窗 —— 這是四個頁面共用同一份資料，不要在頁面裡另抄一份。',
  columns: [
    { name: 'title', label: '認證', fromTranslation: true },
    { name: 'category', label: '分類', type: 'badge', options: CERTIFICATION_CATEGORY_OPTIONS, width: '9rem' },
    { name: 'certificateNumber', label: '證號', type: 'code', width: '10rem' },
    { name: 'validUntil', label: '效期至', type: 'date', width: '8rem' },
    { name: 'isPlaceholder', label: '待補', type: 'boolean', width: '5rem' },
    STATUS_COLUMN,
  ],
  filters: [{ name: 'category', label: '分類', options: CERTIFICATION_CATEGORY_OPTIONS }],
  baseFields: [
    SLUG_FIELD,
    { name: 'category', label: '分類', type: 'select', scope: 'base', required: true, options: CERTIFICATION_CATEGORY_OPTIONS },
    { name: 'certificateNumber', label: '證書編號', type: 'text', scope: 'base', maxLength: 120 },
    { name: 'issuedOn', label: '發證日', type: 'date', scope: 'base' },
    { name: 'validUntil', label: '有效至', type: 'date', scope: 'base', hint: '過期會自動隱藏。' },
    {
      name: 'isPlaceholder',
      label: '尚待客戶提供',
      type: 'boolean',
      scope: 'base',
      hint: '打開時前台顯示虛線的待補卡片，不會顯示假資料。',
    },
    { name: 'downloadId', label: '證書 PDF', type: 'reference', scope: 'base', refType: 'downloads' },
    { name: 'logoMediaAssetId', label: '標章圖', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    { name: 'productIds', label: '涵蓋產品', type: 'multiReference', scope: 'base', refType: 'products', wide: true },
    { name: 'categoryIds', label: '涵蓋產品線', type: 'multiReference', scope: 'base', refType: 'categories', wide: true },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'title', label: '名稱', type: 'text', scope: 'translation', required: true, maxLength: 200 },
    { name: 'shortNote', label: '卡片一行說明', type: 'text', scope: 'translation', maxLength: 200 },
    { name: 'summary', label: '彈窗敘述', type: 'textarea', scope: 'translation', maxLength: 1000, rows: 3, wide: true },
    { name: 'issuerName', label: '發證機構', type: 'text', scope: 'translation', maxLength: 200 },
    {
      name: 'validityText',
      label: '效期敘述',
      type: 'text',
      scope: 'translation',
      maxLength: 200,
      hint: '像「Reviewed annually」這種非日期的說法；判定過期用的是上面的「有效至」。',
    },
    { name: 'scopeText', label: '驗證範疇', type: 'text', scope: 'translation', maxLength: 400, wide: true },
    { name: 'sitesText', label: '適用場址', type: 'text', scope: 'translation', maxLength: 400, wide: true },
    { name: 'documentationLabel', label: '文件標示', type: 'text', scope: 'translation', maxLength: 120 },
    ...SEO_FIELDS,
  ],
};

/* --------------------------------------------------------------------------
 * 四、公司
 * ------------------------------------------------------------------------ */

const milestones: ResourceDef = {
  type: 'milestones',
  label: '里程碑',
  singular: '里程碑',
  screen: 'ordered',
  titleField: 'title',
  titleFromTranslation: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: '關於我們的歷程時間軸，依年份排序。',
  columns: [
    { name: 'year', label: '年份', type: 'number', width: '6rem' },
    { name: 'title', label: '事件', fromTranslation: true },
    STATUS_COLUMN,
  ],
  baseFields: [
    { name: 'year', label: '年份', type: 'number', scope: 'base', required: true },
    { name: 'month', label: '月份', type: 'number', scope: 'base' },
    { name: 'mediaAssetId', label: '圖片', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'label', label: '編號標示', type: 'text', scope: 'translation', maxLength: 80, placeholder: '01 — Founding' },
    { name: 'title', label: '標題', type: 'text', scope: 'translation', required: true, maxLength: 200 },
    { name: 'body', label: '說明', type: 'textarea', scope: 'translation', maxLength: 1000, rows: 3, wide: true },
  ],
};

const locations: ResourceDef = {
  type: 'locations',
  label: '據點',
  singular: '據點',
  screen: 'collection',
  titleField: 'name',
  titleFromTranslation: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: '同一筆據點同時出現在關於我們與聯絡我們兩頁。',
  columns: [
    { name: 'name', label: '名稱', fromTranslation: true },
    { name: 'type', label: '類型', type: 'badge', options: LOCATION_TYPE_OPTIONS, width: '7rem' },
    { name: 'city', label: '城市', width: '8rem' },
    { name: 'phone', label: '電話', width: '10rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    { name: 'type', label: '類型', type: 'select', scope: 'base', required: true, options: LOCATION_TYPE_OPTIONS },
    { name: 'countryCode', label: '國別代碼', type: 'text', scope: 'base', maxLength: 2, placeholder: 'TW' },
    { name: 'city', label: '城市', type: 'text', scope: 'base', maxLength: 80 },
    { name: 'phone', label: '電話', type: 'text', scope: 'base', maxLength: 40 },
    { name: 'email', label: '電子郵件', type: 'email', scope: 'base', maxLength: 320 },
    { name: 'latitude', label: '緯度', type: 'number', scope: 'base' },
    { name: 'longitude', label: '經度', type: 'number', scope: 'base' },
    { name: 'mapUrl', label: '地圖連結', type: 'url', scope: 'base', maxLength: 512, wide: true },
    { name: 'mediaAssetId', label: '照片', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'name', label: '名稱', type: 'text', scope: 'translation', required: true, maxLength: 200 },
    { name: 'addressLine', label: '地址', type: 'textarea', scope: 'translation', maxLength: 400, rows: 2, wide: true },
    { name: 'note', label: '備註', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'openingHours', label: '服務時間', type: 'text', scope: 'translation', maxLength: 200 },
  ],
};

const testimonials: ResourceDef = {
  type: 'testimonials',
  label: '客戶見證',
  singular: '見證',
  screen: 'collection',
  titleField: 'quote',
  titleFromTranslation: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: '具名需要客戶書面授權；沒有授權就留空姓名，只顯示職稱與公司類型。',
  columns: [
    { name: 'quote', label: '引言', fromTranslation: true },
    { name: 'authorName', label: '姓名', fromTranslation: true, width: '9rem' },
    { name: 'solutionId', label: '關聯產業', width: '10rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    { name: 'partnerBrandId', label: '合作品牌', type: 'reference', scope: 'base', refType: 'partner-brands' },
    { name: 'solutionId', label: '關聯產業', type: 'reference', scope: 'base', refType: 'solutions' },
    { name: 'mediaAssetId', label: '照片', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'quote', label: '引言', type: 'textarea', scope: 'translation', required: true, maxLength: 1000, rows: 3, wide: true },
    { name: 'authorName', label: '姓名', type: 'text', scope: 'translation', maxLength: 120, hint: '未取得具名授權時留空。' },
    { name: 'authorTitle', label: '職稱', type: 'text', scope: 'translation', maxLength: 160 },
    { name: 'companyType', label: '公司類型', type: 'text', scope: 'translation', maxLength: 160 },
  ],
};

const partnerBrands: ResourceDef = {
  type: 'partner-brands',
  label: '合作品牌',
  singular: '品牌',
  screen: 'collection',
  titleField: 'name',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: 'Logo 牆同時出現在首頁與合作頁。',
  columns: [
    { name: 'logoMediaAssetId', label: 'Logo', type: 'thumb', width: '5rem' },
    { name: 'name', label: '品牌', fromTranslation: true },
    { name: 'isLogoWallVisible', label: '顯示於 Logo 牆', type: 'boolean', width: '9rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'logoMediaAssetId', label: 'Logo', type: 'media', scope: 'base', required: true, accept: IMAGE_ACCEPT },
    { name: 'websiteUrl', label: '官方網站', type: 'url', scope: 'base', maxLength: 512, wide: true },
    { name: 'isLogoWallVisible', label: '顯示於 Logo 牆', type: 'boolean', scope: 'base' },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'name', label: '品牌名稱', type: 'text', scope: 'translation', required: true, maxLength: 200 },
    { name: 'note', label: '說明', type: 'textarea', scope: 'translation', maxLength: 400, rows: 2, wide: true },
  ],
};

const contactChannels: ResourceDef = {
  type: 'contact-channels',
  label: '聯絡管道',
  singular: '聯絡管道',
  screen: 'collection',
  titleField: 'label',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: '聯絡頁的直接聯絡窗口；詢問單也依這裡的類型分派。',
  columns: [
    { name: 'label', label: '窗口', fromTranslation: true },
    { name: 'email', label: '電子郵件', width: '14rem' },
    { name: 'inquiryType', label: '詢問類型', type: 'badge', options: INQUIRY_TYPE_OPTIONS, width: '8rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'email', label: '電子郵件', type: 'email', scope: 'base', required: true, maxLength: 320 },
    { name: 'phone', label: '電話', type: 'text', scope: 'base', maxLength: 40 },
    { name: 'inquiryType', label: '詢問類型', type: 'select', scope: 'base', options: INQUIRY_TYPE_OPTIONS },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'label', label: '窗口名稱', type: 'text', scope: 'translation', required: true, maxLength: 120 },
    { name: 'description', label: '說明', type: 'textarea', scope: 'translation', maxLength: 400, rows: 2, wide: true },
  ],
};

const processFlows: ResourceDef = {
  type: 'process-flows',
  label: '製程流程',
  singular: '流程',
  screen: 'editor',
  titleField: 'title',
  titleFromTranslation: true,
  hasSlug: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  hasSeo: true,
  description: '五種步驟清單（核心製程、產品線製造、共同開發、OEM/ODM、詢問流程）共用一組表，用「種類」區分。',
  columns: [
    { name: 'title', label: '流程', fromTranslation: true },
    { name: 'kind', label: '種類', type: 'badge', options: PROCESS_FLOW_KIND_OPTIONS, width: '11rem' },
    { name: 'ownerCategoryId', label: '所屬產品線', width: '10rem' },
    STATUS_COLUMN,
  ],
  filters: [{ name: 'kind', label: '種類', options: PROCESS_FLOW_KIND_OPTIONS }],
  baseFields: [
    SLUG_FIELD,
    { name: 'kind', label: '種類', type: 'select', scope: 'base', required: true, options: PROCESS_FLOW_KIND_OPTIONS },
    {
      name: 'ownerCategoryId',
      label: '所屬產品線',
      type: 'reference',
      scope: 'base',
      refType: 'categories',
      hint: '只有「產品線製造流程」需要指定。',
    },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'title', label: '標題', type: 'text', scope: 'translation', required: true, maxLength: 300, wide: true },
    { name: 'subtitle', label: '副標', type: 'text', scope: 'translation', maxLength: 400, wide: true },
    { name: 'intro', label: '開場', type: 'html', scope: 'translation', wide: true },
    ...SEO_FIELDS,
  ],
  children: [
    {
      key: 'steps',
      label: '步驟',
      description: '步驟順序就是前台的顯示順序。',
      baseFields: [
        { name: 'stepNumber', label: '步驟編號', type: 'number', scope: 'base', required: true },
        { name: 'iconName', label: '圖示', type: 'icon', scope: 'base' },
        { name: 'accentColorHex', label: '色條', type: 'color', scope: 'base' },
        { name: 'mediaAssetId', label: '圖片', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
        SORT_FIELD,
      ],
      translationFields: [
        { name: 'title', label: '標題', type: 'text', scope: 'translation', required: true, maxLength: 200 },
        { name: 'body', label: '說明', type: 'textarea', scope: 'translation', maxLength: 1000, rows: 3, wide: true },
      ],
    },
  ],
};

/* --------------------------------------------------------------------------
 * 五、營運
 * ------------------------------------------------------------------------ */

const members: ResourceDef = {
  type: 'members',
  label: '會員審核',
  singular: '會員',
  screen: 'queue',
  titleField: 'fullName',
  description: '前台會員與後台使用者是兩套完全隔離的帳號系統。這裡只審核前台會員。',
  columns: [
    { name: 'fullName', label: '姓名' },
    { name: 'companyName', label: '公司', width: '12rem' },
    { name: 'email', label: '電子郵件', width: '16rem' },
    { name: 'status', label: '狀態', type: 'badge', options: MEMBER_STATUS_OPTIONS, width: '9rem' },
    { name: 'createdAt', label: '註冊時間', type: 'datetime', width: '10rem' },
  ],
  filters: [{ name: 'status', label: '狀態', options: MEMBER_STATUS_OPTIONS }],
  baseFields: [
    { name: 'fullName', label: '姓名', type: 'text', scope: 'base', readOnly: true },
    { name: 'email', label: '電子郵件', type: 'email', scope: 'base', readOnly: true },
    { name: 'companyName', label: '公司', type: 'text', scope: 'base', readOnly: true },
    { name: 'jobRole', label: '職務', type: 'select', scope: 'base', options: MEMBER_JOB_ROLE_OPTIONS, readOnly: true },
    { name: 'jobRoleOther', label: '職務（其他）', type: 'text', scope: 'base', readOnly: true },
    { name: 'phone', label: '電話', type: 'text', scope: 'base', readOnly: true },
    { name: 'countryCode', label: '國別', type: 'text', scope: 'base', readOnly: true },
    { name: 'emailVerifiedAt', label: '信箱驗證時間', type: 'datetime', scope: 'base', readOnly: true },
    { name: 'approvedAt', label: '核准時間', type: 'datetime', scope: 'base', readOnly: true },
    { name: 'lastLoginAt', label: '最後登入', type: 'datetime', scope: 'base', readOnly: true },
    {
      name: 'reviewNote',
      label: '審核備註',
      type: 'textarea',
      scope: 'base',
      maxLength: 600,
      rows: 3,
      wide: true,
      hint: '拒絕時必填；這段文字會保留在會員資料上。',
    },
  ],
  translationFields: [],
};

const sampleRequests: ResourceDef = {
  type: 'sample-requests',
  label: '樣品申請',
  singular: '樣品申請',
  screen: 'board',
  titleField: 'requestNumber',
  description: '狀態歷程用每階段一個時間戳表達，所以看板上的每一次移動都會留下時間，但不會產生歷程表。',
  columns: [
    { name: 'requestNumber', label: '單號', type: 'code', width: '11rem' },
    { name: 'memberName', label: '申請人', width: '10rem' },
    { name: 'shipToCompany', label: '收件公司', width: '12rem' },
    { name: 'status', label: '狀態', type: 'badge', options: SAMPLE_REQUEST_STATUS_OPTIONS, width: '8rem' },
    { name: 'submittedAt', label: '送出時間', type: 'datetime', width: '10rem' },
  ],
  filters: [{ name: 'status', label: '狀態', options: SAMPLE_REQUEST_STATUS_OPTIONS }],
  baseFields: [
    { name: 'status', label: '狀態', type: 'select', scope: 'base', options: SAMPLE_REQUEST_STATUS_OPTIONS, required: true },
    { name: 'carrier', label: '物流商', type: 'text', scope: 'base', maxLength: 80 },
    { name: 'trackingNumber', label: '追蹤號碼', type: 'text', scope: 'base', maxLength: 80 },
    { name: 'trackingUrl', label: '追蹤網址', type: 'url', scope: 'base', maxLength: 512, wide: true },
    {
      name: 'rejectionReason',
      label: '拒絕理由',
      type: 'textarea',
      scope: 'base',
      maxLength: 600,
      rows: 2,
      wide: true,
      hint: '狀態改為「已拒絕」時必填，會回覆給申請人。',
    },
    { name: 'internalNote', label: '內部備註', type: 'textarea', scope: 'base', rows: 3, wide: true, hint: '只有後台看得到。' },
    { name: 'externalOrderNumber', label: 'ERP 單號', type: 'text', scope: 'base', maxLength: 64 },
  ],
  translationFields: [],
};

const contactInquiries: ResourceDef = {
  type: 'contact-inquiries',
  label: '詢問單',
  singular: '詢問單',
  screen: 'inbox',
  titleField: 'referenceNumber',
  description: '聯絡頁與 Header 的聯絡抽屜是同一個表單、同一個端點，所以詢問單都落在這裡。',
  columns: [
    { name: 'referenceNumber', label: '編號', type: 'code', width: '12rem' },
    { name: 'name', label: '姓名', width: '9rem' },
    { name: 'companyName', label: '公司', width: '12rem' },
    { name: 'type', label: '類型', type: 'badge', options: INQUIRY_TYPE_OPTIONS, width: '7rem' },
    { name: 'status', label: '狀態', type: 'badge', options: INQUIRY_STATUS_OPTIONS, width: '7rem' },
    { name: 'createdAt', label: '收到時間', type: 'datetime', width: '10rem' },
  ],
  filters: [
    { name: 'status', label: '狀態', options: INQUIRY_STATUS_OPTIONS },
    { name: 'type', label: '類型', options: INQUIRY_TYPE_OPTIONS },
  ],
  baseFields: [
    { name: 'status', label: '狀態', type: 'select', scope: 'base', options: INQUIRY_STATUS_OPTIONS, required: true },
    { name: 'assignedChannelId', label: '分派窗口', type: 'reference', scope: 'base', refType: 'contact-channels' },
    { name: 'internalNote', label: '內部備註', type: 'textarea', scope: 'base', rows: 4, wide: true },
    { name: 'respondedAt', label: '回覆時間', type: 'datetime', scope: 'base', readOnly: true },
  ],
  translationFields: [],
};

const businessDomains: ResourceDef = {
  type: 'business-domains',
  label: '企業網域規則',
  singular: '網域規則',
  screen: 'collection',
  titleField: 'domain',
  description: '註冊時先比對網域：封鎖的直接擋下不建帳號，自動核准的驗證信箱後即成為正式會員。',
  columns: [
    { name: 'domain', label: '網域', type: 'code' },
    { name: 'rule', label: '規則', type: 'badge', options: BUSINESS_DOMAIN_RULE_OPTIONS, width: '9rem' },
    { name: 'note', label: '備註' },
    UPDATED_COLUMN,
  ],
  filters: [{ name: 'rule', label: '規則', options: BUSINESS_DOMAIN_RULE_OPTIONS }],
  baseFields: [
    { name: 'domain', label: '網域', type: 'text', scope: 'base', required: true, maxLength: 255, placeholder: 'example.com' },
    { name: 'rule', label: '規則', type: 'select', scope: 'base', required: true, options: BUSINESS_DOMAIN_RULE_OPTIONS },
    { name: 'note', label: '備註', type: 'textarea', scope: 'base', maxLength: 300, rows: 2, wide: true },
  ],
  translationFields: [],
};

/* --------------------------------------------------------------------------
 * 六、站台
 * ------------------------------------------------------------------------ */

const navigation: ResourceDef = {
  type: 'navigation',
  label: '導覽選單',
  singular: '選單項目',
  screen: 'ordered',
  titleField: 'label',
  titleFromTranslation: true,
  hasStatus: true,
  hasSort: true,
  hasTranslations: true,
  description: '選單項目指向「內容實體」而不是硬寫網址 —— 實體改 slug 時選單會自己跟著改。',
  columns: [
    { name: 'label', label: '文字', fromTranslation: true },
    { name: 'location', label: '位置', type: 'badge', options: NAVIGATION_LOCATION_OPTIONS, width: '11rem' },
    { name: 'linkType', label: '連結方式', type: 'badge', options: LINK_TARGET_TYPE_OPTIONS, width: '10rem' },
    STATUS_COLUMN,
  ],
  filters: [{ name: 'location', label: '位置', options: NAVIGATION_LOCATION_OPTIONS }],
  baseFields: [
    { name: 'location', label: '位置', type: 'select', scope: 'base', required: true, options: NAVIGATION_LOCATION_OPTIONS },
    { name: 'parentId', label: '上層項目', type: 'reference', scope: 'base', refType: 'navigation' },
    { name: 'linkType', label: '連結方式', type: 'select', scope: 'base', required: true, options: LINK_TARGET_TYPE_OPTIONS },
    {
      name: 'url',
      label: '網址／錨點',
      type: 'text',
      scope: 'base',
      maxLength: 512,
      wide: true,
      visibleWhen: (values) => values.linkType === 'external' || values.linkType === 'anchor' || values.linkType === 'internal',
    },
    ...(
      [
        ['refPageId', '指向頁面', 'pages'],
        ['refCategoryId', '指向產品線', 'categories'],
        ['refProductId', '指向產品', 'products'],
        ['refSolutionId', '指向解決方案', 'solutions'],
        ['refArticleId', '指向文章', 'articles'],
        ['refDownloadId', '指向下載', 'downloads'],
      ] as const
    ).map(([name, label, refType]): FieldDef => ({
      name,
      label,
      type: 'reference',
      scope: 'base',
      refType,
      visibleWhen: (values) => values.linkType === 'entityRef',
    })),
    { name: 'iconName', label: '圖示', type: 'icon', scope: 'base' },
    { name: 'openInNewTab', label: '另開分頁', type: 'boolean', scope: 'base' },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'label', label: '選單文字', type: 'text', scope: 'translation', required: true, maxLength: 120 },
    { name: 'note', label: '子項說明', type: 'text', scope: 'translation', maxLength: 200, wide: true },
    { name: 'menuTitle', label: 'Mega menu 標題', type: 'text', scope: 'translation', maxLength: 200, wide: true },
    { name: 'ariaLabel', label: '無障礙標籤', type: 'text', scope: 'translation', maxLength: 200, wide: true },
  ],
};

const redirects: ResourceDef = {
  type: 'redirects',
  label: '轉址（301）',
  singular: '轉址',
  screen: 'collection',
  titleField: 'fromPath',
  description: '轉址不可成鏈也不可成環：新增 A→B 時若已有 B→C，系統會直接寫成 A→C。',
  columns: [
    { name: 'fromPath', label: '來源路徑', type: 'code' },
    { name: 'toPath', label: '目標路徑', type: 'code' },
    { name: 'statusCode', label: '狀態碼', type: 'badge', options: REDIRECT_STATUS_OPTIONS, width: '8rem' },
    { name: 'isEnabled', label: '啟用', type: 'boolean', width: '5rem' },
  ],
  filters: [{ name: 'statusCode', label: '狀態碼', options: REDIRECT_STATUS_OPTIONS }],
  baseFields: [
    {
      name: 'fromPath',
      label: '來源路徑',
      type: 'text',
      scope: 'base',
      required: true,
      maxLength: 512,
      wide: true,
      placeholder: '/store/anti-glare-film.html',
      hint: '會自動正規化為小寫、去除結尾斜線。',
    },
    { name: 'toPath', label: '目標路徑', type: 'text', scope: 'base', required: true, maxLength: 512, wide: true, placeholder: '/en/products/optical-film' },
    { name: 'statusCode', label: '狀態碼', type: 'select', scope: 'base', required: true, options: REDIRECT_STATUS_OPTIONS },
    { name: 'targetCulture', label: '目標語系', type: 'select', scope: 'base', options: [], hint: '來源路徑沒有語系前綴時要指定。' },
    { name: 'isEnabled', label: '啟用', type: 'boolean', scope: 'base' },
    { name: 'notes', label: '備註', type: 'textarea', scope: 'base', maxLength: 400, rows: 2, wide: true },
  ],
  translationFields: [],
};

const siteSettings: ResourceDef = {
  type: 'site-settings',
  label: '站台設定',
  singular: '設定',
  screen: 'settings',
  titleField: 'key',
  adminOnly: true,
  hasTranslations: true,
  description: '預設 SEO 樣板、Organization 結構化資料、分析碼、發布後失效的 webhook 目標。',
  columns: [
    { name: 'key', label: '設定鍵', type: 'code', width: '18rem' },
    { name: 'value', label: '值' },
    { name: 'valueKind', label: '型別', type: 'badge', options: SETTING_VALUE_KIND_OPTIONS, width: '7rem' },
    { name: 'isLocalized', label: '分語系', type: 'boolean', width: '6rem' },
  ],
  baseFields: [
    { name: 'key', label: '設定鍵', type: 'text', scope: 'base', required: true, maxLength: 100, readOnly: true },
    { name: 'valueKind', label: '型別', type: 'select', scope: 'base', options: SETTING_VALUE_KIND_OPTIONS },
    { name: 'isLocalized', label: '分語系', type: 'boolean', scope: 'base' },
    { name: 'value', label: '值', type: 'textarea', scope: 'base', rows: 3, wide: true },
  ],
  translationFields: [{ name: 'value', label: '值', type: 'textarea', scope: 'translation', rows: 3, wide: true }],
};

/**
 * 媒體檔案。
 *
 * <p>
 * **沒有獨立的「媒體庫」畫面**——檔案一律從用到它的欄位直接上傳（見 `FieldControl`
 * 的 `MediaControl`），上傳完就綁在那個欄位上。這裡保留資源定義，是因為欄位要靠
 * `GET /admin/media/{id}` 把已選檔案的檔名與縮圖讀回來，列表與刪除端點也還在。
 * </p>
 *
 * <p>
 * 二進位檔案存 Blob Storage，資料庫只留位址；限會員文件存私有容器，只能靠 SAS 連結取得。
 * </p>
 */
const media: ResourceDef = {
  type: 'media',
  label: '媒體檔案',
  singular: '媒體',
  screen: 'editor',
  titleField: 'fileName',
  description: '從各欄位直接上傳；這裡不提供獨立的瀏覽畫面。',
  columns: [
    { name: 'url', label: '預覽', type: 'thumb', width: '5rem' },
    { name: 'fileName', label: '檔名' },
    { name: 'type', label: '類型', type: 'badge', options: MEDIA_TYPE_OPTIONS, width: '7rem' },
    { name: 'fileSizeBytes', label: '大小', type: 'number', width: '7rem', align: 'end' },
    { name: 'isPrivate', label: '私有', type: 'boolean', width: '5rem' },
    { name: 'createdAt', label: '上傳時間', type: 'datetime', width: '10rem' },
  ],
  filters: [{ name: 'type', label: '類型', options: MEDIA_TYPE_OPTIONS }],
  baseFields: [
    { name: 'fileName', label: '檔名', type: 'text', scope: 'base', readOnly: true },
    { name: 'container', label: '容器', type: 'text', scope: 'base', readOnly: true },
    { name: 'mimeType', label: 'MIME', type: 'text', scope: 'base', readOnly: true },
    { name: 'fileSizeBytes', label: '大小（bytes）', type: 'number', scope: 'base', readOnly: true },
    { name: 'width', label: '寬', type: 'number', scope: 'base', readOnly: true },
    { name: 'height', label: '高', type: 'number', scope: 'base', readOnly: true },
    { name: 'focalPointX', label: '焦點 X', type: 'number', scope: 'base', hint: '0–1，決定裁切時保留哪個位置。' },
    { name: 'focalPointY', label: '焦點 Y', type: 'number', scope: 'base' },
    { name: 'isArchived', label: '封存', type: 'boolean', scope: 'base' },
  ],
  translationFields: [
    { name: 'altText', label: '替代文字', type: 'text', scope: 'translation', maxLength: 300, wide: true, hint: '無障礙與 SEO 都靠它，別留空。' },
    { name: 'caption', label: '圖說', type: 'textarea', scope: 'translation', maxLength: 600, rows: 2, wide: true },
    { name: 'title', label: '標題', type: 'text', scope: 'translation', maxLength: 200 },
  ],
};

const users: ResourceDef = {
  type: 'users',
  label: '後台使用者',
  singular: '使用者',
  screen: 'collection',
  titleField: 'displayName',
  adminOnly: true,
  description: '後台帳號與前台會員完全隔離：不同表、不同簽章金鑰，拿對方的 token 一律被拒。登入一律用帳號，不是信箱。',
  columns: [
    { name: 'username', label: '帳號', width: '12rem' },
    { name: 'displayName', label: '名稱' },
    { name: 'roles', label: '角色', type: 'badge', width: '10rem' },
    { name: 'isActive', label: '啟用', type: 'boolean', width: '5rem' },
    { name: 'lastLoginAt', label: '最後登入', type: 'datetime', width: '10rem' },
  ],
  baseFields: [
    {
      name: 'username',
      label: '帳號',
      type: 'text',
      scope: 'base',
      required: true,
      maxLength: 64,
      hint: '登入用。英文、數字與 . _ -，3–64 個字元。建立後可以改，改完對方要用新帳號登入。',
    },
    {
      name: 'password',
      label: '密碼',
      type: 'password',
      scope: 'base',
      hint: '至少 12 個字元。新帳號必填；編輯時留空表示不變更，填了就等於替對方重設密碼並登出他所有裝置。',
    },
    { name: 'displayName', label: '名稱', type: 'text', scope: 'base', required: true, maxLength: 160 },
    {
      name: 'email',
      label: '聯絡信箱',
      type: 'email',
      scope: 'base',
      maxLength: 320,
      hint: '選填，只是聯絡方式——後台不寄信，也不能拿它登入。',
    },
    { name: 'roles', label: '角色', type: 'multiReference', scope: 'base', options: ROLE_OPTIONS, wide: true },
    { name: 'isActive', label: '啟用', type: 'boolean', scope: 'base' },
    {
      name: 'mustChangePassword',
      label: '下次登入須改密碼',
      type: 'boolean',
      scope: 'base',
      hint: '重設密碼後打開，讓對方自己設定新密碼。',
    },
    { name: 'lockoutEndsAt', label: '鎖定至', type: 'datetime', scope: 'base', readOnly: true },
    { name: 'lastLoginAt', label: '最後登入', type: 'datetime', scope: 'base', readOnly: true },
  ],
  translationFields: [],
};

/* --------------------------------------------------------------------------
 * 匯出
 * ------------------------------------------------------------------------ */

export const RESOURCES: ResourceDef[] = [
  categories,
  products,
  solutions,
  articles,
  pages,
  exhibitions,
  faqCategories,
  faqItems,
  downloads,
  articleTags,
  authors,
  certifications,
  milestones,
  locations,
  testimonials,
  partnerBrands,
  contactChannels,
  processFlows,
  members,
  sampleRequests,
  contactInquiries,
  businessDomains,
  navigation,
  redirects,
  siteSettings,
  media,
  users,
];

const BY_TYPE = new Map(RESOURCES.map((resource) => [resource.type, resource]));

export function resourceOf(type: string): ResourceDef | undefined {
  return BY_TYPE.get(type);
}
