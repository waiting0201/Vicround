import type { ReactNode } from 'react';
import { PageBanner } from './PageBanner';
import { PageShell } from './PageShell';

/**
 * 內頁骨架：確認稿的頁首 banner + 內容容器。
 *
 * <p>
 * ⚠️ **這是鷹架，不是完稿。** banner／頁寬／字級已與 `mockup/Rounded Design` 一致，
 * 但各頁的內容區塊（產品卡、規格表、認證列…）尚未逐頁實作。
 * 實作某一頁時，把 `Todo` 換成真正的區塊。
 * </p>
 */
export function PageScaffold({
  eyebrow,
  title,
  lead,
  bannerImage,
  tone = 'light',
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  bannerImage?: string | null;
  tone?: 'light' | 'dark';
  children?: ReactNode;
}) {
  return (
    <PageShell tone={tone}>
      <PageBanner
        eyebrow={eyebrow ?? 'Vicround'}
        title={title}
        description={lead}
        image={bannerImage}
        tone={tone}
      />
      {children && (
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: 'clamp(32px, 4vw, 48px) clamp(24px, 5vw, 80px) clamp(64px, 9vw, 128px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {children}
        </div>
      )}
    </PageShell>
  );
}

/** 尚未接上的區塊。寫明「等哪一支 API」，讓待辦留在程式碼裡而不是記憶裡。 */
export function Todo({ api, note }: { api: string; note?: string }) {
  return (
    <section
      style={{
        border: '1px dashed var(--page-border)',
        borderRadius: 22,
        padding: 24,
        font: "400 0.875rem/1.55 'Geologica', 'GenYoGothic TW', sans-serif",
        color: 'var(--page-muted)',
      }}
    >
      <p style={{ margin: 0 }}>
        待接 API：<code style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{api}</code>
      </p>
      {note && <p style={{ margin: '8px 0 0' }}>{note}</p>}
    </section>
  );
}
