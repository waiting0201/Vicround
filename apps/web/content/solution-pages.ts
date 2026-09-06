import { t, type Localized } from '@/lib/content';

/**
 * 七個產業解決方案內頁 —— 英文逐字取自各 `mockup/Rounded Design/solution-*.dc.html`，
 * 繁中為暫譯（待客戶校稿）。接上 `GET /api/v1/solutions/{slug}` 後刪除。
 *
 * <p>
 * 六頁走同一套區塊（challenge → materials → specs → why → other），
 * Acoustic Solutions 那頁的中段換成「等級表 / 如何驗證 / 目前應用」——
 * 型別上用可選欄位表達，版型元件依有無決定要不要渲染。
 * </p>
 */
export type SolutionPage = {
  slug: string;
  icon: string;
  /** 該頁的強調色（challenge 的短線與 why 區的數字）。 */
  accent: string;
  banner: { eyebrow: Localized; title: Localized; description: Localized; imageLabel: Localized };
  challenge: {
    eyebrow: Localized;
    title: Localized;
    paragraphs: Localized[];
    imageLabel: Localized;
    imageBg: string;
    /** mockup 有幾頁是圖在左、文字在右。 */
    imageFirst?: boolean;
  };
  materials?: {
    title: Localized;
    lead: Localized;
    items: { icon: string; name: Localized; body: Localized; platform: Localized }[];
  };
  specs?: { title: Localized; rows: { property: Localized; value: Localized; note: Localized }[]; note: Localized };
  /** Acoustic 專用：五欄的等級比較表。 */
  grades?: { title: Localized; lead: Localized; columns: Localized[]; rows: Localized[][]; note: Localized };
  why?: {
    title: Localized;
    stats: { value: Localized; label: Localized; body: Localized }[];
    /** 底部連到產品線的膠囊按鈕。 */
    lines: string[];
  };
  /** Acoustic 專用：「如何驗證」與「目前應用」。 */
  cards?: { title: Localized; items: { icon: string; name: Localized; body: Localized }[] }[];
  cta: { eyebrow: Localized; headline: Localized; subcopy: Localized };
};

const MATERIALS_TITLE = t('What we bring to the assembly', '我們為這個組裝件帶來什麼');
const MATERIALS_LEAD = t(
  'Materials chosen for this application, drawn from the three platforms we manufacture ourselves.',
  '為此應用挑選的材料，全部出自我們自有製造的三大平台。',
);
const SPECS_TITLE = t('Key specifications', '關鍵規格');
const WHY_TITLE = t('Why teams specify us here', '團隊為何在這裡指定我們');
const CHALLENGE = t('The challenge', '課題');

const OPTICAL = t('Optical Film', '光學膜');
const TEXTILE = t('Textile & Foam', '紡織與泡棉');
const ACOUSTIC = t('Acoustic', '聲學材料');

