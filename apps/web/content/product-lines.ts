import { t, type Localized } from '@/lib/content';

/**
 * 三個產品線頁 —— 英文逐字取自 `mockup/Rounded Design/product-optical-film.dc.html`、
 * `product-textile-foam.dc.html`、`product-acoustic.dc.html`，繁中為暫譯（待客戶校稿）。
 *
 * <p>
 * ⚠️ 接上 API 後由 `GET /api/v1/categories/{slug}` 提供：`families` 對應該產品線底下的
 * `Products`、`specs` 對應 `SpecificationRows`、`process` 對應 `ProcessFlows`
 * （見 docs/database.md §02、§04）。這裡的 key 刻意與那些實體對齊，之後替換資料來源即可。
 * </p>
 */
export type ProductLine = {
  slug: string;
  /** 淺色頁用的產品線色（mockup 在淺色底上用深一階，確保對比度）。 */
  color: string;
  banner: {
    eyebrow: Localized;
    title: Localized;
    description: Localized;
    image: string;
    imageLabel: Localized;
  };
  overview: {
    image: string;
    alt: Localized;
    title: Localized;
    paragraphs: Localized[];
    stats: { value: Localized; label: Localized }[];
  };
  families: {
    title: Localized;
    lead: Localized;
    items: { code: string; name: Localized; body: Localized; tags: Localized[] }[];
  };
  specs: {
    title: Localized;
    rows: { property: Localized; value: Localized; note: Localized }[];
    note: Localized;
  };
  process: {
    title: Localized;
    steps: { icon: string; name: Localized; body: Localized }[];
  };
  /** 對應的產業解決方案 slug（`Where it is used` 那排 chip）。 */
  solutions: string[];
  cta: { eyebrow: Localized; headline: Localized; subcopy: Localized };
};

const FAMILIES_LEAD = t(
  'Every family below is a production grade shipping today. Custom formulations start from the closest one.',
  '以下每一個系列都是目前量產出貨的等級。客製配方由最接近的那一個開始調整。',
);

