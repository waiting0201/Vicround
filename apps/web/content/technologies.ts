import { t } from '@/lib/content';

/**
 * Technologies —— 逐字取自 `mockup/Rounded Design/technologies.dc.html`（繁中暫譯）。
 *
 * <p>
 * ⚠️ 方括號 `[Add …]` 的段落在確認稿裡就是**待客戶補內容**的佔位文字，這裡照實保留，
 * 不要自己編。接上 `GET /api/v1/technologies`（ProcessFlows + Certifications）後刪除。
 * </p>
 */
export const technologies = {
  banner: {
    eyebrow: t('Technologies', '技術與製程'),
    title: t('The capability behind the spec sheet.', '規格書背後的製造能力。'),
    description: t(
      'Core processes, material innovation and product compliance — how VICROUND turns a target specification into a material that holds up in mass production.',
      '核心製程、材料創新與產品法規符合 —— VICROUND 如何把一份目標規格，變成量產也站得住的材料。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Technologies · 2560×480', 'Banner 圖 —— 技術與製程 · 2560×480'),
  },

  core: {
    eyebrow: t('Core Processes', '核心製程'),
    title: t('From coating line to finished part', '從塗佈產線到成品件'),
    lead: t(
      'Every VICROUND material runs through the same controlled chain — so the sample you qualify is the part you receive at volume.',
      '每一種 VICROUND 材料都走同一條受控流程 —— 您驗證的樣品，就是量產時收到的零件。',
    ),
    steps: [
      {
        icon: 'layers',
        title: t('Coating', '塗佈'),
        body: t(
          'Roll-to-roll hard-coat, AG, AF and functional layers applied to target haze and gloss.',
          '捲對捲塗佈硬塗層、AG、AF 與功能層，達到目標霧度與光澤。',
        ),
      },
      {
        icon: 'align-center-horizontal',
        title: t('Laminating', '貼合'),
        body: t(
          'Multi-layer build-ups bonded with controlled tension and adhesive selection.',
          '多層疊構以受控張力與選定膠系貼合。',
        ),
      },
      {
        icon: 'scissors',
        title: t('Die-cutting & slitting', '模切與分條'),
        body: t(
          'Precision converting to part geometry, from roll goods to finished components.',
          '依零件幾何精密加工，從捲材到成品元件。',
        ),
      },
      {
        icon: 'clipboard-check',
        title: t('Inspection & packing', '檢驗與包裝'),
        body: t(
          'In-line and end-of-line QC, cleanroom packing, batch-level traceability.',
          '線上與線末品管、無塵室包裝、批次級追溯。',
        ),
      },
    ],
    imageLabel: t('Process imagery — production line · 1200×900', '製程情境圖 —— 生產線 · 1200×900'),
    qc: {
      title: t('In-line quality control', '線上品質管制'),
      body: t(
        '[Add the inspection equipment, sampling plan and traceability system used on each line — this is what buyers ask for during audits.]',
        '[待補：各產線使用的檢測設備、抽樣計畫與追溯系統 —— 這是採購稽核時會問的內容。]',
      ),
      tags: [
        t('Haze / gloss', '霧度／光澤'),
        t('Thickness', '厚度'),
        t('Adhesion', '附著力'),
        t('Batch traceability', '批次追溯'),
      ],
    },
  },

  innovation: {
    eyebrow: t('R&D / Material Innovation', '研發與材料創新'),
    title: t('From formulation to pilot line', '從配方到試產線'),
    items: [
      {
        title: t('Material formulation', '材料配方開發'),
        body: t(
          '[Add the in-house formulation capability — resin systems, coating chemistries, additive know-how.]',
          '[待補：自有配方能力 —— 樹脂系統、塗佈化學、添加劑知識。]',
        ),
      },
      {
        title: t('Application engineering', '應用工程'),
        body: t(
          '[Add how the team translates an OEM application requirement into a testable material specification.]',
          '[待補：團隊如何把客戶的應用需求轉譯成可測試的材料規格。]',
        ),
      },
      {
        title: t('Pilot & scale-up', '試產與放大'),
        body: t(
          '[Add pilot-line capability, sample lead time, and the path from prototype to mass production.]',
          '[待補：試產線能力、樣品交期，以及從原型到量產的路徑。]',
        ),
      },
    ],
    flowTitle: t('Co-development flow', '共同開發流程'),
    flow: [
      { bar: '#6436ef', title: t('Requirement', '需求'), note: t('Application, target spec, constraints', '應用、目標規格、限制條件') },
      { bar: '#7c55f1', title: t('Formulation', '配方'), note: t('Material and process selection', '材料與製程選定') },
      { bar: '#a184f5', title: t('Sample', '樣品'), note: t('A/B samples for your bench test', 'A／B 樣品供您台架測試') },
      { bar: '#ccbdfa', title: t('Validation', '驗證'), note: t('Reliability and reliability-plus testing', '可靠度與加嚴可靠度測試') },
      { bar: '#e9e3fd', title: t('Mass production', '量產'), note: t('Locked spec, batch traceability', '規格鎖定、批次追溯') },
    ],
  },

  compliance: {
    eyebrow: t('Product Compliance', '產品法規符合'),
    title: t('Documented, testable, auditable', '有文件、可測試、可稽核'),
    /** 這段在 mockup 裡帶一個指向 Sustainability 的行內連結。 */
    leadBefore: t(
      'Product-level compliance lives here. Company and factory certifications — ISO 14001, ISO 22196, BSCI, GRS — sit under ',
      '產品層級的法規符合在這一頁。公司與工廠層級的認證 —— ISO 14001、ISO 22196、BSCI、GRS —— 請見 ',
    ),
    leadLink: t('About Us → Sustainability', '關於我們 → 永續發展'),
    leadAfter: t('.', '。'),
    columns: [t('Standard', '標準'), t('Scope', '範疇'), t('Documentation', '文件')],
    rows: [
      {
        standard: t('RoHS', 'RoHS'),
        scope: t('Restricted substances across all shipped material platforms.', '涵蓋所有出貨材料平台的限用物質。'),
        doc: t('Declaration', '聲明書'),
      },
      {
        standard: t('REACH / SVHC', 'REACH / SVHC'),
        scope: t('Substance-of-very-high-concern screening and reporting.', '高度關切物質篩查與報告。'),
        doc: t('Statement', '聲明'),
      },
      {
        standard: t('Halogen-free', '無鹵'),
        scope: t('Applicable textile, foam and adhesive constructions.', '適用的紡織、泡棉與膠層結構。'),
        doc: t('Test report', '測試報告'),
      },
      {
        standard: t('IEC / IP rating', 'IEC / IP 等級'),
        scope: t('Acoustic mesh ingress protection, tested to customer protocol.', '聲學網布防護等級，依客戶規範測試。'),
        doc: t('Test report', '測試報告'),
      },
      {
        standard: t('OEM protocols', '客戶規範'),
        scope: t('[Add customer-specific reliability protocols supported.]', '[待補：可支援的客戶專屬可靠度規範。]'),
        doc: t('On request', '依需求提供'),
      },
    ],
  },

  cta: {
    eyebrow: t('Technical enquiry', '技術諮詢'),
    headline: t(
      'Need a capability confirmed before you spec us in?',
      '在把我們寫進規格前，需要先確認製造能力嗎？',
    ),
    subcopy: t(
      'Send us the process window or test standard you need to hit — our engineering team responds within two business days.',
      '把您需要達到的製程窗口或測試標準給我們 —— 工程團隊將於兩個工作天內回覆。',
    ),
  },
};
