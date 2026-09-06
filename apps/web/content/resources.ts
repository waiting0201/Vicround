import { t } from '@/lib/content';
import { ROUTES } from '@/lib/routes';

/**
 * Resources hub 與 Downloads —— 逐字取自 `mockup/Rounded Design/resources.dc.html`（繁中暫譯）。
 *
 * <p>
 * mockup 把下載放在 Resources 的 `#downloads` 區段；本站的資訊架構（docs/sitemap.md）
 * 另有 `/resources/downloads` 獨立頁，所以同一份資料同時餵這兩處。
 * </p>
 */
export const resources = {
  banner: {
    eyebrow: t('Resources', '資源中心'),
    title: t('Technical knowledge, structured for engineers.', '為工程師整理的技術資訊。'),
    description: t(
      'Articles, industry insights, FAQ and downloadable spec sheets — everything an OEM engineering team needs to evaluate our materials.',
      '技術文章、產業洞察、常見問題與可下載的規格書 —— OEM 工程團隊評估我們材料所需的一切。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Resources · 2560×480', 'Banner 圖 —— 資源中心 · 2560×480'),
  },

  news: {
    eyebrow: t('News & Exhibitions', '新聞與展會'),
    title: t('Meet us on the show floor', '在展場與我們見面'),
    cta: t('All news & exhibitions', '所有新聞與展會'),
    nextLabel: t('Next exhibition', '下一場展會'),
    nextName: t('[Exhibition name — add here]', '[展會名稱 —— 待補]'),
    facts: [
      { label: t('Date', '日期'), value: t('[Add date]', '[待補日期]') },
      { label: t('Location', '地點'), value: t('[Add city / venue]', '[待補城市／場館]') },
      { label: t('Booth', '攤位'), value: t('[Add booth no.]', '[待補攤位號]') },
    ],
    bookCta: t('Book a meeting', '預約會面'),
    items: [
      {
        kind: t('Exhibition', '展會'),
        title: t(
          '[Add the exhibition recap or upcoming show announcement.]',
          '[待補：展會回顧或即將參展的公告。]',
        ),
      },
      {
        kind: t('Company news', '公司新聞'),
        title: t(
          '[Add a company milestone, certification or capacity announcement.]',
          '[待補：公司里程碑、認證或產能公告。]',
        ),
      },
      {
        kind: t('Product news', '產品新聞'),
        title: t('[Add a new material platform or grade launch.]', '[待補：新材料平台或新等級上市。]'),
      },
    ],
    readMore: t('Read more →', '閱讀更多 →'),
  },

  faq: {
    eyebrow: t('FAQ', '常見問題'),
    title: t('Common questions', '常見問題'),
    cta: t('See all 13 questions →', '查看全部 13 個問題 →'),
  },

  insights: {
    eyebrow: t('Industry Insights / Trend Reports', '產業洞察／趨勢報告'),
    title: t('Where the market is heading', '市場走向何方'),
    cta: t('Read report →', '閱讀報告 →'),
    items: [
      {
        slug: '2026-outlook-automotive-displays',
        title: t(
          '2026 Outlook: Materials Demand Across Automotive Displays',
          '2026 展望：車用顯示器的材料需求',
        ),
        body: t(
          'A look at cockpit-display protection trends and what they mean for film specification.',
          '檢視座艙顯示器防護趨勢，以及它對膜材規格的意義。',
        ),
      },
      {
        slug: 'eudr-sustainable-sourcing',
        title: t(
          'EUDR & Sustainable Sourcing: What OEM Buyers Need to Know',
          'EUDR 與永續採購：OEM 採購該知道的事',
        ),
        body: t(
          'A practical primer on EU deforestation regulation readiness for materials procurement teams.',
          '給材料採購團隊的歐盟零毀林法規準備入門。',
        ),
      },
    ],
  },

  articles: {
    eyebrow: t('Blog / Technical Articles', '技術文章'),
    title: t('From the engineering team', '來自工程團隊'),
    cta: t('Read article →', '閱讀文章 →'),
    items: [
      {
        slug: 'anti-glare-haze-ratings',
        category: t('Optical Film', '光學膜'),
        title: t('Understanding Anti-Glare Film Haze Ratings', '看懂抗眩光膜的霧度數值'),
      },
      {
        slug: 'emi-shielding-101',
        category: t('Textile & Foam', '紡織與泡棉'),
        title: t('EMI Shielding 101 for Consumer Electronics', '消費性電子的 EMI 遮蔽入門'),
      },
      {
        slug: 'choosing-acoustic-mesh',
        category: t('Acoustic', '聲學材料'),
        title: t('Choosing the Right Acoustic Mesh for IP-Rated Devices', '為 IP 等級裝置選對聲學網布'),
      },
    ],
  },

  downloads: {
    eyebrow: t('Downloads', '下載'),
    title: t('White papers & spec sheets', '白皮書與規格書'),
    /**
     * ⚠️ 這些連到 `/member` 而不是檔案本身 —— 規格書是 `MemberOnly`，
     * 公開端不得回傳真實檔案 URL（docs/cms-api.md）。登入後由 Account API 換 SAS。
     */
    items: [
      { slug: 'optical-film-spec-sheet', title: t('Optical Film Spec Sheet', '光學膜規格書'), href: ROUTES.member },
      { slug: 'textile-foam-spec-sheet', title: t('Textile & Foam Spec Sheet', '紡織與泡棉規格書'), href: ROUTES.member },
      { slug: 'acoustic-spec-sheet', title: t('Acoustic Spec Sheet', '聲學材料規格書'), href: ROUTES.member },
    ],
  },

  cta: {
    eyebrow: t('Still have questions?', '還有問題嗎？'),
    headline: t('Talk to our engineering team directly.', '直接和我們的工程團隊談。'),
    subcopy: t(
      'Send us your application and target spec — our engineering team responds within two business days.',
      '把您的應用與目標規格給我們 —— 工程團隊將於兩個工作天內回覆。',
    ),
  },
};
