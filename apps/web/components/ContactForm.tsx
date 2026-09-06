'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

/**
 * 詢問表單 —— 逐項對照 `mockup/Rounded Design/contact.dc.html`。
 *
 * <p>
 * ⚠️ **送出尚未接上** `POST /api/v1/contact`。接的時候要一併帶 `sourceUrl`、`culture`
 * 與 anti-bot token，成功後顯示後端回的 `referenceNumber`（docs/cms-api.md）——
 * 目前只做前端狀態切換，好讓版面與確認稿一致。
 * </p>
 */
export type ContactFormLabels = {
  title: string;
  lead: string;
  sentTitle: string;
  sentBody: string;
  name: string;
  company: string;
  email: string;
  productLine: string;
  productLines: string[];
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
}: {
  labels: ContactFormLabels;
  privacyHref: string;
}) {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO POST /api/v1/contact（帶 anti-bot token、sourceUrl、culture），成功後顯示 referenceNumber
    setSent(true);
  }

  if (sent) {
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
          <select name="productLine" style={fieldStyle}>
            {labels.productLines.map((line) => (
              <option key={line}>{line}</option>
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
        <button type="submit" className="vr-btn">
          {labels.submit}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
