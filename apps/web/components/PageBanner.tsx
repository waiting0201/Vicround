/**
 * 內頁頁首 —— 逐項對照 `mockup/Rounded Design/PageBanner.dc.html`。
 *
 * <p>
 * `image` 有值就鋪滿實圖，沒有就用 mockup 的預設漸層（`linear-gradient(150deg, #3a17a8…)`）
 * 並顯示尺寸提示標籤。banner 圖之後由 CMS 的 `MediaAssets` 供應。
 * </p>
 */
export function PageBanner({
  eyebrow,
  title,
  description,
  image,
  imageLabel = 'Banner imagery — 2560×480',
  tone = 'dark',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  image?: string | null;
  imageLabel?: string;
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
      {image ? (
        <div style={bannerStyle} role="img" aria-label={title} />
      ) : (
        <div style={bannerStyle}>
          <span
            style={{
              font: "500 12px/1.4 'IBM Plex Mono', monospace",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            {imageLabel}
          </span>
        </div>
      )}

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
                maxWidth: 900,
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
