/**
 * 固定頁面的欄位對照：**每一頁、每一個版塊，前台實際讀了哪些欄位、顯示在哪裡**。
 *
 * <p>
 * 頁面與版塊共用同一組翻譯欄位（眉標、副標、Banner 標題、CTA…），但 14 個前台路由
 * 各自只讀其中幾個——下載中心的橫幅大標讀的是版塊標題、首頁根本沒有橫幅、頁面的「副標」
 * 整站沒有一頁用到。全部攤開等於叫編輯者去猜哪一格改了會動。這裡只列真的會出現在前台的
 * 欄位，標籤寫的是「它在畫面上的位置」。
 * </p>
 *
 * <p>
 * ⚠️ 真相來源是 `apps/web/app/[locale]/` 的頁面檔。前台改了讀哪個欄位，這裡要跟著改；
 * 不在表上的頁面或版塊會退回顯示全部欄位，不會讓資料改不到。
 * </p>
 */

export type FieldCopy = {
  label: string;
  hint?: string;
  /** 前台以純文字輸出的內文（`{block.body}`）不能給富文字編輯器，否則 `<p>` 會原樣印出來。 */
  plainText?: boolean;
};

export type PageTextField =
  | 'title'
  | 'eyebrow'
  | 'bannerTitle'
  | 'bannerDescription'
  | 'ctaEyebrow'
  | 'ctaHeadline'
  | 'ctaSubcopy'
  | 'body'
  | 'lastReviewedLabel';

export type BlockTextField = 'eyebrow' | 'title' | 'subtitle' | 'body' | 'ctaLabel' | 'footNote';

export type ItemField = 'iconName' | 'linkUrl' | 'title' | 'subtitle' | 'body' | 'value' | 'linkLabel';

/**
 * 版塊底下的項目（`ContentBlockItems`）：卡片、數字、標籤。
 *
 * <p>
 * 只有前台真的從項目取文字的版塊才列 —— 很多版塊的項目是種子資料留下來的，前台讀的其實是
 * 認證、據點、製程流程這些強型別表（見各版塊的 note），在這裡開放編輯只會讓人改了沒反應。
 * </p>
 */
export type ItemsLayout = {
  label: string;
  /** 單一項目的稱呼，含量詞（「張卡片」「個數字」）：組成「新增一張卡片」「刪除這個數字」。 */
  noun: string;
  fields: Partial<Record<ItemField, FieldCopy>>;
};

export type BlockLayout = {
  /** 這個版塊在前台的位置，取代「第 N 塊」。 */
  name: string;
  /** 版塊的其餘內容從哪裡來（例如卡片來自「認證」）。 */
  note?: string;
  /** 空物件 ＝ 前台不讀這個版塊的任何文字。 */
  fields: Partial<Record<BlockTextField, FieldCopy>>;
  items?: ItemsLayout;
};

export type PageLayout = {
  fields: Partial<Record<PageTextField, FieldCopy>>;
  /** 沒給 ＝ 前台不用 `heroMediaAssetId`。 */
  heroImage?: FieldCopy;
  /** 以 `anchor` 對應（前台也是用 anchor 找版塊，見 apps/web/lib/content-api.ts 的 `block()`）。 */
  blocks: Record<string, BlockLayout>;
};

// ── 共用 ─────────────────────────────────────────────────────────────────

const PAGE_TITLE: FieldCopy = {
  label: '頁面名稱',
  hint: '瀏覽器分頁標題，以及 Google 搜尋結果的標題（沒另外填「搜尋結果標題」時）。也是後台清單上顯示的名稱。',
};

const BANNER: Partial<Record<PageTextField, FieldCopy>> = {
  eyebrow: { label: '橫幅眉標', hint: '橫幅大標上方那一行小字。留空會顯示選單上的頁面名稱。' },
  bannerTitle: { label: '橫幅大標', hint: '頁面最上方橫幅裡的大標題。' },
  bannerDescription: {
    label: '橫幅說明',
    hint: '橫幅大標下方的一段說明。沒填「搜尋結果說明」時，Google 搜尋結果也會用這段。',
  },
};

