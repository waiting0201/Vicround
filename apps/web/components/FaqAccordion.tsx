'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * FAQ 分類軌 + 折疊清單 —— 逐項對照 `mockup/Rounded Design/faq.dc.html`。
 *
 * <p>
 * 互動（選分類、展開、全部展開）在 client；**問答內容本身由 server 渲染成 HTML**，
 * 所以爬蟲與 AI 引擎讀得到答案 —— 這一頁是 GEO 的重點，答案不能只存在 JS 裡。
 * 折疊只是視覺上的隱藏（`hidden` 屬性），不是條件式不渲染。
 * </p>
 */
export type FaqView = {
  id: string;
  category: string;
  question: string;
  answer: string;
  /** 延伸連結；API 沒有給對應實體時為 null，那一題就只顯示答案。 */
  href: string | null;
  linkLabel: string | null;
};

export function FaqAccordion({
  items,
  categories,
  labels,
}: {
  items: FaqView[];
  categories: { id: string; label: string }[];
  labels: { result: string; expandAll: string; collapseAll: string };
}) {
  const [category, setCategory] = useState('all');
  const [open, setOpen] = useState<string[]>([items[0]?.id].filter(Boolean) as string[]);
  const [allOpen, setAllOpen] = useState(false);

  const visible = items.filter((item) => category === 'all' || item.category === category);
  const isOpen = (id: string) => allOpen || open.includes(id);

  const count = (id: string) =>
    id === 'all' ? items.length : items.filter((item) => item.category === id).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        gap: 'clamp(28px, 4vw, 64px)',
        alignItems: 'start',
      }}
    >
      <nav
        style={{
          position: 'sticky',
          top: 104,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          borderLeft: '1px solid var(--page-border)',
        }}
      >
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className="vr-faq-cat"
            data-active={item.id === category}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
            <span style={{ font: "500 12px/1 'IBM Plex Mono', monospace", color: 'var(--page-faint)' }}>
              {count(item.id)}
            </span>
          </button>
        ))}
      </nav>

      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <p
            style={{
              margin: 0,
              font: "500 12px/1.4 'IBM Plex Mono', monospace",
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--page-faint)',
            }}
          >
            {labels.result.replace('{count}', String(visible.length))}
          </p>
          <button
            type="button"
            onClick={() => {
              setAllOpen(!allOpen);
              setOpen([]);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              font: "600 13px/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
              color: '#6436ef',
            }}
          >
            {allOpen ? labels.collapseAll : labels.expandAll}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--page-border)' }}>
          {visible.map((item) => (
            <div key={item.id} style={{ borderBottom: '1px solid var(--page-border)' }}>
              <button
                type="button"
                className="vr-faq-head"
                aria-expanded={isOpen(item.id)}
                onClick={() =>
                  setOpen((current) =>
                    current.includes(item.id)
                      ? current.filter((id) => id !== item.id)
                      : [...current, item.id],
                  )
                }
              >
                <span
                  style={{
                    font: "600 1.0625rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  style={{ font: "400 1.25rem/1 'Geologica', sans-serif", color: '#6436ef' }}
                >
                  {isOpen(item.id) ? '−' : '+'}
                </span>
              </button>

              {/* 收合時用 hidden 而不是不渲染 —— 答案要留在 HTML 裡給爬蟲與 AI 引擎 */}
              <div hidden={!isOpen(item.id)} style={{ padding: '0 0 24px' }}>
                {/*
                  編輯者在 CMS 用換行分段（來源 FAQ 有近七成是多段落）。HTML 會把
                  換行吃掉，所以在這裡拆成一段一個 <p>，而不是丟一坨文字給讀者。
                */}
                {item.answer
                  .split(/\n+/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      style={{
                        margin: index === 0 ? 0 : '14px 0 0',
                        font: "400 0.9375rem/1.75 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}
                {item.href && item.linkLabel ? (
                  <Link
                    href={item.href}
                    style={{
                      display: 'inline-flex',
                      marginTop: 16,
                      font: "600 13px/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: '#6436ef',
                      textDecoration: 'none',
                    }}
                  >
                    {item.linkLabel} →
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
