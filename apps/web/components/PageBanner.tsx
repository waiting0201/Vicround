/**
 * 內頁頁首 —— 逐項對照 `mockup/Rounded Design/PageBanner.dc.html`。
 *
 * <p>
 * `image` 有值就鋪滿實圖，沒有就用 mockup 的預設漸層（`linear-gradient(150deg, #3a17a8…)`）。
 * **不顯示尺寸提示標籤**——那是設計稿給設計師看的標記，印在客戶的正式頁面上會被當成
 * bug。banner 圖由 CMS 的 `MediaAssets` 或 `lib/page-assets.ts` 的設計素材供應。
 * </p>
 */
export function PageBanner({
  eyebrow,
  title,
  description,
  image,
  tone = 'dark',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  image?: string | null;
  tone?: 'dark' | 'light';
}) {
  const light = tone === 'light';

  const bannerStyle: React.CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    aspectRatio: '16 / 3',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '24px 28px',
    overflow: 'hidden',
    ...(image
      ? { background: `#0a0a12 url('${image}') center center / cover no-repeat` }
      : { background: 'linear-gradient(150deg, #3a17a8 0%, #1a0755 55%, #0d0d18 100%)' }),
  };

  return (
    <section
      style={{ fontFamily: "'Geologica', 'GenYoGothic TW', 'Noto Sans TC', system-ui, sans-serif" }}
    >
      <div style={bannerStyle} role={image ? 'img' : undefined} aria-label={image ? title : undefined} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(24px, 5vw, 80px)' }}>
        <div style={{ padding: 'clamp(32px, 4vw, 48px) 0 clamp(8px, 1vw, 16px)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              margin: '0 0 16px',
            }}
          >
            <span
              style={{ width: 18, height: 2, background: '#6436ef', display: 'inline-block' }}
            />
            <p
              style={{
                margin: 0,
                font: "600 13px/1.2 'Geologica', sans-serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: light ? '#6436ef' : '#a184f5',
              }}
            >
              {eyebrow}
            </p>
          </div>
          <h1
            style={{
              margin: 0,
              font: "400 clamp(2.25rem, 4vw, 2.75rem)/1.08 'Geologica', 'GenYoGothic TW', sans-serif",
              letterSpacing: '-0.01em',
              color: light ? '#14141f' : '#ffffff',
              textWrap: 'balance',
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                margin: '20px 0 0',
                font: "400 1.125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: light ? 'rgba(20,20,31,0.66)' : 'rgba(255,255,255,0.66)',
                textWrap: 'pretty',
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
