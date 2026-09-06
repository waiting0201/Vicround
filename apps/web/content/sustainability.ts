import { t } from '@/lib/content';

/**
 * Sustainability —— 逐字取自 `mockup/Rounded Design/sustainability.dc.html`（繁中暫譯）。
 * 方括號段落是確認稿裡就待客戶補的內容，照實保留。
 */
export const sustainability = {
  banner: {
    eyebrow: t('Sustainability', '永續發展'),
    title: t('Built for a lower-carbon supply chain.', '為低碳供應鏈而生。'),
    description: t(
      'ESG performance, carbon footprint management, and regulatory readiness — engineered into how we source and manufacture.',
      'ESG 績效、碳足跡管理與法規準備 —— 內建於我們的採購與製造方式。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Sustainability · 2560×480', 'Banner 圖 —— 永續發展 · 2560×480'),
  },

  esg: {
    eyebrow: t('ESG Results', 'ESG 成果'),
    title: t('Measured across three pillars', '以三大支柱衡量'),
    pillars: [
      {
        icon: 'leaf',
        title: t('Environmental', '環境'),
        body: t(
          'Energy, waste and water-reduction initiatives across manufacturing sites. [Add environmental results summary.]',
          '各生產據點的能源、廢棄物與用水減量行動。[待補：環境成果摘要。]',
        ),
      },
      {
        icon: 'users',
        title: t('Social', '社會'),
        body: t(
          'Labor and workplace standards audited under BSCI. [Add social program results summary.]',
          '勞動與職場標準經 BSCI 稽核。[待補：社會方案成果摘要。]',
        ),
      },
      {
        icon: 'scale',
        title: t('Governance', '治理'),
        body: t(
          'Certified quality and environmental management systems. [Add governance program results summary.]',
          '通過認證的品質與環境管理系統。[待補：治理方案成果摘要。]',
        ),
      },
    ],
    note: t('Full ESG report available on request.', '完整 ESG 報告可依需求索取。'),
  },

  carbon: {
    eyebrow: t('Carbon Footprint Management (TRIPs)', '碳足跡管理（TRIPs）'),
    title: t('Tracked from sourcing to shipment', '從採購追蹤到出貨'),
    paragraphs: [
      t(
        'Our internal TRIPs framework tracks carbon impact across sourcing, manufacturing and logistics — surfacing reduction opportunities batch by batch rather than once a year.',
        '我們的內部 TRIPs 架構橫跨採購、製造與物流追蹤碳影響 —— 逐批找出減量機會，而不是一年檢視一次。',
      ),
      t('[Add TRIPs program details, scope and current-year metrics.]', '[待補：TRIPs 方案細節、範疇與本年度指標。]'),
    ],
    imageLabel: t(
      'Chart placeholder — carbon footprint by stage · 1200×900',
      '圖表版位 —— 各階段碳足跡 · 1200×900',
    ),
  },

  eudr: {
    eyebrow: t('EUDR Regulations Response', 'EUDR 法規因應'),
    title: t('Ready ahead of enforcement', '在強制實施前就準備好'),
    paragraphs: [
      t(
        "We're aligning sourcing documentation and supply-chain traceability with EU Deforestation Regulation (EUDR) requirements, so partners selling into the EU can source from us with confidence.",
        '我們正依歐盟零毀林規範（EUDR）對齊採購文件與供應鏈追溯，讓銷往歐盟的合作夥伴能安心向我們採購。',
      ),
      t('[Add EUDR compliance timeline and documentation details.]', '[待補：EUDR 合規時程與文件細節。]'),
    ],
    imageLabel: t('Documentation placeholder — traceability · 1200×900', '文件版位 —— 供應鏈追溯 · 1200×900'),
  },

  certifications: {
    eyebrow: t('Certifications and Standards', '認證與標準'),
    title: t("What we're certified to", '我們通過的認證'),
    /** id 對應 content/certifications.ts，點擊開同一個彈窗 */
    items: [
      { id: 'iso-14001', label: t('ISO 14001', 'ISO 14001'), body: t('Environmental management systems.', '環境管理系統。') },
      {
        id: 'iso-22196',
        label: t('ISO 22196', 'ISO 22196'),
        body: t('Antibacterial activity on plastic surfaces.', '塑膠表面抗菌活性。'),
      },
      { id: 'bsci', label: t('BSCI', 'BSCI'), body: t('Social & labor compliance auditing.', '社會與勞動條件稽核。') },
      { id: 'grs', label: t('GRS', 'GRS'), body: t('Global Recycled Standard content tracing.', '全球回收標準成分追溯。') },
    ],
  },

  cta: {
    eyebrow: t('Sourcing with confidence', '安心採購'),
    headline: t('Request our compliance documentation.', '索取我們的合規文件。'),
    subcopy: t(
      'Ask for certificates, ESG summaries or EUDR documentation — our team responds within two business days.',
      '索取證書、ESG 摘要或 EUDR 文件 —— 我們的團隊將於兩個工作天內回覆。',
    ),
  },
};
