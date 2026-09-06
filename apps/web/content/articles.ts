import { t, type Localized } from '@/lib/content';

/**
 * 文章與新聞 —— 逐字取自 `mockup/Rounded Design/article.dc.html` 與
 * `news-article.dc.html`（繁中暫譯）。
 *
 * <p>
 * ⚠️ **這是版型的示範內容，不是網站文案。** 正式站由 `GET /api/v1/articles/{slug}`
 * 提供，內文是後台 TipTap 存的 HTML。這裡把內文拆成 block 陣列，形狀刻意貼近
 * `ContentBlocks`（docs/database.md §09），之後替換資料來源時版型不用改。
 * </p>
 */
export type Block =
  | { type: 'paragraph'; text: Localized }
  | { type: 'heading'; id: string; text: Localized }
  | { type: 'table'; columns: Localized[]; rows: Localized[][] }
  | { type: 'definitions'; items: { term: Localized; text: Localized }[] }
  | { type: 'callout'; text: Localized }
  | { type: 'figure'; label: Localized; caption: Localized }
  | { type: 'quote'; text: Localized; author: Localized }
  | { type: 'list'; items: Localized[] };

export type ArticleContent = {
  slug: string;
  category: Localized;
  date: string;
  dateLabel: Localized;
  meta: Localized;
  title: Localized;
  lead: Localized;
  author: { initials: string; name: Localized; role: Localized };
  heroLabel: Localized;
  heroGradient: string;
  toc: { id: string; label: Localized }[];
  blocks: Block[];
};

