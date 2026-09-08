import { CertChip } from '@/components/CertificationDialog';
import { Icon } from '@/components/Icon';
import { Container } from '@/components/sections';
import type { Certification, ContentBlock, ProcessStep, ProductListItem, SpecificationRow, Testimonial } from '@/lib/content-api';
import { localizeHtml } from '@/lib/html';
import type { Locale } from '@/lib/locale';

/**
 * 版塊的共用渲染件 —— 樣式逐項取自 `mockup/Rounded Design/`。
 *
 * <p>
 * 版塊型別（`ContentBlocks.BlockType`）決定用哪一種版面，內容全部來自 CMS。
 * 頁面因此只需要決定「哪些版塊、什麼順序、放在什麼底色的區段裡」，
 * 不再各自複製一份卡片樣式。
 * </p>
 */
export const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  font: "500 clamp(1.75rem, 3vw, 2.25rem)/1.15 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-fg)',
  textWrap: 'balance',
};

export const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  font: "600 13px/1.2 'Geologica', sans-serif",
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#6436ef',
};

export const leadStyle: React.CSSProperties = {
  margin: '16px 0 0',
  font: "400 1rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-muted)',
  textWrap: 'pretty',
};

export const cardStyle: React.CSSProperties = {
  background: 'var(--page-bg)',
  border: '1px solid var(--page-border)',
  borderRadius: 22,
  padding: '28px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '14px 18px',
  font: "600 12px/1.4 'IBM Plex Mono', monospace",
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--page-muted)',
  borderBottom: '1px solid var(--page-border)',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 18px',
  color: 'var(--page-muted)',
  borderBottom: '1px solid rgba(20,20,31,0.08)',
};