const BANNER_IMAGE: FieldCopy = { label: '橫幅背景圖', hint: '頁面最上方橫幅的照片。留空時前台不顯示這條圖帶，只留標題與說明。' };

const PAGE_CTA: Partial<Record<PageTextField, FieldCopy>> = {
  ctaEyebrow: { label: '頁尾行動呼籲：眉標', hint: '頁面最底部「聯絡我們」區塊標題上方的小字。' },
  ctaHeadline: { label: '頁尾行動呼籲：標題', hint: '留空的話，整個頁尾行動呼籲區塊都不會顯示。' },
  ctaSubcopy: { label: '頁尾行動呼籲：說明', hint: '標題下方的一句說明。' },
};

/** `BlockHeading`：眉標、標題、標題下方的說明。 */
const HEADING: Partial<Record<BlockTextField, FieldCopy>> = {
  eyebrow: { label: '眉標', hint: '區塊標題上方的小字。' },
  title: { label: '標題' },
  subtitle: { label: '說明', hint: '標題下方的一段說明文字。' },
};

const EYEBROW_TITLE: Partial<Record<BlockTextField, FieldCopy>> = {
  eyebrow: HEADING.eyebrow,
  title: HEADING.title,
};

/** `MediaTextSplitBlock`：左右圖文，沒有說明列，內文是富文字。 */
const MEDIA_TEXT: Partial<Record<BlockTextField, FieldCopy>> = {
  eyebrow: HEADING.eyebrow,
  title: HEADING.title,
  body: { label: '內文' },
};

/** `FeatureGridBlock`：圖示、標題、說明，說明下方可再加一行小字。 */
const FEATURE_CARDS: ItemsLayout = {
  label: '卡片',
  noun: '張卡片',
  fields: {
    iconName: { label: '圖示' },
    title: { label: '標題' },
    body: { label: '說明', plainText: true },
    subtitle: { label: '補充小字', hint: '說明下方的一行小字，非必填。' },
  },
};

/** `OfferingGrid`：整張卡片可點。 */
const LINK_CARDS: ItemsLayout = {
  label: '卡片',
  noun: '張卡片',
  fields: {
    iconName: { label: '圖示' },
    title: { label: '標題' },
    body: { label: '說明', plainText: true },
    linkLabel: { label: '連結文字', hint: '卡片底部的連結文字，後面會自動加上箭頭。' },
    linkUrl: { label: '連結網址', hint: '站內路徑，不含語系，例如 /sustainability#esg。' },
  },
};

const standard = (blocks: Record<string, BlockLayout>): PageLayout => ({
  fields: { title: PAGE_TITLE, ...BANNER, ...PAGE_CTA },
  heroImage: BANNER_IMAGE,
  blocks,
});

// ── 各頁 ─────────────────────────────────────────────────────────────────

