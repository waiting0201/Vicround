'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

/**
 * 詢問表單 —— 逐項對照 `mockup/Rounded Design/contact.dc.html`。
 *
 * <p>
 * 送出走同源的 `/api/contact`（它再轉給 Content API），成功後顯示後端回的受理編號。
 * 產品線下拉送的是 **slug**，不是顯示名稱 —— 後端據此連到 `Categories`，
 * 查不到會回 400 而不是靜默存 null（docs/cms-api.md）。
 * </p>
 */
export type ContactCategory = { slug: string; name: string };

export type ContactFormLabels = {
  title: string;
  lead: string;
  sentTitle: string;
  sentBody: string;
  reference: string;
  failed: string;
  name: string;
  company: string;
  email: string;
  productLine: string;
  application: string;
  targetSpec: string;
  consentBefore: string;
  consentLink: string;
  consentAfter: string;
  responseTime: string;
  submit: string;
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  font: "500 13px/1.2 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-muted)',
};

const fieldStyle: React.CSSProperties = {
  height: 44,
  padding: '0 14px',
  background: 'var(--page-bg)',
  border: '1px solid var(--page-border)',
  borderRadius: 12,
  color: 'var(--page-fg)',
  font: "400 15px/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
  outlineColor: '#6436ef',
};

export function ContactForm({
  labels,
  privacyHref,
  categories,
  culture,
}: {
  labels: ContactFormLabels;
  privacyHref: string;
  categories: ContactCategory[];
  culture: string;
}) {
  const [reference, setReference] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailed(false);
    setSending(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          company: form.get('company'),
          email: form.get('email'),
          categorySlug: form.get('categorySlug') || undefined,
          application: form.get('application') || undefined,
          targetSpec: form.get('targetSpec') || undefined,
          sourceUrl: window.location.href,
          culture,
          consent: form.get('consent') === 'on',
          // 蜜罐：真人看不到這個欄位，有值就是機器人（後端會擋下）
          website: form.get('website') || undefined,
        }),
      });

      const body = (await response.json()) as { success: boolean; data?: { referenceNumber?: string } };

      if (response.ok && body.success && body.data?.referenceNumber) {
        setReference(body.data.referenceNumber);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  if (reference) {
    return (
      <div
        style={{
          border: '1px solid rgba(100,54,239,0.35)',
          background: 'rgba(100,54,239,0.06)',
          borderRadius: 22,
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            font: "500 1.125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'var(--page-fg)',
          }}
        >
          {labels.sentTitle}
        </p>
        <p
          style={{
            margin: '8px 0 0',
            font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'var(--page-muted)',
          }}
        >
          {labels.sentBody}
        </p>
        <p
          style={{
            margin: '18px 0 0',
            font: "500 0.875rem/1.5 'IBM Plex Mono', monospace",
            color: '#6436ef',
          }}
        >
          {labels.reference}：{reference}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        border: '1px solid var(--page-border)',
        borderRadius: 22,
        padding: 'clamp(28px, 3vw, 40px)',
      }}
    >
      <h2
        style={{
          margin: 0,
          font: "500 1.5rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
          color: 'var(--page-fg)',
        }}
      >
        {labels.title}
      </h2>
      <p
        style={{
          margin: '12px 0 0',
          font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
          color: 'var(--page-muted)',
        }}
      >
        {labels.lead}
      </p>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <label style={labelStyle}>
          {labels.name}
          <input type="text" name="name" required style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          {labels.company}
          <input type="text" name="company" required style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          {labels.email}
          <input type="email" name="email" required style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          {labels.productLine}
          <select name="categorySlug" style={fieldStyle} defaultValue="">
            <option value="" />
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          {labels.application}
          <input type="text" name="application" style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          {labels.targetSpec}
          <input type="text" name="targetSpec" style={fieldStyle} />
        </label>
      </div>

      {/* 蜜罐：藏起來，真人不會填到 */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      <label
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
          color: 'var(--page-muted)',
        }}
      >
        <input
          type="checkbox"
          name="consent"
          required
          style={{ marginTop: 3, accentColor: '#6436ef', width: 16, height: 16 }}
        />
        <span>
          {labels.consentBefore}
          <Link href={privacyHref} style={{ color: '#6436ef', fontWeight: 600 }}>
            {labels.consentLink}
          </Link>
          {labels.consentAfter}
        </span>
      </label>

      {failed ? (
        <p
          style={{
            margin: '16px 0 0',
            font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
            color: '#d93a2f',
          }}
          role="alert"
        >
          {labels.failed}
        </p>
      ) : null}

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ font: "400 12px/1.5 'IBM Plex Mono', monospace", color: 'var(--page-faint)' }}>
          {labels.responseTime}
        </span>
        <button type="submit" className="vr-btn" disabled={sending}>
          {labels.submit}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
