import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BlockSection, cardStyle, eyebrowStyle, sectionTitleStyle, SpecTable } from '@/components/blocks';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CertChip } from '@/components/CertificationDialog';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import { DownloadList } from '@/components/ResourceSections';
import { Container, ImageSlot } from '@/components/sections';
import { apiGet, tag } from '@/lib/api';
import type { Certification, Download, SpecificationRow } from '@/lib/content-api';
import { translator } from '@/lib/i18n';
import { requireLocale, type Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import { CATEGORY_TEXT_ACCENT, bannerImage, categoryImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema, productSchema, type ProductSchemaInput } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * 產品詳情。網址三段：`/products/{category}/{slug}`（docs/sitemap.md）。
 *
 * <p>
 * 這一頁是「產品線頁再深一層」，版型逐區塊沿用 `product-*.dc.html` 與 `PageBanner` 的語彙，
 * 對照 `mockup/Rounded Design/product-detail.dc.html`：
 * PageBanner（沿用該產品線的 banner 與強調色）→ 麵包屑 → Overview（圖 + 說明 + 關鍵數值帶）→
 * 剖面結構（步驟卡）→ 規格表 → 認證（點開全站唯一的認證彈窗）→ 文件（下載列）→
 * 同系列型號（產品線頁的 family 卡）→ PageCTA。
 * 各區依「實際有哪些」由上而下交錯白／淺紫底，就像產品線頁那樣。family 與型號共用這一頁。
 * 客戶案例不在這一頁——它掛在產業頁（`/solutions/{slug}`），產品只是案例裡的連結。
 * </p>
 */

type Params = { params: Promise<{ locale: string; category: string; slug: string }> };

/** 圖庫的一張圖（`ProductImages`）。 */
type ProductImage = {
  url: string;
  altText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

/** 連到另一個產品所需的最少欄位（family ↔ 型號）。 */
type ProductRef = { slug: string; categorySlug: string; code: string | null; name: string | null };

/** `GET /v1/products/{slug}` 回的欄位。 */
type Product = Omit<ProductSchemaInput, 'specifications' | 'certifications'> & {
  categorySlug?: string | null;
  brand?: string | null;
  isNew?: boolean;
  summary?: string | null;
  applicationNote?: string | null;
  seo?: { title?: string; description?: string } | null;
  heroImageUrl?: string | null;
  specifications?: SpecificationRow[];
  images?: ProductImage[] | null;
  certifications?: Certification[] | null;
  downloads?: Download[] | null;
  parent?: ProductRef | null;
  variants?: ProductRef[] | null;
};

/** 下載依文件類型分組的順序（`DownloadKind`，API 輸出 camelCase）。 */
const DOWNLOAD_GROUPS = [
  ['specSheet', 'product.groupSpecSheet'],
  ['testReport', 'product.groupTestReport'],
  ['certificate', 'product.groupCertificate'],
  ['catalogue', 'product.groupCatalogue'],
] as const;

async function getProduct(locale: Locale, slug: string) {
  return apiGet<Product>(`/products/${slug}`, {
    culture: locale,
    tags: [tag.products(), tag.product(slug)],
  });
}

/**
 * 剖面結構是一列規格（「Cross-section」／「剖面結構」），值以斜線分層、由上而下。
 * 用欄名辨識而不是另開欄位：編輯者在後台照同一個欄名填，就會畫成色帶；
 * 欄名不同時它只是規格表裡普通的一列，不會壞。
 */
function splitCrossSection(rows: SpecificationRow[], label: string) {
  const index = rows.findIndex((row) => row.label === label);
  if (index < 0) return { layers: [] as string[], rows };

  const layers = rows[index].value.split(/\s*[/／]\s*/).filter(Boolean);
  return { layers, rows: rows.filter((_, i) => i !== index) };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, category, slug } = await params;
  const locale = requireLocale(rawLocale);
  const data = await getProduct(locale, slug);

  return pageMetadata({
    locale,
    path: `${ROUTES.products}/${category}/${slug}`,
    title: data?.seo?.title ?? data?.name ?? slug,
    description: data?.seo?.description ?? data?.summary,
    image: data?.heroImageUrl ?? data?.image,
  });
}

/** 同系列型號卡要的資料：型號頁 API 已有摘要與 highlighted 規格，這裡直接取（Data Cache 有 tag，不打 DB）。 */
async function getSiblings(locale: Locale, refs: ProductRef[]) {
  const details = await Promise.all(refs.map((ref) => getProduct(locale, ref.slug)));
  return refs.map((ref, index) => ({ ref, detail: details[index] }));
}

const monoLabel: React.CSSProperties = {
  font: "500 11px/1.4 'IBM Plex Mono', monospace",
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--page-faint)',
};