export const PAGE_LAYOUTS: Record<string, PageLayout> = {
  home: {
    fields: {
      title: { label: '頁面名稱', hint: '只用在後台清單。首頁的瀏覽器分頁標題取自下方「首頁主視覺」的大標。' },
    },
    heroImage: { label: '主視覺背景圖', hint: '首頁最上方的大幅照片。留空時前台不顯示這張圖，只留下方的大標與說明。' },
    blocks: {
      hero: {
        name: '首頁主視覺',
        note: '背景圖在上方「主視覺背景圖」設定。',
        fields: {
          eyebrow: { label: '眉標', hint: '大標上方的小字。' },
          title: { label: '大標', hint: '同時是首頁的瀏覽器分頁標題（沒另外填「搜尋結果標題」時）。' },
          subtitle: { label: '說明', hint: '大標下方的一段文字。沒填「搜尋結果說明」時，Google 搜尋結果也會用這段。' },
        },
      },
      materials: { name: '三大產品線', note: '下方卡片來自「產品線」。', fields: EYEBROW_TITLE },
      industries: { name: '應用產業', note: '下方卡片來自「解決方案」。', fields: EYEBROW_TITLE },
      trust: { name: '客戶信任牆', fields: EYEBROW_TITLE },
      'trust-certs': { name: '信任牆：認證列', note: '認證來自「認證」，這一列的小標是固定的介面文字。', fields: {} },
      'trust-partners': { name: '信任牆：合作夥伴', note: '合作夥伴 logo 尚未上線，前台目前是佔位圖框。', fields: {} },
      'trust-exhibitions': { name: '信任牆：展會列', note: '展會來自「展會」。', fields: {} },
      sustainability: {
        name: '永續承諾（頁尾紫色卡片）',
        fields: {
          eyebrow: HEADING.eyebrow,
          title: HEADING.title,
          body: { label: '說明', plainText: true },
          footNote: { label: '聯絡信箱', hint: '顯示成可點的 email 連結，只能填一個信箱。' },
        },
      },
    },
  },

  about: standard({
    vision: { name: '品牌願景與承諾（圖文）', fields: MEDIA_TEXT },
    values: { name: '品牌價值', fields: HEADING, items: FEATURE_CARDS },
    history: { name: '發展歷程', note: '時間軸來自「里程碑」。', fields: HEADING },
    manufacturing: { name: '製造能力', fields: HEADING, items: LINK_CARDS },
    'manufacturing-locations': { name: '工廠與製造據點', note: '據點來自「據點」。', fields: HEADING },
    sustainability: {
      name: '永續發展',
      fields: { ...HEADING, ctaLabel: { label: '按鈕文字', hint: '標題右側的按鈕，連到永續頁。' } },
      items: LINK_CARDS,
    },
    'sustainability-certs': {
      name: '永續段落：認證列',
      note: '認證來自「認證」。',
      fields: { title: { label: '小標', hint: '認證列上方的一行小字。' } },
    },
    'certifications-1': { name: '認證分類 1', note: '卡片來自「認證」。', fields: HEADING },
    'certifications-2': { name: '認證分類 2', note: '卡片來自「認證」。', fields: HEADING },
    'certifications-3': { name: '認證分類 3', note: '卡片來自「認證」。', fields: HEADING },
    partnership: {
      name: '合作模式',
      fields: { ...HEADING, ctaLabel: { label: '按鈕文字', hint: '標題右側的按鈕，連到合作夥伴頁。' } },
      items: LINK_CARDS,
    },
  }),

  contact: {
    fields: { title: PAGE_TITLE, ...BANNER },
    blocks: {
      channels: {
        name: '聯絡管道（表單右側）',
        note: '下方的電話、信箱等來自「聯絡管道」。',
        fields: { title: HEADING.title, subtitle: HEADING.subtitle },
      },
      hurry: {
        name: '趕時間？（聯絡管道下方的提示框）',
        fields: {
          eyebrow: HEADING.eyebrow,
          title: HEADING.title,
          body: { label: '說明', hint: '下方固定接一個「前往下載中心」的連結。', plainText: true },
        },
      },
      locations: { name: '據點', note: '地圖與據點清單來自「據點」。', fields: HEADING },
      'what-happens-next': {
        name: '送出後的流程',
        note: '步驟來自「製程流程」。',
        fields: { title: HEADING.title },
      },
    },
  },

  downloads: {
    fields: {
      title: PAGE_TITLE,
      eyebrow: BANNER.eyebrow,
      bannerDescription: BANNER.bannerDescription,
      ...PAGE_CTA,
    },
    heroImage: BANNER_IMAGE,
    blocks: {
      downloads: {
        name: '文件清單',
        note: '文件來自「下載中心」。',
        fields: {
          eyebrow: { label: '清單眉標', hint: '清單標題上方的小字。' },
          title: { label: '標題', hint: '同時是頁面最上方的橫幅大標與清單標題。' },
        },
      },
    },
  },

  faq: {
    fields: { title: PAGE_TITLE, ...BANNER },
    heroImage: BANNER_IMAGE,
    blocks: {},
  },

  member: standard({
    benefits: {
      name: '會員權益',
      fields: EYEBROW_TITLE,
      items: {
        label: '權益',
        noun: '項權益',
        fields: { iconName: { label: '圖示' }, title: { label: '標題' }, body: { label: '說明', plainText: true } },
      },
    },
  }),

  news: standard({
    list: { name: '最新消息', note: '文章來自「文章」。', fields: EYEBROW_TITLE },
    events: { name: '展會活動', note: '展會來自「展會」。', fields: EYEBROW_TITLE },
  }),

  partnership: standard({
    'oem-odm': { name: 'OEM／ODM 服務', note: '步驟來自「製程流程」。', fields: HEADING },
    distribution: {
      name: '經銷與採購（圖文）',
      fields: {
        ...MEDIA_TEXT,
        ctaLabel: { label: '強調文字', hint: '內文下方的一行紫色文字。目前不是可點的連結。' },
      },
    },
    testimonials: { name: '客戶見證', note: '見證來自「客戶見證」。', fields: HEADING },
  }),

  privacy: {
    fields: {
      title: PAGE_TITLE,
      ...BANNER,
      body: { label: '條文內容', hint: '左側的目錄會依內文裡的標題自動產生。' },
      lastReviewedLabel: { label: '最後更新標示', hint: '條文上方的一行文字，例如「最後更新：2026 年 6 月 1 日」。' },
    },
    heroImage: BANNER_IMAGE,
    blocks: {},
  },

  products: standard({
    lines: { name: '產品線卡片', note: '卡片內容來自「產品線」。', fields: {} },
  }),

  resources: {
    fields: { title: PAGE_TITLE, ...BANNER, ...PAGE_CTA },
    blocks: {
      news: {
        name: '最新消息與展會',
        fields: { ...EYEBROW_TITLE, ctaLabel: { label: '「看全部」連結文字', hint: '標題右側的連結，連到最新消息頁。' } },
      },
      faq: {
        name: '常見問題',
        note: '題目來自「FAQ 題目」。',
        fields: { ...EYEBROW_TITLE, ctaLabel: { label: '「看全部」連結文字', hint: '連到常見問題頁。' } },
      },
      insights: {
        name: '產業洞察',
        note: '文章來自「文章」。',
        fields: { ...EYEBROW_TITLE, ctaLabel: { label: '卡片連結文字', hint: '每張文章卡片底部的連結文字。' } },
      },
      articles: {
        name: '技術文章',
        note: '文章來自「文章」。',
        fields: { ...EYEBROW_TITLE, ctaLabel: { label: '卡片連結文字', hint: '每張文章卡片底部的連結文字。' } },
      },
      downloads: { name: '文件下載', note: '文件來自「下載中心」。', fields: EYEBROW_TITLE },
    },
  },

  solutions: standard({
    cards: { name: '產業卡片', note: '卡片內容來自「解決方案」。', fields: {} },
  }),

  sustainability: standard({
    esg: {
      name: 'ESG 成果',
      fields: { ...HEADING, footNote: { label: '下方註記', hint: '卡片下方的一行小字。' } },
      items: FEATURE_CARDS,
    },
    carbon: { name: '碳足跡管理（圖文）', fields: MEDIA_TEXT },
    eudr: { name: 'EUDR 法規因應（圖文）', fields: MEDIA_TEXT },
    certifications: { name: '認證與標準', note: '卡片來自「認證」。', fields: HEADING },
  }),

  technologies: standard({
    'core-processes': { name: '核心製程', note: '步驟來自「製程流程」。', fields: HEADING },
    qc: {
      name: '線上品管（核心製程下方）',
      fields: { title: HEADING.title, body: { label: '說明', plainText: true } },
      items: { label: '檢測項目標籤', noun: '個標籤', fields: { title: { label: '標籤文字' } } },
    },
    innovation: { name: '研發與材料創新', fields: HEADING, items: FEATURE_CARDS },
    compliance: {
      name: '產品法規符合',
      note: '下方卡片來自「認證」。',
      fields: { ...HEADING, body: { label: '內文', hint: '標題下方、認證卡片上方的一段文字。' } },
    },
  }),
};

