'use client';

import type { CSSProperties, ReactNode } from 'react';

/**
 * 會員相關畫面（登入／註冊／驗證／重設密碼／改密碼）共用的深色表單語彙。
 *
 * <p>
 * 值取自 `mockup/Rounded Design/member.dc.html`。抽成共用檔的理由很實際：
 * 這些畫面是同一段流程的不同階段，使用者會在幾分鐘內連續看到它們，
 * 欄位高度或卡片圓角差一點都會被看出來。
 * </p>
 */
export const MEMBER_LABEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  font: "500 13px/1.2 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'rgba(255,255,255,0.66)',
};

export const MEMBER_FIELD: CSSProperties = {
  height: 44,
  padding: '0 14px',
  background: '#0d0d18',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12,
  color: '#ffffff',
  font: "400 15px/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
  outlineColor: '#6436ef',
};

/** 表單所在的深色卡片。 */
export function MemberCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: '#14141f',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 22,
        padding: 'clamp(28px, 3vw, 40px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * 成功／失敗的提示條。<b>錯誤用 <c>role="alert"</c>、成功用 <c>role="status"</c></b>——
 * 對讀螢幕的人來說，「送出失敗」必須立刻打斷，「已寄出」則不該。
 */
export function MemberNotice({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const error = tone === 'error';

  return (
    <p
      role={error ? 'alert' : 'status'}
      style={{
        margin: '0 0 18px',
        padding: '12px 14px',
        borderRadius: 12,
        border: `1px solid ${error ? 'rgba(255,138,138,0.4)' : 'rgba(138,255,176,0.35)'}`,
        background: error ? 'rgba(255,138,138,0.08)' : 'rgba(138,255,176,0.07)',
        font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
        color: error ? '#ff8a8a' : '#8affb0',
      }}
    >
      {children}
    </p>
  );
}
