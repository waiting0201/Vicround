import { t } from '@/lib/content';

/**
 * 首頁文案 —— 英文逐字取自 `mockup/Rounded Design/index.dc.html`（客戶確認稿），
 * 繁中為暫譯，**待客戶校稿**。接上 `GET /api/v1/pages/home` 後本檔刪除。
 */
export const home = {
  hero: {
    eyebrow: t('Advanced Materials Manufacturer · OEM / ODM', '先進材料製造商 · OEM / ODM'),
    title: t('Bold ideas. Real answers.', '大膽構想，實在解答。'),
    lead: t(
      "Vicround engineers optical film, technical textile & foam, and acoustic materials that ship inside the world's consumer electronics, vehicles, medical devices and solar hardware.",
      '盈絲實業開發光學膜、機能性紡織與泡棉、聲學材料，供應全球消費性電子、車輛、醫療器材與太陽能硬體。',
    ),
    image: '/assets/hero-banner-01.jpg',
    imageAlt: t('Bold ideas. Real answers.', '大膽構想，實在解答。'),
  },

  materials: {
    eyebrow: t('Three Major Products', '三大產品'),
    title: t('What we engineer', '我們製造什麼'),
    items: [
      {
        index: '01',
        color: '#2f85da',
        image: '/assets/product-optical-film.jpg',
        slug: 'optical-film',
        title: t('Optical Film', '光學膜'),
        alt: t(
          'Optical film samples — anti-glare, anti-fingerprint and privacy coatings',
          '光學膜樣品 —— 抗眩光、抗指紋與防窺塗層',
        ),
        body: t(
          'Anti-glare, anti-fingerprint and privacy films engineered for displays — from handheld screens to automotive cockpits.',
          '為顯示器開發的抗眩光、抗指紋與防窺膜 —— 從手持裝置螢幕到車用座艙。',
        ),
        tags: [t('AG', 'AG'), t('AF', 'AF'), t('Privacy', '防窺')],
      },
      {
        index: '02',
        color: '#da762f',
        image: '/assets/product-textile-foam.jpg',
        slug: 'textile-foam',
        title: t('Textile & Foam', '紡織與泡棉'),
        alt: t('Technical textile and engineered foam samples', '機能性紡織與工程泡棉樣品'),
        body: t(
          'Technical fabrics and foams for cushioning, sealing and EMI shielding — built to spec for demanding assemblies.',
          '用於緩衝、密封與 EMI 遮蔽的機能布與泡棉 —— 依規格為嚴苛組裝需求量身製作。',
        ),
        tags: [t('EMI shielding', 'EMI 遮蔽'), t('Gaskets', '墊片'), t('Foams', '泡棉')],
      },
      {
        index: '03',
        color: '#2fdabe',
        image: '/assets/product-acoustic.jpg',
        slug: 'acoustic',
        title: t('Acoustic', '聲學材料'),
        alt: t('Acoustic foam and waterproof mesh samples', '聲學泡棉與防水網布樣品'),
        body: t(
          'Waterproof, dust-proof mesh protecting speakers and microphones without compromising sound.',
          '防水防塵網布，在不犧牲音質的前提下保護喇叭與麥克風。',
        ),
        tags: [t('IP67 mesh', 'IP67 網布'), t('Speaker', '喇叭'), t('Microphone', '麥克風')],
      },
    ],
  },

  industries: {
    eyebrow: t('Application Overview', '應用總覽'),
    title: t('Purpose-built by industry', '依產業量身打造'),
    items: [
      {
        icon: 'smartphone',
        slug: 'consumer-electronics',
        title: t('Consumer Electronics', '消費性電子'),
        body: t('Phones, tablets and wearables.', '手機、平板與穿戴裝置。'),
      },
      {
        icon: 'car',
        slug: 'automotive',
        title: t('Automotive', '車用'),
        body: t('Cockpit displays and sensors.', '座艙顯示器與感測器。'),
      },
      {
        icon: 'stethoscope',
        slug: 'smart-healthcare',
        title: t('Smart Healthcare', '智慧醫療'),
        body: t('Antimicrobial device surfaces.', '器材抗菌表面。'),
      },
      {
        icon: 'sun',
        slug: 'renewable-energy',
        title: t('Renewable Energy', '再生能源'),
        body: t('PV modules and enclosures.', '太陽能模組與機殼。'),
      },
    ],
  },

  trust: {
    eyebrow: t('Customer Trust Wall', '客戶信任牆'),
    title: t('Certified. Trusted. Proven.', '通過認證，值得信賴，實績驗證。'),
    /** 首頁只露出這四張；完整清單在 Sustainability 與 About。 */
    certificationIds: ['iso-14001', 'iso-22196', 'bsci', 'grs'],
    partnerSlots: 6,
    partnerLabel: t('Partner logo', '合作品牌 logo'),
    exhibitionSlots: 3,
    exhibitionLabel: t('Trade show — add name & year', '展會 —— 待補名稱與年份'),
  },

  sustainability: {
    eyebrow: t('Sustainability Commitments', '永續承諾'),
    title: t('Committed to a lower-carbon supply chain.', '致力打造低碳供應鏈。'),
    body: t(
      'ESG results, carbon footprint management (TRIPs), and EUDR-ready sourcing — engineered into every material we ship.',
      'ESG 成果、碳足跡管理（TRIPs）與符合 EUDR 的採購 —— 內建於我們出貨的每一種材料。',
    ),
    email: 'sales@vicround.com',
  },
};
