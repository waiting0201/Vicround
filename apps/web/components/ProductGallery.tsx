'use client';

import { useRef, useState, type CSSProperties, type KeyboardEvent, type TouchEvent } from 'react';
import { PlayBadge, YouTubeEmbed } from './YouTubeEmbed';

/**
 * 產品頁 Overview 左欄的圖庫：一張大圖 + 縮圖列。
 *
 * <p>
 * 原本把每張圖由上往下疊，六張圖就是兩千多 px 高，右欄的說明文字被置中在一大片空白中間。
 * 改成「同一個位置換圖」之後，左欄高度與圖片張數無關，只有一張圖時也不顯示任何控制項。
 * </p>
 * <p>
 * 舞台固定 4:3、`contain`：產品圖有實拍也有行銷海報，比例不一，裁掉海報上的字比留白更糟；
 * 固定比例讓換圖時版面不跳動。所有圖都以縮圖的 `<img>` 出現在 HTML 裡，爬蟲照樣看得到每一張。
 * </p>
 * <p>
 * 有 `youTubeId` 的一格是 YouTube 影片（`url` 是它的縮圖）：舞台換成輕量嵌入，按下才載入播放器；
 * 縮圖列那一格疊一個播放標記。影片在 4:3 舞台裡上下留黑邊，與 YouTube 自己的播放器一致。
 * </p>
 */
export type GalleryImage = {
  url: string;
  altText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  /** 有值時這一格是 YouTube 影片。 */
  youTubeId?: string | null;
};

export function ProductGallery({
  images,
  fallbackAlt,
  accent,
  labels,
}: {
  images: GalleryImage[];
  fallbackAlt: string;
  /** 產品線的強調色：選中的縮圖外框用它。 */
  accent: string;
  /** `show` 含 `{n}` 佔位（第幾張）；`play` 含 `{title}` 佔位。 */
  labels: { previous: string; next: string; show: string; play: string };
}) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  const many = images.length > 1;
  const current = images[active] ?? images[0];

  function go(delta: number) {
    setActive((index) => (index + delta + images.length) % images.length);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') go(-1);
    else if (event.key === 'ArrowRight') go(1);
    else return;
    event.preventDefault();
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (start === null) return;
    const dx = event.changedTouches[0].clientX - start;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  }

  if (!current) return null;

  return (
    <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
      <figure style={{ margin: 0, display: 'grid', gap: 10 }}>
        <div
          style={stage}
          tabIndex={many ? 0 : undefined}
          onKeyDown={many ? onKeyDown : undefined}
          onTouchStart={many ? (event) => (touchStart.current = event.touches[0].clientX) : undefined}
          onTouchEnd={many ? onTouchEnd : undefined}
          aria-roledescription={many ? 'carousel' : undefined}
        >
          {current.youTubeId ? (
            // key 讓換到別張再換回來時回到縮圖狀態，不會在背景繼續播放。
            <YouTubeEmbed
              key={`yt-${active}`}
              videoId={current.youTubeId}
              title={current.altText ?? fallbackAlt}
              playLabel={labels.play.replace('{title}', current.altText ?? fallbackAlt)}
              thumbnailUrl={current.url}
              style={{ position: 'absolute', inset: 0 }}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- 圖片優化已關閉，見 next.config.ts */
            <img
              key={current.url}
              src={current.url}
              alt={current.altText ?? fallbackAlt}
              width={current.width ?? undefined}
              height={current.height ?? undefined}
              loading="eager"
              className="vr-gallery-fade"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}

          {many ? (
            <>
              <button type="button" aria-label={labels.previous} onClick={() => go(-1)} style={{ ...arrow, left: 12 }}>
                <Chevron direction="left" />
              </button>
              <button type="button" aria-label={labels.next} onClick={() => go(1)} style={{ ...arrow, right: 12 }}>
                <Chevron direction="right" />
              </button>
              {/* 影片那一格不顯示張數：右下角正好是 YouTube 播放器的標誌與全螢幕鈕。 */}
              {current.youTubeId ? null : (
                <span style={counter} aria-live="polite">
                  {active + 1} / {images.length}
                </span>
              )}
            </>
          ) : null}
        </div>

        {current.caption ? <figcaption style={captionStyle}>{current.caption}</figcaption> : null}
      </figure>

      {many ? (
        <ul style={thumbRail}>
          {images.map((image, index) => {
            const selected = index === active;
            return (
              <li key={image.url}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={labels.show.replace('{n}', String(index + 1))}
                  aria-current={selected ? 'true' : undefined}
                  style={{
                    ...thumb,
                    position: 'relative',
                    borderColor: selected ? accent : 'var(--page-border)',
                    boxShadow: selected ? `0 0 0 1px ${accent}` : 'none',
                    opacity: selected ? 1 : 0.62,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- 圖片優化已關閉，見 next.config.ts */}
                  <img
                    src={image.url}
                    alt={image.altText ?? fallbackAlt}
                    loading="lazy"
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {image.youTubeId ? <PlayBadge /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

const stage: CSSProperties = {
  position: 'relative',
  aspectRatio: '4 / 3',
  borderRadius: 22,
  background: 'var(--page-raised)',
  border: '1px solid var(--page-border)',
  overflow: 'hidden',
  outlineOffset: 3,
};

const arrow: CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 40,
  height: 40,
  borderRadius: 999,
  border: '1px solid var(--page-border)',
  background: 'color-mix(in srgb, var(--page-bg) 82%, transparent)',
  backdropFilter: 'blur(6px)',
  color: 'var(--page-fg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const counter: CSSProperties = {
  position: 'absolute',
  right: 14,
  bottom: 14,
  padding: '4px 10px',
  borderRadius: 999,
  background: 'color-mix(in srgb, var(--page-bg) 82%, transparent)',
  backdropFilter: 'blur(6px)',
  border: '1px solid var(--page-border)',
  font: "500 0.75rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
  letterSpacing: '0.04em',
  color: 'var(--page-muted)',
  fontVariantNumeric: 'tabular-nums',
};

const captionStyle: CSSProperties = {
  padding: '0 6px',
  font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-faint)',
};

// 固定 6 欄而不是橫向捲動：縮圖列跟舞台一樣寬，張數少時靠左、多於 6 張就換行，
// 不會出現一條捲軸，也不會因為只有 2 張就被撐成兩張大圖。
const thumbRail: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
  gap: 'clamp(6px, 1vw, 10px)',
};

const thumb: CSSProperties = {
  display: 'block',
  width: '100%',
  aspectRatio: '4 / 3',
  padding: 0,
  borderRadius: 'clamp(8px, 1vw, 12px)',
  border: '1px solid var(--page-border)',
  background: 'var(--page-raised)',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'opacity 160ms ease, border-color 160ms ease',
};