/** 技術文章／產業洞察的示範內容（`/blog/{slug}`、`/insights/{slug}` 共用版型）。 */
export const sampleArticle: ArticleContent = {
  slug: 'anti-glare-haze-ratings',
  category: t('Optical Film', '光學膜'),
  date: '2026-07-14',
  dateLabel: t('14 July 2026', '2026 年 7 月 14 日'),
  meta: t('14 July 2026 · 9 min read', '2026 年 7 月 14 日 · 閱讀約 9 分鐘'),
  title: t(
    'Anti-glare or anti-reflective? Choosing a display surface you will not regret.',
    '抗眩光還是抗反射？選一個之後不會後悔的顯示器表面。',
  ),
  lead: t(
    'The two treatments solve the same complaint by opposite means, and the wrong choice is usually discovered after the housing is tooled. Here is how our engineering team decides.',
    '兩種處理方式解決同一個抱怨，手段卻完全相反；而選錯，通常是在機殼開完模之後才發現。以下是我們工程團隊的判斷方式。',
  ),
  author: {
    initials: 'CY',
    name: t('Chen Yi-Hsuan', '陳羿萱'),
    role: t('Senior Application Engineer, Optical Film', '光學膜資深應用工程師'),
  },
  heroLabel: t('Article hero — AG vs AR comparison · 2100×900', '文章主圖 —— AG 與 AR 比較 · 2100×900'),
  heroGradient: 'linear-gradient(150deg, #1c568e 0%, #11385f 60%, #0d0d18 100%)',
  toc: [
    { id: 'mechanism', label: t('1. Two different mechanisms', '1. 兩種不同的原理') },
    { id: 'compare', label: t('2. Side by side', '2. 並排比較') },
    { id: 'haze', label: t('3. Picking a haze level', '3. 霧度怎麼選') },
    { id: 'sparkle', label: t('4. The sparkle problem', '4. 閃爍的問題') },
    { id: 'decide', label: t('5. How we decide', '5. 我們怎麼決定') },
  ],
  blocks: [
    { type: 'heading', id: 'mechanism', text: t('1. Two different mechanisms', '1. 兩種不同的原理') },
    {
      type: 'paragraph',
      text: t(
        'Both treatments exist because a user complained about a reflection, but they attack it from opposite directions. Anti-glare works mechanically: a micro-textured surface scatters incoming light in many directions, so a hard-edged reflection of a window becomes a soft, diffuse brightness. Nothing is removed — it is spread out until the eye stops reading it as an image.',
        '兩種處理方式都源自同一個抱怨：反光。但它們從相反的方向下手。抗眩光走的是機械途徑 —— 微結構表面把入射光散射到各個方向，讓窗戶那種邊緣銳利的倒影變成柔和的漫射亮度。光沒有被移除，只是被攤開到眼睛不再把它讀成一個影像。',
      ),
    },
    {
      type: 'paragraph',
      text: t(
        'Anti-reflective works optically. Thin interference layers, each a fraction of a wavelength thick, are stacked so that light reflecting off the top of the stack arrives out of phase with light reflecting off the bottom. The two cancel. Surface reflectance drops from roughly 4 % to well under 1 %, and the surface itself stays perfectly smooth.',
        '抗反射走的是光學途徑。厚度僅為波長幾分之一的干涉層層層堆疊，讓從疊層頂端反射的光與底端反射的光相位相反，兩者互相抵銷。表面反射率從約 4 % 降到遠低於 1 %，而表面本身維持完全平滑。',
      ),
    },
    {
      type: 'paragraph',
      text: t(
        'That difference in mechanism explains every trade-off that follows. Scattering costs you sharpness; cancellation costs you money and durability.',
        '原理上的差異，解釋了後面所有的取捨：散射的代價是銳利度，抵銷的代價是成本與耐用性。',
      ),
    },

    { type: 'heading', id: 'compare', text: t('2. Side by side', '2. 並排比較') },
    {
      type: 'paragraph',
      text: t(
        'The table below is the one we put in front of customers in the first meeting. The numbers are typical production values rather than best-case laboratory figures.',
        '下面這張表是我們在第一次會議就會攤開的。數字是典型量產值，不是實驗室的最佳條件。',
      ),
    },
    {
      type: 'table',
      columns: [t('Property', '項目'), t('Anti-glare (AG)', '抗眩光（AG）'), t('Anti-reflective (AR)', '抗反射（AR）')],
      rows: [
        [t('Surface reflectance', '表面反射率'), t('3 – 4 %, diffused', '3 – 4 %，漫射'), t('< 1 %, specular', '< 1 %，鏡面')],
        [t('Text sharpness', '文字銳利度'), t('Slightly softened', '略為柔化'), t('Unchanged', '不受影響')],
        [
          t('Scratch tolerance', '耐刮容忍度'),
          t('High (texture hides marks)', '高（紋理可掩飾刮痕）'),
          t('Low (marks are visible)', '低（刮痕明顯）'),
        ],
        [t('Fingerprint visibility', '指紋明顯度'), t('Low', '低'), t('High without AF layer', '未加 AF 層時高')],
        [t('Relative cost', '相對成本'), t('1×', '1×'), t('2.5 – 4×', '2.5 – 4×')],
        [
          t('Best environment', '最適環境'),
          t('Outdoor, bright, touched', '戶外、明亮、會被觸碰'),
          t('Controlled lighting', '照明可控的環境'),
        ],
      ],
    },

    { type: 'heading', id: 'haze', text: t('3. Picking a haze level', '3. 霧度怎麼選') },
    {
      type: 'paragraph',
      text: t(
        'If you settle on anti-glare, the next question is how much. Haze is the fraction of transmitted light scattered by more than 2.5 degrees, and it is the single number that decides how the display feels.',
        '如果決定用抗眩光，下一個問題是要多少。霧度是穿透光中被散射超過 2.5 度的比例，也是決定顯示器手感的那一個數字。',
      ),
    },
    {
      type: 'definitions',
      items: [
        {
          term: t('3 – 8 %', '3 – 8 %'),
          text: t(
            '— text stays crisp, strong reflections are softened but still recognisable. Suits office and medical displays under controlled lighting.',
            '—— 文字維持清晰，強反射被柔化但仍看得出形狀。適合照明可控的辦公與醫療顯示器。',
          ),
        },
        {
          term: t('8 – 15 %', '8 – 15 %'),
          text: t(
            '— the automotive centre-stack band. Reflections of the windscreen and sky are broken up without visibly degrading map text.',
            '—— 車用中控的區間。擋風玻璃與天空的倒影被打散，而地圖文字不會明顯劣化。',
          ),
        },
        {
          term: t('15 – 25 %', '15 – 25 %'),
          text: t(
            '— for direct sunlight and outdoor kiosks. Reflections effectively disappear; expect a visible softening of small type.',
            '—— 用於直射陽光與戶外資訊站。反射幾乎消失，但小字會明顯變柔。',
          ),
        },
      ],
    },
    {
      type: 'callout',
      text: t(
        'Choosing haze from a datasheet is guessing. Choose it from coupons on your own panel, in the lighting the product will actually live in.',
        '看規格書選霧度等於在猜。請用試片、在您自己的面板上、在產品真正會待著的照明環境裡選。',
      ),
    },

    { type: 'heading', id: 'sparkle', text: t('4. The sparkle problem', '4. 閃爍的問題') },
    {
      type: 'paragraph',
      text: t(
        'Sparkle is the grainy shimmer that appears when the surface texture of an anti-glare film interacts with the pixel grid beneath it. It is barely visible at 150 PPI and obvious at 300 PPI, which is why a film that looked fine on last year’s panel can fail on this year’s.',
        '閃爍是抗眩光膜的表面紋理與底下像素網格交互作用時出現的顆粒狀閃動。在 150 PPI 幾乎看不見，到 300 PPI 就很明顯 —— 這就是為什麼去年面板上沒問題的膜，今年會不合格。',
      ),
    },
    {
      type: 'paragraph',
      text: t(
        'The fix is not simply less haze. It is a finer, more uniform texture at the same haze value — which is a coating-formulation problem rather than a specification problem. If you are moving to a higher-resolution panel, re-qualify the film even when the part number has not changed.',
        '解法不是單純降霧度，而是在同樣霧度下做出更細、更均勻的紋理 —— 那是塗佈配方的問題，不是規格的問題。若換到更高解析度的面板，即使料號沒變也要重新驗證膜材。',
      ),
    },
    {
      type: 'figure',
      label: t('Micrograph — sparkle at 220 vs 320 PPI · 1200×675', '顯微影像 —— 220 與 320 PPI 的閃爍比較 · 1200×675'),
      caption: t(
        'Same film, two panel resolutions. The texture did not change; the pixel pitch did.',
        '同一種膜、兩種面板解析度。變的不是紋理，是像素間距。',
      ),
    },

    { type: 'heading', id: 'decide', text: t('5. How we decide', '5. 我們怎麼決定') },
    {
      type: 'paragraph',
      text: t(
        'In practice we ask three questions. Will the surface be touched? If yes, anti-glare almost always wins, because fingerprints on an anti-reflective surface are far more visible than on a textured one. Is the ambient light controlled? If not, anti-glare again. Does the product sell on image quality above all else — a reference monitor, a premium tablet — and can it carry the cost? Then anti-reflective earns its place.',
        '實務上我們問三個問題。表面會被觸碰嗎？會的話，抗眩光幾乎一定勝出 —— 指紋在抗反射表面上比在有紋理的表面明顯得多。環境光可控嗎？不可控的話，還是抗眩光。這個產品是不是以畫質為最主要賣點（監視器、高階平板），而且撐得起成本？那抗反射才有它的位置。',
      ),
    },
    {
      type: 'paragraph',
      text: t(
        'Everything else is a matter of tuning haze and hard-coat hardness, which is a conversation we would rather have before your housing is tooled than after.',
        '其餘就是調霧度與硬塗層硬度的問題 —— 而這場討論，我們寧可在您的機殼開模前談，而不是之後。',
      ),
    },
  ],
};