const bodyCopy: React.CSSProperties = {
  margin: 0,
  font: "400 1rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-muted)',
  textWrap: 'pretty',
};

const cardBody: React.CSSProperties = {
  margin: 0,
  font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-muted)',
  textWrap: 'pretty',
};

const cardTitle: React.CSSProperties = {
  font: "600 1rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-fg)',
};

const autoFill = (min: number, gap = 20): React.CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}px), 1fr))`,
  gap,
});

/** 型號代碼 chip —— 產品線頁 family 卡的同一顆。 */
const codeChip = (accent: string): React.CSSProperties => ({
  borderRadius: 12,
  width: 'fit-content',
  maxWidth: '100%',
  boxSizing: 'border-box',
  minWidth: 48,
  padding: '0 12px',
  height: 32,
  background: 'rgba(100,54,239,0.1)',
  color: accent,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  font: "500 13px/1 'IBM Plex Mono', monospace",
});

const newBadge: React.CSSProperties = {
  font: "500 10px/1 'IBM Plex Mono', monospace",
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#0f8a76',
  border: '1px solid rgba(15,138,118,0.45)',
  borderRadius: 999,
  padding: '3px 8px',
};

const specChip: React.CSSProperties = {
  borderRadius: 999,
  padding: '5px 10px',
  border: '1px solid var(--page-border)',
  font: "400 11px/1.4 'IBM Plex Mono', monospace",
  color: 'var(--page-muted)',
};

export default async function ProductPage({ params }: Params) {
  const { locale: rawLocale, category, slug } = await params;
  const locale = requireLocale(rawLocale);
  const t = translator(locale);
  const data = await getProduct(locale, slug);

  // 與其餘實體詳情頁（category／solution／article）一致：查不到就是真的 404，
  // 不是伺服器暫時掛掉（那是 requirePage 的固定路由才有的例外）。
  if (!data) notFound();

  const name = data.name ?? slug;
  const categorySlug = data.categorySlug ?? category;
  const categoryName = data.category?.name ?? categorySlug;
  const accent = CATEGORY_TEXT_ACCENT[categorySlug] ?? '#6436ef';
  const categoryPath = `${ROUTES.products}/${category}`;
  const path = `${categoryPath}/${slug}`;
  const productHref = (ref: ProductRef) => localeHref(locale, `${ROUTES.products}/${ref.categorySlug}/${ref.slug}`);

  const crumbs = [
    { name: t('nav.products'), path: ROUTES.products },
    { name: categoryName, path: categoryPath },
    ...(data.parent ? [{ name: data.parent.name ?? data.parent.slug, path: `${categoryPath}/${data.parent.slug}` }] : []),
    { name, path },
  ];

  const { layers, rows: specRows } = splitCrossSection(data.specifications ?? [], t('product.crossSectionLabels'));
  const crossSectionNote = (data.specifications ?? []).find((row) => row.label === t('product.crossSectionLabels'))?.note;
  const highlights = (data.specifications ?? []).filter((row) => row.isHighlighted);

  // 主圖排在圖庫第一張（後端刻意不把它重複收進 `images`）。沒有任何圖時退回該產品線的情境圖。
  const gallery = [
    ...(data.heroImageUrl ? [{ url: data.heroImageUrl, altText: name } as ProductImage] : []),
    ...(data.images ?? []),
  ];

  const downloads = data.downloads ?? [];
  const groupedKinds = new Set<string>(DOWNLOAD_GROUPS.map(([kind]) => kind));
  const downloadGroups = [
    ...DOWNLOAD_GROUPS.map(([kind, label]) => ({ label: t(label), items: downloads.filter((d) => d.kind === kind) })),
    { label: t('product.groupOther'), items: downloads.filter((d) => !groupedKinds.has(d.kind)) },
  ].filter((group) => group.items.length > 0);
  const specSheet = downloads.find((d) => d.kind === 'specSheet' && d.fileUrl);

  const certifications = data.certifications ?? [];
  const variants = data.variants ?? [];
  const siblings = await getSiblings(locale, variants);
  const hasFamilySection = Boolean(data.parent) || variants.length > 0;

  // 區段依「實際存在的」由上而下交錯白／淺紫底（Overview 固定是白底）。
  const present = [
    layers.length > 0 && 'structure',
    specRows.length > 0 && 'specs',
    certifications.length > 0 && 'certifications',
    downloadGroups.length > 0 && 'downloads',
    hasFamilySection && 'family',
  ].filter(Boolean) as string[];
  const raised = (key: string) => present.indexOf(key) % 2 === 0;

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, crumbs)} />
      {/*
        Product schema 的 `additionalProperty` 來自 SpecificationRows —— 這是規格
        能被 AI 引擎正確引用（而不是從版面猜）的關鍵，見 docs/database.md §09。
      */}
      <JsonLd
        data={productSchema(locale, path, {
          ...data,
          // schema 的認證欄叫 `name`，API 的認證名稱是 `title`。
          certifications: (data.certifications ?? []).map((c) => ({ name: c.title ?? c.slug })),
          specifications: (data.specifications ?? []).flatMap((row) =>
            row.label ? [{ label: row.label, value: row.value, note: row.note }] : [],
          ),
        })}
      />

      <PageShell tone="light">
        {/* 沿用所屬產品線的 banner；產品名是這一頁的 H1，摘要是它的導言。 */}
        <PageBanner
          tone="light"
          eyebrow={`${t('nav.products')} · ${categoryName}`}
          title={name}
          description={data.summary ?? undefined}
          image={bannerImage(null, categorySlug)}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px clamp(24px, 5vw, 80px) 0' }}>
          <Breadcrumb locale={locale} items={crumbs} label={t('common.breadcrumb')} />
        </div>

        {/* ============ Overview：圖 + 說明 + 關鍵數值帶（同產品線頁） ============ */}
        <section id="overview" style={{ scrollMarginTop: 90 }}>
          <Container
            style={{
              padding: 'clamp(40px, 5vw, 72px) clamp(24px, 5vw, 80px)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
              gap: 'clamp(32px, 5vw, 72px)',
              alignItems: 'center',
            }}
          >
            {gallery.length > 0 ? (
              // 產品圖多半是行銷海報，要完整看見，所以是 contain 而不是 cover。
              <div style={{ display: 'grid', gap: 16 }}>
                {gallery.map((image, index) => (
                  <figure
                    key={image.url}
                    style={{
                      margin: 0,
                      borderRadius: 22,
                      background: 'var(--page-raised)',
                      border: '1px solid var(--page-border)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 圖片優化已關閉，見 next.config.ts */}
                    <img
                      src={image.url}
                      alt={image.altText ?? name}
                      width={image.width ?? undefined}
                      height={image.height ?? undefined}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      style={{ display: 'block', width: '100%', height: 'auto', maxHeight: 620, objectFit: 'contain' }}
                    />
                    {image.caption ? (
                      <figcaption
                        style={{
                          padding: '12px 20px',
                          font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                          color: 'var(--page-faint)',
                        }}
                      >
                        {image.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : (
              <ImageSlot src={categoryImage(categorySlug)} alt={categoryName} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {data.code ? <span style={codeChip(accent)}>{data.code}</span> : null}
                {data.isNew ? <span style={newBadge}>{t('common.new')}</span> : null}
                {data.brand ? <span style={monoLabel}>{data.brand}</span> : null}
              </div>
              <h2 style={{ ...sectionTitleStyle, maxWidth: 480 }}>{t('product.about')}</h2>
              {data.description ? <p style={bodyCopy}>{data.description}</p> : null}

              {/* 應用場景：確認稿 news-article 的引言方塊語彙（淺紫底 + 左側色條）。 */}
              {data.applicationNote ? (
                <div style={{ borderRadius: 14, padding: '22px 24px', background: 'var(--page-raised)', borderLeft: `3px solid ${accent}` }}>
                  <p style={eyebrowStyle}>{t('product.usedIn')}</p>
                  <p style={{ ...bodyCopy, marginTop: 12, color: 'var(--page-fg)' }}>{data.applicationNote}</p>
                </div>
              ) : null}

              {highlights.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(highlights.length, 3)}, 1fr)`,
                    gap: 20,
                    marginTop: 12,
                    paddingTop: 28,
                    borderTop: '1px solid var(--page-border)',
                  }}
                >
                  {highlights.map((row) => (
                    <div key={`${row.label}-${row.value}`}>
                      <span
                        style={{
                          display: 'block',
                          // 較長的值（「GRS-certified base」）降一級，數值帶才不會被撐高。
                          font: `500 ${row.value.length > 12 ? 'clamp(1.25rem, 2vw, 1.5rem)' : 'clamp(1.75rem, 3vw, 2.25rem)'}/1.15 'Geologica', 'GenYoGothic TW', sans-serif`,
                          color: accent,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {row.value}
                      </span>
                      {row.label ? (
                        <span
                          style={{
                            display: 'block',
                            marginTop: 8,
                            font: "500 0.8125rem/1.4 'IBM Plex Mono', monospace",
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: 'var(--page-muted)',
                          }}
                        >
                          {row.label}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Container>
        </section>

        {/*
          ============ 剖面結構 ============
          沒有前例，用「How it is made」的步驟卡組出來：每一層一張卡，編號由上而下。
        */}
        {layers.length > 0 ? (
          <BlockSection id="structure" raised={raised('structure')}>
            <h2 style={sectionTitleStyle}>{t('product.crossSection')}</h2>
            {crossSectionNote ? (
              <p style={{ ...bodyCopy, margin: '16px 0 0', lineHeight: 1.6, color: 'var(--page-muted)' }}>{crossSectionNote}</p>
            ) : null}
            <div style={{ ...autoFill(200), marginTop: 40 }}>
              {layers.map((layer, index) => (
                <div key={`${index}-${layer}`} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: accent }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span style={{ ...monoLabel, lineHeight: 1 }}>
                      {index === 0 ? t('product.top') : index === layers.length - 1 ? t('product.bottom') : ''}
                    </span>
                  </div>
                  <span style={cardTitle}>{layer}</span>
                </div>
              ))}
            </div>
          </BlockSection>
        ) : null}

        {/* ============ 規格表 ============ */}
        {specRows.length > 0 ? (
          <BlockSection id="specs" raised={raised('specs')}>
            <h2 style={sectionTitleStyle}>{t('product.specifications')}</h2>
            <SpecTable rows={specRows} labels={{ property: t('spec.property'), value: t('spec.value'), note: t('spec.note') }} />
            <div style={{ marginTop: 28, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a className="vr-btn" href={specSheet?.fileUrl ?? '#downloads'}>
                {t('spec.download')}
                <span aria-hidden="true">→</span>
              </a>
              <Link className="vr-btn" data-variant="ghost" href={localeHref(locale, ROUTES.contact)}>
                {t('spec.sample')}
              </Link>
            </div>
          </BlockSection>
        ) : null}

        {/*
          ============ 認證（`CertificationProducts`） ============
          卡片點下去開全站唯一的認證彈窗——說明文字只有 `Certifications` 一份，這裡不重寫。
          卡片本身同 Sustainability 頁：標題 + 一行說明。
        */}
        {certifications.length > 0 ? (
          <BlockSection id="certifications" raised={raised('certifications')}>
            <h2 style={sectionTitleStyle}>{t('product.certifications')}</h2>
            <div style={{ ...autoFill(240), marginTop: 40 }}>
              {certifications.map((certification) => (
                <CertChip
                  key={certification.slug}
                  id={certification.slug}
                  label={certification.title ?? certification.slug}
                  description={certification.shortNote ?? undefined}
                  pending={certification.isPlaceholder}
                  variant="card"
                />
              ))}
            </div>
          </BlockSection>
        ) : null}

        {/* ============ 文件（`DownloadProducts`）：Resources 的下載列，依文件類型分組 ============ */}
        {downloadGroups.length > 0 ? (
          <BlockSection id="downloads" raised={raised('downloads')}>
            <h2 style={sectionTitleStyle}>{t('product.downloads')}</h2>
            {downloadGroups.map((group) => (
              <div key={group.label} style={{ marginTop: 36 }}>
                <p style={eyebrowStyle}>{group.label}</p>
                <DownloadList locale={locale} items={group.items} emptyLabel={t('common.emptyDownloads')} />
              </div>
            ))}
          </BlockSection>
        ) : null}

        {/* ============ 同系列型號（family 頁：旗下型號；型號頁：其他型號）——產品線頁的 family 卡 ============ */}
        {hasFamilySection ? (
          <BlockSection id="family" raised={raised('family')}>
            <h2 style={sectionTitleStyle}>{t(data.parent ? 'product.otherModels' : 'product.familyModels')}</h2>
            {siblings.length > 0 ? (
              <div style={{ ...autoFill(240), marginTop: 40 }}>
                {siblings.map(({ ref, detail }) => (
                  <Link key={ref.slug} href={productHref(ref)} className="vr-card-link" style={{ ...cardStyle, padding: '28px 26px', textDecoration: 'none' }}>
                    {ref.code ? <span style={codeChip(accent)}>{ref.code}</span> : null}
                    <span style={{ font: "600 1.0625rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif", color: 'var(--page-fg)' }}>
                      {ref.name ?? ref.slug}
                      {detail?.isNew ? <span style={{ ...newBadge, marginLeft: 10, verticalAlign: 'middle' }}>{t('common.new')}</span> : null}
                    </span>
                    {detail?.summary ? (
                      <p style={{ ...cardBody, font: "400 0.875rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif" }}>{detail.summary}</p>
                    ) : null}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                      {(detail?.specifications ?? [])
                        .filter((spec) => spec.isHighlighted)
                        .map((spec) => (
                          <span key={`${spec.label}-${spec.value}`} style={specChip}>
                            {[spec.label, spec.value].filter(Boolean).join(' ')}
                          </span>
                        ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ ...bodyCopy, margin: '16px 0 0', lineHeight: 1.6, color: 'var(--page-muted)' }}>{t('product.onlyModel')}</p>
            )}
            <div style={{ marginTop: 28 }}>
              <Link className="vr-btn" data-variant="ghost" href={localeHref(locale, categoryPath)}>
                {t('product.backToLine')}
              </Link>
            </div>
          </BlockSection>
        ) : null}

        <PageCTA locale={locale} />
      </PageShell>
    </>
  );
}
