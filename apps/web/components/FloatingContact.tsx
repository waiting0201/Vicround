import Link from 'next/link';
import { Icon } from './Icon';
import { translator } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';

/**
 * 右下角浮動聯絡鈕 —— 逐項對照 `mockup/Rounded Design/FloatingButton.dc.html`。
 *
 * <p>
 * Sitemap-0819 的「Floating Button」節點另有一顆 AI Agent 鈕待定；
 * mockup 目前也只留 Contact Us 這一顆，之後要加時在同一個直列容器裡加第二個。
 * </p>
 */
export function FloatingContact({ locale }: { locale: Locale }) {
  const t = translator(locale);

  return (
    <div
      style={{
        position: 'fixed',
        right: 'clamp(16px, 2.5vw, 32px)',
        bottom: 'clamp(16px, 2.5vw, 32px)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        fontFamily: "'Geologica', 'GenYoGothic TW', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <Link href={localeHref(locale, ROUTES.contact)} className="vr-float">
        <Icon name="mail" size={18} />
        <span style={{ font: "600 14px/1 'Geologica', 'GenYoGothic TW', sans-serif" }}>
          {t('nav.contact')}
        </span>
      </Link>
    </div>
  );
}
