'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AccountError,
  forgotPassword,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '@/lib/account-client';
import { MEMBER_FIELD, MEMBER_LABEL, MemberCard, MemberNotice } from './member-ui';

/**
 * 信件流程的三個畫面：忘記密碼、重設密碼、驗證信箱。
 *
 * <p>
 * 都在 `/member/**` 底下（深色），版型沿用 `MemberForms` 的卡片語彙。
 * 三頁的網址與 <b>後端寄出的信裡的連結一致</b>：`member/verify?token=` 與
 * `member/reset?token=`（見 Api/Services/IMemberNotifier.cs）——改這裡的路徑就要同時改那裡。
 * </p>
 */
type Heading = { title: string; lead?: string };

function Title({ title, lead }: Heading) {
  return (
    <>
      <h1
        style={{
          margin: 0,
          font: "400 1.5rem/1.25 'Geologica', 'GenYoGothic TW', sans-serif",
          color: '#ffffff',
        }}
      >
        {title}
      </h1>
      {lead && (
        <p
          style={{
            margin: '10px 0 24px',
            font: "400 0.9375rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {lead}
        </p>
      )}
    </>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <p style={{ margin: '20px 0 0' }}>
      <Link
        href={href}
        style={{
          font: "500 0.875rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
          color: '#a184f5',
        }}
      >
        {label}
      </Link>
    </p>
  );
}

export type ForgotLabels = {
  title: string;
  lead: string;
  email: string;
  submit: string;
  sent: string;
  back: string;
  failed: string;
};

/**
 * 忘記密碼。<b>成功與「查無此人」顯示同一句話</b>——後端一律回 202 就是為了不讓這一頁
 * 變成帳號探測器，前端如果把兩者分開顯示，那道防線就白做了。
 */
export function ForgotPasswordForm({ labels, signInHref }: { labels: ForgotLabels; signInHref: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') ?? '');

    setError(null);
    setBusy(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (caught) {
      setError(caught instanceof AccountError ? caught.message : labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <MemberCard>
      <Title title={labels.title} lead={labels.lead} />

      {error && <MemberNotice tone="error">{error}</MemberNotice>}

      {sent ? (
        <MemberNotice tone="success">{labels.sent}</MemberNotice>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={MEMBER_LABEL}>
            {labels.email}
            <input type="email" name="email" required autoComplete="email" style={MEMBER_FIELD} />
          </label>

          <button type="submit" className="vr-btn" style={{ marginTop: 6 }} disabled={busy}>
            {labels.submit}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      )}

      <BackLink href={signInHref} label={labels.back} />
    </MemberCard>
  );
}

export type ResetLabels = {
  title: string;
  lead: string;
  password: string;
  confirm: string;
  submit: string;
  done: string;
  mismatch: string;
  missingToken: string;
  failed: string;
  signIn: string;
};

/**
 * 用信裡的 token 設定新密碼。
 *
 * <p>
 * token 從網址的 query 讀，<b>不放進 state 以外的任何地方</b>；成功後不自動登入——
 * 後端在這一步撤銷了所有 refresh token，這一頁手上本來就沒有可用的工作階段。
 * </p>
 */
export function ResetPasswordForm({
  labels,
  token,
  signInHref,
  forgotHref,
}: {
  labels: ResetLabels;
  token: string | null;
  signInHref: string;
  forgotHref: string;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');

    setError(null);

    if (password !== String(form.get('confirm') ?? '')) {
      setError(labels.mismatch);
      return;
    }

    setBusy(true);

    try {
      await resetPassword(token!, password);
      setDone(true);
    } catch (caught) {
      setError(caught instanceof AccountError ? caught.message : labels.failed);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <MemberCard>
        <Title title={labels.title} />
        <MemberNotice tone="error">{labels.missingToken}</MemberNotice>
        <BackLink href={forgotHref} label={labels.signIn} />
      </MemberCard>
    );
  }

  return (
    <MemberCard>
      <Title title={labels.title} lead={labels.lead} />

      {error && <MemberNotice tone="error">{error}</MemberNotice>}

      {done ? (
        <>
          <MemberNotice tone="success">{labels.done}</MemberNotice>
          <BackLink href={signInHref} label={labels.signIn} />
        </>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={MEMBER_LABEL}>
            {labels.password}
            <input
              type="password"
              name="password"
              required
              minLength={12}
              autoComplete="new-password"
              style={MEMBER_FIELD}
            />
          </label>

          <label style={MEMBER_LABEL}>
            {labels.confirm}
            <input
              type="password"
              name="confirm"
              required
              minLength={12}
              autoComplete="new-password"
              style={MEMBER_FIELD}
            />
          </label>

          <button type="submit" className="vr-btn" style={{ marginTop: 6 }} disabled={busy}>
            {labels.submit}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      )}
    </MemberCard>
  );
}

export type VerifyLabels = {
  title: string;
  working: string;
  doneTitle: string;
  failedTitle: string;
  failedBody: string;
  missingToken: string;
  email: string;
  resend: string;
  resent: string;
  resendFailed: string;
  toAccount: string;
};

/**
 * 信箱驗證。使用者是從信件點進來的，所以<b>一進頁面就自動送出</b>，不要求他再按一次按鈕。
 *
 * <p>
 * 失敗時直接在同一頁提供「重寄」——連結過期是這一步最常見的失敗，
 * 把補救措施放在別的頁面只會讓人卡住。
 * </p>
 */
export function VerifyEmailScreen({
  labels,
  token,
  accountHref,
}: {
  labels: VerifyLabels;
  token: string | null;
  accountHref: string;
}) {
  const [state, setState] = useState<
    { kind: 'working' } | { kind: 'done'; message: string } | { kind: 'failed'; message: string }
  >(token ? { kind: 'working' } : { kind: 'failed', message: labels.missingToken });

  useEffect(() => {
    if (!token) {
      return;
    }

    let alive = true;

    verifyEmail(token).then(
      (result) => alive && setState({ kind: 'done', message: result.message }),
      (error: unknown) =>
        alive &&
        setState({
          kind: 'failed',
          message: error instanceof AccountError ? error.message : labels.failedBody,
        }),
    );

    return () => {
      alive = false;
    };
  }, [token, labels.failedBody]);

  return (
    <MemberCard>
      <Title title={state.kind === 'done' ? labels.doneTitle : labels.title} />

      {state.kind === 'working' && (
        <p
          style={{
            margin: 0,
            font: "400 0.9375rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'rgba(255,255,255,0.6)',
          }}
          aria-busy="true"
        >
          {labels.working}
        </p>
      )}

      {state.kind === 'done' && (
        <>
          <MemberNotice tone="success">{state.message}</MemberNotice>
          <BackLink href={accountHref} label={labels.toAccount} />
        </>
      )}

      {state.kind === 'failed' && (
        <>
          <MemberNotice tone="error">{state.message}</MemberNotice>
          <ResendVerification labels={labels} />
        </>
      )}
    </MemberCard>
  );
}

function ResendVerification({ labels }: { labels: VerifyLabels }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email') ?? '');

    setError(null);
    setBusy(true);

    try {
      await resendVerification(email);
      setSent(true);
    } catch (caught) {
      setError(caught instanceof AccountError ? caught.message : labels.resendFailed);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <MemberNotice tone="success">{labels.resent}</MemberNotice>;
  }

  return (
    <>
      <p
        style={{
          margin: '0 0 16px',
          font: "400 0.875rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        {labels.failedBody}
      </p>

      {error && <MemberNotice tone="error">{error}</MemberNotice>}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={MEMBER_LABEL}>
          {labels.email}
          <input type="email" name="email" required autoComplete="email" style={MEMBER_FIELD} />
        </label>

        <button type="submit" className="vr-btn" style={{ marginTop: 6 }} disabled={busy}>
          {labels.resend}
          <span aria-hidden="true">→</span>
        </button>
      </form>
    </>
  );
}