/**
 * 產品線頁（`/products/{category}`）。三條產品線共用同一個版型，版塊以 anchor 對應。
 * 前台找概覽、產品系列、頁尾 CTA 時用的是 blockType，但三條線的 anchor 都一致（seed 決定）。
 */
export const CATEGORY_BLOCKS: Record<string, BlockLayout> = {
  banner: {
    name: '橫幅',
    note: '橫幅背景圖在上方「基本資料」的「主視覺」。',
    fields: {
      eyebrow: { label: '眉標', hint: '大標上方的小字。留空會顯示「產品」。' },
      title: { label: '大標', hint: '同時是瀏覽器分頁標題（沒另外填「搜尋結果標題」時）。留空會顯示產品線名稱。' },
      subtitle: { label: '說明', hint: '大標下方的一段文字，也是 Google 搜尋結果說明的備援。留空會顯示「摘要」。' },
    },
  },
  overview: {
    name: '概覽（橫幅下方的圖文與數字）',
    note: '標題下方的段落是上方「產品線頁開場」欄位；左側照片是設計稿固定的圖。',
    fields: { title: { label: '標題' } },
    items: {
      label: '數字',
      noun: '個數字',
      fields: {
        value: { label: '數字', hint: '大字顯示的值，例如 IP67、± 0.05 mm、48 h。' },
        title: { label: '說明', hint: '數字下方的一小行說明。' },
      },
    },
  },
  families: {
    name: '產品系列',
    note: '下方卡片來自「產品」：型號、名稱、New 標籤、摘要、規格亮點都在產品裡改，順序依產品的排序。',
    fields: HEADING,
  },
  cta: {
    name: '頁尾行動呼籲',
    fields: {
      eyebrow: { label: '眉標', hint: '標題上方的小字。' },
      title: { label: '標題' },
      subtitle: { label: '說明', hint: '標題下方的一句說明。' },
    },
  },
};

