'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * 認證明細彈窗 —— 逐項對照 `mockup/Rounded Design/CertificationDialog.dc.html`。
 *
 * <p>
 * 與聯絡表單同一個模式：任何地方都能用事件叫出來
 * `window.dispatchEvent(new CustomEvent('vicround:certification', { detail: { id } }))`，
 * 全站只有一份彈窗。首頁的認證 chip 與 About／Sustainability 的認證列都是這樣開的。
 * </p>
 */
export type CertificationView = {
  id: string;
  category: string;
  title: string;
  summary: string;
  issuer: string;
  validity: string;
  scope: string;
  sites: string;
  todo?: boolean;
};

export type DialogLabels = {
  issuer: string;
  validity: string;
  scope: string;
  sites: string;
  placeholder: string;
  cta: string;
  close: string;
};

export function CertificationDialog({
  certifications,
  labels,
  contactHref,
}: {
  certifications: CertificationView[];
  labels: DialogLabels;
  contactHref: string;
}) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const open = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id && certifications.some((c) => c.id === detail.id)) setId(detail.id);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setId(null);
    };
    window.addEventListener('vicround:certification', open);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('vicround:certification', open);
      window.removeEventListener('keydown', key);
    };
  }, [certifications]);

  const cert = certifications.find((c) => c.id === id);
  if (!cert) return null;

  // 尚未提供的欄位用較淡的顏色，讓「還沒填」在畫面上看得出來（同 mockup）
  const pending = (value: string) => value.startsWith('[');
  const rows = [
    { label: labels.issuer, value: cert.issuer },
    { label: labels.validity, value: cert.validity },
    { label: labels.scope, value: cert.scope },
    { label: labels.sites, value: cert.sites },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={cert.title}
      onClick={() => setId(null)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(5,5,10,0.68)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Geologica', 'GenYoGothic TW', 'Noto Sans TC', system-ui, sans-serif",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflow: 'auto',
          background: '#14141f',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: 32,
          borderRadius: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p
              style={{
                margin: 0,
                font: "600 12px/1.2 'Geologica', sans-serif",
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#a184f5',
              }}
            >
              {cert.category}
            </p>
            <h3
              style={{
                margin: '10px 0 0',
                font: "400 1.75rem/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
                color: '#ffffff',
              }}
            >
              {cert.title}
            </h3>
          </div>
          <button
            type="button"
            aria-label={labels.close}
            onClick={() => setId(null)}
            className="vr-icon-btn"
            style={{ flex: '0 0 auto', fontSize: 16 }}
          >
            ✕
          </button>
        </div>

        <p
          style={{
            margin: '20px 0 0',
            font: "400 1rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {cert.summary}
        </p>

        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {rows.map((row) => (
            <div key={row.label} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
              <p
                style={{
                  margin: 0,
                  font: "500 11px/1.4 'IBM Plex Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {row.label}
              </p>
              <p
                style={{
                  margin: '8px 0 0',
                  font: "400 0.9375rem/1.55 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: pending(row.value) ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.82)',
                }}
              >
                {row.value || '—'}
              </p>
            </div>
          ))}
        </div>

        {cert.todo && (
          <p
            style={{
              margin: '24px 0 0',
              padding: '14px 16px',
              border: '1px dashed rgba(161,132,245,0.5)',
              borderRadius: 14,
              font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            {labels.placeholder}
          </p>
        )}

        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            href={contactHref}
            onClick={() => setId(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              height: 48,
              padding: '0 26px',
              background: '#6436ef',
              color: '#ffffff',
              font: "600 15px/1 Geologica, sans-serif",
              textDecoration: 'none',
              borderRadius: 999,
            }}
          >
            {labels.cta}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 開啟彈窗的按鈕。
 *
 * <p>
 * 兩種外觀，對應 mockup 的兩處用法：`chip` 是首頁信任牆那排膠囊，
 * `card` 是 Sustainability 的「認證與標準」四張卡。行為相同。
 * </p>
 */
export function CertChip({
  id,
  label,
  description,
  action,
  pending,
  variant = 'chip',
}: {
  id: string;
  label: string;
  description?: string;
  /** 卡片底部的動作字樣（「查看詳情 →」／「待提供」）。 */
  action?: string;
  /** 這一張還沒有內容 —— 邊框改虛線、字色轉淡（同 mockup）。 */
  pending?: boolean;
  variant?: 'chip' | 'card';
}) {
  const open = () =>
    window.dispatchEvent(new CustomEvent('vicround:certification', { detail: { id } }));

  if (variant === 'card') {
    return (
      <button
        type="button"
        className="vr-cert-card"
        data-pending={pending ? 'true' : undefined}
        onClick={open}
      >
        <span
          style={{
            font: "700 1rem/1.3 'IBM Plex Mono', monospace",
            color: pending ? 'var(--page-faint)' : 'var(--page-fg)',
          }}
        >
          {label}
        </span>
        {description && (
          <span
            style={{
              display: 'block',
              marginTop: 10,
              font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'var(--page-muted)',
            }}
          >
            {description}
          </span>
        )}
        {action && (
          <span
            style={{
              display: 'block',
              marginTop: 16,
              font: "600 13px/1.4 'Geologica', sans-serif",
              color: pending ? 'var(--page-faint)' : '#a184f5',
            }}
          >
            {action}
          </span>
        )}
      </button>
    );
  }

  return (
    <button type="button" className="vr-cert-chip" onClick={open}>
      {label}
    </button>
  );
}
