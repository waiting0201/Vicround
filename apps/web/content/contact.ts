import { t } from '@/lib/content';

/** Contact —— 逐字取自 `mockup/Rounded Design/contact.dc.html`（繁中暫譯）。 */
export const contact = {
  banner: {
    eyebrow: t('Contact Us', '聯絡我們'),
    title: t("Tell us what you're building.", '告訴我們您正在做什麼。'),
    description: t(
      'Send us your application and target spec. Inquiries reach the engineer who owns that material platform — not a general mailbox — and we respond within two business days.',
      '把您的應用與目標規格給我們。詢問會直接送到負責該材料平台的工程師手上，而不是一個公用信箱，我們將於兩個工作天內回覆。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Contact · 2560×480', 'Banner 圖 —— 聯絡我們 · 2560×480'),
  },

  form: {
    title: t('Send an inquiry', '送出詢問'),
    lead: t(
      'Fields marked * are required. The more you can tell us about the application and target spec, the faster we can quote.',
      '標示 * 為必填。應用與目標規格說明得越清楚，我們就能越快報價。',
    ),
    sentTitle: t("Thank you — we've received your inquiry.", '感謝您 —— 我們已收到您的詢問。'),
    sentBody: t(
      'A reference number has been emailed to you. Our team responds within two business days.',
      '受理編號已寄至您的信箱。團隊將於兩個工作天內回覆。',
    ),
    fields: {
      name: t('Name *', '姓名 *'),
      company: t('Company *', '公司 *'),
      email: t('Business Email *', '公司電子郵件 *'),
      productLine: t('Product Line', '產品線'),
      application: t('Application', '應用'),
      targetSpec: t('Target Spec', '目標規格'),
    },
    productLines: [
      t('Optical Film', '光學膜'),
      t('Textile & Foam', '紡織與泡棉'),
      t('Acoustic', '聲學材料'),
      t('Other', '其他'),
    ],
    consentBefore: t(
      'I agree that Vicround may use the information above to respond to this inquiry, as described in the ',
      '我同意盈絲實業依',
    ),
    consentLink: t('Privacy Policy', '隱私權政策'),
    consentAfter: t('.', '使用上述資訊回覆本次詢問。'),
    responseTime: t('Typical response time: 2 business days', '一般回覆時間：2 個工作天'),
    submit: t('Send inquiry', '送出詢問'),
  },

  direct: {
    title: t('Reach us directly', '直接聯絡我們'),
    lead: t('Already know who you need? Skip the form.', '已經知道要找誰？可以略過表單。'),
    channels: [
      {
        icon: 'package',
        title: t('Sales & quotations', '業務與報價'),
        email: 'sales@vicround.com',
        note: t('Pricing, lead times, sample orders.', '價格、交期、樣品訂單。'),
      },
      {
        icon: 'flask-conical',
        title: t('Technical & engineering', '技術與工程'),
        email: 'engineering@vicround.com',
        note: t('Spec review, material selection, testing data.', '規格檢視、材料選定、測試數據。'),
      },
      {
        icon: 'handshake',
        title: t('Partnership & distribution', '合作與經銷'),
        email: 'partners@vicround.com',
        note: t('OEM/ODM programs and regional distribution.', 'OEM／ODM 專案與區域經銷。'),
      },
      {
        icon: 'phone',
        title: t('Headquarters', '總公司'),
        email: '+886 4 2359 0000',
        note: t('Mon–Fri, 09:00–18:00 (GMT+8)', '週一至週五 09:00–18:00（GMT+8）'),
      },
    ],
    hurryTitle: t('In a hurry?', '趕時間？'),
    hurryLabel: t('Spec library', '規格文件庫'),
    hurryBody: t(
      'Spec sheets and technical documents are available to download straight away — no form required. Head to Resources → Downloads.',
      '規格書與技術文件可直接下載，不必填表。請前往「資源中心 → 技術文件下載」。',
    ),
  },

  locations: {
    eyebrow: t('Locations', '據點'),
    title: t('Where to find us', '我們在哪裡'),
    lead: t(
      "Headquarters and R&D in Taiwan, with production and sales support close to our customers' assembly lines.",
      '總部與研發在台灣，生產與業務支援則貼近客戶的組裝線。',
    ),
    mapLabel: t('Location map — Taiwan · China · Vietnam · 2000×625', '據點地圖 —— 台灣 · 中國 · 越南 · 2000×625'),
    openInMaps: t('Open in Maps →', '在地圖開啟 →'),
    items: [
      {
        kind: t('Headquarters', '總部'),
        city: t('Taichung, Taiwan', '台灣台中'),
        address: t(
          'No. 000, Sec. 0, Taiwan Blvd., Xitun Dist., Taichung City 407, Taiwan',
          '407 台中市西屯區台灣大道 0 段 000 號',
        ),
        phone: '+886 4 2359 0000',
      },
      {
        kind: t('Production', '生產'),
        city: t('Suzhou, China', '中國蘇州'),
        address: t(
          'Coating and converting lines serving mainland China assembly partners.',
          '塗佈與加工產線，服務中國大陸的組裝夥伴。',
        ),
        phone: '+86 512 0000 0000',
      },
      {
        kind: t('Production', '生產'),
        city: t('Bac Ninh, Vietnam', '越南北寧'),
        address: t(
          'Die-cutting and assembly capacity for Southeast Asia programs.',
          '模切與組裝產能，服務東南亞專案。',
        ),
        phone: '+84 222 000 0000',
      },
    ],
  },

  process: {
    title: t('What happens after you send', '送出之後會發生什麼'),
    steps: [
      {
        title: t('Routed, not queued', '直接分派，不進排隊'),
        body: t(
          'Your inquiry goes straight to the engineer who owns that material platform, with your spec attached.',
          '您的詢問連同規格會直接送到負責該材料平台的工程師手上。',
        ),
      },
      {
        title: t('Feasibility reply in 2 days', '兩天內回覆可行性'),
        body: t(
          'We come back with a candidate material, the relevant test data, and any open questions about your spec.',
          '我們會回覆候選材料、相關測試數據，以及對您規格尚待確認的問題。',
        ),
      },
      {
        title: t('Samples on the way', '樣品隨即出發'),
        body: t(
          'Once the direction is agreed, sample sheets ship within two weeks for your own validation.',
          '方向確認後，樣品將於兩週內寄出供您自行驗證。',
        ),
      },
    ],
  },
};