const iconBadgeStyle: React.CSSProperties = {
  borderRadius: 12,
  width: 44,
  height: 44,
  background: 'rgba(100,54,239,0.1)',
  color: '#6436ef',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

/** 區段標題（eyebrow + 標題 + 導言）。三者都可能沒有，缺的就不渲染。 */
export function BlockHeading({ block }: { block: ContentBlock }) {
  return (
    <>
      {block.eyebrow ? <p style={eyebrowStyle}>{block.eyebrow}</p> : null}
      {block.title ? (
        <h2 style={{ ...sectionTitleStyle, marginTop: block.eyebrow ? 12 : 0 }}>{block.title}</h2>
      ) : null}
      {block.subtitle ? <p style={leadStyle}>{block.subtitle}</p> : null}
    </>
  );
}

/** 圖示 + 標題 + 說明的卡片格。`subtitle` 會變成卡片底部的 chip（例如「Optical Film」）。 */
export function FeatureGridBlock({ block, columns }: { block: ContentBlock; columns?: number }) {
  const count = columns ?? Math.min(block.items.length || 3, 4);

  return (
    <>
      <BlockHeading block={block} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${count}, 1fr)`,
          gap: 20,
          marginTop: 40,
        }}
      >
        {block.items.map((item, index) => (
          <div key={item.title ?? index} style={cardStyle}>
            {item.iconName ? (
              <span style={iconBadgeStyle}>
                <Icon name={item.iconName} size={20} />
              </span>
            ) : null}
            <span
              style={{
                font: "600 1.0625rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {item.title}
            </span>
            {item.body ? (
              <p
                style={{
                  margin: 0,
                  font: "400 0.875rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-muted)',
                }}
              >
                {item.body}
              </p>
            ) : null}
            {item.subtitle ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                <span
                  style={{
                    borderRadius: 999,
                    padding: '5px 10px',
                    border: '1px solid var(--page-border)',
                    font: "400 11px/1.4 'IBM Plex Mono', monospace",
                    color: 'var(--page-muted)',
                  }}
                >
                  {item.subtitle}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

/** 大數字 + 標題 + 說明。mockup 的「Why teams specify us here」。 */
export function StatBandBlock({ block }: { block: ContentBlock }) {
  return (
    <>
      <BlockHeading block={block} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(block.items.length || 3, 3)}, 1fr)`,
          gap: 20,
          marginTop: 40,
        }}
      >
        {block.items.map((item, index) => (
          <div key={item.title ?? index} style={{ ...cardStyle, gap: 10 }}>
            <span
              style={{
                font: "500 clamp(1.75rem, 3vw, 2.25rem)/1 'Geologica', sans-serif",
                color: '#6436ef',
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                font: "600 1rem/1.35 'Geologica', 'GenYoGothic TW', sans-serif",
                color: 'var(--page-fg)',
              }}
            >
              {item.title}
            </span>
            {item.body ? (
              <p
                style={{
                  margin: 0,
                  font: "400 0.875rem/1.65 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-muted)',
                }}
              >
                {item.body}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

/** 規格表（property / value / note）。產品線頁、產業頁共用同一個版面。 */
export function SpecTable({
  rows,
  labels,
  note,
}: {
  rows: SpecificationRow[];
  labels: { property: string; value: string; note: string };
  note?: string | null;
}) {
  if (rows.length === 0) return null;

  return (
    <>
      <div style={{ marginTop: 40, overflowX: 'auto', border: '1px solid var(--page-border)', borderRadius: 22 }}>
        <table
          style={{
            width: '100%',
            minWidth: 640,
            borderCollapse: 'collapse',
            font: "400 0.875rem/1.5 'IBM Plex Mono', monospace",
          }}
        >
          <thead>
            <tr style={{ background: 'var(--page-raised)' }}>
              <th style={thStyle}>{labels.property}</th>
              <th style={thStyle}>{labels.value}</th>
              <th style={thStyle}>{labels.note}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.label}-${row.value}`}
                style={index % 2 === 1 ? { background: 'rgba(20,20,31,0.03)' } : undefined}
              >
                <td style={{ ...tdStyle, color: 'var(--page-fg)' }}>{row.label}</td>
                <td style={tdStyle}>{row.value}</td>
                <td style={tdStyle}>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? (
        <p
          style={{
            margin: '16px 0 0',
            font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'var(--page-faint)',
          }}
        >
          {note}
        </p>
      ) : null}
    </>
  );
}

/**
 * 產品比較表：一列一個產品，欄位是那些產品**具名**的規格列。
 *
 * <p>
 * 欄序取自第一個產品，其餘產品依標籤對齊 —— 少一項就留空，而不是整欄消失。
 * 資料是產品自己的規格，因此產品線頁與產業頁不會出現兩份不同的數值。
 * </p>
 */
export function ProductComparisonTable({
  products,
  firstColumnLabel,
  note,
}: {
  products: ProductListItem[];
  firstColumnLabel: string;
  note?: string | null;
}) {
  const labels = [
    ...new Set(
      products.flatMap((product) =>
        product.specifications.filter((spec) => !spec.isHighlighted && spec.label).map((spec) => spec.label!),
      ),
    ),
  ];

  if (products.length === 0 || labels.length === 0) return null;

  return (
    <>
      <div
        style={{
          marginTop: 40,
          overflowX: 'auto',
          border: '1px solid var(--page-border)',
          borderRadius: 22,
          background: 'var(--page-bg)',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 720,
            borderCollapse: 'collapse',
            font: "400 0.875rem/1.5 'IBM Plex Mono', monospace",
          }}
        >
          <thead>
            <tr style={{ background: 'var(--page-raised)' }}>
              <th style={thStyle}>{firstColumnLabel}</th>
              {labels.map((label) => (
                <th key={label} style={thStyle}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.slug} style={index % 2 === 1 ? { background: 'rgba(20,20,31,0.03)' } : undefined}>
                <td style={{ ...tdStyle, color: 'var(--page-fg)' }}>{product.name}</td>
                {labels.map((label) => (
                  <td key={label} style={tdStyle}>
                    {product.specifications.find((spec) => spec.label === label)?.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? (
        <p
          style={{
            margin: '16px 0 0',
            font: "400 0.8125rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
            color: 'var(--page-faint)',
          }}
        >
          {note}
        </p>
      ) : null}
    </>
  );
}

/** 圖片版位：CMS 還沒有指定圖時，維持 mockup 的虛線框與尺寸提示。 */
export function MediaSlot({ url, label, ratio = '4 / 3' }: { url?: string | null; label: string; ratio?: string }) {
  return (
    <div
      style={{
        aspectRatio: ratio,
        borderRadius: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        textAlign: 'center',
        ...(url
          ? { background: `#0a0a12 url('${url}') center center / cover no-repeat` }
          : { border: '1px dashed var(--page-border)' }),
      }}
    >
      {url ? null : (
        <span
          style={{
            font: "500 12px/1.4 'IBM Plex Mono', monospace",
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--page-faint)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/** 深淺交錯的區段外框。mockup 每一頁都是這樣一段一段疊起來的。 */
export function BlockSection({
  id,
  raised,
  children,
}: {
  id?: string;
  raised?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        scrollMarginTop: 90,
        ...(raised
          ? {
              background: 'var(--page-raised)',
              borderTop: '1px solid var(--page-border)',
              borderBottom: '1px solid var(--page-border)',
            }
          : {}),
      }}
    >
      <Container style={{ padding: 'clamp(48px, 7vw, 88px) clamp(24px, 5vw, 80px)' }}>{children}</Container>
    </section>
  );
}

/** 有序步驟卡（核心製程、共同開發、OEM/ODM、詢問流程共用）。 */
export function StepCards({ steps, accent = '#6436ef' }: { steps: ProcessStep[]; accent?: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(steps.length || 4, 4)}, 1fr)`,
        gap: 20,
        marginTop: 40,
      }}
    >
      {steps.map((step, index) => (
        <div key={step.title ?? index} style={cardStyle}>
          <span style={{ font: "500 14px/1 'IBM Plex Mono', monospace", color: step.accentColorHex ?? accent }}>
            {String(step.stepNumber || index + 1).padStart(2, '0')}
          </span>
          {step.iconName ? (
            <span style={{ ...iconBadgeStyle, width: 40, height: 40 }}>
              <Icon name={step.iconName} size={18} />
            </span>
          ) : null}
          <span style={{ font: "600 1rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif", color: 'var(--page-fg)' }}>
            {step.title}
          </span>
          <p
            style={{
              margin: 0,
              font: "400 0.875rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'var(--page-muted)',
            }}
          >
            {step.body}
          </p>
        </div>
      ))}
    </div>
  );
}

/** 圖文左右分割。`imageRight` 由呼叫端決定，mockup 是逐段交錯的。 */
export function MediaTextSplitBlock({
  block,
  locale,
  imageLabel,
  imageRight = true,
}: {
  block: ContentBlock;
  locale: Locale;
  imageLabel: string;
  imageRight?: boolean;
}) {
  const copy = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {block.eyebrow ? <p style={eyebrowStyle}>{block.eyebrow}</p> : null}
      {block.title ? <h2 style={sectionTitleStyle}>{block.title}</h2> : null}
      {block.body ? (
        <div className="vr-prose" dangerouslySetInnerHTML={{ __html: localizeHtml(locale, block.body)! }} />
      ) : null}
      {block.ctaLabel ? (
        <span style={{ font: "600 13px/1.4 'Geologica', sans-serif", color: '#6436ef' }}>{block.ctaLabel}</span>
      ) : null}
    </div>
  );

  const media = <MediaSlot url={block.items[0]?.linkUrl} label={imageLabel} />;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'clamp(32px, 5vw, 72px)',
        alignItems: 'center',
      }}
    >
      {imageRight ? copy : media}
      {imageRight ? media : copy}
    </div>
  );
}

/**
 * 認證卡。點下去開全站唯一的認證彈窗（`components/CertificationDialog.tsx`），
 * 資料來自 `Certifications`——這裡不重寫一份認證說明。
 */
export function CertificationCards({
  certifications,
  labels,
  columns = 4,
}: {
  certifications: Certification[];
  labels: { view: string; pending: string };
  columns?: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 20, marginTop: 40 }}>
      {certifications.map((certification) => (
        <CertChip
          key={certification.slug}
          id={certification.slug}
          label={certification.title ?? certification.slug}
          description={certification.shortNote ?? undefined}
          action={certification.isPlaceholder ? labels.pending : labels.view}
          pending={certification.isPlaceholder}
          variant="card"
        />
      ))}
    </div>
  );
}

/** 客戶推薦。具名需書面授權，因此姓名可能為空，只顯示職稱與公司類型（database.md §08）。 */
export function TestimonialCards({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(testimonials.length || 3, 3)}, 1fr)`,
        gap: 20,
        marginTop: 40,
      }}
    >
      {testimonials.map((testimonial, index) => (
        <figure key={index} style={{ ...cardStyle, margin: 0, gap: 16 }}>
          <blockquote
            style={{
              margin: 0,
              font: "400 1rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'var(--page-fg)',
            }}
          >
            {testimonial.quote}
          </blockquote>
          <figcaption
            style={{
              marginTop: 'auto',
              font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
              color: 'var(--page-faint)',
            }}
          >
            {[testimonial.authorName, testimonial.authorTitle, testimonial.companyType ?? testimonial.brandName]
              .filter(Boolean)
              .join(' · ')}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
