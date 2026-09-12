import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { Container } from '@/components/sections';
import { getSearch } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { ROUTES } from '@/lib/routes';
import { pageMetadata } from '@/lib/seo';

/**
 * 站內搜尋結果 —— 確認稿沒有這一頁（Header 只有搜尋面板），所以版型不自創第二套視覺，
 * 沿用其他淺色內頁的 Container 與卡片語彙。
 *
 * <p>
 * 關鍵字走網址（`?q=`）而不是元件狀態：結果頁要能被複製、加書籤、從信件點進來。
 * 搜尋框本身是原生的 GET form，沒有 JavaScript 也能用。
 * </p>
 *
 * <p>
 * <b>一律 noindex</b>：站內搜尋結果頁是無限多個近乎重複的網址，被索引只會稀釋
 * 真正該被索引的那 118 頁（docs/sitemap.md）。
 * </p>
 */
type Params = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  return pageMetadata({
    locale,
    path: ROUTES.search,
    title: t('search.pageTitle'),
    description: t('search.pageDescription'),
    noIndex: true,
  });
}

export default async function SearchPage({ params, searchParams }: Params) {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);

  const query = (await searchParams).q?.trim() ?? '';
  const response = query.length >= 2 ? await getSearch(locale, query) : null;
  const results = response?.results ?? [];

  return (
    <PageShell tone="light">
      <Container style={{ padding: 'clamp(48px, 7vw, 96px) clamp(24px, 5vw, 80px) clamp(64px, 8vw, 112px)' }}>
        <p
          style={{
            margin: 0,
            font: "600 12px/1.2 'Geologica', sans-serif",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#6436ef',
          }}
        >
          {t('search.label')}
        </p>

        <h1
          style={{
            margin: '12px 0 28px',
            font: "400 clamp(2rem, 4vw, 2.75rem)/1.12 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'var(--page-fg)',
          }}
        >
          {t('search.pageTitle')}
        </h1>

        {/* 原生 GET form：送出就是換一個網址，不需要任何 client 端程式碼 */}
        <form
          action={localeHref(locale, ROUTES.search)}
          method="get"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, maxWidth: 720 }}
        >
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={t('search.placeholder')}
            aria-label={t('search.label')}
            style={{
              flex: '1 1 280px',
              minWidth: 0,
              height: 52,
              padding: '0 20px',
              background: 'var(--page-bg)',
              border: '1px solid var(--page-border)',
              borderRadius: 999,
              color: 'var(--page-fg)',
              font: "400 16px/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
              outlineColor: '#6436ef',
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
            {t('search.submit')}
          </button>
        </form>

        <div style={{ marginTop: 36 }}>
          {query.length < 2 ? (
            <Hint text={t('search.promptBody')} />
          ) : results.length === 0 ? (
            <>
              <h2
                style={{
                  margin: '0 0 8px',
                  font: "500 1.25rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-fg)',
                }}
              >
                {t('search.emptyTitle')}
              </h2>
              <Hint text={t('search.emptyBody')} />
            </>
          ) : (
            <>
              <p
                style={{
                  margin: '0 0 20px',
                  font: "500 13px/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-muted)',
                }}
              >
                {response?.total} {t('search.resultsLabel')}
              </p>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
                {results.map((result) => (
                  <li key={`${result.kind}:${result.path}`}>
                    <Link
                      href={href(locale, result.path)}
                      className="vr-card-link"
                      style={{ padding: '22px 26px', borderRadius: 18 }}
                    >
                      <span
                        style={{
                          font: "600 11px/1.2 'Geologica', sans-serif",
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#6436ef',
                        }}
                      >
                        {t(`search.kinds.${result.kind}`)}
                      </span>
                      <p
                        style={{
                          margin: '10px 0 0',
                          font: "500 1.0625rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
                          color: 'var(--page-fg)',
                        }}
                      >
                        {result.title}
                      </p>
                      {result.summary && (
                        <p
                          style={{
                            margin: '8px 0 0',
                            font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                            color: 'var(--page-muted)',
                          }}
                        >
                          {result.summary}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {response?.hasMore && <Hint text={t('search.moreHint')} style={{ marginTop: 20 }} />}
            </>
          )}
        </div>
      </Container>
    </PageShell>
  );
}

/**
 * 首頁的公開路徑是 `/`，直接接在語系後面會變成 `/en/`（多一個斜線）。
 * 其餘路徑原樣交給 `localeHref`。
 */
function href(locale: ReturnType<typeof requireLocale>, path: string) {
  return localeHref(locale, path === '/' ? '' : path);
}

function Hint({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        margin: 0,
        maxWidth: 620,
        font: "400 0.9375rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
        color: 'var(--page-muted)',
        ...style,
      }}
    >
      {text}
    </p>
  );
}
