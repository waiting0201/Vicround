import { t } from '@/lib/content';

/** Solutions hub 文案 —— 逐字取自 `mockup/Rounded Design/solutions.dc.html`（繁中暫譯）。 */
const EXPLORE = t('Explore this application →', '了解這個應用 →');

export const solutionsHub = {
  banner: {
    eyebrow: t('Solutions', '應用解決方案'),
    title: t('Solutions engineered by industry.', '依產業設計的解決方案。'),
    description: t(
      "Seven application areas, one materials platform — optical film, technical textile & foam, and acoustic components matched to each industry's real-world demands.",
      '七個應用領域、一個材料平台 —— 光學膜、機能性紡織與泡棉、聲學元件，對應每個產業的真實需求。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Solutions · 2560×480', 'Banner 圖 —— 解決方案 · 2560×480'),
  },
  cta: {
    eyebrow: t('Not seeing your industry?', '沒看到您的產業？'),
    headline: t(
      'We engineer to your application, not just our catalog.',
      '我們依您的應用開發，而不只是照型錄供貨。',
    ),
    subcopy: t(
      'Send us your target spec and use case — our engineering team responds within two business days.',
      '把目標規格與使用情境給我們 —— 工程團隊將於兩個工作天內回覆。',
    ),
  },
  cards: [
    {
      slug: 'consumer-electronics',
      title: t('Consumer Electronics', '消費性電子'),
      body: t(
        'Anti-glare and anti-fingerprint optical film plus protective foam gaskets for phones, laptops and tablets.',
        '抗眩光與抗指紋光學膜，加上保護用泡棉墊片，用於手機、筆電與平板。',
      ),
      link: EXPLORE,
      platforms: [t('Optical Film', '光學膜'), t('Textile & Foam', '紡織與泡棉')],
    },
    {
      slug: 'automotive',
      title: t('Automotive', '車用'),
      body: t(
        'Anti-fouling, anti-rain films and cockpit display protection engineered for automotive-grade durability.',
        '抗污、抗雨膜與座艙顯示器防護，以車規耐久性設計。',
      ),
      link: EXPLORE,
      platforms: [t('Optical Film', '光學膜')],
    },
    {
      slug: 'smart-healthcare',
      title: t('Smart Healthcare', '智慧醫療'),
      body: t(
        'Privacy film and antimicrobial surface treatments for clinical displays and shared medical devices.',
        '防窺膜與抗菌表面處理，用於臨床顯示器與共用醫療設備。',
      ),
      link: EXPLORE,
      platforms: [t('Optical Film', '光學膜'), t('Textile & Foam', '紡織與泡棉')],
    },
    {
      slug: 'renewable-energy',
      title: t('Renewable Energy', '再生能源'),
      body: t(
        'Weatherproof protective film and sealing gaskets that extend the service life of solar panel assemblies.',
        '耐候保護膜與密封墊片，延長太陽能模組的服役壽命。',
      ),
      link: EXPLORE,
      platforms: [t('Optical Film', '光學膜'), t('Textile & Foam', '紡織與泡棉')],
    },
    {
      slug: 'acoustic-solutions',
      title: t('Acoustic Solutions', '聲學解決方案'),
      badge: t('New', '新'),
      body: t(
        'Waterproof, dust-proof mesh protecting speakers and microphones without compromising sound clarity.',
        '防水防塵網布，在不犧牲音質的前提下保護喇叭與麥克風。',
      ),
      link: t('Explore acoustic solutions →', '了解聲學解決方案 →'),
      platforms: [t('Acoustic', '聲學材料')],
    },
    {
      slug: 'e-paper',
      title: t('E-Paper', '電子紙'),
      body: t(
        'Optical film tuned for low-glare, low-reflectance e-paper and e-reader displays.',
        '為低眩光、低反射的電子紙與電子閱讀器調校的光學膜。',
      ),
      link: EXPLORE,
      platforms: [t('Optical Film', '光學膜')],
    },
    {
      slug: 'sports-eyewear',
      title: t('Sports Eye-Wear', '運動眼鏡'),
      body: t(
        'Anti-fog, anti-scratch film and cushioning foam for performance eyewear.',
        '防霧、抗刮膜與緩衝泡棉，用於機能型眼鏡。',
      ),
      link: EXPLORE,
      platforms: [t('Optical Film', '光學膜'), t('Textile & Foam', '紡織與泡棉')],
    },
  ],
};
