import { ContactTrigger } from './ContactTrigger';
import { translator } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';

/**
 * 頁尾 CTA 帶 —— 逐項對照 `mockup/Rounded Design/PageCTA.dc.html`
 * （背景 #1a0755、置中、白色 pill 按鈕）。
 *
 * <p>
 * 文案之後由 `GET /api/v1/pages/{slug}` 的 CTA 欄位覆寫；沒給就用這裡的預設，
 * 與 mockup 的預設值相同。
 * </p>
 */
export function PageCTA({
  locale,
  eyebrow,
  headline,
  subcopy,
}: {
  locale: Locale;
  eyebrow?: string;
  headline?: string;
  subcopy?: string;
}) {
  const t = translator(locale);

  return (
    <section
      style={{
        background: '#1a0755',
        fontFamily: "'Geologica', 'GenYoGothic TW', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: 'clamp(72px, 9vw, 120px) clamp(24px, 5vw, 80px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            font: "600 13px/1.2 'Geologica', sans-serif",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#a184f5',
          }}
        >
          {eyebrow ?? t('cta.eyebrow')}
        </p>
        <h2
          style={{
            margin: '16px 0 0',
            font: "500 clamp(2rem, 3.5vw, 2.5rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
            color: '#ffffff',
            maxWidth: 960,
            textWrap: 'balance',
          }}
        >
          {headline ?? t('cta.headline')}
        </h2>
        <p
          style={{
            margin: '16px 0 0',
            font: "400 1.0625rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'rgba(255,255,255,0.65)',
            textWrap: 'pretty',
          }}
        >
          {subcopy ?? t('cta.subcopy')}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 32,
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ContactTrigger className="vr-cta-invert">
            {t('cta.button')}
            <span aria-hidden="true">→</span>
          </ContactTrigger>
        </div>
      </div>
    </section>
  );
}
