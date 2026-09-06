import { t } from '@/lib/content';

/** 會員專區入口 —— 逐字取自 `mockup/Rounded Design/member.dc.html`（繁中暫譯，深色頁）。 */
export const member = {
  banner: {
    eyebrow: t('Member', '會員'),
    title: t('Your technical library, in one account.', '一個帳號，收齊所有技術資料。'),
    description: t(
      'A Vicround member account unlocks full spec sheets, test reports and white papers, and keeps your sample requests and inquiry history in one place.',
      '盈絲會員帳號可取得完整規格書、測試報告與白皮書，並把您的樣品申請與詢問紀錄集中在一處。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Member · 2560×480', 'Banner 圖 —— 會員 · 2560×480'),
  },

  tabs: { signIn: t('Sign in', '登入'), register: t('Create account', '註冊帳號') },

  signIn: {
    email: t('Business email', '公司電子郵件'),
    password: t('Password', '密碼'),
    remember: t('Keep me signed in', '保持登入'),
    forgot: t('Forgot password?', '忘記密碼？'),
    submit: t('Sign in', '登入'),
  },

  register: {
    name: t('Name *', '姓名 *'),
    company: t('Company *', '公司 *'),
    email: t('Business email *', '公司電子郵件 *'),
    role: t('Role', '職務'),
    roles: [
      t('Engineering / R&D', '工程／研發'),
      t('Procurement', '採購'),
      t('Product management', '產品管理'),
      t('Quality', '品保'),
      t('Other', '其他'),
    ],
    password: t('Password *', '密碼 *'),
    confirm: t('Confirm password *', '確認密碼 *'),
    consentBefore: t('I agree to the ', '我同意'),
    consentLink: t('Privacy Policy', '隱私權政策'),
    consentAfter: t(' and consent to Vicround storing my account details.', '，並同意盈絲保存我的帳號資料。'),
    submit: t('Create account', '註冊帳號'),
    note: t(
      'Accounts are verified against a business domain. Approval usually completes within one business day.',
      '帳號會以企業網域驗證，審核通常於一個工作天內完成。',
    ),
  },

  benefits: {
    eyebrow: t('Member benefits', '會員權益'),
    title: t('Built for engineering teams', '為工程團隊而設'),
    items: [
      {
        icon: 'file-text',
        title: t('Full spec sheets', '完整規格書'),
        body: t(
          'Complete technical data, tolerance tables and test reports — beyond the public summaries.',
          '完整技術數據、公差表與測試報告 —— 超出公開摘要的內容。',
        ),
      },
      {
        icon: 'download',
        title: t('White paper library', '白皮書資料庫'),
        body: t(
          'Download every technical paper without filling in a form each time.',
          '下載每一份技術文件，不必每次填表。',
        ),
      },
      {
        icon: 'package',
        title: t('Sample request history', '樣品申請紀錄'),
        body: t(
          'Track what you requested, what shipped, and re-order the same lot spec.',
          '追蹤申請了什麼、出貨了什麼，並可依同一批規格再次申請。',
        ),
      },
      {
        icon: 'shield-check',
        title: t('Compliance documents', '合規文件'),
        body: t(
          'ISO, BSCI, GRS and EUDR documentation packs, always at the current revision.',
          'ISO、BSCI、GRS 與 EUDR 文件包，永遠是現行版本。',
        ),
      },
    ],
    footnoteBefore: t('Not ready for an account? Public spec summaries and FAQs are open to everyone in ', '還不想開帳號？公開的規格摘要與常見問題都在'),
    footnoteLink: t('Resources', '資源中心'),
    footnoteAfter: t('.', '，開放給所有人。'),
  },

  cta: {
    eyebrow: t('Need help with your account?', '帳號需要協助？'),
    headline: t('Our team can set it up for you.', '我們的團隊可以替您開通。'),
    subcopy: t(
      "Send us your team's details and we'll provision member access for everyone who needs it.",
      '把團隊成員資料給我們，我們會為每一位需要的人開通會員權限。',
    ),
  },
};
