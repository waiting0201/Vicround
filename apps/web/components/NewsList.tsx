'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * News 列表與分類篩選 —— 逐項對照 `mockup/Rounded Design/news.dc.html`。
 *
 * <p>
 * 篩選走 client state 而**不是網址參數**：分類不是可索引的維度（docs/sitemap.md
 * ——「篩選一律不產生可索引 URL」），只有文章本身有自己的網址。
 * </p>
 */
export type NewsView = {
  slug: string;
  /** 機器可讀（`<time dateTime>`）。 */
  date: string;
  /** 依語系格式化後的日期，畫面上顯示的是這一個。 */
  dateLabel: string;
  category: string;
  categoryLabel: string;
  title: string;
  excerpt: string;
  href: string;
};

export function NewsList({
  items,
  categories,
  readMore,
}: {
  items: NewsView[];
  categories: { id: string; label: string }[];
  readMore: string;
}) {
  const [category, setCategory] = useState('all');
  const visible = items.filter((item) => category === 'all' || item.category === category);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 36 }}>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            className="vr-filter-chip"
            data-active={item.id === category}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 16, marginTop: 32 }}>
        {visible.map((item) => (
          <Link key={item.slug} href={item.href} className="vr-news-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <time
                dateTime={item.date}
                style={{ font: "400 0.8125rem/1.4 'IBM Plex Mono', monospace", color: 'var(--page-faint)' }}
              >
                {item.dateLabel}
              </time>
              <span
                style={{
                  borderRadius: 999,
                  padding: '4px 10px',
                  background: 'rgba(100,54,239,0.1)',
                  font: "500 11px/1.4 'IBM Plex Mono', monospace",
                  textTransform: 'uppercase',
                  color: '#6436ef',
                }}
              >
                {item.categoryLabel}
              </span>
            </div>
            <span
              style={{
                font: "600 1.125rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {item.title}
            </span>
            <span
              style={{
                font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-muted)',
              }}
            >
              {item.excerpt}
            </span>
            <span style={{ font: "600 13px/1.4 'Geologica', sans-serif", color: '#6436ef' }}>{readMore}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