/**
 * 應用解決方案頁（`/solutions/{slug}`）。7 個產業共用一個版型，但 anchor 各頁不一
 * （Acoustic 有自己的 how-we-prove-it…），前台也是**依版塊類型**決定怎麼畫，所以這裡以 blockType 對應。
 */
export const SOLUTION_BLOCKS: Record<string, BlockLayout> = {
  hero: {
    name: '橫幅',
    note: '橫幅背景圖在上方「基本資料」的「主視覺」。',
    fields: {
      eyebrow: { label: '眉標', hint: '大標上方的小字。留空會顯示「解決方案」。' },
      title: { label: '大標', hint: '同時是瀏覽器分頁標題（沒另外填「搜尋結果標題」時）。留空會顯示產業名稱。' },
      subtitle: { label: '說明', hint: '大標下方的一段文字，也是 Google 搜尋結果說明的備援。留空會顯示「索引卡摘要」。' },
    },
  },
  featureGrid: { name: '卡片區', fields: HEADING, items: FEATURE_CARDS },
  statBand: {
    name: '數字區',
    note: '沒有任何數字時，前台整段不顯示。數字下方的按鈕是這個產業勾選的產品線。',
    fields: HEADING,
    items: {
      label: '數字',
      noun: '個數字',
      fields: {
        value: { label: '數字', hint: '大字顯示的值，例如 15 yr、± 30°、IEC 61215。' },
        title: { label: '標題' },
        body: { label: '說明', plainText: true },
      },
    },
  },
  specTable: {
    name: '產品比較表',
    note: '表格內容是第一個勾選的產品線底下的產品與規格，在「產品」裡改。',
    fields: { ...HEADING, footNote: { label: '表格下方註記', hint: '例如「數值為典型值」。' } },
  },
  cta: {
    name: '頁尾行動呼籲',
    fields: {
      eyebrow: { label: '眉標', hint: '標題上方的小字。' },
      title: { label: '標題' },
      subtitle: { label: '說明', hint: '標題下方的一句說明。' },
    },
  },
};
