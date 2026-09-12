'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { LOCALES, LOCALE_SHORT_LABELS, switchLocalePath, type Locale } from '@/lib/locale';

/**
 * 頁首的互動層。**樣式值逐字取自 `Header.dc.html`**（sticky 84px、#0a0a12、
 * pill 導覽、mega menu、搜尋面板、聯絡 dialog）；hover 由 globals.css 的 `.vr-*` 提供，
 * 因為 mockup 的 `style-hover` 是它自己的執行期功能，React 沒有對應寫法。
 */
export type HeaderModel = {
  locale: Locale;
  homeHref: string;
  contactHref: string;
  memberHref: string;
  privacyHref: string;
  contactLabel: string;
  memberLabel: string;
  searchLabel: string;
  languageLabel: string;
  items: {
    key: string;
    label: string;
    href: string;
    menuTitle?: string;
    children?: { label: string; note: string; href: string }[];
  }[];
  search: {
    placeholder: string;
    submit: string;
    frequent: string;
    chips: { label: string; href: string }[];
  };
  dialog: {
    eyebrow: string;
    title: string;
    name: string;
    namePlaceholder: string;
    company: string;
    companyPlaceholder: string;
    email: string;
    emailPlaceholder: string;
    productLine: string;
    /** 送出的是 slug（後端據此連到 Categories）；「其他」的 slug 為空字串。 */
    productLines: { slug: string; label: string }[];
    application: string;
    applicationPlaceholder: string;
    targetSpec: string;
    targetSpecPlaceholder: string;
    consent: string;
    consentLink: string;
    consentSuffix: string;
    submit: string;
    sending: string;
    sentTitle: string;
    sentBody: string;
    reference: string;
    failed: string;
    close: string;
  };
  searchHref: string;
};

const MEGA_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: '#0a0a12',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 16px 48px rgba(10,10,18,0.55)',
};

const PANEL_INNER: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '28px clamp(24px, 5vw, 80px) 32px',
};

const EYEBROW: React.CSSProperties = {
  font: "600 12px/1.2 'Geologica', sans-serif",
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#a184f5',
};

