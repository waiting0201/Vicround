import { t } from '@/lib/content';

/**
 * Products hub 文案 —— 英文逐字取自 `mockup/Rounded Design/products.dc.html`，
 * 繁中為暫譯（待客戶校稿）。接上 `GET /api/v1/pages/products` + `/categories` 後刪除。
 */
export const products = {
  banner: {
    eyebrow: t('Products', '產品'),
    title: t('Three material platforms. Endless applications.', '三大材料平台，無限應用可能。'),
    description: t(
      'Optical Film, Textile & Foam, and Acoustic — every product ships against a certified, repeatable spec.',
      '光學膜、紡織與泡棉、聲學材料 —— 每項產品都依可驗證、可重現的規格出貨。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Products · 2560×480', 'Banner 圖 —— 產品 · 2560×480'),
  },

  cta: {
    eyebrow: t('Need a custom spec?', '需要客製規格？'),
    headline: t("Let's engineer it together.", '我們一起把它做出來。'),
    subcopy: t(
      'Tell us your application and target spec — our engineering team responds within two business days.',
      '告訴我們您的應用與目標規格 —— 工程團隊將於兩個工作天內回覆。',
    ),
  },

  lines: [
    {
      slug: 'optical-film',
      anchor: 'optical',
      index: '01',
      /** 淺色底用的深一階數字色（mockup 在深色頁用 #2f85da，淺色頁用 #1f6ab4）。 */
      color: '#1f6ab4',
      image: '/assets/product-optical-film.jpg',
      raised: false,
      title: t('Optical Film', '光學膜'),
      alt: t(
        'Optical film samples — anti-glare, anti-fingerprint and privacy coatings',
        '光學膜樣品 —— 抗眩光、抗指紋與防窺塗層',
      ),
      cardBody: t(
        'Anti-glare, anti-fingerprint and privacy films for displays.',
        '為顯示器開發的抗眩光、抗指紋與防窺膜。',
      ),
      body: t(
        'Precision-coated films that manage glare, fingerprints and viewing angle across consumer, automotive and medical displays.',
        '精密塗佈膜材，處理消費性、車用與醫療顯示器的眩光、指紋與可視角問題。',
      ),
      features: [
        {
          title: t('Anti-Glare (AG)', '抗眩光（AG）'),
          body: t('Diffuses reflected light for outdoor readability.', '擴散反射光，提升戶外可讀性。'),
        },
        {
          title: t('Anti-Fingerprint (AF)', '抗指紋（AF）'),
          body: t('Oleophobic coating resists smudging.', '疏油塗層抗污漬。'),
        },
        {
          title: t('Privacy / Anti-Peek', '防窺'),
          body: t('Narrows viewing angle for shared-space displays.', '收窄可視角，適用於共用空間的顯示器。'),
        },
        {
          title: t('Hard Coating', '硬塗層'),
          body: t('Abrasion-resistant surface layer.', '耐磨表面層。'),
        },
      ],
    },
    {
      slug: 'textile-foam',
      anchor: 'textile',
      index: '02',
      color: '#a2540f',
      image: '/assets/product-textile-foam.jpg',
      raised: true,
      title: t('Textile & Foam', '紡織與泡棉'),
      alt: t('Technical textile and engineered foam samples', '機能性紡織與工程泡棉樣品'),
      cardBody: t(
        'Technical fabrics and foams for cushioning, sealing and shielding.',
        '用於緩衝、密封與遮蔽的機能布與泡棉。',
      ),
      body: t(
        'Technical fabrics and engineered foams for cushioning, sealing and shielding inside demanding assemblies.',
        '機能布與工程泡棉，用於嚴苛組裝件內部的緩衝、密封與遮蔽。',
      ),
      features: [
        {
          title: t('EMI Shielding', 'EMI 遮蔽'),
          body: t('Conductive layers for electromagnetic compliance.', '導電層，符合電磁相容要求。'),
        },
        {
          title: t('Gaskets & Seals', '墊片與密封'),
          body: t('Dust and moisture ingress protection.', '防塵與防潮氣侵入。'),
        },
        {
          title: t('Cushioning Foam', '緩衝泡棉'),
          body: t('Impact and vibration absorption.', '吸收衝擊與振動。'),
        },
        {
          title: t('Custom Die-Cut', '客製模切'),
          body: t('Precision-cut to assembly spec.', '依組裝規格精密裁切。'),
        },
      ],
    },
    {
      slug: 'acoustic',
      anchor: 'acoustic',
      index: '03',
      color: '#0f8a76',
      image: '/assets/product-acoustic.jpg',
      raised: false,
      title: t('Acoustic', '聲學材料'),
      alt: t('Acoustic foam and waterproof mesh samples', '聲學泡棉與防水網布樣品'),
      cardBody: t(
        'Waterproof, dust-proof mesh for speakers and microphones.',
        '用於喇叭與麥克風的防水防塵網布。',
      ),
      body: t(
        'Waterproof, dust-proof mesh that protects speakers and microphones without compromising sound.',
        '防水防塵網布，在不犧牲音質的前提下保護喇叭與麥克風。',
      ),
      features: [
        {
          title: t('IP67 Mesh', 'IP67 網布'),
          body: t('Waterproof and dustproof protection.', '防水防塵防護。'),
        },
        {
          title: t('Acoustic Transparency', '聲學穿透性'),
          body: t('Minimal impact on frequency response.', '對頻率響應影響極小。'),
        },
        {
          title: t('Speaker Protection', '喇叭防護'),
          body: t('Guards drivers from moisture and dust.', '保護單體不受濕氣與粉塵影響。'),
        },
        {
          title: t('Microphone Protection', '麥克風防護'),
          body: t('Preserves pickup clarity in the field.', '在現場維持收音清晰度。'),
        },
      ],
    },
  ],

  links: {
    viewRange: t('View the full {name} range →', '瀏覽完整 {name} 產品線 →'),
    specSheet: t('Download spec sheet →', '下載規格書 →'),
  },
};
