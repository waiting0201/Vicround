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
  /** 有 Draft / Published 狀態與發布動作。 */
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
  {
    name: 'seoTitle',
    label: '搜尋結果標題',
    type: 'text',
    scope: 'translation',
    maxLength: 200,
    hint: '出現在瀏覽器分頁與 Google 搜尋結果第一行。留空就自動用上面的標題，通常已經夠用，只有想在搜尋結果特別強調關鍵字時才需要另外填。',
  },
  {
    name: 'seoDescription',
    label: '搜尋結果說明',
    type: 'textarea',
    scope: 'translation',
    maxLength: 400,
    rows: 2,
    wide: true,
    hint: 'Google 搜尋結果標題下面那兩三行說明文字。留空就顯示「站台設定」裡的全站預設說明；每頁自己填一段更貼切的話比較容易吸引人點進來，80–160 個字元最理想。',
  },
  {
    name: 'seoKeywords',
    label: 'SEO 關鍵字',
    type: 'text',
    scope: 'translation',
    maxLength: 400,
    wide: true,
    hint: '內部備忘用，目前搜尋引擎排名已經不看這欄，留空不會影響曝光。',
  },
  {
    name: 'ogImageMediaAssetId',
    label: '社群分享縮圖（OG 圖片）',
    type: 'media',
    scope: 'translation',
    accept: IMAGE_ACCEPT,
    hint: '把這一頁的網址貼到 LINE、Facebook、LinkedIn 時跳出來的那張圖。留空就用「站台設定」裡的全站預設圖，建議尺寸 1200×630。',
  },
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
  description:
    '產品分類樹：三條產品線（Optical Film／Textile & Foam／Acoustic）與其下的子分類。這裡的 slug 會組成產品頁網址，例如 vicround.com/products/optical-film 裡的「optical-film」。',
  columns: [
    { name: 'name', label: '名稱', fromTranslation: true },
    { name: 'type', label: '產品線', type: 'badge', options: CATEGORY_TYPE_OPTIONS, width: '12rem' },
    { name: 'slug', label: '網址片段', type: 'code', width: '12rem' },
    STATUS_COLUMN,
    UPDATED_COLUMN,
  ],
  filters: [{ name: 'type', label: '產品線', options: CATEGORY_TYPE_OPTIONS }],
  baseFields: [
    SLUG_FIELD,
    {
      name: 'type',
      label: '產品線',
      type: 'select',
      scope: 'base',
      required: true,
      options: CATEGORY_TYPE_OPTIONS,
      hint: '這筆屬於三條產品線的哪一條，決定它出現在網站上的哪個大分類底下。',
    },
    {
      name: 'parentId',
      label: '上層分類',
      type: 'reference',
      scope: 'base',
      refType: 'categories',
      hint: '產品線本身（最上層）留空；子分類要選它所屬的產品線，否則不會出現在正確的選單位置。',
    },
    {
      name: 'accentColorHex',
      label: '主色',
      type: 'color',
      scope: 'base',
      hint: '這條產品線在網站上的識別色（例如清單裡的色點）。色號來自公司識別手冊（CIS），不要自己配色，要改請先跟負責品牌規範的人確認。',
    },
    { name: 'iconName', label: '圖示', type: 'icon', scope: 'base', hint: '選單與卡片上代表這條產品線的小圖示。' },
    {
      name: 'heroMediaAssetId',
      label: '主視覺',
      type: 'media',
      scope: 'base',
      accept: IMAGE_ACCEPT,
      hint: '這條產品線頁面最上方的大幅橫幅照片。',
    },
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
      description: '產品線頁的「共同規格」表格，一列一個規格項目。同一種表也用在「產品」與「解決方案」的規格列，欄位形狀相同。',
      baseFields: [
        { name: 'isHighlighted', label: '列為亮點', type: 'boolean', scope: 'base', hint: '打開後這一列會用特別樣式凸顯出來，用在最想讓人注意到的規格。' },
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
  description:
    '產品與細分型號。細分型號用「上層產品」掛在一個大類商品之下（例如某系列的 A 款、B 款）；產品清單卡片只會顯示沒有上層的那一筆大類商品，細分型號要點進去才看得到。',
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
    { name: 'code', label: '型號短碼', type: 'text', scope: 'base', maxLength: 32, placeholder: 'VR-AC 360-A', hint: '型錄與訂購用的短碼，非必填。' },
    { name: 'brand', label: '品牌', type: 'text', scope: 'base', maxLength: 80, placeholder: 'FlexCore™' },
    { name: 'isFeatured', label: '精選（首頁／熱銷）', type: 'boolean', scope: 'base', hint: '打開後這個產品會出現在首頁與熱銷區塊。' },
    { name: 'isNew', label: '標記 New', type: 'boolean', scope: 'base', hint: '打開後產品卡片會顯示「New」標籤，沒有自動到期，記得之後手動關掉。' },
    {
      name: 'heroMediaAssetId',
      label: '主視覺',
      type: 'media',
      scope: 'base',
      accept: IMAGE_ACCEPT,
      hint: '產品卡片與產品頁最上方使用的主要照片。',
    },
    { name: 'gallery', label: '產品圖庫', type: 'mediaList', scope: 'base', wide: true, accept: IMAGE_ACCEPT, hint: '產品頁的多張圖／輪播圖，可以放好幾張。' },
    {
      name: 'solutionIds',
      label: '關聯產業',
      type: 'multiReference',
      scope: 'base',
      refType: 'solutions',
      wide: true,
      hint: '這個產品適用的產業，會出現在對應產業頁的「相關產品」。',
    },
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
      description:
        '產品的規格數據（例如厚度、透光率）。這裡填的內容會被搜尋引擎讀取為產品結構化資料，也是會員區完整公差表的來源——請填實際數據，不是排版用的文字。',
      baseFields: [
        { name: 'isHighlighted', label: '卡片亮點', type: 'boolean', scope: 'base', hint: '打開後這項規格會出現在產品卡片上，不用點進詳情頁就看得到。' },
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
  description:
    '七個產業頁（例如汽車、建築）。每頁固定分成四段：客戶遇到的課題、我們怎麼解決、關鍵規格、為什麼選我們——欄位跟「產品線」不一樣，所以是獨立的一組資料，不能互通。',
  columns: [
    { name: 'name', label: '名稱', fromTranslation: true },
    { name: 'slug', label: '網址片段', type: 'code', width: '14rem' },
    { name: 'isNew', label: 'New', type: 'boolean', width: '5rem' },
    STATUS_COLUMN,
    UPDATED_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'iconName', label: '圖示', type: 'icon', scope: 'base', hint: '選單與卡片上代表這個產業的小圖示。' },
    { name: 'isNew', label: '索引卡標記 New', type: 'boolean', scope: 'base', hint: '打開後索引卡會顯示「New」標籤，沒有自動到期，記得之後手動關掉。' },
    {
      name: 'heroMediaAssetId',
      label: '主視覺',
      type: 'media',
      scope: 'base',
      accept: IMAGE_ACCEPT,
      hint: '這個產業頁面最上方的大幅橫幅照片。',
    },
    {
      name: 'categoryIds',
      label: '相關產品線',
      type: 'multiReference',
      scope: 'base',
      refType: 'categories',
      wide: true,
      hint: '這個產業會出現在這裡勾選的產品線頁面的「相關產業」。',
    },
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
      description: '產業頁的「關鍵規格」表格，列出這個產業最在意的幾項規格數據。',
      baseFields: [
        { name: 'isHighlighted', label: '列為亮點', type: 'boolean', scope: 'base', hint: '打開後這一列會用特別樣式凸顯出來，用在最想讓人注意到的規格。' },
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
  description:
    '公司新聞、產業洞察、技術文章都在這裡管理。上面選的「文章類型」決定網址開頭是 /news、/insights 還是 /blog，改類型等於改網址，系統會自動補一筆 301 轉址。',
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
    { name: 'authorId', label: '作者', type: 'reference', scope: 'base', refType: 'authors', hint: '留空的話文章頁不會顯示作者署名。' },
    {
      name: 'exhibitionId',
      label: '關聯展會',
      type: 'reference',
      scope: 'base',
      refType: 'exhibitions',
      hint: '類型選「展會」時要連到對應的展會，讓搜尋引擎讀得到正確的活動日期與地點。',
    },
    {
      name: 'heroMediaAssetId',
      label: '主視覺',
      type: 'media',
      scope: 'base',
      accept: IMAGE_ACCEPT,
      hint: '文章列表卡片與文章頁最上方使用的圖片。',
    },
    { name: 'readingMinutes', label: '閱讀分鐘數', type: 'number', scope: 'base', hint: '顯示在文章頁「閱讀時間」；留空就不顯示。' },
    { name: 'isFeatured', label: '資源中心置頂', type: 'boolean', scope: 'base' },
    {
      name: 'publishedAt',
      label: '發布時間',
      type: 'datetime',
      scope: 'base',
      hint: '文章的發布時間同時決定可見性與排序：時間未到不會出現在前台，就算狀態是「已發布」也一樣。',
    },
    {
      name: 'tagIds',
      label: '標籤',
      type: 'multiReference',
      scope: 'base',
      refType: 'article-tags',
      wide: true,
      hint: '產品線與產業請用下面兩個欄位，這裡只勾選沒有專屬分類的行銷標籤。',
    },
    {
      name: 'categoryIds',
      label: '產品線標籤',
      type: 'multiReference',
      scope: 'base',
      refType: 'categories',
      wide: true,
      hint: '讓這篇文章可以被依產品線篩選，並出現在該產品線頁面的相關文章。',
    },
    {
      name: 'solutionIds',
      label: '產業標籤',
      type: 'multiReference',
      scope: 'base',
      refType: 'solutions',
      wide: true,
      hint: '讓這篇文章可以被依產業篩選，並出現在該產業頁面的相關文章。',
    },
    {
      name: 'productIds',
      label: '相關產品',
      type: 'multiReference',
      scope: 'base',
      refType: 'products',
      wide: true,
      hint: '會顯示在文章頁的「相關產品」區塊。',
    },
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
  description:
    '網站固定頁面的文字與版塊（例如首頁、關於我們、隱私權）。系統頁面（見下方「系統頁」欄位）不能被刪除；「版型」決定這頁在前台用哪種版面樣式呈現。',
  columns: [
    { name: 'title', label: '標題', fromTranslation: true },
    { name: 'slug', label: '網址片段', type: 'code', width: '12rem' },
    { name: 'template', label: '版型', type: 'badge', options: PAGE_TEMPLATE_OPTIONS, width: '10rem' },
    STATUS_COLUMN,
    UPDATED_COLUMN,
  ],
  filters: [{ name: 'template', label: '版型', options: PAGE_TEMPLATE_OPTIONS }],
  baseFields: [
    SLUG_FIELD,
    {
      name: 'template',
      label: '版型',
      type: 'select',
      scope: 'base',
      required: true,
      options: PAGE_TEMPLATE_OPTIONS,
      hint: '決定這頁在前台用哪一種版面樣式呈現。新增後不要隨意更換——版塊不會自動跟著調整，已經編好的內容可能會排得不對。',
    },
    {
      name: 'parentPageId',
      label: '上層頁面',
      type: 'reference',
      scope: 'base',
      refType: 'pages',
      hint: '大多數頁面留空；只有這頁是某個頁面底下的子頁（例如法律條文的子條款）時才需要選。',
    },
    {
      name: 'isSystemPage',
      label: '系統頁',
      type: 'boolean',
      scope: 'base',
      readOnly: true,
      hint: '首頁、隱私權、聯絡等頁面不可刪除。這格由系統設定，後台無法勾選或取消。',
    },
    {
      name: 'heroMediaAssetId',
      label: '主視覺',
      type: 'media',
      scope: 'base',
      accept: IMAGE_ACCEPT,
      hint: '這頁最上方橫幅使用的大幅照片。',
    },
    SORT_FIELD,
  ],
  translationFields: [
    {
      name: 'title',
      label: '頁面標題',
      type: 'text',
      scope: 'translation',
      required: true,
      maxLength: 300,
      wide: true,
      hint: '瀏覽器分頁與導覽麵包屑顯示的名稱。頁面最上方橫幅裡的大標題請填下面的「Banner 標題」，兩者可以不一樣。',
    },
    { name: 'eyebrow', label: '眉標', type: 'text', scope: 'translation', maxLength: 120, hint: '大標題上方的一小行前導文字，非必填。' },
    { name: 'subtitle', label: '副標', type: 'text', scope: 'translation', maxLength: 400, hint: '頁面標題下方的一小段補充説明。' },
    {
      name: 'bannerTitle',
      label: 'Banner 標題',
      type: 'text',
      scope: 'translation',
      maxLength: 300,
      hint: '頁面最上方橫幅裡的視覺大標題。留空的話橫幅會改顯示上面的「頁面標題」。',
    },
    {
      name: 'bannerDescription',
      label: 'Banner 說明',
      type: 'textarea',
      scope: 'translation',
      maxLength: 600,
      rows: 2,
      hint: '橫幅標題下方的一段說明文字。',
    },
    {
      name: 'ctaEyebrow',
      label: 'CTA 眉標',
      type: 'text',
      scope: 'translation',
      maxLength: 120,
      hint: '頁面底部「行動呼籲」區塊（例如「立即聯絡我們」）的前導文字，這一頁不需要的話整組 CTA 欄位都可以留空。',
    },
    { name: 'ctaHeadline', label: 'CTA 標題', type: 'text', scope: 'translation', maxLength: 300 },
    { name: 'ctaSubcopy', label: 'CTA 副文', type: 'textarea', scope: 'translation', maxLength: 400, rows: 2 },
    { name: 'body', label: '長文內容', type: 'html', scope: 'translation', wide: true, hint: '隱私權這類純長文可以直接寫在這裡，不用另外加版塊。' },
    {
      name: 'lastReviewedLabel',
      label: '更新日期標示',
      type: 'text',
      scope: 'translation',
      maxLength: 80,
      hint: '顯示在頁尾的「最後更新」文字，法律類頁面（隱私權、服務條款）才需要填，一般頁面留空即可。',
    },
    ...SEO_FIELDS,
  ],
  children: [
    {
      key: 'blocks',
      label: '版塊',
      description:
        '這頁由上而下的內容區塊。有兩種：「內容版塊」（長文、圖庫、CTA…）直接在下面填文字；「認證清單」「里程碑時間軸」這類「參照版塊」不用填文字，資料自動來自對應的管理畫面（例如改認證內容請去「認證管理」，這裡只設定要抓哪個分類、顯示幾筆）。',
      baseFields: [
        {
          name: 'blockType',
          label: '版塊類型',
          type: 'select',
          scope: 'base',
          required: true,
          options: BLOCK_TYPE_OPTIONS,
          hint: '選到「清單」「時間軸」這類名稱的版塊時，內容不是自己打字，而是自動抓對應管理畫面的資料（見上方說明）。',
        },
        {
          name: 'anchor',
          label: '錨點',
          type: 'text',
          scope: 'base',
          maxLength: 64,
          hint: '網址加 #esg 這種頁內定位用的英文代號，同一頁內不可以重複，例：esg。非必填。',
        },
        { name: 'tone', label: '底色', type: 'select', scope: 'base', options: BLOCK_TONE_OPTIONS, hint: '這個版塊要用深色還是淺色底，留空跟隨前一個版塊。' },
        { name: 'mediaAssetId', label: '圖片', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
        {
          name: 'settingsJson',
          label: '查詢條件（JSON）',
          type: 'json',
          scope: 'base',
          wide: true,
          hint: '只有「參照版塊」（清單、時間軸類）需要填，用來設定要抓哪些資料，例如認證清單要抓的分類、要顯示幾筆。一般文字版塊不要動這裡；格式打錯會讓版塊在前台完全顯示不出來，且不會提示要修哪裡。這欄不會被翻譯，不要放任何中英文展示文字。',
        },
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
  description:
    '展會會依日期自動判斷是「即將登場」還是「已結束」，結束日一過就自動歸類到「展會紀錄」——所以不需要另外手動勾選「精選」或「置頂」。',
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
    {
      name: 'endDate',
      label: '結束日期',
      type: 'date',
      scope: 'base',
      required: true,
      hint: '這天一過，展會會自動從「即將登場」移到「展會紀錄」。',
    },
    { name: 'boothNumber', label: '攤位號', type: 'text', scope: 'base', maxLength: 32 },
    { name: 'city', label: '城市', type: 'text', scope: 'base', maxLength: 80 },
    {
      name: 'countryCode',
      label: '國別代碼',
      type: 'text',
      scope: 'base',
      maxLength: 2,
      placeholder: 'TW',
      hint: '兩碼英文國家代碼，例如台灣是 TW、日本是 JP。',
    },
    {
      name: 'websiteUrl',
      label: '官方網站',
      type: 'url',
      scope: 'base',
      maxLength: 512,
      wide: true,
      hint: '完整網址，要以 https:// 開頭。',
    },
    {
      name: 'meetingUrl',
      label: '預約洽談連結',
      type: 'url',
      scope: 'base',
      maxLength: 512,
      wide: true,
      hint: '訪客可以線上預約攤位洽談的連結，完整網址，要以 https:// 開頭。留空就不顯示預約按鈕。',
    },
    {
      name: 'heroMediaAssetId',
      label: '主視覺',
      type: 'media',
      scope: 'base',
      accept: IMAGE_ACCEPT,
      hint: '展會頁最上方使用的橫幅照片。',
    },
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
  description: 'FAQ 頁面最上方的分類頁籤（例如「產品」「訂購」「技術支援」）。這裡排的順序，就是前台頁籤顯示的順序。',
  columns: [
    { name: 'name', label: '分類名稱', fromTranslation: true },
    { name: 'slug', label: '網址片段', type: 'code', width: '12rem' },
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
  description:
    '每一題 FAQ 都會被 Google 與 AI 助理直接讀取、顯示在搜尋結果裡，所以答案要寫成完整、乾淨的句子，不要用表格或花俏排版——排版做得再漂亮，被抓取出來一樣是一團純文字。',
  columns: [
    { name: 'question', label: '問題', fromTranslation: true },
    { name: 'faqCategoryId', label: '分類', width: '10rem' },
    { name: 'isFeatured', label: '精選', type: 'boolean', width: '5rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    {
      name: 'faqCategoryId',
      label: '分類',
      type: 'reference',
      scope: 'base',
      refType: 'faq-categories',
      required: true,
      hint: '決定這一題出現在 FAQ 頁的哪個分類頁籤下。',
    },
    SLUG_FIELD,
    { name: 'isFeatured', label: '資源中心顯示', type: 'boolean', scope: 'base', hint: '打開後也會出現在「資源中心」首頁的精選問答。' },
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
      hint: '站內連結請用上面的欄位直接選頁面／產品／解決方案，不要自己貼站內網址——用選的話，目標改 slug 時連結會自動跟著走；這裡只用來填站外網址，且要以 https:// 開頭。',
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
  description:
    '可以發布給前台或會員下載的文件（規格書、型錄、證書等），各自有版本號、效期與存取層級。同一份文件如果出了新版本，要新增一筆新的下載項目，不是覆蓋原本那筆——這樣舊版本連結才不會失效。',
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
    { name: 'validUntil', label: '有效至', type: 'date', scope: 'base', hint: '過期後自動不列出，不用手動下架。' },
    {
      name: 'documentCulture',
      label: '檔案語言',
      type: 'select',
      scope: 'base',
      options: [],
      hint: '這份檔案本身的語言（例如 PDF 內文是英文還是中文），留空表示語言中立（例如純圖表、無文字的檔案）。',
    },
    { name: 'thumbnailMediaAssetId', label: '縮圖', type: 'media', scope: 'base', accept: IMAGE_ACCEPT, hint: '下載清單裡顯示的小圖，留空會用預設圖示。' },
    {
      name: 'productIds',
      label: '關聯產品',
      type: 'multiReference',
      scope: 'base',
      refType: 'products',
      wide: true,
      hint: '這份文件會出現在勾選的產品頁面的「下載」區塊。',
    },
    {
      name: 'categoryIds',
      label: '關聯產品線',
      type: 'multiReference',
      scope: 'base',
      refType: 'categories',
      wide: true,
      hint: '這份文件會出現在勾選的產品線頁面的「下載」區塊。',
    },
    {
      name: 'solutionIds',
      label: '關聯解決方案',
      type: 'multiReference',
      scope: 'base',
      refType: 'solutions',
      wide: true,
      hint: '這份文件會出現在勾選的產業頁面的「下載」區塊。',
    },
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
  description:
    '自由標籤只用在沒有專屬分類的行銷關鍵字（例如活動名稱）。產品線與產業請直接在文章編輯頁挑選對應欄位，不要在這裡重複建立一次。',
  columns: [
    { name: 'name', label: '標籤', fromTranslation: true },
    { name: 'slug', label: '網址片段', type: 'code', width: '12rem' },
    { name: 'isSystem', label: '系統', type: 'boolean', width: '5rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    {
      name: 'isSystem',
      label: '系統標籤',
      type: 'boolean',
      scope: 'base',
      readOnly: true,
      hint: '系統自動建立的標籤，這格由系統設定，後台無法勾選或取消。',
    },
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
  description: '文章作者的署名資料。姓名與職稱要分別填 en／繁中兩個語系；縮寫與照片兩個語系共用同一份，不用重複填。',
  columns: [
    { name: 'name', label: '姓名', fromTranslation: true },
    { name: 'initials', label: '縮寫', type: 'code', width: '5rem' },
    { name: 'jobTitle', label: '職稱', fromTranslation: true },
    STATUS_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'initials', label: '縮寫', type: 'text', scope: 'base', maxLength: 4, hint: '沒有照片時顯示的圓形縮寫，例如「TW」。' },
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
    '一筆認證資料會同時顯示在四個地方：永續頁的認證卡、關於我們、技術頁的合規表、以及認證彈窗——這四處都是抓同一份資料，改這裡四邊都會跟著換，不需要（也不要）在任何頁面裡另外重複輸入一次。',
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
    {
      name: 'downloadId',
      label: '證書 PDF',
      type: 'reference',
      scope: 'base',
      refType: 'downloads',
      hint: '連到「下載中心」裡的證書檔案，前台認證卡的下載按鈕會用它；要先在下載中心建好那筆文件才能在這裡選到。',
    },
    { name: 'logoMediaAssetId', label: '標章圖', type: 'media', scope: 'base', accept: IMAGE_ACCEPT },
    {
      name: 'productIds',
      label: '涵蓋產品',
      type: 'multiReference',
      scope: 'base',
      refType: 'products',
      wide: true,
      hint: '這張認證會出現在勾選的產品頁面的合規資訊。',
    },
    {
      name: 'categoryIds',
      label: '涵蓋產品線',
      type: 'multiReference',
      scope: 'base',
      refType: 'categories',
      wide: true,
      hint: '這張認證會出現在勾選的產品線頁面的合規資訊。',
    },
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
  description: '「關於我們」頁面的歷程時間軸，一筆代表一個事件（例如創立、拿到某張認證），依年份排序顯示。',
  columns: [
    { name: 'year', label: '年份', type: 'number', width: '6rem' },
    { name: 'title', label: '事件', fromTranslation: true },
    STATUS_COLUMN,
  ],
  baseFields: [
    { name: 'year', label: '年份', type: 'number', scope: 'base', required: true, hint: '西元四位數年份，例：1998。' },
    { name: 'month', label: '月份', type: 'number', scope: 'base', hint: '非必填，只用來在同一年多筆事件時決定先後順序。' },
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
  description: '公司據點資料，同一筆會同時出現在「關於我們」與「聯絡我們」兩個頁面，不用分別建立兩次。',
  columns: [
    { name: 'name', label: '名稱', fromTranslation: true },
    { name: 'type', label: '類型', type: 'badge', options: LOCATION_TYPE_OPTIONS, width: '7rem' },
    { name: 'city', label: '城市', width: '8rem' },
    { name: 'phone', label: '電話', width: '10rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    { name: 'type', label: '類型', type: 'select', scope: 'base', required: true, options: LOCATION_TYPE_OPTIONS },
    {
      name: 'countryCode',
      label: '國別代碼',
      type: 'text',
      scope: 'base',
      maxLength: 2,
      placeholder: 'TW',
      hint: '兩碼英文國家代碼，例如台灣是 TW、日本是 JP。',
    },
    { name: 'city', label: '城市', type: 'text', scope: 'base', maxLength: 80 },
    { name: 'phone', label: '電話', type: 'text', scope: 'base', maxLength: 40 },
    { name: 'email', label: '電子郵件', type: 'email', scope: 'base', maxLength: 320 },
    { name: 'latitude', label: '緯度', type: 'number', scope: 'base', hint: '地圖用的座標，跟「經度」要一起填才能在地圖上正確定位，例：25.0330。' },
    { name: 'longitude', label: '經度', type: 'number', scope: 'base', hint: '地圖用的座標，跟「緯度」要一起填才能在地圖上正確定位，例：121.5654。' },
    {
      name: 'mapUrl',
      label: '地圖連結',
      type: 'url',
      scope: 'base',
      maxLength: 512,
      wide: true,
      hint: 'Google 地圖分享連結，要以 https:// 開頭；點「查看地圖」按鈕會直接開這個連結。',
    },
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
  description: '客戶的推薦引言。具名顯示需要客戶書面授權；沒有授權的話姓名留空，只顯示職稱與公司類型就好，不要自己補一個名字上去。',
  columns: [
    { name: 'quote', label: '引言', fromTranslation: true },
    { name: 'authorName', label: '姓名', fromTranslation: true, width: '9rem' },
    { name: 'solutionId', label: '關聯產業', width: '10rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    { name: 'partnerBrandId', label: '合作品牌', type: 'reference', scope: 'base', refType: 'partner-brands' },
    { name: 'solutionId', label: '關聯產業', type: 'reference', scope: 'base', refType: 'solutions', hint: '選了之後這則見證也會出現在對應產業頁。' },
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
  description: '合作品牌的 Logo，同一筆會同時出現在首頁與合作頁的 Logo 牆。',
  columns: [
    { name: 'logoMediaAssetId', label: 'Logo', type: 'thumb', width: '5rem' },
    { name: 'name', label: '品牌', fromTranslation: true },
    { name: 'isLogoWallVisible', label: '顯示於 Logo 牆', type: 'boolean', width: '9rem' },
    STATUS_COLUMN,
  ],
  baseFields: [
    SLUG_FIELD,
    { name: 'logoMediaAssetId', label: 'Logo', type: 'media', scope: 'base', required: true, accept: IMAGE_ACCEPT, hint: '建議透明底 PNG，避免出現白色方塊。' },
    { name: 'websiteUrl', label: '官方網站', type: 'url', scope: 'base', maxLength: 512, wide: true, hint: '完整網址，要以 https:// 開頭；留空的話 Logo 不會是連結。' },
    { name: 'isLogoWallVisible', label: '顯示於 Logo 牆', type: 'boolean', scope: 'base', hint: '關掉的話這筆品牌資料還在，但不會出現在首頁與合作頁的 Logo 牆。' },
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
  description: '聯絡頁列出的直接聯絡窗口（例如業務、技術支援）。詢問單送出時也會依這裡設定的「詢問類型」自動分派給對應窗口。',
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
    {
      name: 'inquiryType',
      label: '詢問類型',
      type: 'select',
      scope: 'base',
      options: INQUIRY_TYPE_OPTIONS,
      hint: '這類詢問單送出後會分派給這個窗口；留空表示不參與自動分派。',
    },
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
  description:
    '五種流程頁共用同一個畫面來管理：核心製程、產品線製造流程、共同開發、OEM／ODM、詢問流程。上面的「種類」欄位決定這一筆屬於哪一種、顯示在哪個頁面。',
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
        { name: 'stepNumber', label: '步驟編號', type: 'number', scope: 'base', required: true, hint: '顯示在步驟卡片上的數字，例如 1、2、3，跟下面的「排序」分開設定。' },
        { name: 'iconName', label: '圖示', type: 'icon', scope: 'base' },
        { name: 'accentColorHex', label: '色條', type: 'color', scope: 'base', hint: '這個步驟卡片旁邊的裝飾色條，選一個跟其他步驟區分開的顏色即可，沒有固定色號規則。' },
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
  description:
    '每個階段（送出、審核、核准、出貨、送達）都會各自記下時間，所以看板上每移動一次卡片，系統都留得下紀錄可以回頭查，不需要另外一張「歷程紀錄」表。',
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
    { name: 'trackingNumber', label: '追蹤號碼', type: 'text', scope: 'base', maxLength: 80, hint: '狀態改為「已出貨」時建議填，會顯示給申請人。' },
    { name: 'trackingUrl', label: '追蹤網址', type: 'url', scope: 'base', maxLength: 512, wide: true, hint: '物流商的貨態查詢連結，要以 https:// 開頭。' },
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
    { name: 'internalNote', label: '內部備註', type: 'textarea', scope: 'base', rows: 3, wide: true, hint: '只有後台看得到，申請人看不到。' },
    { name: 'externalOrderNumber', label: 'ERP 單號', type: 'text', scope: 'base', maxLength: 64, hint: '對應公司內部訂單／出貨系統的單號，方便日後對帳，非必填。' },
  ],
  translationFields: [],
};

const contactInquiries: ResourceDef = {
  type: 'contact-inquiries',
  label: '詢問單',
  singular: '詢問單',
  screen: 'inbox',
  titleField: 'referenceNumber',
  description: '不管客戶是從「聯絡我們」頁面，還是從網站上方選單彈出的聯絡表單送出的，都會統一進到這裡處理。',
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
    { name: 'assignedChannelId', label: '分派窗口', type: 'reference', scope: 'base', refType: 'contact-channels', hint: '這張詢問單交給哪個窗口處理，只是內部標記，不會寄信通知對方。' },
    { name: 'internalNote', label: '內部備註', type: 'textarea', scope: 'base', rows: 4, wide: true, hint: '只有後台看得到，客戶看不到。' },
    { name: 'respondedAt', label: '回覆時間', type: 'datetime', scope: 'base', readOnly: true, hint: '狀態改為「已回覆」時系統自動記錄，無法手動修改。' },
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
    {
      name: 'domain',
      label: '網域',
      type: 'text',
      scope: 'base',
      required: true,
      maxLength: 255,
      placeholder: 'example.com',
      hint: '只填 @ 後面的網域，不要加 @ 或 https://，例如 gmail.com。註冊信箱的網域完全相符才會套用這條規則。',
    },
    {
      name: 'rule',
      label: '規則',
      type: 'select',
      scope: 'base',
      required: true,
      options: BUSINESS_DOMAIN_RULE_OPTIONS,
      hint: '「封鎖」會直接擋下註冊、不建帳號；「自動核准」驗證信箱後立刻成為正式會員，不用人工審核；「人工審核」照一般流程進待審核佇列。',
    },
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
  description:
    '網站上方選單、頁尾選單等處的連結項目。這裡的連結盡量指向頁面、產品、文章等內容（用「連結方式」選「指向內容實體」），而不是自己輸入死的網址——這樣被指到的那一頁改網址時，選單會自動跟著換，不會變成連不到的舊連結。',
  columns: [
    { name: 'label', label: '文字', fromTranslation: true },
    { name: 'location', label: '位置', type: 'badge', options: NAVIGATION_LOCATION_OPTIONS, width: '11rem' },
    { name: 'linkType', label: '連結方式', type: 'badge', options: LINK_TARGET_TYPE_OPTIONS, width: '10rem' },
    STATUS_COLUMN,
  ],
  filters: [{ name: 'location', label: '位置', options: NAVIGATION_LOCATION_OPTIONS }],
  baseFields: [
    {
      name: 'location',
      label: '位置',
      type: 'select',
      scope: 'base',
      required: true,
      options: NAVIGATION_LOCATION_OPTIONS,
      hint: '這個項目要出現在網站的哪一個選單（例如上方主選單、頁尾）。同一個位置底下的排序互相獨立。',
    },
    {
      name: 'parentId',
      label: '上層項目',
      type: 'reference',
      scope: 'base',
      refType: 'navigation',
      hint: '要做成子選單（例如展開後的次項目）才需要選；主要項目留空。只能選同一個「位置」底下的項目。',
    },
    {
      name: 'linkType',
      label: '連結方式',
      type: 'select',
      scope: 'base',
      required: true,
      options: LINK_TARGET_TYPE_OPTIONS,
      hint: '選了之後下面才會出現對應要填的欄位（例如選「指向內容實體」才會出現「指向頁面／產品…」的選擇欄位）。',
    },
    {
      name: 'url',
      label: '網址／錨點',
      type: 'text',
      scope: 'base',
      maxLength: 512,
      wide: true,
      hint: '「站內路徑」請填 / 開頭的路徑；「外部網址」請填完整網址（https:// 開頭）；「頁內錨點」請填 # 開頭的錨點名稱。',
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
      hint: '連結方式選「指向內容實體」時才需要填；目標之後改 slug，這個連結會自動跟著換，不用回來手動改。',
      visibleWhen: (values) => values.linkType === 'entityRef',
    })),
    { name: 'iconName', label: '圖示', type: 'icon', scope: 'base', hint: '只有部分選單位置（例如 Header 主選單）會顯示圖示，非必填。' },
    { name: 'openInNewTab', label: '另開分頁', type: 'boolean', scope: 'base', hint: '通常只有連到外部網址時才打開。' },
    SORT_FIELD,
  ],
  translationFields: [
    { name: 'label', label: '選單文字', type: 'text', scope: 'translation', required: true, maxLength: 120 },
    { name: 'note', label: '子項說明', type: 'text', scope: 'translation', maxLength: 200, wide: true, hint: '只有下拉選單裡的子項目才會顯示這一小段說明，非必填。' },
    { name: 'menuTitle', label: '下拉選單標題', type: 'text', scope: 'translation', maxLength: 200, wide: true, hint: '主選單展開下拉選單時，該區塊上方的標題，留空就不顯示。' },
    {
      name: 'ariaLabel',
      label: '無障礙標籤（螢幕報讀）',
      type: 'text',
      scope: 'translation',
      maxLength: 200,
      wide: true,
      hint: '螢幕報讀軟體念出來的說明文字，給視障使用者聽的，畫面上不會顯示。留空就直接念「選單文字」。',
    },
  ],
};

const redirects: ResourceDef = {
  type: 'redirects',
  label: '轉址（301）',
  singular: '轉址',
  screen: 'collection',
  titleField: 'fromPath',
  description:
    '把一個舊網址導去新網址（HTTP 301／302 轉址）。多數轉址是內容改 slug 時系統自動寫入的，這裡是給人工需要時（例如舊站搬遷）手動補登。系統會避免轉址疊好幾層或繞回原地：新增 A→B 時若已經有 B→C，會直接寫成 A→C。',
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
    {
      name: 'toPath',
      label: '目標路徑',
      type: 'text',
      scope: 'base',
      required: true,
      maxLength: 512,
      wide: true,
      placeholder: '/en/products/optical-film',
      hint: '訪客造訪「來源路徑」時實際會被導去的網址，請包含語系前綴（/en 或 /zh-Hant）。',
    },
    { name: 'statusCode', label: '狀態碼', type: 'select', scope: 'base', required: true, options: REDIRECT_STATUS_OPTIONS, hint: '不確定選哪個就用「301 永久轉址」，這是最常見的情況。' },
    { name: 'targetCulture', label: '目標語系', type: 'select', scope: 'base', options: [], hint: '只有「來源路徑」沒有 /en 或 /zh-Hant 前綴時（例如舊站網址）才需要指定。' },
    { name: 'isEnabled', label: '啟用', type: 'boolean', scope: 'base', hint: '關掉的話這筆轉址會停止生效，但資料還在，不用刪除也能暫停。' },
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
  description:
    '整站共用的設定：搜尋結果怎麼顯示、公司基本資料、流量分析，以及系統寄信要用的網址。改完按右上角「儲存變更」；影響搜尋結果的部分會在下一次有人開啟該頁時生效。',
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
    { name: 'focalPointX', label: '焦點 X（水平位置）', type: 'number', scope: 'base', hint: '0 到 1 之間，決定圖片被裁切成不同比例時要保留畫面的哪個水平位置，0 是最左、1 是最右。' },
    { name: 'focalPointY', label: '焦點 Y（垂直位置）', type: 'number', scope: 'base', hint: '0 到 1 之間，決定圖片被裁切成不同比例時要保留畫面的哪個垂直位置，0 是最上、1 是最下。' },
    { name: 'isArchived', label: '封存', type: 'boolean', scope: 'base', hint: '打開後這個檔案不會出現在各欄位的選擇清單裡，但既有引用它的地方不受影響。' },
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
      hint: '至少 6 個字元。新帳號必填；編輯時留空表示不變更，填了就等於替對方重設密碼並登出他所有裝置。',
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
    {
      name: 'lockoutEndsAt',
      label: '鎖定至',
      type: 'datetime',
      scope: 'base',
      readOnly: true,
      hint: '密碼連續輸錯太多次時，系統會自動鎖定帳號到這個時間，過了就能再嘗試登入；這格由系統設定，後台無法手動修改或提前解鎖。',
    },
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
