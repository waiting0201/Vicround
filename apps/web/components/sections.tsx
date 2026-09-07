import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * 版型基本件 —— 從 `mockup/Rounded Design` 各頁重複出現的樣式歸納出來。
 * 每一支的數值都取自 mockup，改動前先回去對照那幾支 .dc.html。
 */

/** 內容容器：max-width 1280 + 兩側 clamp padding。mockup 每一個 section 都是這個殼。 */
export function Container({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(64px, 9vw, 120px) clamp(24px, 5vw, 80px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 區段。`tone` 對應 mockup 的兩種底色：預設 #0a0a12、`raised` 是 #10101d。 */
export function Section({
  id,
  tone = 'base',
  children,
  style,
  containerStyle,
}: {
  id?: string;
  tone?: 'base' | 'raised' | 'deep';
  children: ReactNode;
  style?: CSSProperties;
  containerStyle?: CSSProperties;
}) {
  const background = { base: undefined, raised: 'var(--page-raised)', deep: '#08080f' }[tone];

  return (
    <section id={id} style={{ background, scrollMarginTop: 90, ...style }}>
      <Container style={containerStyle}>{children}</Container>
    </section>
  );
}

/** 小標（eyebrow）。全站統一：13px、600、字距 0.14em、大寫、#a184f5。 */
export const eyebrowStyle: CSSProperties = {
  margin: 0,
  font: "600 13px/1.2 'Geologica', sans-serif",
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--page-accent)',
};

/** 等寬小標籤（Certifications / Partner Brands 這類分組標題）。 */
export const monoLabelStyle: CSSProperties = {
  font: "500 12px/1.4 'IBM Plex Mono', monospace",
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--page-faint)',
};

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'start',
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: 'start' | 'center';
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : undefined,
        textAlign: align === 'center' ? 'center' : undefined,
      }}
    >
      {eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}
      <h2
        style={{
          margin: '12px 0 0',
          font: "500 clamp(2rem, 3.5vw, 2.75rem)/1.1 'Geologica', 'GenYoGothic TW', sans-serif",
          color: 'var(--page-fg)',
        }}
      >
        {title}
      </h2>
      {lead && (
        <p
          style={{
            margin: '16px 0 0',
            font: "400 1.0625rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'var(--page-muted)',
            textWrap: 'pretty',
          }}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

/**
 * 圖片版位。
 *
 * <p>
 * 有圖就鋪圖，沒有就畫 mockup 自己那個虛線佔位框（它在沒有素材時就是這樣處理
 * partner logo 與 banner 的）。**正式站的圖來自 CMS 的 Blob 媒體庫**，
 * 所以這個元件的 `src` 之後會是 `MediaAssets.Url`，不是 repo 裡的檔案。
 * </p>
 */
export function ImageSlot({
  src,
  alt,
  label,
  ratio = '4 / 3',
  radius = 22,
  style,
}: {
  src?: string | null;
  alt: string;
  label?: string;
  ratio?: string;
  radius?: number;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    aspectRatio: ratio,
    borderRadius: radius,
    overflow: 'hidden',
    ...style,
  };

  if (src) {
    return (
      <div style={{ ...base, background: '#000000' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 圖片優化已關閉（見 next.config.ts），一律直供 */}
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...base,
        border: '1px dashed var(--page-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          font: "500 12px/1.4 'IBM Plex Mono', monospace",
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--page-faint)',
        }}
      >
        {label ?? alt}
      </span>
    </div>
  );
}

/** 等寬小 chip（產品特性標籤：AG / AF / Privacy…）。 */
export function MonoChip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        padding: '6px 12px',
        border: '1px solid var(--page-border)',
        borderRadius: 999,
        font: "400 12px/1.4 'IBM Plex Mono', monospace",
        color: 'var(--page-muted)',
      }}
    >
      {children}
    </span>
  );
}

/** 88px 圓角方塊 + 圖示（產業總覽、製程卡片的視覺開頭）。 */
export function IconTile({ name, size = 88 }: { name: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.295),
        background: 'rgba(100,54,239,0.16)',
        color: '#a184f5',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      <Icon name={name} size={Math.round(size * 0.455)} />
    </span>
  );
}

/** 卡片：22px 圓角 + 1px 細邊，mockup 的卡片一律是這組。 */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--page-border)',
        borderRadius: 22,
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export const bodyStyle: CSSProperties = {
  margin: 0,
  font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-muted)',
  textWrap: 'pretty',
};

export const cardTitleStyle: CSSProperties = {
  margin: 0,
  font: "600 1.25rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-fg)',
};
