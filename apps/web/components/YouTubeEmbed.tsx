'use client';

import { useState, type CSSProperties } from 'react';

/**
 * YouTube 影片的「輕量嵌入」：先只放縮圖與播放鈕，訪客按下去才換成 iframe。
 *
 * <p>
 * 直接放 iframe 的代價是每支影片在載入時就拉進 YouTube 播放器約 1 MB 的腳本與第三方 cookie——
 * 產品頁與產業頁大多數訪客根本不會播，卻要為它付 LCP。換成縮圖之後，沒按播放的人只多載一張圖。
 * iframe 走 `youtube-nocookie.com`，按下播放前不設任何 YouTube cookie。
 * </p>
 * <p>
 * 外框尺寸交給呼叫端（`style`）：產品圖庫的舞台是 4:3，案例的成果卡是 16:9。
 * </p>
 */
export function YouTubeEmbed({
  videoId,
  title,
  playLabel,
  thumbnailUrl,
  style,
}: {
  videoId: string;
  title: string;
  /** 播放鈕的無障礙名稱，例如「播放影片：{title}」。 */
  playLabel: string;
  /** 預設用 YouTube 的 hqdefault 縮圖。 */
  thumbnailUrl?: string | null;
  style?: CSSProperties;
}) {
  const [playing, setPlaying] = useState(false);
  const poster = thumbnailUrl || youTubeThumbnail(videoId);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#000', ...style }}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={playLabel} style={posterButton}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 圖片優化已關閉，見 next.config.ts */}
          <img
            src={poster}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <PlayIcon />
        </button>
      )}
    </div>
  );
}

/** YouTube 的 hqdefault 縮圖（480×360，每支影片都有）。 */
export function youTubeThumbnail(videoId: string) {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

/** 縮圖列等小尺寸位置用的播放標記。 */
export function PlayBadge({ size = 22 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        borderRadius: 999,
        background: 'rgba(0,0,0,0.62)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 4.5v15l13-7.5z" />
      </svg>
    </span>
  );
}

function PlayIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        width: 68,
        height: 48,
        borderRadius: 14,
        background: 'rgba(15,15,20,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 160ms ease',
      }}
      className="vr-yt-play"
    >
      <svg width={22} height={22} viewBox="0 0 24 24" fill="#fff">
        <path d="M7 4.5v15l13-7.5z" />
      </svg>
    </span>
  );
}

const posterButton: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