/** 「Keep reading」的三張相關文章卡。 */
export const relatedArticles = [
  {
    slug: 'insertion-loss-first',
    category: t('Acoustic', '聲學材料'),
    title: t(
      'Why insertion loss should be your first acoustic spec, not your last',
      '為什麼插入損失該是第一個聲學規格，而不是最後一個',
    ),
    body: t(
      'Specifying mesh from the ingress rating alone is how audio teams end up re-tuning late.',
      '只看防護等級選網布，正是音訊團隊最後得重新調音的原因。',
    ),
  },
  {
    slug: 'emi-shielding-101',
    category: t('Textile & Foam', '紡織與泡棉'),
    title: t('EMI Shielding 101 for Consumer Electronics', '消費性電子的 EMI 遮蔽入門'),
    body: t(
      'Conductive textile, contact pads and the grounding path that actually carries the current.',
      '導電布、接點墊片，以及真正導走電流的那條接地路徑。',
    ),
  },
  {
    slug: 'eudr-sustainable-sourcing',
    category: t('Sustainability', '永續'),
    title: t('EUDR & Sustainable Sourcing: What OEM Buyers Need to Know', 'EUDR 與永續採購：OEM 採購該知道的事'),
    body: t(
      'A practical primer on EU deforestation regulation readiness for procurement teams.',
      '給採購團隊的歐盟零毀林法規準備入門。',
    ),
  },
];

