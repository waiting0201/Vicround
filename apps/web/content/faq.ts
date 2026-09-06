import { t, type Localized } from '@/lib/content';
import { ROUTES } from '@/lib/routes';

/**
 * FAQ —— 13 題逐字取自 `mockup/Rounded Design/faq.dc.html`（繁中暫譯）。
 *
 * <p>
 * ⚠️ 這一頁的內容同時是 **GEO 的主要素材**：輸出 `FAQPage` JSON-LD 讓 AI 引擎能正確引用
 * （docs/sitemap.md 明列）。接上 `GET /api/v1/faq` 後由 `FaqCategories` / `FaqItems` 提供 ——
 * 它們之所以是強型別表而不是 content block，正是為了這個結構化輸出。
 * </p>
 */
export type FaqItem = {
  id: string;
  category: string;
  question: Localized;
  answer: Localized;
  href: string;
  linkLabel: Localized;
};

export const faq = {
  banner: {
    eyebrow: t('Resources · FAQ', '資源中心 · 常見問題'),
    title: t('Answers, before you have to ask.', '在您開口前，答案就在這裡。'),
    description: t(
      'The questions our engineering and sales teams field most often — about specification, ordering, testing and compliance. Marked up as structured data so search and AI engines can quote them accurately.',
      '工程與業務團隊最常被問到的問題 —— 關於規格、下單、測試與法規符合。已加上結構化標記，讓搜尋與 AI 引擎能正確引用。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — FAQ · 2560×480', 'Banner 圖 —— 常見問題 · 2560×480'),
  },

  categories: [
    { id: 'all', label: t('All questions', '全部問題') },
    { id: 'spec', label: t('Specification', '規格') },
    { id: 'order', label: t('Ordering & samples', '下單與樣品') },
    { id: 'testing', label: t('Testing & validation', '測試與驗證') },
    { id: 'compliance', label: t('Compliance', '法規符合') },
    { id: 'partner', label: t('Partnership', '合作') },
  ],

  items: [
    {
      id: 'q1',
      category: 'spec',
      question: t(
        'What is the difference between anti-glare (AG) and anti-reflective (AR) film?',
        '抗眩光（AG）與抗反射（AR）膜有什麼不同？',
      ),
      answer: t(
        'Anti-glare film scatters reflected light with a micro-textured surface, so a bright reflection becomes a soft haze. Anti-reflective film cancels the reflection optically with thin-film interference layers. AG is cheaper, more scratch-tolerant and generally better outdoors; AR preserves contrast and text sharpness but costs more and marks more easily. For sunlight-readable industrial and automotive displays we usually start from AG.',
        '抗眩光膜以微結構表面散射反射光，讓刺眼的反射變成柔和的霧感；抗反射膜則以薄膜干涉層在光學上抵銷反射。AG 較便宜、較耐刮，戶外表現通常較好；AR 能保留對比與文字銳利度，但成本較高也較容易留痕。針對需在陽光下判讀的工控與車用顯示器，我們通常從 AG 開始。',
      ),
      href: `${ROUTES.products}/optical-film`,
      linkLabel: t('See the Optical Film grades', '查看光學膜等級'),
    },
    {
      id: 'q2',
      category: 'spec',
      question: t('How do I choose a haze level for an anti-glare film?', '抗眩光膜的霧度該怎麼選？'),
      answer: t(
        'Haze trades glare suppression against text sharpness. Below 5 % you keep crisp text but only soften strong reflections; above 20 % reflections almost disappear but fine type starts to sparkle, especially on high-PPI panels. Most centre-stack automotive displays land between 8 % and 15 %. We send coupons across the range so your display team can judge it on the real panel.',
        '霧度是在抑制眩光與文字銳利度之間取捨。低於 5 % 文字仍清晰，但只能柔化強反射；高於 20 % 反射幾乎消失，細小文字卻會開始閃爍，在高 PPI 面板上尤其明顯。多數車用中控顯示器落在 8 % 到 15 % 之間。我們會提供整個區間的試片，讓您的顯示器團隊在真實面板上判斷。',
      ),
      href: ROUTES.contact,
      linkLabel: t('Request a haze coupon set', '索取霧度試片組'),
    },
    {
      id: 'q3',
      category: 'spec',
      question: t('Can two surface functions be combined in one film?', '兩種表面功能可以做在同一片膜上嗎？'),
      answer: t(
        'Yes, and most production parts do. A hard coat is almost always the base layer, with anti-glare texture and an anti-fingerprint top layer applied over it. Anti-fog and anti-fingerprint are the one pairing that needs care, because one wants a hydrophilic surface and the other a hydrophobic one — in that case we zone the coating rather than stack it.',
        '可以，而且多數量產件都是這樣。硬塗層幾乎一定是底層，上面再做抗眩光紋理與抗指紋表層。唯一需要留意的組合是防霧與抗指紋 —— 一個要親水、一個要疏水，這種情況我們會採分區塗佈而非疊層。',
      ),
      href: `${ROUTES.products}/optical-film`,
      linkLabel: t('Compare film families', '比較膜材系列'),
    },
    {
      id: 'q4',
      category: 'order',
      question: t('What is the minimum order quantity for a custom film grade?', '客製膜材等級的最小訂購量是多少？'),
      answer: t(
        'Standard grades ship from stock with no minimum beyond one master roll. A custom coating formulation normally needs a single production run — around 3,000 square metres — though we can often trial the formulation on a shorter pilot coat first so you are not committing to a full run to find out whether it works.',
        '標準等級為現貨出貨，除一支母卷外沒有其他最小量限制。客製塗佈配方通常需要一次完整生產 —— 約 3,000 平方公尺 —— 但我們多半可以先用較短的試塗驗證配方，您不必為了確認可行性就投入一整次生產。',
      ),
      href: ROUTES.contact,
      linkLabel: t('Discuss a custom grade', '討論客製等級'),
    },
    {
      id: 'q5',
      category: 'order',
      question: t('How long does it take to receive samples?', '拿到樣品需要多久？'),
      answer: t(
        'Standard grades ship within 72 hours of an approved request. Die-cut parts to your own drawing take about 48 hours for prototype tooling, plus shipping. Custom formulations depend on where they fall in the coating schedule and are quoted case by case, usually two to four weeks.',
        '標準等級在申請核准後 72 小時內出貨。依您圖面製作的模切件，樣品模具約需 48 小時，再加上運送時間。客製配方則視塗佈排程而定，逐案報期，通常兩到四週。',
      ),
      href: ROUTES.contact,
      linkLabel: t('Request samples', '索取樣品'),
    },
    {
      id: 'q6',
      category: 'order',
      question: t('Do you supply die-cut parts or only roll stock?', '你們供應模切件還是只有捲材？'),
      answer: t(
        'Both. We slit, laminate and die-cut in house, and most customers take finished parts rather than roll stock because it removes a converting step and a tolerance stack from their own line. Send a DXF and we will quote the tooling — prototype tools are typically ready within 48 hours.',
        '兩者都有。分條、貼合與模切都在自家廠內完成，多數客戶選擇成品件而非捲材，因為這樣可以從自己的產線上少掉一道加工與一層公差堆疊。把 DXF 給我們就能報模具費 —— 樣品模具通常 48 小時內完成。',
      ),
      href: `${ROUTES.products}/textile-foam`,
      linkLabel: t('See converting capability', '查看加工能力'),
    },
    {
      id: 'q7',
      category: 'testing',
      question: t(
        'Will you test on our housing rather than a standard coupon?',
        '你們會在我們的機殼上測試，而不是用標準試片嗎？',
      ),
      answer: t(
        'For acoustic and sealing parts we insist on it. Insertion loss and ingress performance are dominated by the port and cavity geometry, so a coupon result tells you very little about your product. Send us the housing or the CAD and we will run the measurement on the real geometry during qualification.',
        '聲學與密封件我們堅持這樣做。插入損失與防護表現主要由開孔與腔體幾何決定，試片結果對您的產品參考價值很低。把機殼或 CAD 給我們，驗證階段就會在真實幾何上量測。',
      ),
      href: `${ROUTES.solutions}/acoustic-solutions`,
      linkLabel: t('How we validate acoustic parts', '我們如何驗證聲學件'),
    },
    {
      id: 'q8',
      category: 'testing',
      question: t('What ageing tests do you run as standard?', '標準會做哪些老化測試？'),
      answer: t(
        'Consumer grades get 500 hours of damp heat at 85 °C / 85 % RH. Automotive grades get 1000 hours plus 300 thermal-shock cycles between −40 °C and 105 °C. Weatherable and PV grades run 2000 hours of QUV against the IEC 61215 profile. In every case we re-measure the functional property afterwards, not just adhesion.',
        '消費性等級做 500 小時 85 °C／85 % RH 濕熱。車用等級做 1000 小時，另加 −40 °C 至 105 °C 的 300 次熱衝擊循環。耐候與太陽能等級依 IEC 61215 條件做 2000 小時 QUV。每一種情況我們都會在測試後重新量測功能特性，而不只是附著力。',
      ),
      href: ROUTES.downloads,
      linkLabel: t('Download test reports', '下載測試報告'),
    },
    {
      id: 'q9',
      category: 'compliance',
      question: t('Which certifications does Vicround hold?', '盈絲持有哪些認證？'),
      answer: t(
        'ISO 9001 and ISO 14001 across our manufacturing sites, ISO 22196 test reports for antimicrobial grades, BSCI for social compliance, and GRS for recycled-content textile lines. Automotive lines run to IATF 16949 practice. Current certificates are in the member area and are re-issued as they renew.',
        '各生產據點持有 ISO 9001 與 ISO 14001，抗菌等級備有 ISO 22196 測試報告，社會責任方面為 BSCI，回收成分紡織產線為 GRS。車用產線依 IATF 16949 實務運作。最新證書放在會員專區，換證後會重新上傳。',
      ),
      href: ROUTES.sustainability,
      linkLabel: t('See certifications and standards', '查看認證與標準'),
    },
    {
      id: 'q10',
      category: 'compliance',
      question: t('Can you supply RoHS, REACH and EUDR documentation?', '能提供 RoHS、REACH 與 EUDR 文件嗎？'),
      answer: t(
        'Yes. RoHS and REACH declarations ship with every qualification sample. For EUDR we hold geolocation and due-diligence records for the natural-fibre content in our textile lines, and we can issue a due-diligence statement per shipment ahead of the enforcement date.',
        '可以。每一份驗證樣品都附 RoHS 與 REACH 聲明。EUDR 方面，我們保有紡織產線天然纖維成分的地理位置與盡職調查紀錄，並可在強制實施日前依出貨批次出具盡職調查聲明。',
      ),
      href: ROUTES.sustainability,
      linkLabel: t('Read our EUDR response', '閱讀我們的 EUDR 因應'),
    },
    {
      id: 'q11',
      category: 'compliance',
      question: t('Do you provide a carbon footprint figure per part?', '會提供每個零件的碳足跡數字嗎？'),
      answer: t(
        'For products covered by our TRIPs carbon-management programme, yes — a cradle-to-gate figure per square metre or per part, with the calculation boundary stated. For everything else we can give you the site-level intensity figure and be explicit that it is not a product-level number.',
        '納入 TRIPs 碳管理方案的產品可以 —— 提供每平方公尺或每件的搖籃到大門數值，並載明計算邊界。其餘產品我們會提供據點層級的強度數字，並明確說明那不是產品層級的數值。',
      ),
      href: ROUTES.sustainability,
      linkLabel: t('Carbon footprint management', '碳足跡管理'),
    },
    {
      id: 'q12',
      category: 'partner',
      question: t('Do you take OEM/ODM development programs?', '你們承接 OEM／ODM 開發專案嗎？'),
      answer: t(
        'Most of our volume is OEM/ODM. A typical program runs spec review, material selection, prototype tooling, qualification, then production release, with one engineer owning it end to end. We are equally happy building to your drawing or developing the specification with you from the application requirement.',
        '我們大部分的量都是 OEM／ODM。典型專案流程是規格檢視、材料選定、樣品模具、驗證，再到量產放行，全程由同一位工程師負責。依您的圖面製作，或從應用需求與您一起訂出規格，兩種我們都做。',
      ),
      href: ROUTES.partnership,
      linkLabel: t('How OEM/ODM works with us', 'OEM／ODM 的合作方式'),
    },
    {
      id: 'q13',
      category: 'partner',
      question: t('Are you looking for regional distributors?', '你們在找區域經銷商嗎？'),
      answer: t(
        'Yes, in territories where we do not yet have direct coverage. We look for partners with existing technical sales capability in electronics, automotive or medical device supply chains, since these products are specified rather than shelf-bought. Send a company profile and the territory you cover.',
        '是的，在我們尚未直接覆蓋的地區。我們尋找在電子、車用或醫療器材供應鏈已具備技術銷售能力的夥伴 —— 這類產品是被指定選用而非上架販售。請提供公司簡介與您負責的地區。',
      ),
      href: ROUTES.partnership,
      linkLabel: t('Distribution and purchasing', '經銷與採購'),
    },
  ] satisfies FaqItem[],
};
