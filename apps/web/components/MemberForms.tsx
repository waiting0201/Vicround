'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountError, register as apiRegister, signIn as apiSignIn } from '@/lib/account-client';

/**
 * 會員登入／註冊分頁 —— 逐項對照 `mockup/Rounded Design/member.dc.html`（深色頁）。
 *
 * <p>
 * 送出走同源的 `/api/v1/account/**`（`app/api/v1/account/[...path]`）：登入是
 * `POST …/login`，註冊是 `POST …/register`（後端會先比對 `BusinessDomainRules`，
 * 封鎖網域直接回 400 且不建帳號 —— 見 docs/cms-api.md）。
 * 會員 token 與後台 token 完全隔離，兩邊互不通用。
 * </p>
 *
 * <p>
 * <b>註冊成功不會自動登入</b>：帳號這時還是 `PendingEmailVerification`，
 * 直接把人丟進會員專區只會看到一頁「請去收信」。所以留在原地顯示後端回的那句話。
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

/**
 * 職務下拉的後端列舉值，順序必須與 `messages.member.register.roles` 一致
 * （後端是 `MemberEnumNames.ParseJobRole`）。兩邊都是五個選項，改一邊就要改另一邊。
 */
export const MEMBER_ROLE_VALUES = [
  'engineeringRnd',
  'procurement',
  'productManagement',
  'quality',
  'other',
];

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

export function MemberForms({
  labels,
  privacyHref,
  locale,
  accountHref,
  roleValues,
}: {
  labels: MemberLabels;
  privacyHref: string;
  locale: string;
  accountHref: string;
  /** 與 `labels.register.roles` 同順序的後端列舉值。 */
  roleValues: string[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'signIn' | 'register'>('signIn');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function reset() {
    setError(null);
    setDone(null);
  }

  async function onSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    reset();
    setBusy(true);

    try {
      await apiSignIn(String(form.get('email') ?? ''), String(form.get('password') ?? ''));
      router.push(accountHref);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof AccountError ? caught.message : '登入失敗，請稍後再試。');
      setBusy(false);
    }
  }

  async function onRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    reset();

    const password = String(form.get('password') ?? '');

    // 兩次密碼不一致就不必送出——這是純前端的一致性檢查，後端只認一個 password 欄位。
    if (password !== String(form.get('confirm') ?? '')) {
      setError(labels.register.confirm);
      return;
    }

    setBusy(true);

    try {
      const result = await apiRegister({
        email: String(form.get('email') ?? ''),
        password,
        fullName: String(form.get('fullName') ?? ''),
        companyName: String(form.get('companyName') ?? ''),
        jobRole: String(form.get('jobRole') ?? ''),
        phone: String(form.get('phone') ?? '') || undefined,
        consent: form.get('consent') === 'on',
        culture: locale,
      });

      setDone(result.message);
    } catch (caught) {
      setError(caught instanceof AccountError ? caught.message : '註冊失敗，請稍後再試。');
    } finally {
      setBusy(false);
    }
  }

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
            onClick={() => {
              setTab(id);
              reset();
            }}
          >
            {labels.tabs[id]}
          </button>
        ))}
      </div>

      {(error || done) && (
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
          {error ?? done}
        </p>
      )}

      {tab === 'signIn' ? (
        <form onSubmit={onSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          <button type="submit" className="vr-btn" style={{ marginTop: 10 }} disabled={busy}>
            {labels.signIn.submit}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      ) : (
        <form onSubmit={onRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label style={labelStyle}>
            {labels.register.name}
            <input type="text" name="fullName" autoComplete="name" required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.register.company}
            <input type="text" name="companyName" autoComplete="organization" required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.register.email}
            <input type="email" name="email" autoComplete="email" required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.register.role}
            <select name="jobRole" style={fieldStyle}>
              {labels.register.roles.map((role, index) => (
                <option key={role} value={roleValues[index] ?? 'other'}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            {labels.register.password}
            <input type="password" name="password" autoComplete="new-password" minLength={12} required style={fieldStyle} />
          </label>
          <label style={labelStyle}>
            {labels.register.confirm}
            <input type="password" name="confirm" autoComplete="new-password" minLength={12} required style={fieldStyle} />
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
              name="consent"
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
            <button type="submit" className="vr-btn" disabled={busy}>
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
