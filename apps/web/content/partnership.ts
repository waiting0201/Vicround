import { t } from '@/lib/content';

/** Partnership —— 逐字取自 `mockup/Rounded Design/partnership.dc.html`（繁中暫譯）。 */
export const partnership = {
  banner: {
    eyebrow: t('Partnership', '合作夥伴'),
    title: t('Grow with a materials partner, not just a vendor.', '與材料夥伴一起成長，而不只是找一家供應商。'),
    description: t(
      'From first spec to full-scale production, and from direct purchasing to regional distribution.',
      '從第一份規格到全面量產，從直接採購到區域經銷。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Partnership · 2560×480', 'Banner 圖 —— 合作夥伴 · 2560×480'),
  },

  oem: {
    eyebrow: t('OEM / ODM Service Description', 'OEM / ODM 服務說明'),
    title: t('From spec to scale', '從規格到量產'),
    lead: t(
      'We embed with OEM and ODM engineering teams from the first spec conversation through qualified mass production.',
      '從第一次規格討論到通過驗證的量產，我們與 OEM／ODM 工程團隊一起投入。',
    ),
    steps: [
      {
        icon: 'file-text',
        title: t('Spec', '規格'),
        body: t(
          'We review your application, target performance and constraints together.',
          '我們與您一起檢視應用、目標性能與限制條件。',
        ),
      },
      {
        icon: 'flask-conical',
        title: t('Sample', '樣品'),
        body: t(
          'Prototype and qualification samples validated against your test plan.',
          '原型與驗證樣品依您的測試計畫驗證。',
        ),
      },
      {
        icon: 'factory',
        title: t('Scale', '量產'),
        body: t(
          'Qualified mass production with consistent, certified output.',
          '通過驗證的量產，輸出穩定且有認證依據。',
        ),
      },
    ],
  },

  distribution: {
    eyebrow: t('Distribution / Purchasing Cooperation', '經銷／採購合作'),
    title: t('Two ways to work with us', '兩種合作方式'),
    body: t(
      'Buy direct as a purchasing partner, or carry our materials as a regional distributor — order structures scale with program volume, and every route gets the same engineering support.',
      '以採購夥伴身分直接購買，或以區域經銷商身分代理我們的材料 —— 訂單架構隨專案量調整，而兩種路徑得到的工程支援相同。',
    ),
    cta: t('Become a partner', '成為合作夥伴'),
    imageLabel: t('Imagery placeholder — distribution network · 1200×900', '圖片版位 —— 經銷網絡 · 1200×900'),
  },

  testimonials: {
    eyebrow: t('Customer Testimonials / Case Studies', '客戶推薦／案例'),
    title: t('What partners say', '合作夥伴怎麼說'),
    items: [
      { quote: t('[Add customer testimonial quote.]', '[待補：客戶推薦內容。]'), author: t('[Add title, company type]', '[待補：職稱、公司類型]') },
      { quote: t('[Add customer testimonial quote.]', '[待補：客戶推薦內容。]'), author: t('[Add title, company type]', '[待補：職稱、公司類型]') },
      { quote: t('[Add customer testimonial quote.]', '[待補：客戶推薦內容。]'), author: t('[Add title, company type]', '[待補：職稱、公司類型]') },
    ],
  },

  cta: {
    eyebrow: t("Let's talk", '聊聊吧'),
    headline: t('Start the conversation about your program.', '從您的專案開始談起。'),
    subcopy: t(
      'Tell us your application and target spec — our engineering team responds within two business days.',
      '告訴我們您的應用與目標規格 —— 工程團隊將於兩個工作天內回覆。',
    ),
  },
};