export const SOLUTION_PAGES: Record<string, SolutionPage> = {
  'consumer-electronics': {
    slug: 'consumer-electronics',
    icon: 'smartphone',
    accent: '#1f6ab4',
    banner: {
      eyebrow: t('Solutions · Consumer Electronics', '解決方案 · 消費性電子'),
      title: t(
        'Displays that survive the pocket, the desk and the daylight.',
        '經得起口袋、桌面與日光的顯示器。',
      ),
      description: t(
        'Optical film, cushioning foam and acoustic mesh specified together for phones, tablets, laptops and wearables — one supplier for the whole surface stack.',
        '光學膜、緩衝泡棉與聲學網布一起選型，用於手機、平板、筆電與穿戴裝置 —— 整組表面疊構由同一家供應。',
      ),
      imageLabel: t('Banner imagery — Consumer Electronics · 2560×480', 'Banner 圖 —— 消費性電子 · 2560×480'),
    },
    challenge: {
      eyebrow: CHALLENGE,
      title: t(
        'Three suppliers, three tolerance stacks, one assembly line.',
        '三家供應商、三套公差堆疊，一條組裝線。',
      ),
      paragraphs: [
        t(
          'A phone bezel typically carries an anti-glare film, a die-cut foam gasket and an acoustic mesh — sourced from three vendors, each with its own thickness tolerance. The stack-up error lands on your assembly line, not theirs.',
          '一片手機邊框通常同時有抗眩光膜、模切泡棉墊片與聲學網布 —— 來自三家供應商，各有各的厚度公差。堆疊誤差最後落在您的產線上，不是他們的。',
        ),
        t(
          'We supply all three against one specification. Tolerances are stacked and agreed before tooling, and every lot ships with a single certificate of analysis covering the whole set.',
          '這三項由我們依同一份規格供應。公差在開模前就疊算並確認，每一批出貨附一份涵蓋整組的檢驗證明。',
        ),
      ],
      imageLabel: t('Application imagery — Consumer Electronics · 1200×900', '應用情境圖 —— 消費性電子 · 1200×900'),
      imageBg: '#11385f',
    },
    materials: {
      title: MATERIALS_TITLE,
      lead: MATERIALS_LEAD,
      items: [
        {
          icon: 'sun',
          name: t('Anti-glare & AF film', '抗眩光與抗指紋膜'),
          body: t(
            '60–120 GU gloss with a 3H hard coat and an oleophobic top layer, for touch surfaces handled all day.',
            '光澤度 60–120 GU，搭配 3H 硬塗層與疏油表層，適用整天被觸碰的表面。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'layers',
          name: t('Die-cut foam gaskets', '模切泡棉墊片'),
          body: t(
            'Microcellular cushioning cut to ±0.05 mm for display bonding, battery swell allowance and drop protection.',
            '微孔緩衝材裁切至 ±0.05 mm，用於顯示器貼合、電池膨脹裕度與落摔防護。',
          ),
          platform: TEXTILE,
        },
        {
          icon: 'volume-2',
          name: t('Acoustic mesh', '聲學網布'),
          body: t(
            'IPX4–IPX7 mesh for earpiece, loudspeaker and MEMS microphone ports, with the insertion loss measured on your housing.',
            'IPX4–IPX7 網布，用於聽筒、揚聲器與 MEMS 麥克風開孔，插入損失在您的機殼上量測。',
          ),
          platform: ACOUSTIC,
        },
      ],
    },
    specs: {
      title: SPECS_TITLE,
      rows: [
        { property: t('Gloss (60°)', '光澤度（60°）'), value: t('60 – 120 GU', '60 – 120 GU'), note: t('AG grades, tunable', 'AG 等級，可調') },
        { property: t('Pencil hardness', '鉛筆硬度'), value: t('3H – 4H', '3H – 4H'), note: t('Hard-coat top layer', '硬塗層表面') },
        { property: t('Foam compression set', '泡棉壓縮永久變形'), value: t('< 5 %', '< 5 %'), note: t('25 % deflection / 22 h', '25 % 壓縮量／22 小時') },
        { property: t('Die-cut tolerance', '模切公差'), value: t('± 0.05 mm', '± 0.05 mm'), note: t('Full sheet, not first article', '整片維持，非僅首件') },
        { property: t('Acoustic insertion loss', '聲學插入損失'), value: t('< 0.6 dB @ 1 kHz', '< 0.6 dB @ 1 kHz'), note: t('Grade VR-AC 110', 'VR-AC 110 等級') },
      ],
      note: t(
        'Values are typical for standard consumer grades at 23°C / 50% RH. Full tolerance tables ship with the spec sheet.',
        '數值為標準消費性等級在 23°C／50% RH 的典型值。完整公差表隨規格書提供。',
      ),
    },
    why: {
      title: WHY_TITLE,
      stats: [
        {
          value: t('1', '1'),
          label: t('Bill of materials', '份物料清單'),
          body: t(
            'Film, foam and mesh on a single purchase order and a single certificate of analysis.',
            '膜材、泡棉與網布共用一張採購單與一份檢驗證明。',
          ),
        },
        {
          value: t('± 0.05 mm', '± 0.05 mm'),
          label: t('Die-cut tolerance', '模切公差'),
          body: t(
            'Held across the full sheet, verified by in-line vision inspection.',
            '整片維持，並以線上影像檢測驗證。',
          ),
        },
        {
          value: t('72 h', '72 小時'),
          label: t('Sample turnaround', '樣品交期'),
          body: t(
            'Standard grades ship from stock so early fit checks are not blocked.',
            '標準等級現貨出貨，早期配合度確認不必等待。',
          ),
        },
      ],
      lines: ['optical-film', 'textile-foam', 'acoustic'],
    },
    cta: {
      eyebrow: t('Building a consumer device?', '正在開發消費性裝置？'),
      headline: t('Send us the bezel stack-up.', '把邊框疊構圖給我們。'),
      subcopy: t(
        "We'll come back with a film, foam and mesh combination that fits your tolerance budget — usually within two business days.",
        '我們會回覆一組符合您公差預算的膜材、泡棉與網布組合 —— 通常兩個工作天內。',
      ),
    },
  },

  automotive: {
    slug: 'automotive',
    icon: 'car',
    accent: '#1f6ab4',
    banner: {
      eyebrow: t('Solutions · Automotive', '解決方案 · 車用'),
      title: t('Cockpit surfaces rated for a fifteen-year service life.', '以十五年服役壽命設計的座艙表面。'),
      description: t(
        'Anti-glare, anti-fingerprint and anti-fouling film plus sealing foam for centre stacks, clusters and exterior sensor housings — qualified against automotive temperature and humidity cycles.',
        '抗眩光、抗指紋與抗污膜，加上密封泡棉，用於中控台、儀表與外部感測器機殼 —— 通過車用溫濕度循環驗證。',
      ),
      imageLabel: t('Banner imagery — Automotive · 2560×480', 'Banner 圖 —— 車用 · 2560×480'),
    },
    challenge: {
      eyebrow: CHALLENGE,
      title: t('Consumer-grade film does not survive a parked car.', '消費級膜材撐不過一台停在路邊的車。'),
      paragraphs: [
        t(
          'A dashboard reaches 85 °C on an afternoon in traffic and cycles below −30 °C overnight. Adhesives creep, hard coats craze, and anti-fingerprint layers lose their contact angle long before the vehicle is out of warranty.',
          '儀表板在午後車陣中可達 85 °C，夜間又降到 −30 °C 以下。膠層潛變、硬塗層龜裂、抗指紋層失去接觸角 —— 都遠早於保固期結束。',
        ),
        t(
          'Our automotive grades are specified against that ageing profile rather than showroom appearance: 1000 h damp heat, 300 thermal-shock cycles, and a contact-angle and haze measurement after each.',
          '我們的車用等級是依那條老化曲線定規格，而不是展間外觀：1000 小時濕熱、300 次熱衝擊循環，且每次之後都重新量測接觸角與霧度。',
        ),
      ],
      imageLabel: t('Application imagery — Automotive · 1200×900', '應用情境圖 —— 車用 · 1200×900'),
      imageBg: '#11385f',
      imageFirst: true,
    },
    materials: {
      title: MATERIALS_TITLE,
      lead: MATERIALS_LEAD,
      items: [
        {
          icon: 'monitor',
          name: t('Anti-glare display film', '抗眩光顯示膜'),
          body: t(
            'Low-sparkle AG for curved centre displays, tuned so the diffuser does not fight the touch sensor.',
            '低閃爍 AG，適用曲面中控顯示器，並調校成不干擾觸控感測。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'cloud-rain',
          name: t('Anti-fouling / anti-rain film', '抗污／抗雨膜'),
          body: t(
            'Hydrophobic coating for exterior camera and LiDAR windows — water beads and clears at road speed.',
            '疏水塗層，用於外部攝影機與光達視窗 —— 水珠在行駛速度下即被帶離。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'layers',
          name: t('Sealing & vibration foam', '密封與制振泡棉'),
          body: t(
            'Closed-cell gaskets that hold their seal and their damping through the full thermal cycle.',
            '閉孔墊片，在完整熱循環後仍維持密封與阻尼。',
          ),
          platform: TEXTILE,
        },
      ],
    },
    specs: {
      title: SPECS_TITLE,
      rows: [
        { property: t('Operating temperature', '工作溫度'), value: t('−40 to 105 °C', '−40 至 105 °C'), note: t('Continuous', '連續') },
        { property: t('Damp heat', '濕熱'), value: t('1000 h', '1000 小時'), note: t('85 °C / 85 % RH', '85 °C／85 % RH') },
        { property: t('Thermal shock', '熱衝擊'), value: t('300 cycles', '300 次循環'), note: t('−40 ↔ 105 °C', '−40 ↔ 105 °C') },
        { property: t('Water contact angle (AF)', '水接觸角（AF）'), value: t('> 110°', '> 110°'), note: t('After ageing', '老化後') },
        { property: t('Haze (AG)', '霧度（AG）'), value: t('3 – 25 %', '3 – 25 %'), note: t('Tunable to display', '依顯示器可調') },
      ],
      note: t(
        'Test profiles follow common OEM material specifications. Program-specific qualification plans are agreed before tooling.',
        '測試條件依常見車廠材料規範。專案別的驗證計畫在開模前確認。',
      ),
    },
    why: {
      title: WHY_TITLE,
      stats: [
        {
          value: t('15 yr', '15 年'),
          label: t('Service-life target', '服役壽命目標'),
          body: t(
            'Materials selected against end-of-life performance, not first-article appearance.',
            '材料以壽命末期表現選型，而非首件外觀。',
          ),
        },
        {
          value: t('1000 h', '1000 小時'),
          label: t('Damp-heat qualified', '濕熱驗證'),
          body: t('Haze, adhesion and contact angle re-measured after ageing.', '老化後重新量測霧度、附著力與接觸角。'),
        },
        {
          value: t('IATF', 'IATF'),
          label: t('Aligned quality system', '對齊的品質系統'),
          body: t(
            'Process controls run to IATF 16949 practice across our automotive lines.',
            '車用產線的製程管制依 IATF 16949 實務運作。',
          ),
        },
      ],
      lines: ['optical-film', 'textile-foam'],
    },
    cta: {
      eyebrow: t('Qualifying an interior program?', '正在驗證內裝專案？'),
      headline: t('Send us the OEM material spec.', '把車廠材料規範給我們。'),
      subcopy: t(
        "We'll map it to a candidate grade and tell you plainly which clauses need a qualification run.",
        '我們會對應到候選等級，並直說哪些條款需要另跑驗證。',
      ),
    },
  },

  'smart-healthcare': {
    slug: 'smart-healthcare',
    icon: 'stethoscope',
    accent: '#0f8a76',
    banner: {
      eyebrow: t('Solutions · Smart Healthcare', '解決方案 · 智慧醫療'),
      title: t('Surfaces that can be wiped down and still be read.', '擦得下去，也看得清楚的表面。'),
      description: t(
        'Antimicrobial hard coats, privacy film and cleanable technical textile for clinical displays, shared workstations and portable diagnostic devices.',
        '抗菌硬塗層、防窺膜與可清潔機能布，用於臨床顯示器、共用工作站與可攜式診斷設備。',
      ),
      imageLabel: t('Banner imagery — Smart Healthcare · 2560×480', 'Banner 圖 —— 智慧醫療 · 2560×480'),
    },
    challenge: {
      eyebrow: CHALLENGE,
      title: t('Disinfection protocols destroy ordinary display surfaces.', '消毒流程會毀掉一般的顯示器表面。'),
      paragraphs: [
        t(
          'Ward equipment is wiped with 70 % alcohol or a quaternary-ammonium solution several times a shift. Standard anti-fingerprint coatings lose their oleophobic layer within weeks, printed bezels chalk, and the display ends up harder to read than the day it was installed.',
          '病房設備每個班次要用 70 % 酒精或四級銨溶液擦拭數次。一般抗指紋塗層數週內就失去疏油層、印刷邊框粉化，最後顯示器比剛裝機時更難判讀。',
        ),
        t(
          'Our healthcare grades are validated after 5,000 wipe cycles with hospital disinfectants. The antimicrobial additive sits in the coating matrix rather than in a surface spray, so it is still there after the hundredth clean.',
          '我們的醫療等級是在以醫院消毒劑擦拭 5,000 次之後驗證。抗菌劑存在於塗層基質中而非表面噴塗，所以第一百次清潔後它還在。',
        ),
      ],
      imageLabel: t('Application imagery — Smart Healthcare · 1200×900', '應用情境圖 —— 智慧醫療 · 1200×900'),
      imageBg: '#115f52',
    },
    materials: {
      title: MATERIALS_TITLE,
      lead: MATERIALS_LEAD,
      items: [
        {
          icon: 'shield-check',
          name: t('Antimicrobial hard coat', '抗菌硬塗層'),
          body: t(
            'Tested to ISO 22196 — over 99 % reduction against S. aureus and E. coli at 24 h.',
            '依 ISO 22196 測試 —— 24 小時對金黃色葡萄球菌與大腸桿菌減少率超過 99 %。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'eye-off',
          name: t('Privacy / anti-peek film', '防窺膜'),
          body: t(
            'A ±30° viewing cone keeps patient records off the corridor without dimming the display for the clinician.',
            '±30° 可視錐角讓病歷不外洩到走廊，同時不讓醫護端的畫面變暗。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'layers',
          name: t('Cleanable technical textile', '可清潔機能布'),
          body: t(
            'Wipe-down covers and cushioning for portable diagnostic carts and imaging positioners.',
            '可擦拭護套與緩衝材，用於可攜式診斷推車與影像定位裝置。',
          ),
          platform: TEXTILE,
        },
      ],
    },
    specs: {
      title: SPECS_TITLE,
      rows: [
        { property: t('Antimicrobial efficacy', '抗菌效能'), value: t('> 99 % at 24 h', '24 小時 > 99 %'), note: t('ISO 22196', 'ISO 22196') },
        { property: t('Disinfectant resistance', '耐消毒劑'), value: t('5,000 wipe cycles', '5,000 次擦拭'), note: t('IPA 70 %, quaternary ammonium', '70 % 異丙醇、四級銨') },
        { property: t('Privacy viewing cone', '防窺可視角'), value: t('± 30°', '± 30°'), note: t('Horizontal', '水平方向') },
        { property: t('Light transmittance', '光穿透率'), value: t('> 88 %', '> 88 %'), note: t('Privacy grade, on-axis', '防窺等級，正視角') },
        { property: t('Pencil hardness', '鉛筆硬度'), value: t('3H', '3H'), note: t('Hard-coat top layer', '硬塗層表面') },
      ],
      note: t(
        'Antimicrobial performance is a surface property and does not replace clinical cleaning protocol. Test reports available to members.',
        '抗菌效能屬表面特性，不能取代臨床清潔規範。測試報告提供給會員。',
      ),
    },
    why: {
      title: WHY_TITLE,
      stats: [
        {
          value: t('ISO 22196', 'ISO 22196'),
          label: t('Tested antimicrobial', '經測試的抗菌力'),
          body: t(
            'Third-party laboratory reports issued per production lot family.',
            '依生產批系列出具第三方實驗室報告。',
          ),
        },
        {
          value: t('5,000', '5,000'),
          label: t('Wipe cycles validated', '次擦拭驗證'),
          body: t(
            'Contact angle and haze re-measured after the full cycle count.',
            '完成全部循環後重新量測接觸角與霧度。',
          ),
        },
        {
          value: t('± 30°', '± 30°'),
          label: t('Privacy cone', '防窺角度'),
          body: t('Measured at 50 % luminance on the finished panel stack.', '在成品面板疊構上以 50 % 亮度量測。'),
        },
      ],
      lines: ['optical-film', 'textile-foam'],
    },
    cta: {
      eyebrow: t('Specifying for a clinical environment?', '正在為臨床環境選規格？'),
      headline: t('Tell us your cleaning protocol.', '告訴我們您的清潔流程。'),
      subcopy: t(
        'The disinfectant and the wipe count drive the coating choice more than anything else — start there and we can narrow it fast.',
        '消毒劑種類與擦拭次數對塗層選擇的影響最大 —— 從這裡開始，我們可以很快收斂。',
      ),
    },
  },

  'renewable-energy': {
    slug: 'renewable-energy',
    icon: 'sun',
    accent: '#a2540f',
    banner: {
      eyebrow: t('Solutions · Renewable Energy', '解決方案 · 再生能源'),
      title: t('Protecting the twenty-fifth year of a solar asset.', '守住太陽能資產的第二十五年。'),
      description: t(
        'Weatherable front-sheet film, anti-soiling coatings and junction-box sealing foam for PV modules and energy-storage enclosures.',
        '耐候前板膜、抗積塵塗層與接線盒密封泡棉，用於太陽能模組與儲能機櫃。',
      ),
      imageLabel: t('Banner imagery — Renewable Energy · 2560×480', 'Banner 圖 —— 再生能源 · 2560×480'),
    },
    challenge: {
      eyebrow: CHALLENGE,
      title: t(
        'Modules are financed for 25 years. Most protective films are not.',
        '模組以 25 年融資，多數保護膜卻撐不到。',
      ),
      paragraphs: [
        t(
          'UV exposure, sand abrasion and daily thermal cycling degrade transmittance long before the cells wear out. A two-percent transmittance loss across a utility array is a measurable revenue loss in every year that follows.',
          'UV 曝曬、風砂磨耗與每日熱循環，會在電池片老化之前就讓穿透率下降。一座電廠級陣列少 2 % 穿透率，之後每一年都是可量化的收益損失。',
        ),
        t(
          'Our PV grades are weathered against IEC 61215 profiles and reported as retained transmittance after ageing — so the number you put in the yield model is the number the module will actually run at.',
          '我們的 PV 等級依 IEC 61215 條件做耐候試驗，並以老化後的保留穿透率回報 —— 讓您放進發電模型的數字，就是模組實際運作的數字。',
        ),
      ],
      imageLabel: t('Application imagery — Renewable Energy · 1200×900', '應用情境圖 —— 再生能源 · 1200×900'),
      imageBg: '#5f3211',
      imageFirst: true,
    },
    materials: {
      title: MATERIALS_TITLE,
      lead: MATERIALS_LEAD,
      items: [
        {
          icon: 'sun',
          name: t('Weatherable protective film', '耐候保護膜'),
          body: t(
            'UV-stable topcoat holding over 97 % retained transmittance after 2000 h QUV exposure.',
            '抗 UV 表層，2000 小時 QUV 曝曬後保留穿透率仍超過 97 %。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'droplets',
          name: t('Anti-soiling coating', '抗積塵塗層'),
          body: t(
            'Low surface energy reduces dust adhesion, cutting soiling loss between cleaning cycles.',
            '低表面能降低粉塵附著，減少清洗週期之間的積塵損失。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'layers',
          name: t('Junction-box sealing foam', '接線盒密封泡棉'),
          body: t(
            'Closed-cell gaskets rated for outdoor thermal cycling and IP68 enclosure sealing.',
            '閉孔墊片，適用戶外熱循環與 IP68 機櫃密封。',
          ),
          platform: TEXTILE,
        },
      ],
    },
    specs: {
      title: SPECS_TITLE,
      rows: [
        { property: t('QUV exposure', 'QUV 曝曬'), value: t('2000 h', '2000 小時'), note: t('IEC 61215 profile', 'IEC 61215 條件') },
        { property: t('Retained transmittance', '保留穿透率'), value: t('> 97 %', '> 97 %'), note: t('After QUV', 'QUV 後') },
        { property: t('Operating temperature', '工作溫度'), value: t('−40 to 90 °C', '−40 至 90 °C'), note: t('Continuous', '連續') },
        { property: t('Enclosure sealing', '機櫃密封'), value: t('IP68', 'IP68'), note: t('Junction box gasket', '接線盒墊片') },
        { property: t('Soiling loss', '積塵損失'), value: t('< 1 % / 30 days', '< 1 %／30 天'), note: t('Anti-soiling grade, desert profile', '抗積塵等級，沙漠條件') },
      ],
      note: t(
        'Field soiling depends heavily on site conditions. We supply the coupon data and help you correlate it to your own site.',
        '現場積塵高度取決於場址條件。我們提供試片數據並協助對應到您的場址。',
      ),
    },
    why: {
      title: WHY_TITLE,
      stats: [
        {
          value: t('25 yr', '25 年'),
          label: t('Design life', '設計壽命'),
          body: t(
            'Materials chosen against end-of-life transmittance, not initial gloss.',
            '材料以壽命末期穿透率選型，而非初始光澤。',
          ),
        },
        {
          value: t('> 97 %', '> 97 %'),
          label: t('Retained transmittance', '保留穿透率'),
          body: t('Measured after the full 2000 h QUV profile.', '完成 2000 小時 QUV 條件後量測。'),
        },
        {
          value: t('IEC 61215', 'IEC 61215'),
          label: t('Weathering profile', '耐候條件'),
          body: t('The same sequence your module certification uses.', '與您模組認證所用的程序相同。'),
        },
      ],
      lines: ['optical-film', 'textile-foam'],
    },
    cta: {
      eyebrow: t('Building modules or enclosures?', '正在做模組或機櫃？'),
      headline: t('Send us your site and yield assumptions.', '把場址與發電假設給我們。'),
      subcopy: t(
        "We'll match a weatherable grade to the climate profile and share the ageing data behind it.",
        '我們會依氣候條件對應耐候等級，並提供背後的老化數據。',
      ),
    },
  },

  'e-paper': {
    slug: 'e-paper',
    icon: 'book-open',
    accent: '#1f6ab4',
    banner: {
      eyebrow: t('Solutions · E-Paper', '解決方案 · 電子紙'),
      title: t('Paper-like, without the paper-like trade-offs.', '要紙感，不要紙感的代價。'),
      description: t(
        'Paper-feel surface film, front-light diffusers and protective layers for e-readers, electronic shelf labels and industrial e-paper signage.',
        '紙感表面膜、前光擴散膜與保護層，用於電子閱讀器、電子貨架標籤與工業電子紙標示。',
      ),
      imageLabel: t('Banner imagery — E-Paper · 2560×480', 'Banner 圖 —— 電子紙 · 2560×480'),
    },
    challenge: {
      eyebrow: CHALLENGE,
      title: t(
        'Every micron of texture you add is contrast you take away.',
        '每加一微米的紋理，就少一分對比。',
      ),
      paragraphs: [
        t(
          'The writing feel readers ask for comes from surface roughness — and roughness scatters the little light an e-paper panel reflects. Push the texture too far and the display goes grey; pull it back and the stylus skates.',
          '讀者要的書寫手感來自表面粗糙度 —— 而粗糙度會散射電子紙本就有限的反射光。紋理過頭畫面就灰掉，收得太少觸控筆又打滑。',
        ),
        t(
          'We characterise both properties on the same sample: dynamic friction against a standard stylus tip, and reflectance measured on your actual panel stack. That lets you choose a point on the curve instead of discovering one late.',
          '我們在同一片樣品上同時量測兩者：對標準筆尖的動摩擦係數，以及在您實際面板疊構上的反射率。讓您在曲線上挑一個點，而不是後期才發現一個點。',
        ),
      ],
      imageLabel: t('Application imagery — E-Paper · 1200×900', '應用情境圖 —— 電子紙 · 1200×900'),
      imageBg: '#11385f',
    },
    materials: {
      title: MATERIALS_TITLE,
      lead: MATERIALS_LEAD,
      items: [
        {
          icon: 'pen-line',
          name: t('Paper-feel surface film', '紙感表面膜'),
          body: t(
            'Controlled micro-texture giving 0.35–0.55 dynamic friction against a felt stylus tip.',
            '受控微結構，對毛氈筆尖提供 0.35–0.55 的動摩擦係數。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'lightbulb',
          name: t('Front-light diffuser', '前光擴散膜'),
          body: t(
            'Even light spread across the panel with no hot spot at the LED edge.',
            '全面板均勻布光，LED 邊緣不出現亮點。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'shield',
          name: t('Protective hard coat', '保護硬塗層'),
          body: t(
            'Abrasion resistance for shelf labels and signage handled thousands of times.',
            '為被反覆拿取數千次的貨架標籤與標示提供耐磨性。',
          ),
          platform: OPTICAL,
        },
      ],
    },
    specs: {
      title: SPECS_TITLE,
      rows: [
        { property: t('Dynamic friction (stylus)', '動摩擦係數（觸控筆）'), value: t('0.35 – 0.55', '0.35 – 0.55'), note: t('Felt tip, 100 g load', '毛氈筆尖、100 g 負載') },
        { property: t('Surface roughness Ra', '表面粗糙度 Ra'), value: t('0.3 – 1.2 µm', '0.3 – 1.2 µm'), note: t('Tunable by grade', '依等級可調') },
        { property: t('Reflectance loss', '反射率損失'), value: t('< 4 %', '< 4 %'), note: t('Versus bare panel', '相對於裸面板') },
        { property: t('Pencil hardness', '鉛筆硬度'), value: t('2H – 3H', '2H – 3H'), note: t('Hard-coat top layer', '硬塗層表面') },
        { property: t('Abrasion', '耐磨'), value: t('5,000 cycles', '5,000 次循環'), note: t('Steel wool, 500 g', '鋼絨、500 g') },
      ],
      note: t(
        'Friction and reflectance are measured on the same coupon so the trade-off is visible rather than inferred.',
        '摩擦與反射在同一片試片上量測，讓取捨看得見而不是靠推論。',
      ),
    },
    why: {
      title: WHY_TITLE,
      stats: [
        {
          value: t('0.35–0.55', '0.35–0.55'),
          label: t('Stylus friction band', '筆尖摩擦區間'),
          body: t(
            'Three grades across the band so writing feel can be tuned, not guessed.',
            '區間內有三個等級，書寫手感可以調，不必用猜的。',
          ),
        },
        {
          value: t('< 4 %', '< 4 %'),
          label: t('Reflectance loss', '反射率損失'),
          body: t('Measured on the finished stack, including adhesive.', '在含膠層的成品疊構上量測。'),
        },
        {
          value: t('5,000', '5,000'),
          label: t('Abrasion cycles', '次耐磨循環'),
          body: t('For retail and signage parts handled continuously.', '適用被持續取用的零售與標示件。'),
        },
      ],
      lines: ['optical-film'],
    },
    cta: {
      eyebrow: t('Tuning a writing surface?', '正在調書寫表面？'),
      headline: t('Ask for the friction/reflectance curve.', '跟我們要摩擦／反射曲線。'),
      subcopy: t(
        'We can send coupons across the whole band so your panel team picks the point rather than accepting ours.',
        '我們可以提供整個區間的試片，讓您的面板團隊自己挑點，而不是接受我們挑的。',
      ),
    },
  },

  'sports-eyewear': {
    slug: 'sports-eyewear',
    icon: 'glasses',
    accent: '#0f8a76',
    banner: {
      eyebrow: t('Solutions · Sports Eye-Wear', '解決方案 · 運動眼鏡'),
      title: t('Lenses that stay clear when the wearer does not stop.', '配戴者不停下來，鏡片也不起霧。'),
      description: t(
        'Anti-fog, anti-scratch and polarised film plus skin-contact comfort foam for cycling, ski, watersport and tactical eyewear.',
        '防霧、抗刮與偏光膜，加上親膚舒適泡棉，用於自行車、滑雪、水上運動與戰術眼鏡。',
      ),
      imageLabel: t('Banner imagery — Sports Eye-Wear · 2560×480', 'Banner 圖 —— 運動眼鏡 · 2560×480'),
    },
    challenge: {
      eyebrow: CHALLENGE,
      title: t('Fogging is the failure mode that ends the ride.', '起霧就是那個讓行程中斷的失效模式。'),
      paragraphs: [
        t(
          "A lens fogs when the wearer's heat output changes faster than the airflow behind it. Sprayed-on anti-fog treatments survive a few washes; hydrophilic coatings that pass in a warm lab often fail at −5 °C, which is exactly where ski goggles live.",
          '當配戴者的產熱變化快過鏡片後方的氣流，鏡片就起霧。噴塗式防霧只撐得過幾次清洗；在溫暖實驗室通過的親水塗層，常在 −5 °C 失效 —— 而那正是雪鏡的工作環境。',
        ),
        t(
          'Our anti-fog film holds clarity through the EN 168 fog test and after twenty wash cycles, and we run the validation at low temperature because that is where the product is actually used.',
          '我們的防霧膜通過 EN 168 起霧測試並在二十次清洗後仍維持清晰，而且驗證在低溫下進行 —— 因為產品實際就用在那裡。',
        ),
      ],
      imageLabel: t('Application imagery — Sports Eye-Wear · 1200×900', '應用情境圖 —— 運動眼鏡 · 1200×900'),
      imageBg: '#115f52',
      imageFirst: true,
    },
    materials: {
      title: MATERIALS_TITLE,
      lead: MATERIALS_LEAD,
      items: [
        {
          icon: 'cloud-fog',
          name: t('Anti-fog film', '防霧膜'),
          body: t(
            'Hydrophilic layer holding EN 168 clarity beyond 20 s, retained after 20 wash cycles.',
            '親水層在 EN 168 測試維持清晰超過 20 秒，20 次清洗後仍保有。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'sun',
          name: t('Polarised & tinted film', '偏光與染色膜'),
          body: t(
            'Category 2–3 tints with over 99 % polarisation efficiency on wet road and snow glare.',
            '第 2–3 類色度，對濕路面與雪地眩光提供超過 99 % 偏光效率。',
          ),
          platform: OPTICAL,
        },
        {
          icon: 'layers',
          name: t('Comfort foam & gasket', '舒適泡棉與墊圈'),
          body: t(
            'Skin-contact foam for goggle seals — hypoallergenic, sweat-stable and colourfast.',
            '護目鏡密封用親膚泡棉 —— 低致敏、耐汗、不褪色。',
          ),
          platform: TEXTILE,
        },
      ],
    },
    specs: {
      title: SPECS_TITLE,
      rows: [
        { property: t('Anti-fog clarity', '防霧清晰度'), value: t('> 20 s', '> 20 秒'), note: t('EN 168', 'EN 168') },
        { property: t('Wash durability', '清洗耐久性'), value: t('20 cycles', '20 次循環'), note: t('Clarity retained', '維持清晰') },
        { property: t('Impact resistance', '抗衝擊'), value: t('EN 166 F', 'EN 166 F'), note: t('45 m/s, 6 mm ball', '45 m/s、6 mm 鋼球') },
        { property: t('UV protection', 'UV 防護'), value: t('UV400', 'UV400'), note: t('Full spectrum block', '全波段阻隔') },
        { property: t('Polarisation efficiency', '偏光效率'), value: t('> 99 %', '> 99 %'), note: t('Polarised grades', '偏光等級') },
      ],
      note: t(
        'Low-temperature fog testing is run at −5 °C in addition to the standard profile, on request.',
        '除標準條件外，可依需求另在 −5 °C 進行低溫起霧測試。',
      ),
    },
    why: {
      title: WHY_TITLE,
      stats: [
        {
          value: t('EN 168', 'EN 168'),
          label: t('Anti-fog validated', '防霧驗證'),
          body: t('Tested to the European standard, not an in-house breath test.', '依歐洲標準測試，不是內部哈氣測試。'),
        },
        {
          value: t('20', '20'),
          label: t('Wash cycles retained', '次清洗後仍有效'),
          body: t(
            'Because a coating that fails in month two is a warranty claim.',
            '因為第二個月就失效的塗層，等於一張保固申訴。',
          ),
        },
        {
          value: t('UV400', 'UV400'),
          label: t('Full-spectrum block', '全波段阻隔'),
          body: t('Across all tinted and polarised grades.', '涵蓋所有染色與偏光等級。'),
        },
      ],
      lines: ['optical-film', 'textile-foam'],
    },
    cta: {
      eyebrow: t('Developing eyewear?', '正在開發眼鏡產品？'),
      headline: t('Send us the frame and the climate.', '把鏡框與使用氣候給我們。'),
      subcopy: t(
        'Venting geometry changes which anti-fog grade works — tell us both and we can shortlist properly.',
        '通風結構會改變哪一種防霧等級有效 —— 兩者都給我們，才能篩得準。',
      ),
    },
  },

  'acoustic-solutions': {
    slug: 'acoustic-solutions',
    icon: 'volume-2',
    accent: '#0f8a76',
    banner: {
      eyebrow: t('Solutions · Acoustic', '解決方案 · 聲學'),
      title: t('Acoustic protection without acoustic compromise.', '要防護，也不犧牲聲音。'),
      description: t(
        'IP-rated mesh that keeps water and dust out of speakers and microphones while leaving the frequency response where your audio team tuned it.',
        'IP 等級網布，把水與粉塵擋在喇叭與麥克風之外，同時把頻率響應留在音訊團隊調好的位置。',
      ),
      imageLabel: t('Banner imagery — Acoustic Solutions · 2560×480', 'Banner 圖 —— 聲學解決方案 · 2560×480'),
    },
    challenge: {
      eyebrow: CHALLENGE,
      title: t('Sealing an audio port usually costs you decibels.', '把音孔封起來，通常要付出分貝的代價。'),
      paragraphs: [
        t(
          'Every barrier placed in front of a driver or a MEMS microphone adds insertion loss and shifts the response curve. Most teams end up choosing between an IP rating and the sound they signed off on — then re-tune late in the program when the mesh arrives.',
          '在單體或 MEMS 麥克風前多一層阻隔，就多一分插入損失、響應曲線也跟著位移。多數團隊最後得在 IP 等級與已定案的音色之間二選一 —— 然後在網布到貨的專案後期重新調音。',
        ),
        t(
          'Our acoustic mesh is specified the other way round: we start from the insertion-loss budget your audio team can live with, then select the membrane and adhesive stack that reaches your IP target within it.',
          '我們的聲學網布反過來選型：先確認音訊團隊能接受的插入損失預算，再挑出能在此範圍內達到 IP 目標的薄膜與膠層疊構。',
        ),
      ],
      imageLabel: t('Application imagery — Acoustic mesh · 1200×900', '應用情境圖 —— 聲學網布 · 1200×900'),
      imageBg: '#115f52',
    },
    grades: {
      title: t('Mesh grades', '網布等級'),
      lead: t(
        'Four standard stacks cover most consumer and automotive programs. Anything outside them we build to spec.',
        '四種標準疊構涵蓋多數消費性與車用專案，超出範圍的依規格製作。',
      ),
      columns: [
        t('Grade', '等級'),
        t('Ingress rating', '防護等級'),
        t('Insertion loss @1kHz', '插入損失 @1kHz'),
        t('Air permeability', '透氣度'),
        t('Typical use', '典型應用'),
      ],
      rows: [
        [t('VR-AC 110', 'VR-AC 110'), t('IPX4', 'IPX4'), t('< 0.6 dB', '< 0.6 dB'), t('180 mm/s', '180 mm/s'), t('TWS earbud driver ports', 'TWS 耳機單體開孔')],
        [t('VR-AC 240', 'VR-AC 240'), t('IPX7', 'IPX7'), t('< 1.2 dB', '< 1.2 dB'), t('90 mm/s', '90 mm/s'), t('Smartphone speaker & mic', '手機喇叭與麥克風')],
        [t('VR-AC 360', 'VR-AC 360'), t('IP67', 'IP67'), t('< 2.0 dB', '< 2.0 dB'), t('45 mm/s', '45 mm/s'), t('Outdoor / portable speakers', '戶外／可攜式喇叭')],
        [t('VR-AC 360-A', 'VR-AC 360-A'), t('IP67 · −40 to 105°C', 'IP67 · −40 至 105°C'), t('< 2.4 dB', '< 2.4 dB'), t('40 mm/s', '40 mm/s'), t('Automotive cabin microphones', '車艙麥克風')],
      ],
      note: t(
        'Values are typical for a 6 mm port at 23°C / 50% RH. Full tolerance tables ship with the spec sheet.',
        '數值為 6 mm 開孔於 23°C／50% RH 的典型值。完整公差表隨規格書提供。',
      ),
    },
    cards: [
      {
        title: t('How we prove it', '我們如何驗證'),
        items: [
          {
            icon: 'audio-waveform',
            name: t('Frequency-response sweep', '頻率響應掃頻'),
            body: t(
              '20 Hz – 20 kHz sweep in an anechoic fixture, measured with and without the mesh so you see the delta, not a claim.',
              '在無響室治具中做 20 Hz – 20 kHz 掃頻，量測加裝與未加裝網布兩種狀態，讓您看到差值而不是一句宣稱。',
            ),
          },
          {
            icon: 'droplets',
            name: t('Ingress testing to IEC 60529', '依 IEC 60529 的防護測試'),
            body: t(
              'Immersion and jet testing on your own housing geometry, not a generic coupon — because the seal path is what fails.',
              '在您自己的機殼幾何上做浸水與噴水測試，而不是通用試片 —— 因為失效的是密封路徑。',
            ),
          },
          {
            icon: 'thermometer',
            name: t('Environmental ageing', '環境老化'),
            body: t(
              '500 h damp heat, thermal shock and adhesive peel after ageing, so the acoustic spec still holds at end of life.',
              '500 小時濕熱、熱衝擊與老化後膠帶剝離測試，確保壽命末期聲學規格仍成立。',
            ),
          },
        ],
      },
      {
        title: t('Where it ships today', '目前的出貨應用'),
        items: [
          {
            icon: 'headphones',
            name: t('True wireless earbuds', '真無線耳機'),
            body: t('Driver and feedback-mic ports, sweat-resistant to IPX4.', '單體與回授麥克風開孔，抗汗達 IPX4。'),
          },
          {
            icon: 'smartphone',
            name: t('Smartphones', '智慧型手機'),
            body: t('Earpiece, loudspeaker and bottom-mic protection at IPX7.', '聽筒、揚聲器與底部麥克風防護達 IPX7。'),
          },
          {
            icon: 'speaker',
            name: t('Portable speakers', '可攜式喇叭'),
            body: t('Full IP67 grilles for outdoor and poolside products.', '戶外與泳池畔產品的完整 IP67 網孔。'),
          },
          {
            icon: 'car',
            name: t('Automotive cabins', '車艙'),
            body: t('Voice-assistant microphone arrays rated to 105°C.', '語音助理麥克風陣列，耐溫至 105°C。'),
          },
        ],
      },
    ],
    why: {
      title: t('Where it ships today', '目前的出貨應用'),
      stats: [],
      lines: ['acoustic'],
    },
    cta: {
      eyebrow: t('New category, proven process', '新品類，成熟製程'),
      headline: t('Send us your port geometry and IL budget.', '把開孔幾何與插入損失預算給我們。'),
      subcopy: t(
        "We'll come back with a candidate grade and the measured response curve — usually within two business days.",
        '我們會回覆建議等級與實測響應曲線 —— 通常兩個工作天內。',
      ),
    },
  },
};