export const PRODUCT_LINES: Record<string, ProductLine> = {
  'optical-film': {
    slug: 'optical-film',
    color: '#1f6ab4',
    banner: {
      eyebrow: t('Products · Optical Film', '產品 · 光學膜'),
      title: t(
        'Coated film, specified by what the surface has to do.',
        '塗佈膜材，以表面該做什麼來定規格。',
      ),
      description: t(
        'Eight production families across anti-glare, anti-fingerprint, privacy, anti-fog, antimicrobial, paper-like, weatherable and hard-coat — coated in-house and converted to your part geometry.',
        '八大量產系列：抗眩光、抗指紋、防窺、防霧、抗菌、紙感、耐候與硬塗層 —— 自有塗佈產線，並依您的零件外形加工成形。',
      ),
      image: '/assets/banner-optical-film.jpg',
      imageLabel: t('Banner imagery — Optical Film · 2560×480', 'Banner 圖 —— 光學膜 · 2560×480'),
    },
    overview: {
      image: '/assets/product-optical-film.jpg',
      alt: t(
        'Optical film samples — anti-glare, anti-fingerprint and privacy coatings',
        '光學膜樣品 —— 抗眩光、抗指紋與防窺塗層',
      ),
      title: t('One coating line, eight surface behaviours.', '一條塗佈線，八種表面行為。'),
      paragraphs: [
        t(
          'Every grade starts from the same optical-grade PET or TAC substrate and diverges at the coating head. The thickness tolerance, adhesive system and release liner stay consistent across your whole bill of materials even when the surface function changes.',
          '每個等級都從同樣的光學級 PET 或 TAC 基材出發，在塗佈頭才分流。即使表面功能改變，厚度公差、膠系與離型膜在整份物料清單上仍維持一致。',
        ),
        t(
          'We coat, cure, inspect and convert on site. Nothing is bought in and re-labelled — so when a specification has to move mid-program, we can actually move it.',
          '塗佈、固化、檢測與加工都在自有廠內完成。沒有任何一項是外購後貼牌 —— 所以專案中途需要調整規格時，我們真的動得了。',
        ),
      ],
      stats: [
        { value: t('8', '8'), label: t('Production families', '量產系列') },
        { value: t('± 3 %', '± 3 %'), label: t('Coating uniformity', '塗佈均勻度') },
        { value: t('0.05 – 0.5 mm', '0.05 – 0.5 mm'), label: t('Thickness range', '厚度範圍') },
      ],
    },
    families: {
      title: t('Product families', '產品系列'),
      lead: FAMILIES_LEAD,
      items: [
        {
          code: 'AG',
          name: t('Anti-Glare', '抗眩光'),
          body: t(
            'Diffuses reflected light so displays stay readable in daylight and under overhead lighting.',
            '擴散反射光，讓顯示器在日光與頂燈下仍可判讀。',
          ),
          tags: [t('Gloss 60 – 120 GU', '光澤度 60 – 120 GU'), t('Haze 3 – 25 %', '霧度 3 – 25 %')],
        },
        {
          code: 'AF',
          name: t('Anti-Fingerprint', '抗指紋'),
          body: t(
            'Oleophobic top layer that resists smudging and returns to clear with a single wipe.',
            '疏油表層抗污漬，一次擦拭即回復清透。',
          ),
          tags: [t('Contact angle > 110°', '接觸角 > 110°'), t('5,000 wipe cycles', '5,000 次擦拭循環')],
        },
        {
          code: 'PV',
          name: t('Privacy / Anti-Peek', '防窺'),
          body: t(
            'Narrows the viewing cone for shared workspaces, clinical carts and public terminals.',
            '收窄可視錐角，適用於共用辦公空間、醫療推車與公共終端。',
          ),
          tags: [t('Cone ± 30°', '可視角 ± 30°'), t('Transmittance > 88 %', '穿透率 > 88 %')],
        },
        {
          code: 'AFG',
          name: t('Anti-Fog', '防霧'),
          body: t(
            'Hydrophilic layer that holds clarity through condensation instead of beading it.',
            '親水層讓凝結水均勻鋪展而非成珠，維持清晰。',
          ),
          tags: [t('EN 168 > 20 s', 'EN 168 > 20 秒'), t('20 wash cycles', '20 次清洗循環')],
        },
        {
          code: 'AM',
          name: t('Antimicrobial', '抗菌'),
          body: t(
            'Additive carried in the coating matrix rather than sprayed on the surface.',
            '抗菌劑內含於塗層基質中，而非表面噴塗。',
          ),
          tags: [t('ISO 22196 > 99 %', 'ISO 22196 > 99 %'), t('24 h contact', '24 小時接觸')],
        },
        {
          code: 'PL',
          name: t('Paper-Like', '紙感'),
          body: t(
            'Micro-texture tuned for stylus writing feel on e-paper and note-taking panels.',
            '微結構調校出觸控筆書寫手感，適用電子紙與筆記面板。',
          ),
          tags: [t('Friction 0.35 – 0.55', '摩擦係數 0.35 – 0.55'), t('Ra 0.3 – 1.2 µm', 'Ra 0.3 – 1.2 µm')],
        },
        {
          code: 'WX',
          name: t('Weatherable', '耐候'),
          body: t(
            'UV-stable topcoat for outdoor signage, sensor windows and PV front sheets.',
            '抗 UV 表層，適用戶外標示、感測器視窗與太陽能前板。',
          ),
          tags: [t('2000 h QUV', '2000 小時 QUV'), t('> 97 % retained', '保持率 > 97 %')],
        },
        {
          code: 'HC',
          name: t('Hard Coat', '硬塗層'),
          body: t(
            'Abrasion-resistant base layer that can be combined with any surface function above.',
            '耐磨底層，可與上述任一表面功能疊加。',
          ),
          tags: [t('3H – 4H pencil', '鉛筆硬度 3H – 4H'), t('5,000 steel-wool cycles', '5,000 次鋼絨測試')],
        },
      ],
    },
    specs: {
      title: t('Common specifications', '共通規格'),
      rows: [
        { property: t('Substrate', '基材'), value: t('PET / TAC', 'PET / TAC'), note: t('Optical grade', '光學級') },
        { property: t('Total thickness', '總厚度'), value: t('0.05 – 0.5 mm', '0.05 – 0.5 mm'), note: t('± 3 %', '± 3 %') },
        { property: t('Light transmittance', '光穿透率'), value: t('88 – 93 %', '88 – 93 %'), note: t('Clear grades', '透明等級') },
        { property: t('Adhesive', '膠系'), value: t('Acrylic / silicone', '壓克力／矽膠'), note: t('Re-workable options', '可重工選項') },
        { property: t('Master roll width', '母卷寬度'), value: t('up to 1,500 mm', '最寬 1,500 mm'), note: t('Before slitting', '分條前') },
        { property: t('Die-cut tolerance', '模切公差'), value: t('± 0.05 mm', '± 0.05 mm'), note: t('Converted parts', '加工件') },
      ],
      note: t(
        'Grade-specific tolerance tables and test reports are available to members in the Resources area.',
        '各等級的公差表與測試報告提供給會員於資源中心下載。',
      ),
    },
    process: {
      title: t('How it is made', '製程說明'),
      steps: [
        {
          icon: 'layers',
          name: t('Coating', '塗佈'),
          body: t(
            'Slot-die and gravure heads run under class-controlled air so particle count stays out of the optical path.',
            '狹縫式與凹版塗佈頭在潔淨等級受控的環境運轉，讓微粒不進入光學路徑。',
          ),
        },
        {
          icon: 'flame',
          name: t('Curing', '固化'),
          body: t(
            'UV and thermal cure profiles set per chemistry, logged per roll.',
            'UV 與熱固化曲線依配方設定，逐卷記錄。',
          ),
        },
        {
          icon: 'scan-line',
          name: t('In-line inspection', '線上檢測'),
          body: t(
            'Automated defect scanning across the full web width, with roll maps issued to the customer.',
            '全幅寬自動缺陷掃描，並提供捲材缺陷分布圖給客戶。',
          ),
        },
        {
          icon: 'scissors',
          name: t('Converting', '加工成形'),
          body: t(
            'Slitting, laminating and die-cutting to the finished part, kitted for your line.',
            '分條、貼合與模切至成品件，並依產線需求配套包裝。',
          ),
        },
      ],
    },
    solutions: [
      'consumer-electronics',
      'automotive',
      'smart-healthcare',
      'renewable-energy',
      'e-paper',
      'sports-eyewear',
    ],
    cta: {
      eyebrow: t('Need a grade that is not listed?', '需要清單以外的等級？'),
      headline: t('Most of our film started as a custom request.', '我們多數的膜材，都是從客製需求開始的。'),
      subcopy: t(
        'Send the surface behaviour you need and the substrate it has to sit on — we will tell you whether it is a formulation change or a new development.',
        '告訴我們您要的表面特性與需搭配的基材 —— 我們會回覆這是配方調整還是全新開發。',
      ),
    },
  },

  'textile-foam': {
    slug: 'textile-foam',
    color: '#a2540f',
    banner: {
      eyebrow: t('Products · Textile & Foam', '產品 · 紡織與泡棉'),
      title: t(
        'Technical textile and engineered foam, cut to your assembly.',
        '機能性紡織與工程泡棉，依您的組裝件裁切。',
      ),
      description: t(
        'Cushioning, sealing, shielding and surface materials — laminated, die-cut and kitted so they arrive ready for the line rather than ready for a second operation.',
        '緩衝、密封、遮蔽與表面材料 —— 經貼合、模切與配套包裝，送到時可直接上線，而不是還要再加工一次。',
      ),
      image: '/assets/banner-textile-foam.jpg',
      imageLabel: t('Banner imagery — Textile & Foam · 2560×480', 'Banner 圖 —— 紡織與泡棉 · 2560×480'),
    },
    overview: {
      image: '/assets/product-textile-foam.jpg',
      alt: t('Technical textile and engineered foam samples', '機能性紡織與工程泡棉樣品'),
      title: t('The part that arrives is the part that fits.', '送到的那一片，就是裝得上的那一片。'),
      paragraphs: [
        t(
          'Foam and textile rarely fail on the datasheet; they fail at the die. A gasket 0.1 mm out of tolerance compresses unevenly, a shielding textile that frays shorts a contact, and both problems surface at final assembly rather than incoming inspection.',
          '泡棉與紡織很少敗在規格書上，而是敗在模具。墊片超差 0.1 mm 就壓不均勻、遮蔽布起毛就會短路接點 —— 而這兩個問題都在最終組裝時才浮現，不是進料檢驗。',
        ),
        t(
          'We laminate, cut and kit in one place, hold ±0.05 mm across the full sheet, and pack parts in the order your line consumes them.',
          '貼合、裁切與配套包裝在同一處完成，全片維持 ±0.05 mm，並依產線取用順序包裝。',
        ),
      ],
      stats: [
        { value: t('± 0.05 mm', '± 0.05 mm'), label: t('Die-cut tolerance', '模切公差') },
        { value: t('6', '6'), label: t('Material families', '材料系列') },
        { value: t('48 h', '48 小時'), label: t('Prototype tooling', '樣品模具') },
      ],
    },
    families: {
      title: t('Product families', '產品系列'),
      lead: FAMILIES_LEAD,
      items: [
        {
          code: 'CF',
          name: t('Cushioning Foam', '緩衝泡棉'),
          body: t(
            'Microcellular foam for impact, vibration and battery swell allowance inside tight enclosures.',
            '微孔泡棉，於狹小機構內吸收衝擊、振動並預留電池膨脹空間。',
          ),
          tags: [t('Compression set < 5 %', '壓縮永久變形 < 5 %'), t('0.2 – 5 mm', '0.2 – 5 mm')],
        },
        {
          code: 'SG',
          name: t('Sealing Gaskets', '密封墊片'),
          body: t(
            'Closed-cell gaskets for dust and moisture ingress protection on sealed housings.',
            '閉孔墊片，為密閉機殼提供防塵防潮氣防護。',
          ),
          tags: [t('IP68 capable', '可達 IP68'), t('−40 to 105 °C', '−40 至 105 °C')],
        },
        {
          code: 'EM',
          name: t('EMI Shielding Textile', 'EMI 遮蔽布'),
          body: t(
            'Conductive fabric for electromagnetic compliance, grounding paths and contact pads.',
            '導電布，用於電磁相容、接地路徑與接點墊片。',
          ),
          tags: [t('Surface resistance < 0.05 Ω/sq', '表面電阻 < 0.05 Ω/sq'), t('Ni/Cu plated', '鍍鎳／銅')],
        },
        {
          code: 'FC',
          name: t('FlexCore™ Surface', 'FlexCore™ 表面材'),
          body: t(
            'Layered craft and gaming surface with a controlled glide profile and a stable base.',
            '多層手作與電競表面材，具可控滑順度與穩固底層。',
          ),
          tags: [t('3-layer construction', '三層結構'), t('Stitched or heat-sealed edge', '車邊或熱封邊')],
        },
        {
          code: 'MP',
          name: t('Desk & Mouse Surface', '桌墊與滑鼠墊表面材'),
          body: t(
            'Printed, wear-resistant top cloth laminated over a stabilised anti-slip base.',
            '印花耐磨面布，貼合於穩定的防滑底材上。',
          ),
          tags: [t('4-colour sublimation', '四色昇華轉印'), t('Anti-slip base', '防滑底材')],
        },
        {
          code: 'CT',
          name: t('Cleanable Technical Textile', '可清潔機能布'),
          body: t(
            'Wipe-down covers and upholstery for clinical and industrial equipment.',
            '可擦拭的護套與表布，適用醫療與工業設備。',
          ),
          tags: [t('5,000 wipe cycles', '5,000 次擦拭循環'), t('IPA-stable', '耐異丙醇')],
        },
      ],
    },
    specs: {
      title: t('Common specifications', '共通規格'),
      rows: [
        { property: t('Density', '密度'), value: t('0.1 – 0.6 g/cm³', '0.1 – 0.6 g/cm³'), note: t('Foam grades', '泡棉等級') },
        { property: t('Thickness', '厚度'), value: t('0.2 – 10 mm', '0.2 – 10 mm'), note: t('Laminated stacks available', '可提供貼合疊構') },
        { property: t('Compression set', '壓縮永久變形'), value: t('< 5 %', '< 5 %'), note: t('25 % deflection / 22 h', '25 % 壓縮量／22 小時') },
        { property: t('Operating temperature', '工作溫度'), value: t('−40 to 105 °C', '−40 至 105 °C'), note: t('Grade dependent', '依等級而定') },
        { property: t('Die-cut tolerance', '模切公差'), value: t('± 0.05 mm', '± 0.05 mm'), note: t('Full sheet', '整片') },
        { property: t('Adhesive backing', '背膠'), value: t('Acrylic PSA', '壓克力 PSA'), note: t('Optional, single or double sided', '選配，可單面或雙面') },
      ],
      note: t(
        'Material safety data sheets and RoHS/REACH declarations ship with every qualification sample.',
        '每一份驗證樣品都附安全資料表與 RoHS／REACH 聲明。',
      ),
    },
    process: {
      title: t('How it is made', '製程說明'),
      steps: [
        {
          icon: 'layers',
          name: t('Lamination', '貼合'),
          body: t(
            'Foam, textile, adhesive and liner combined in one pass to keep the stack-up consistent.',
            '泡棉、布材、膠層與離型膜一次貼合，維持疊構一致。',
          ),
        },
        {
          icon: 'scissors',
          name: t('Slitting', '分條'),
          body: t(
            'Master rolls slit to the width your tooling expects, with edge quality checked per roll.',
            '母卷分條至模具需要的寬度，逐卷檢查邊緣品質。',
          ),
        },
        {
          icon: 'square-dashed',
          name: t('Die-cutting', '模切'),
          body: t(
            'Rotary and flat-bed tooling held to ±0.05 mm, verified by vision inspection.',
            '圓刀與平板模具維持 ±0.05 mm，並以影像檢測驗證。',
          ),
        },
        {
          icon: 'package',
          name: t('Kitting & packing', '配套與包裝'),
          body: t(
            'Parts packed in line-consumption order, labelled to your part number.',
            '依產線取用順序包裝，並標示您的料號。',
          ),
        },
      ],
    },
    solutions: ['consumer-electronics', 'automotive', 'smart-healthcare', 'renewable-energy', 'sports-eyewear'],
    cta: {
      eyebrow: t('Have a drawing ready?', '已經有圖了嗎？'),
      headline: t('Send the DXF and we will quote the tool.', '把 DXF 給我們，模具費立刻報。'),
      subcopy: t(
        'Prototype tooling is typically ready in 48 hours, so a fit check does not have to wait on production tooling.',
        '樣品模具通常 48 小時內完成，配合度確認不必等量產模。',
      ),
    },
  },

  acoustic: {
    slug: 'acoustic',
    color: '#0f8a76',
    banner: {
      eyebrow: t('Products · Acoustic', '產品 · 聲學材料'),
      title: t('Acoustic mesh that keeps water out and sound in.', '擋得住水、留得住聲音的聲學網布。'),
      description: t(
        'Four IP-rated membrane grades for speaker and microphone ports, specified from your insertion-loss budget rather than from a catalogue page.',
        '四種 IP 等級薄膜，用於喇叭與麥克風開孔 —— 依您的插入損失預算選型，而不是照型錄挑。',
      ),
      image: '/assets/banner-acoustic.jpg',
      imageLabel: t('Banner imagery — Acoustic · 2560×480', 'Banner 圖 —— 聲學材料 · 2560×480'),
    },
    overview: {
      image: '/assets/product-acoustic.jpg',
      alt: t('Acoustic foam and waterproof mesh samples', '聲學泡棉與防水網布樣品'),
      title: t('Specified from the insertion-loss budget backwards.', '從插入損失預算反推選型。'),
      paragraphs: [
        t(
          'Most acoustic mesh is sold on its IP rating alone, leaving the audio team to discover the response penalty after the housing is tooled. That is the wrong order to solve the problem in.',
          '多數聲學網布只談 IP 等級，等機殼開完模，音訊團隊才發現頻響代價。這個解題順序是反的。',
        ),
        t(
          'We start from the loss your tuning can absorb, then select the membrane and adhesive stack that reaches your ingress target inside it — measured on your port geometry rather than on a generic coupon.',
          '我們先確認您的調音能吸收多少損失，再選出能在該範圍內達到防護目標的薄膜與膠層疊構 —— 而且是在您的開孔幾何上量測，不是通用試片。',
        ),
      ],
      stats: [
        { value: t('4', '4'), label: t('Standard grades', '標準等級') },
        { value: t('< 0.6 dB', '< 0.6 dB'), label: t('Best-case insertion loss', '最佳插入損失') },
        { value: t('IP67', 'IP67'), label: t('Top ingress rating', '最高防護等級') },
      ],
    },
    families: {
      title: t('Product families', '產品系列'),
      lead: FAMILIES_LEAD,
      items: [
        {
          code: '110',
          name: t('VR-AC 110', 'VR-AC 110'),
          body: t(
            'The lightest membrane in the range, for driver ports where every decibel is spoken for.',
            '系列中最輕薄的薄膜，適用每一分貝都錙銖必較的單體開孔。',
          ),
          tags: [t('IPX4', 'IPX4'), t('< 0.6 dB @ 1 kHz', '< 0.6 dB @ 1 kHz')],
        },
        {
          code: '240',
          name: t('VR-AC 240', 'VR-AC 240'),
          body: t(
            'The volume grade for smartphone speaker and microphone ports.',
            '智慧型手機喇叭與麥克風開孔的量產主力等級。',
          ),
          tags: [t('IPX7', 'IPX7'), t('< 1.2 dB @ 1 kHz', '< 1.2 dB @ 1 kHz')],
        },
        {
          code: '360',
          name: t('VR-AC 360', 'VR-AC 360'),
          body: t(
            'Full immersion protection for outdoor and poolside speaker grilles.',
            '完全浸水防護，適用戶外與泳池畔喇叭網孔。',
          ),
          tags: [t('IP67', 'IP67'), t('< 2.0 dB @ 1 kHz', '< 2.0 dB @ 1 kHz')],
        },
        {
          code: '360-A',
          name: t('VR-AC 360-A', 'VR-AC 360-A'),
          body: t(
            'The automotive variant, qualified for cabin microphone arrays.',
            '車用版本，已通過車艙麥克風陣列驗證。',
          ),
          tags: [t('IP67 · −40 to 105 °C', 'IP67 · −40 至 105 °C'), t('< 2.4 dB @ 1 kHz', '< 2.4 dB @ 1 kHz')],
        },
      ],
    },
    specs: {
      title: t('Common specifications', '共通規格'),
      rows: [
        { property: t('Membrane', '薄膜'), value: t('ePTFE', 'ePTFE'), note: t('Oleophobic treated', '疏油處理') },
        { property: t('Adhesive', '膠系'), value: t('Acrylic PSA', '壓克力 PSA'), note: t('Die-cut ring', '模切環形') },
        { property: t('Port diameter', '開孔直徑'), value: t('1 – 12 mm', '1 – 12 mm'), note: t('Standard tooling', '標準模具') },
        { property: t('Operating temperature', '工作溫度'), value: t('−40 to 105 °C', '−40 至 105 °C'), note: t('Grade VR-AC 360-A', 'VR-AC 360-A 等級') },
        { property: t('Ingress rating', '防護等級'), value: t('IPX4 – IP67', 'IPX4 – IP67'), note: t('IEC 60529', 'IEC 60529') },
        { property: t('Insertion loss', '插入損失'), value: t('0.6 – 2.4 dB', '0.6 – 2.4 dB'), note: t('@ 1 kHz, 6 mm port', '@ 1 kHz、6 mm 開孔') },
      ],
      note: t(
        'Insertion loss is measured on your own housing geometry during qualification, because the port and cavity dominate the result.',
        '插入損失於驗證階段在您自己的機殼幾何上量測 —— 開孔與腔體才是決定結果的主因。',
      ),
    },
    process: {
      title: t('How it is made', '製程說明'),
      steps: [
        {
          icon: 'sliders-horizontal',
          name: t('Membrane selection', '薄膜選型'),
          body: t(
            'Chosen against your insertion-loss budget and target ingress rating together.',
            '同時對照您的插入損失預算與目標防護等級來選定。',
          ),
        },
        {
          icon: 'layers',
          name: t('Lamination', '貼合'),
          body: t(
            'Membrane bonded to the adhesive ring with the liner your placement equipment expects.',
            '薄膜與膠環貼合，並使用貼片設備所需的離型膜。',
          ),
        },
        {
          icon: 'square-dashed',
          name: t('Die-cutting', '模切'),
          body: t('Rings cut to the port geometry, held to ±0.05 mm.', '依開孔幾何裁切環形，維持 ±0.05 mm。'),
        },
        {
          icon: 'audio-waveform',
          name: t('Acoustic verification', '聲學驗證'),
          body: t(
            'Swept response measured with and without the mesh, reported as the delta.',
            '量測加裝與未加裝網布的掃頻響應，以差值回報。',
          ),
        },
      ],
    },
    solutions: ['consumer-electronics', 'automotive', 'acoustic-solutions'],
    cta: {
      eyebrow: t('New category, proven process', '新品類，成熟製程'),
      headline: t('Send us your port geometry and IL budget.', '把開孔幾何與插入損失預算給我們。'),
      subcopy: t(
        'We will come back with a candidate grade and the measured response curve — usually within two business days.',
        '我們會回覆建議等級與實測響應曲線 —— 通常兩個工作天內。',
      ),
    },
  },
};
