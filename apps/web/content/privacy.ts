import { t } from '@/lib/content';

/** Privacy & Legal —— 逐字取自 `mockup/Rounded Design/privacy.dc.html`（繁中暫譯）。 */
export const privacy = {
  banner: {
    eyebrow: t('Privacy & Legal', '隱私權與法律聲明'),
    title: t('Privacy Policy.', '隱私權政策。'),
    description: t(
      'How Vicround collects, uses and protects the information you share with us — across this website, our contact forms and our member area.',
      '盈絲如何蒐集、使用與保護您提供的資訊 —— 涵蓋本網站、聯絡表單與會員專區。',
    ),
    image: '/assets/banner-brand.jpg',
    imageLabel: t('Banner imagery — Privacy · 2560×480', 'Banner 圖 —— 隱私權 · 2560×480'),
  },
  updated: t('Last updated: June 1, 2026', '最後更新：2026 年 6 月 1 日'),
  sections: [
    {
      id: 'collect',
      title: t('1. Information We Collect', '1. 我們蒐集的資訊'),
      body: t(
        'When you use our contact form, request technical specifications or register for a member account, we collect the information you provide directly: your name, company, business email address, and the details of your inquiry. We also collect basic technical information automatically — such as browser type, device, pages visited and referring URL — to keep the site secure and understand how it is used.',
        '當您使用聯絡表單、索取技術規格或註冊會員帳號時，我們會蒐集您直接提供的資訊：姓名、公司、公司電子郵件與詢問內容。我們也會自動蒐集基本技術資訊 —— 例如瀏覽器類型、裝置、瀏覽頁面與來源網址 —— 以維護網站安全並了解使用情形。',
      ),
    },
    {
      id: 'use',
      title: t('2. How We Use Information', '2. 資訊的使用方式'),
      body: t(
        'We use your information to respond to inquiries, provide requested spec sheets and white papers, manage member accounts, and — where you have opted in — send updates about product launches, certifications and exhibitions. We do not sell personal information, and we do not use it for purposes unrelated to our business relationship with you.',
        '我們使用您的資訊回覆詢問、提供您索取的規格書與白皮書、管理會員帳號，並在您選擇訂閱的情況下寄送產品上市、認證與展會消息。我們不販售個人資訊，也不會將其用於與雙方業務關係無關的用途。',
      ),
    },
    {
      id: 'cookies',
      title: t('3. Cookies & Analytics', '3. Cookie 與分析'),
      body: t(
        'This site uses essential cookies required for core functionality — such as keeping you signed in to the member area and remembering your language preference — and analytics cookies that help us measure page performance in aggregate. You can disable non-essential cookies in your browser settings without affecting your ability to browse the site.',
        '本網站使用核心功能所必需的 cookie —— 例如維持會員專區登入狀態與記住語言偏好 —— 以及協助我們彙總衡量頁面表現的分析 cookie。您可在瀏覽器設定中停用非必要 cookie，不影響瀏覽本站。',
      ),
    },
    {
      id: 'sharing',
      title: t('4. Data Sharing', '4. 資料分享'),
      body: t(
        'We share personal information only with service providers who support our operations — such as cloud hosting and email delivery — under contracts that restrict how they may use it. We may also disclose information when required by law. We never share your inquiry details with other customers or third-party marketers.',
        '我們僅與支援營運的服務供應商（例如雲端主機與電子郵件遞送）分享個人資訊，且以契約限制其使用方式。依法律要求時我們亦可能揭露資訊。我們絕不會將您的詢問內容分享給其他客戶或第三方行銷業者。',
      ),
    },
    {
      id: 'retention',
      title: t('5. Retention & Security', '5. 保存與安全'),
      body: t(
        'We retain personal information only as long as needed for the purposes described above, or as required by applicable law. Data is stored on access-controlled infrastructure, transmitted over encrypted connections, and reviewed periodically so that information we no longer need is deleted.',
        '個人資訊僅保存至達成上述目的所需的期間，或依適用法律規定保存。資料存放於具存取控制的基礎架構，以加密連線傳輸，並定期檢視，將不再需要的資訊刪除。',
      ),
    },
    {
      id: 'rights',
      title: t('6. Your Rights', '6. 您的權利'),
      body: t(
        'You may request access to, correction of, or deletion of your personal information at any time. If you have opted in to updates, every message includes an unsubscribe link, and you can withdraw consent whenever you wish. We respond to verified requests within 30 days.',
        '您可隨時要求查閱、更正或刪除您的個人資訊。若您已訂閱更新，每封信件都附有取消訂閱連結，您可隨時撤回同意。我們會在 30 天內回覆經驗證的請求。',
      ),
    },
    {
      id: 'updates',
      title: t('7. Policy Updates', '7. 政策更新'),
      body: t(
        'We may update this policy from time to time to reflect changes in our practices or legal requirements. The “Last updated” date at the top of this page always reflects the current version, and material changes will be highlighted on this page before they take effect.',
        '我們可能因作業方式或法規要求變動而不定期更新本政策。本頁上方的「最後更新」日期即為現行版本，重大變更將於生效前於本頁標示。',
      ),
    },
    {
      id: 'contact',
      title: t('8. Contact', '8. 聯絡我們'),
      body: t(
        'Questions about this policy or how your data is handled? Contact us and our team will respond within two business days.',
        '對本政策或資料處理方式有疑問嗎？請與我們聯絡，團隊將於兩個工作天內回覆。',
      ),
    },
  ],
};