/** 新聞內頁的示範內容（`/news/{slug}`）。 */
export const sampleNews = {
  slug: 'touch-taiwan-2026',
  category: t('Exhibition', '展會'),
  date: '2026-07-22',
  meta: t('22 July 2026', '2026 年 7 月 22 日'),
  title: t(
    'Vicround brings the VR-AC acoustic mesh range to Touch Taiwan 2026.',
    '盈絲將 VR-AC 聲學網布系列帶到 Touch Taiwan 2026。',
  ),
  lead: t(
    'Our first public showing of the full four-grade acoustic line, alongside a live insertion-loss demonstration rig and the automotive-qualified VR-AC 360-A.',
    '四個等級的聲學產品線首度完整公開展出，同場並有插入損失即時量測台與通過車用驗證的 VR-AC 360-A。',
  ),
  heroLabel: t('News hero — Touch Taiwan booth · 2100×900', '新聞主圖 —— Touch Taiwan 攤位 · 2100×900'),
  heroGradient: 'linear-gradient(150deg, #1c8e7a 0%, #115f52 60%, #0d0d18 100%)',
  blocks: [
    {
      type: 'paragraph' as const,
      text: t(
        'Vicround will exhibit at Touch Taiwan 2026 in Taipei from 26 to 28 August, presenting the complete VR-AC acoustic mesh range for the first time since the category launched earlier this year. The four grades — VR-AC 110, 240, 360 and the automotive 360-A — cover ingress ratings from IPX4 to IP67 with insertion loss from under 0.6 dB to 2.4 dB at 1 kHz.',
        '盈絲將於 8 月 26 至 28 日參加台北 Touch Taiwan 2026，這是聲學品類今年稍早推出以來，VR-AC 網布系列首次完整展出。四個等級 —— VR-AC 110、240、360 與車用的 360-A —— 涵蓋 IPX4 到 IP67 的防護等級，1 kHz 插入損失從 0.6 dB 以下到 2.4 dB。',
      ),
    },
    {
      type: 'paragraph' as const,
      text: t(
        'At the centre of the booth is a measurement rig that runs a 20 Hz to 20 kHz sweep through a sealed port with and without the mesh in place, showing the delta live rather than as a printed curve. Visitors are welcome to bring their own housing: if the port geometry is between 1 mm and 12 mm we can usually fixture it on the day.',
        '攤位中央是一台量測設備，對密閉開孔做 20 Hz 至 20 kHz 掃頻，比較有無網布的差異，現場即時呈現而不是印一張曲線圖。歡迎攜帶自己的機殼：開孔幾何在 1 mm 到 12 mm 之間的，我們通常當天就能架治具。',
      ),
    },
    {
      type: 'quote' as const,
      text: t(
        'Customers have been asking us to prove the acoustic claim rather than state it. Bringing the measurement rig to the show floor is the shortest way to do that.',
        '客戶要的是我們把聲學宣告證明給他們看，而不是說一句。把量測設備搬到展場，是最短的路。',
      ),
      author: t('— Lin Wei-Chen, Head of Acoustic Products', '—— 林維宸，聲學產品部主管'),
    },
    {
      type: 'paragraph' as const,
      text: t(
        'Also on display are the automotive optical film grades qualified to 1000 hours of damp heat, and samples from the GRS-certified textile line introduced after last year’s sustainability review. Our engineering team will be on the booth throughout the show rather than sales alone, so technical questions can be answered on the spot.',
        '同時展出的還有通過 1000 小時濕熱驗證的車用光學膜等級，以及去年永續檢視後導入的 GRS 認證紡織產線樣品。展期間工程團隊全程駐點（而不只是業務），技術問題可當場回覆。',
      ),
    },
    {
      type: 'heading' as const,
      id: 'booth',
      text: t('What is on the booth', '攤位上有什麼'),
    },
    {
      type: 'list' as const,
      items: [
        t(
          'The full VR-AC acoustic mesh range, including the automotive 360-A grade rated to 105 °C.',
          '完整的 VR-AC 聲學網布系列，含耐溫 105 °C 的車用 360-A 等級。',
        ),
        t(
          'A live insertion-loss demonstration rig — bring your own housing if you have one.',
          '插入損失即時展示設備 —— 有機殼的話歡迎帶來。',
        ),
        t(
          'Anti-glare haze coupons from 3 % to 25 %, on a working automotive display.',
          '3 % 到 25 % 的抗眩光霧度試片，裝在運作中的車用顯示器上。',
        ),
        t(
          'GRS-certified recycled textile samples and the accompanying chain-of-custody documentation.',
          'GRS 認證的回收紡織樣品，以及隨附的產銷監管鏈文件。',
        ),
      ],
    },
    {
      type: 'paragraph' as const,
      text: t(
        'Meeting slots are filling from the week of 4 August. If you would like a dedicated session with an application engineer rather than a walk-up conversation, book ahead through the contact form and note the material platform you are working on.',
        '會面時段自 8 月 4 日當週開始安排。若希望與應用工程師有專屬時段而非現場排隊，請先透過聯絡表單預約，並註明您正在處理的材料平台。',
      ),
    },
  ],
  event: {
    title: t('Event details', '展會資訊'),
    facts: [
      { label: t('Dates', '日期'), value: t('26 – 28 August 2026', '2026 年 8 月 26 – 28 日') },
      { label: t('Venue', '場館'), value: t('Nangang Exhibition Center, Hall 1, Taipei', '台北南港展覽館 1 館') },
      { label: t('Booth', '攤位'), value: t('L0000', 'L0000') },
      { label: t('On the booth', '駐點人員'), value: t('Application engineering & sales', '應用工程與業務') },
    ],
    cta: t('Book a meeting', '預約會面'),
    note: {
      before: t('New to the acoustic range? The ', '第一次接觸聲學系列嗎？'),
      link: t('acoustic solutions page', '聲學解決方案頁面'),
      after: t(' covers how we specify from an insertion-loss budget.', '說明我們如何從插入損失預算選型。'),
    },
  },
  prev: {
    slug: 'grs-certification-textile',
    label: t('← Previous', '← 上一則'),
    title: t('GRS certification extended across the recycled textile line', 'GRS 認證擴及整條回收紡織產線'),
  },
  next: {
    slug: 'taoyuan-expansion',
    label: t('Next →', '下一則 →'),
    title: t('Taoyuan Production Facility Expansion Completed', '桃園生產基地擴建完成'),
  },
};

