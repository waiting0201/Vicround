import { t } from '@/lib/content';

/**
 * About Us —— 逐字取自 `mockup/Rounded Design/about-us.dc.html`（繁中暫譯）。
 * 這是三個深色頁之一。方括號段落是確認稿裡就待客戶補的內容，照實保留。
 */
export const about = {
  banner: {
    eyebrow: t('About Us', '關於我們'),
    title: t('Engineering trust into every material we ship.', '把信任做進每一種出貨的材料裡。'),
    description: t(
      "Vicround is an advanced-materials manufacturer built for OEM/ODM partners who can't afford a spec sheet that's wrong in the field.",
      '盈絲實業是一家先進材料製造商，服務的是那些無法承受「規格書在現場出錯」的 OEM／ODM 夥伴。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — About Us · 2560×480', 'Banner 圖 —— 關於我們 · 2560×480'),
  },

  vision: {
    eyebrow: t('Brand Vision & Promise', '品牌願景與承諾'),
    title: t('Built on precision, proven under pressure.', '以精密為本，在壓力下驗證。'),
    body: t(
      'We exist to give OEM partners a materials supplier that treats a spec sheet as a promise — optical film, technical textile & foam, and acoustic components engineered to hold up in the field, not just in the lab. Every product we ship carries the same standard: bold engineering, real answers.',
      '我們的存在，是要讓 OEM 夥伴有一家把規格書當承諾的材料供應商 —— 光學膜、機能性紡織與泡棉、聲學元件，都以「在現場撐得住」而非「在實驗室好看」為目標開發。每一件出貨產品都帶著同一個標準：大膽的工程，實在的解答。',
    ),
    imageLabel: t('Brand imagery — Vision · 1200×900', '品牌情境圖 —— 願景 · 1200×900'),
  },

  values: {
    eyebrow: t('Brand Values', '品牌價值'),
    title: t('What drives the team', '驅動團隊的是什麼'),
    items: [
      { icon: 'target', title: t('Precision', '精密'), body: t('Spec-true, batch after batch.', '批批如規格。') },
      { icon: 'shield-check', title: t('Integrity', '誠信'), body: t('Certified claims, no shortcuts.', '宣告都有認證，不抄捷徑。') },
      {
        icon: 'handshake',
        title: t('Partnership', '夥伴關係'),
        body: t('We build with you, not just for you.', '我們與您一起做，而不只是幫您做。'),
      },
      { icon: 'lightbulb', title: t('Curiosity', '好奇心'), body: t('Bold ideas, tested rigorously.', '大膽構想，嚴謹驗證。') },
    ],
  },

  history: {
    eyebrow: t('Development History', '發展歷程'),
    title: t('Milestones', '里程碑'),
    items: [
      {
        label: t('01 — Founding', '01 — 創立'),
        body: t("[Add the company's founding story and founding year here.]", '[待補：公司創立故事與創立年份。]'),
      },
      {
        label: t('02 — Certification', '02 — 認證'),
        body: t(
          '[Add key quality/environmental certifications achieved and their dates.]',
          '[待補：取得的重要品質／環境認證與時間。]',
        ),
      },
      {
        label: t('03 — Expansion', '03 — 擴張'),
        body: t('[Add major OEM partnerships or market-expansion milestones.]', '[待補：重要 OEM 合作或市場擴張里程碑。]'),
      },
      {
        label: t('04 — Today', '04 — 現在'),
        body: t(
          '[Add recent milestones — exhibitions, awards, or capacity expansions.]',
          '[待補：近期里程碑 —— 展會、獎項或產能擴充。]',
        ),
      },
    ],
  },

  manufacturing: {
    eyebrow: t('Manufacturing', '製造'),
    title: t("We don't just specify materials — we make them.", '我們不只定材料規格，我們自己做。'),
    lead: t(
      'Owned production in Taiwan and China, with the converting, QC and logistics capability an OEM programme needs from first article through to volume.',
      '在台灣與中國擁有自有產線，具備 OEM 專案從首件到量產所需的加工、品管與物流能力。',
    ),
    capabilities: [
      {
        icon: 'factory',
        title: t('Manufacturing Capabilities', '製造能力'),
        body: t(
          '[Add line count, monthly capacity and the product platforms each site runs.]',
          '[待補：產線數量、月產能，以及各據點負責的產品平台。]',
        ),
        cta: t('Capacity detail', '產能細節'),
        href: '/technologies#core-processes',
      },
      {
        icon: 'settings-2',
        title: t('Core Processes', '核心製程'),
        body: t(
          'Coating, laminating, die-cutting and slitting — all under our own roof.',
          '塗佈、貼合、模切與分條 —— 全都在自家廠內。',
        ),
        cta: t('See the process', '看製程'),
        href: '/technologies#core-processes',
      },
      {
        icon: 'map-pin',
        title: t('Factory & Locations', '廠區與據點'),
        body: t(
          'Taiwan and China manufacturing, with dual-site continuity for OEM programmes.',
          '台灣與中國製造，為 OEM 專案提供雙據點供應延續性。',
        ),
        cta: t('Where we build', '製造據點'),
        href: '/about#manufacturing',
      },
      {
        icon: 'truck',
        title: t('Shipping & Supply', '出貨與供應'),
        body: t(
          '[Add lead times, MOQ, packing standards and the supply-continuity commitment.]',
          '[待補：交期、最小訂量、包裝標準與供應延續性承諾。]',
        ),
        cta: t('Talk logistics', '談物流'),
        href: '/contact',
      },
    ],
    locationsEyebrow: t('Factory & Manufacturing Locations', '廠區與製造據點'),
    locationsTitle: t('Taiwan & China manufacturing', '台灣與中國製造'),
    locations: [
      {
        name: t('Taiwan — headquarters & production', '台灣 —— 總部與生產'),
        note: t(
          '[Add the site address, floor area, lines and the processes run here.]',
          '[待補：地址、廠房面積、產線數與此處運作的製程。]',
        ),
      },
      {
        name: t('China — manufacturing', '中國 —— 製造'),
        note: t(
          '[Add the site address, capacity and which product platforms it serves.]',
          '[待補：地址、產能，以及服務哪些產品平台。]',
        ),
      },
    ],
    mapLabel: t(
      'Location map — Taiwan / China manufacturing & shipping · 1600×800',
      '據點地圖 —— 台灣／中國製造與出貨 · 1600×800',
    ),
  },

  sustainability: {
    eyebrow: t('Sustainability', '永續發展'),
    title: t('Compliance you can hand to your auditor', '可以直接交給稽核員的合規資料'),
    cta: t('Full sustainability report', '完整永續報告'),
    items: [
      {
        title: t('ESG Results', 'ESG 成果'),
        body: t(
          'Published results against our environmental and social targets.',
          '對照環境與社會目標的公開成果。',
        ),
        href: '/sustainability#esg',
      },
      {
        title: t('Carbon Footprint (TRIPs)', '碳足跡（TRIPs）'),
        body: t(
          'Product-level carbon footprint management across the material platforms.',
          '橫跨各材料平台的產品級碳足跡管理。',
        ),
        href: '/sustainability#carbon',
      },
      {
        title: t('EUDR Response', 'EUDR 因應'),
        body: t('Deforestation-regulation readiness for EU-bound supply chains.', '為銷歐供應鏈準備的零毀林法規因應。'),
        href: '/sustainability#eudr',
      },
      {
        title: t('Certifications & Standards', '認證與標準'),
        body: t('ISO 14001, ISO 22196, BSCI, GRS — with certificates on file.', 'ISO 14001、ISO 22196、BSCI、GRS —— 證書皆存檔。'),
        href: '/sustainability#certifications',
      },
    ],
    certsLabel: t('Certifications & standards', '認證與標準'),
    certIds: ['iso-14001', 'iso-22196', 'bsci', 'grs'],
  },

  certification: {
    eyebrow: t('Certification', '認證'),
    title: t('Every claim on this site has a certificate behind it', '這個網站上的每一項宣告，背後都有一張證書'),
    lead: t(
      'Select any certification to see the issuing body, validity, scope and covered sites.',
      '點選任一項認證，即可看到發證機構、效期、範疇與適用據點。',
    ),
    groups: [
      {
        title: t('Company / Factory Certification', '公司／工廠認證'),
        body: t(
          'Management-system and audit certifications held at company and factory level.',
          '公司與工廠層級持有的管理系統與稽核認證。',
        ),
        ids: ['iso-14001', 'bsci', 'iso-9001'],
      },
      {
        title: t('Sustainability Certification', '永續認證'),
        body: t(
          'Third-party certification covering sustainability, recycled content and carbon.',
          '涵蓋永續、回收成分與碳議題的第三方認證。',
        ),
        ids: ['grs', 'sustainability-todo'],
      },
      {
        title: t('Product Compliance', '產品法規符合'),
        body: t(
          'Substance and test compliance at product level, across every material platform we ship.',
          '產品層級的物質與測試合規，涵蓋我們出貨的每一個材料平台。',
        ),
        ids: ['iso-22196', 'rohs', 'reach', 'iec-ip'],
      },
    ],
    /** 尚無內容的認證卡在畫面上顯示這個字樣，而不是「查看詳情」。 */
    pending: t('Pending', '待提供'),
    view: t('View details →', '查看詳情 →'),
    notes: {
      'iso-14001': t('Environmental management systems.', '環境管理系統。'),
      bsci: t('Social & labour compliance auditing.', '社會與勞動條件稽核。'),
      'iso-9001': t(
        'Company / factory quality management certification, e.g. ISO 9001.',
        '公司／工廠品質管理認證，例如 ISO 9001。',
      ),
      grs: t('Global Recycled Standard content tracing.', '全球回收標準成分追溯。'),
      'sustainability-todo': t(
        'Carbon footprint verification, EUDR or other sustainability certification.',
        '碳足跡查證、EUDR 或其他永續認證。',
      ),
      'iso-22196': t('Antibacterial activity on plastic surfaces.', '塑膠表面抗菌活性。'),
      rohs: t('Restricted substances across all platforms.', '涵蓋所有平台的限用物質。'),
      reach: t('Substance-of-very-high-concern reporting.', '高度關切物質報告。'),
      'iec-ip': t('Ingress protection, tested to your protocol.', '防護等級，依您的規範測試。'),
    } as Record<string, ReturnType<typeof t>>,
  },

  partnership: {
    eyebrow: t('Partnership', '合作夥伴'),
    title: t('How we work with our partners', '我們如何與夥伴合作'),
    cta: t('Partnership details', '合作細節'),
    items: [
      {
        title: t('OEM / ODM Service', 'OEM / ODM 服務'),
        body: t(
          'From target spec to locked mass-production drawing, with one engineering owner throughout.',
          '從目標規格到鎖定的量產圖面，全程由同一位工程窗口負責。',
        ),
        cta: t('How it works', '運作方式'),
        href: '/partnership#oem-odm',
      },
      {
        title: t('Distribution & Purchasing', '經銷與採購'),
        body: t(
          'Regional distribution and purchasing cooperation for partners carrying our platforms.',
          '為代理我們平台的夥伴提供區域經銷與採購合作。',
        ),
        cta: t('Become a partner', '成為夥伴'),
        href: '/partnership#distribution',
      },
      {
        title: t('Case Studies', '案例'),
        body: t(
          'What we shipped, what it had to survive, and how the programme ran.',
          '我們出了什麼、它得撐過什麼、專案怎麼跑的。',
        ),
        cta: t('Read the cases', '閱讀案例'),
        href: '/resources#insights',
      },
    ],
  },

  cta: {
    eyebrow: t('Partner with Vicround', '與盈絲合作'),
    headline: t('Ready to put our materials to the test?', '準備好考驗我們的材料了嗎？'),
    subcopy: t(
      'Tell us your application and target spec — our engineering team responds within two business days.',
      '告訴我們您的應用與目標規格 —— 工程團隊將於兩個工作天內回覆。',
    ),
  },
};
