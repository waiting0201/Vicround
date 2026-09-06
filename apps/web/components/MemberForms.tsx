'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * 會員登入／註冊分頁 —— 逐項對照 `mockup/Rounded Design/member.dc.html`（深色頁）。
 *
 * <p>
 * ⚠️ **尚未接上** Account API：登入是 `POST /api/v1/account/login`，
 * 註冊是 `POST /api/v1/account/register`（註冊時後端會先比對 `BusinessDomainRules`，
 * 封鎖網域直接回 400 且不建帳號 —— 見 docs/cms-api.md）。
 * 會員 token 與後台 token 完全隔離，兩邊互不通用。
 * </p>
 */
export type MemberLabels = {
  tabs: { signIn: string; register: string };
  signIn: {
    email: string;
    password: string;
    remember: string;
    forgot: string;
    submit: string;
  };
  register: {
    name: string;
    company: string;
    email: string;
    role: string;
    roles: string[];
    password: string;
    confirm: string;
    consentBefore: string;
    consentLink: string;
    consentAfter: string;
    submit: string;
    note: string;
  };
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  font: "500 13px/1.2 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'rgba(255,255,255,0.66)',
};

const fieldStyle: React.CSSProperties = {
  height: 44,
  padding: '0 14px',
  background: '#0d0d18',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12,
  color: '#ffffff',
  font: "400 15px/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
  outlineColor: '#6436ef',
};

export function MemberForms({ labels, privacyHref }: { labels: MemberLabels; privacyHref: string }) {
  const [tab, setTab] = useState<'signIn' | 'register'>('signIn');

  return (
    <div
      style={{
        background: '#14141f',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 22,
        padding: 'clamp(28px, 3vw, 40px)',
      }}
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['signIn', 'register'] as const).map((id) => (
          <button
            key={id}
            type="button"
            className="vr-member-tab"
            data-active={tab === id}
            onClick={() => setTab(id)}
          >
            {labels.tabs[id]}
          </button>
        ))}
      </div>

      {tab === 'signIn' ? (
        <form
          onSubmit={(event) => event.preventDefault()}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <label style={labelStyle}>
            {labels.signIn.email}
            <input type="email" name="email" autoComplete="username" required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.signIn.password}
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              style={fieldStyle}
            />
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              <input type="checkbox" style={{ accentColor: '#6436ef', width: 16, height: 16 }} />
              {labels.signIn.remember}
            </label>
            <span
              style={{
                font: "600 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                color: '#a184f5',
              }}
            >
              {labels.signIn.forgot}
            </span>
          </div>

          <button type="submit" className="vr-btn" style={{ marginTop: 10 }}>
            {labels.signIn.submit}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      ) : (
        <form
          onSubmit={(event) => event.preventDefault()}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <label style={labelStyle}>
            {labels.register.name}
            <input type="text" required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.register.company}
            <input type="text" required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.register.email}
            <input type="email" required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.register.role}
            <select style={fieldStyle}>
              {labels.register.roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            {labels.register.password}
            <input type="password" autoComplete="new-password" required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.register.confirm}
            <input type="password" autoComplete="new-password" required style={fieldStyle} />
          </label>

          <label
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <input
              type="checkbox"
              required
              style={{ marginTop: 3, accentColor: '#6436ef', width: 16, height: 16 }}
            />
            <span>
              {labels.register.consentBefore}
              <Link href={privacyHref} style={{ color: '#a184f5', fontWeight: 600 }}>
                {labels.register.consentLink}
              </Link>
              {labels.register.consentAfter}
            </span>
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="vr-btn">
              {labels.register.submit}
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <p
            style={{
              gridColumn: '1 / -1',
              margin: 0,
              font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            {labels.register.note}
          </p>
        </form>
      )}
    </div>
  );
}