/** News 列表（`/news`）—— 逐字取自 `news.dc.html`。 */
export const newsIndex = {
  banner: {
    eyebrow: t('News & Events', '新聞與活動'),
    title: t("What's happening at Vicround.", '盈絲的最新動態。'),
    description: t(
      'Company announcements, product launches, certifications and the exhibitions where you can meet our engineering team in person.',
      '公司公告、產品上市、認證，以及可以當面見到我們工程團隊的展會。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — News · 2560×480', 'Banner 圖 —— 新聞 · 2560×480'),
  },
  categories: [
    { id: 'all', label: t('All', '全部') },
    { id: 'company', label: t('Company', '公司') },
    { id: 'product', label: t('Product', '產品') },
    { id: 'events', label: t('Events', '活動') },
    { id: 'certification', label: t('Certification', '認證') },
  ],
  listEyebrow: t('Latest News', '最新消息'),
  listTitle: t('From the newsroom', '來自新聞室'),
  readMore: t('Read more →', '閱讀更多 →'),
  items: [
    {
      slug: 'ar-9-automotive-film',
      date: '2026-06-18',
      category: 'product',
      title: t(
        'Next-Gen Anti-Reflective Film for Automotive Displays Enters Production',
        '新一代車用顯示器抗反射膜進入量產',
      ),
      excerpt: t(
        'The AR-9 series pairs sub-1% reflectance with the abrasion resistance cockpit displays demand.',
        'AR-9 系列結合低於 1 % 的反射率與座艙顯示器所需的耐磨性。',
      ),
    },
    {
      slug: 'touch-taiwan-2026',
      date: '2026-05-30',
      category: 'events',
      title: t('Vicround to Exhibit at Touch Taiwan 2026', '盈絲將參展 Touch Taiwan 2026'),
      excerpt: t(
        'Visit Booth M517 for live demos of our optical film line and one-on-one engineering consultations.',
        '歡迎至 M517 攤位觀看光學膜產線實機展示，並可一對一諮詢工程團隊。',
      ),
    },
    {
      slug: 'grs-certification-textile',
      date: '2026-05-12',
      category: 'certification',
      title: t('GRS Certification Earned for Recycled Textile Line', '回收紡織產線取得 GRS 認證'),
      excerpt: t(
        'Global Recycled Standard certification now covers our full recycled-content textile portfolio.',
        '全球回收標準認證現已涵蓋我們完整的回收成分紡織產品線。',
      ),
    },
    {
      slug: 'taoyuan-expansion',
      date: '2026-04-22',
      category: 'company',
      title: t('Taoyuan Production Facility Expansion Completed', '桃園生產基地擴建完成'),
      excerpt: t(
        'The new clean-room line increases optical film capacity by 40% to support automotive programs.',
        '新的無塵室產線讓光學膜產能提升 40 %，以支援車用專案。',
      ),
    },
    {
      slug: 'esf-200-emi-foam',
      date: '2026-03-10',
      category: 'product',
      title: t('New EMI Shielding Foam Series Reaches Mass Production', '新款 EMI 遮蔽泡棉系列進入量產'),
      excerpt: t(
        'The ESF-200 series delivers stable shielding effectiveness across 30 MHz–10 GHz in a thinner profile.',
        'ESF-200 系列以更薄的厚度，在 30 MHz–10 GHz 提供穩定的遮蔽效能。',
      ),
    },
    {
      slug: 'esg-report-2025',
      date: '2026-02-05',
      category: 'company',
      title: t('Vicround Publishes 2025 ESG Report', '盈絲發布 2025 年 ESG 報告'),
      excerpt: t(
        'Full-year progress on carbon footprint management, EUDR-ready sourcing and workplace programs.',
        '全年度在碳足跡管理、EUDR 採購準備與職場方案上的進展。',
      ),
    },
  ],
  events: {
    eyebrow: t('Exhibitions & Events', '展會與活動'),
    title: t('Meet us on the show floor', '在展場與我們見面'),
    items: [
      {
        date: t('Aug 26–28, 2026', '2026 年 8 月 26–28 日'),
        name: t('Touch Taiwan 2026', 'Touch Taiwan 2026'),
        body: t(
          'Taipei Nangang Exhibition Center, Hall 1 — Booth M517. Live demos of the new automotive anti-reflective film line.',
          '台北南港展覽館 1 館 —— M517 攤位。新款車用抗反射膜產線實機展示。',
        ),
      },
      {
        date: t('Oct 8–15, 2026', '2026 年 10 月 8–15 日'),
        name: t('K 2026 Düsseldorf', 'K 2026 杜塞道夫'),
        body: t(
          'The world’s leading trade fair for plastics — visit us to discuss sustainable film and foam sourcing for the EU market.',
          '全球最重要的塑膠專業展 —— 歡迎與我們討論銷歐市場的永續膜材與泡棉採購。',
        ),
      },
      {
        date: t('Jan 6–9, 2027', '2027 年 1 月 6–9 日'),
        name: t('CES 2027', 'CES 2027'),
        body: t(
          'Las Vegas Convention Center. Materials for next-gen wearables, smart healthcare and e-paper devices.',
          '拉斯維加斯會展中心。次世代穿戴裝置、智慧醫療與電子紙裝置的材料。',
        ),
      },
    ],
  },
  cta: {
    eyebrow: t('Stay in the loop', '保持聯繫'),
    headline: t('Want product updates delivered directly?', '想直接收到產品更新嗎？'),
    subcopy: t(
      'Tell us which product lines you follow and our team will keep you posted on launches, certifications and exhibitions.',
      '告訴我們您關注哪些產品線，我們會持續提供上市、認證與展會消息。',
    ),
  },
};