export function HeaderClient({ model }: { model: HeaderModel }) {
  const pathname = usePathname() ?? model.homeHref;
  const router = useRouter();

  const [menu, setMenu] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // PageCTA / 其他區塊用 `vicround:contact` 事件叫出這個 dialog（同 mockup）
  useEffect(() => {
    const open = () => {
      setDialogOpen(true);
    };
    window.addEventListener('vicround:contact', open);
    return () => window.removeEventListener('vicround:contact', open);
  }, []);

  // 觸控裝置沒有 hover：第一次點開選單、第二次才導航（mockup 的 canHover 判斷）
  const canHover = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(hover: hover)').matches;

  const openItem = model.items.find((item) => item.key === menu && item.children);

  return (
    <>
      <header
        onMouseLeave={() => setMenu(null)}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: '#0a0a12',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          fontFamily: "'Geologica', 'GenYoGothic TW', 'Noto Sans TC', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 clamp(24px, 5vw, 80px)',
            height: 84,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Link
            href={model.homeHref}
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flex: '0 0 auto' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 品牌 wordmark 是固定尺寸的本地資產，next/image 的優化在本站是關閉的 */}
            <img
              src="/brand/vicround-wordmark-white.png"
              alt="VICROUND"
              style={{ height: 28, display: 'block' }}
            />
          </Link>

          <nav style={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {model.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const isOpen = menu === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="vr-nav-link"
                  data-active={isActive || isOpen}
                  onMouseEnter={() => {
                    if (item.children && canHover()) {
                      setMenu(item.key);
                      setSearch(false);
                    }
                  }}
                  onFocus={() => {
                    if (item.children && canHover()) setMenu(item.key);
                  }}
                  onClick={(event) => {
                    if (item.children && !canHover() && menu !== item.key) {
                      event.preventDefault();
                      setMenu(item.key);
                      setSearch(false);
                      return;
                    }
                    setMenu(null);
                    setSearch(false);
                  }}
                >
                  {item.label}
                  {item.children && (
                    <span
                      style={{
                        fontSize: 10,
                        lineHeight: 1,
                        color: isOpen ? '#a184f5' : 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {isOpen ? '▴' : '▾'}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto' }}>
            <button
              type="button"
              aria-label={model.searchLabel}
              title={model.searchLabel}
              className="vr-icon-btn"
              onClick={() => {
                setSearch(!search);
                setMenu(null);
              }}
            >
              <Icon name={search ? 'x' : 'search'} size={18} />
            </button>

            <Link
              href={model.memberHref}
              aria-label={model.memberLabel}
              title={model.memberLabel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                textDecoration: 'none',
                color: pathname.startsWith(model.memberHref) ? '#ffffff' : 'rgba(255,255,255,0.65)',
              }}
            >
              <Icon name="circle-user-round" size={22} />
            </Link>

            {/*
              mockup 用的是 <select>（EN / 中文）。保留這個外觀，但真的會切換路由。
              語系探索仍靠 <head> 的 hreflang alternates，不依賴這個控制項。
            */}
            <select
              aria-label={model.languageLabel}
              value={model.locale}
              onChange={(event) => router.push(switchLocalePath(pathname, event.target.value as Locale))}
              style={{
                border: 'none',
                background: 'transparent',
                font: "600 14px/1 'Geologica', sans-serif",
                color: 'rgba(255,255,255,0.72)',
                cursor: 'pointer',
              }}
            >
              {LOCALES.map((locale) => (
                <option key={locale} value={locale} style={{ color: '#14141f' }}>
                  {LOCALE_SHORT_LABELS[locale]}
                </option>
              ))}
            </select>

            <Link href={model.contactHref} className="vr-cta">
              {model.contactLabel}
            </Link>
          </div>
        </div>

        {search && (
          <div style={MEGA_STYLE}>
            <div style={PANEL_INNER}>
              <p style={{ ...EYEBROW, margin: '0 0 16px' }}>{model.searchLabel}</p>
              {/* 送出導向 /{locale}/search?q= —— 結果頁是可分享、可加書籤的網址，
                  而不是只存在於這個面板裡的狀態。 */}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const query = new FormData(event.currentTarget).get('q')?.toString().trim() ?? '';

                  if (query.length === 0) {
                    return;
                  }

                  setSearch(false);
                  router.push(`${model.searchHref}?q=${encodeURIComponent(query)}`);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <input
                  type="search"
                  name="q"
                  autoFocus
                  placeholder={model.search.placeholder}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: 52,
                    padding: '0 20px',
                    background: '#0d0d18',
                    border: '1px solid rgba(255,255,255,0.16)',
                    color: '#ffffff',
                    font: "400 16px/1.4 Geologica, 'GenYoGothic TW', sans-serif",
                    outlineColor: '#6436ef',
                    borderRadius: 999,
                  }}
                />
                <button
                  type="submit"
                  style={{
                    flex: '0 0 auto',
                    height: 52,
                    padding: '0 28px',
                    background: '#6436ef',
                    color: '#ffffff',
                    font: "600 15px/1 Geologica, sans-serif",
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 999,
                  }}
                >
                  {model.search.submit}
                </button>
              </form>
              <p
                style={{
                  margin: '20px 0 10px',
                  font: "500 12px/1.4 'IBM Plex Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                {model.search.frequent}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {model.search.chips.map((chip) => (
                  <Link key={chip.href} href={chip.href} className="vr-chip">
                    {chip.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {openItem && (
          <div style={MEGA_STYLE}>
            <div style={PANEL_INNER}>
              <p style={{ ...EYEBROW, margin: '0 0 20px' }}>{openItem.menuTitle}</p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '4px 20px',
                }}
              >
                {openItem.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="vr-mega-link"
                    onClick={() => setMenu(null)}
                  >
                    <span
                      style={{
                        display: 'block',
                        font: "600 0.9375rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: '#ffffff',
                      }}
                    >
                      {child.label}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        marginTop: 4,
                        font: "400 0.8125rem/1.45 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {child.note}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {dialogOpen && <ContactDialog model={model} onClose={() => setDialogOpen(false)} />}
    </>
  );
}

const LABEL: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  font: "500 13px/1.2 Geologica, 'GenYoGothic TW', sans-serif",
  color: 'rgba(255,255,255,0.66)',
};

const FIELD: React.CSSProperties = {
  height: 44,
  padding: '0 14px',
  background: '#0d0d18',
  border: '1px solid rgba(255,255,255,0.14)',
  color: '#ffffff',
  font: '400 15px/1.4 Geologica, sans-serif',
  outlineColor: '#6436ef',
  borderRadius: 12,
};

/**
 * 聯絡表單 dialog（Header.dc.html 的下半段）。
 *
 * <p>
 * 送出與 `/contact` 頁的表單走同一條路：同源的 `/api/contact` → Content API 的
 * `POST /v1/contact`。兩邊送的欄位也一致（產品線送 slug、帶 `sourceUrl` 與 `culture`、
 * 附蜜罐欄位），因此後端看到的是同一種詢問單，只是入口不同。
 * </p>
 */
function ContactDialog({ model, onClose }: { model: HeaderModel; onClose: () => void }) {
  const d = model.dialog;
  const [reference, setReference] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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
          culture: model.locale,
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={d.eyebrow}
      onClick={onClose}
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
            <p style={{ ...EYEBROW, margin: 0 }}>{d.eyebrow}</p>
            <h3
              style={{
                margin: '10px 0 0',
                font: "400 1.75rem/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
                color: '#ffffff',
              }}
            >
              {d.title}
            </h3>
          </div>
          <button
            type="button"
            aria-label={d.close}
            onClick={onClose}
            className="vr-icon-btn"
            style={{ fontSize: 16 }}
          >
            ✕
          </button>
        </div>

        {reference ? (
          <div
            style={{
              marginTop: 28,
              padding: '32px 24px',
              textAlign: 'center',
              border: '1px solid rgba(161,132,245,0.35)',
              background: 'rgba(100,54,239,0.1)',
            }}
          >
            <p
              style={{
                margin: 0,
                font: "500 1.125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                color: '#ffffff',
              }}
            >
              {d.sentTitle}
            </p>
            <p
              style={{
                margin: '8px 0 0',
                font: "400 0.9375rem/1.5 'Geologica', sans-serif",
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {d.sentBody}
            </p>
            <p
              style={{
                margin: '18px 0 0',
                font: "500 12px/1.2 'Geologica', sans-serif",
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {d.reference}
            </p>
            <p
              style={{
                margin: '6px 0 0',
                font: "600 1.25rem/1.2 'IBM Plex Mono', monospace",
                color: '#a184f5',
              }}
            >
              {reference}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {/* 蜜罐：版面上看不見，真人不會填到（ContactForm 同一招） */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />
            <div
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
              }}
            >
              <label style={LABEL}>
                {d.name}
                <input type="text" name="name" required placeholder={d.namePlaceholder} style={FIELD} />
              </label>
              <label style={LABEL}>
                {d.company}
                <input type="text" name="company" required placeholder={d.companyPlaceholder} style={FIELD} />
              </label>
              <label style={LABEL}>
                {d.email}
                <input type="email" name="email" required placeholder={d.emailPlaceholder} style={FIELD} />
              </label>
              <label style={LABEL}>
                {d.productLine}
                <select name="categorySlug" style={FIELD} defaultValue="">
                  {d.productLines.map((line) => (
                    <option key={line.slug || 'other'} value={line.slug}>
                      {line.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={LABEL}>
                {d.application}
                <input type="text" name="application" placeholder={d.applicationPlaceholder} style={FIELD} />
              </label>
              <label style={LABEL}>
                {d.targetSpec}
                <input type="text" name="targetSpec" placeholder={d.targetSpecPlaceholder} style={FIELD} />
              </label>
            </div>

            <label
              style={{
                marginTop: 18,
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
                {d.consent}{' '}
                <Link href={model.privacyHref} style={{ color: '#a184f5', fontWeight: 600 }}>
                  {d.consentLink}
                </Link>
                {d.consentSuffix}
              </span>
            </label>

            {failed && (
              <p
                role="alert"
                style={{
                  margin: '16px 0 0',
                  font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: '#ff9a9a',
                }}
              >
                {d.failed}
              </p>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={sending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  height: 48,
                  padding: '0 26px',
                  background: '#6436ef',
                  color: '#ffffff',
                  font: "600 15px/1 Geologica, sans-serif",
                  border: 'none',
                  cursor: sending ? 'progress' : 'pointer',
                  opacity: sending ? 0.6 : 1,
                  borderRadius: 999,
                }}
              >
                {sending ? d.sending : d.submit}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
