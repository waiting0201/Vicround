import type { Metadata } from 'next';
import { BlockHeading, BlockSection, FeatureGridBlock, MediaSlot, cardStyle } from '@/components/blocks';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { PageBanner } from '@/components/PageBanner';
import { PageCTA } from '@/components/PageCTA';
import { PageShell } from '@/components/PageShell';
import type { ProcessStep } from '@/lib/content-api';
import { block, getPage, getTechnologies, requirePage } from '@/lib/content-api';
import { localizeHtml } from '@/lib/html';
import { translator } from '@/lib/i18n';
import { requireLocale, type Locale } from '@/lib/locale';
import { bannerImage } from '@/lib/page-assets';
import { ROUTES } from '@/lib/routes';
import { breadcrumbSchema } from '@/lib/schema';
import { pageMetadata } from '@/lib/seo';

/**
 * Technologies —— 版型逐區塊對照 `mockup/Rounded Design/technologies.dc.html`。
 *
 * <p>
 * 製程步驟與法規符合都是強型別資料（`ProcessFlows` / `Certifications`），
 * 頁面只提供標題與版面 —— Technologies 與 Sustainability 因此不會各自抄一份認證清單。
 * </p>
 */
type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = requireLocale(rawLocale);
  const page = requirePage(await getPage(locale, 'technologies'), 'technologies');

  return pageMetadata({
    locale,
    path: ROUTES.technologies,
    title: page.seo?.title ?? page.bannerTitle ?? page.title ?? '',
    description: page.seo?.description ?? page.bannerDescription ?? undefined,
  });
}

function StepCards({ steps, accent = '#6436ef' }: { steps: ProcessStep[]; accent?: string }) {
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
            <span
              style={{
                borderRadius: 12,
                width: 40,
                height: 40,
                background: 'rgba(100,54,239,0.1)',
                color: '#6436ef',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={step.iconName} size={18} />
            </span>
          ) : null}
          <span
            style={{ font: "600 1rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif", color: 'var(--page-fg)' }}
          >
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

export default async function TechnologiesPage({ params }: Params) {
  const { locale: rawLocale } = await params;
  const locale: Locale = requireLocale(rawLocale);
  const t = translator(locale);

  const [pageData, technologies] = await Promise.all([getPage(locale, 'technologies'), getTechnologies(locale)]);
  const page = requirePage(pageData, 'technologies');

  const core = block(page, 'core-processes');
  const qc = block(page, 'qc');
  const innovation = block(page, 'innovation');
  const compliance = block(page, 'compliance');

  const coreFlow = core?.reference?.processFlows?.[0];
  const coDevelopment = technologies?.processFlows.find((flow) => flow.kind === 'coDevelopment');
  const certifications = compliance?.reference?.certifications ?? [];

  return (
    <>
      <JsonLd data={breadcrumbSchema(locale, [{ name: t('nav.technologies'), path: ROUTES.technologies }])} />

      <PageShell tone="light">
        <PageBanner
          tone="light"
          eyebrow={page.eyebrow ?? t('nav.technologies')}
          title={page.bannerTitle ?? page.title ?? ''}
          description={page.bannerDescription ?? undefined}
          image={bannerImage(page.bannerImageUrl)}
        />

        {/* ============ 核心製程 ============ */}
        {core ? (
          <BlockSection id="core-processes">
            <BlockHeading block={core} />
            <StepCards steps={coreFlow?.steps ?? []} />

            {/* 線上品管 —— 核心製程底下的一小段 */}
            {qc ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'clamp(32px, 5vw, 72px)',
                  alignItems: 'center',
                  marginTop: 'clamp(36px, 4vw, 56px)',
                }}
              >
                <MediaSlot label={t('common.imagePlaceholder')} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h3
                    style={{
                      margin: 0,
                      font: "600 1.25rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-fg)',
                    }}
                  >
                    {qc.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      font: "400 0.9375rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {qc.body}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {qc.items.map((item) => (
                      <span
                        key={item.title}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid var(--page-border)',
                          borderRadius: 999,
                          font: "400 12px/1.4 'IBM Plex Mono', monospace",
                          color: 'var(--page-muted)',
                        }}
                      >
                        {item.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </BlockSection>
        ) : null}

        {/* ============ 研發與材料創新 ============ */}
        {innovation ? (
          <BlockSection id="innovation" raised>
            <FeatureGridBlock block={innovation} columns={3} />

            {coDevelopment ? (
              <div style={{ marginTop: 'clamp(36px, 4vw, 56px)' }}>
                <h3
                  style={{
                    margin: 0,
                    font: "600 1.25rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {coDevelopment.title}
                </h3>
                <StepCards steps={coDevelopment.steps} />
              </div>
            ) : null}
          </BlockSection>
        ) : null}

        {/* ============ 產品法規符合 ============ */}
        {compliance ? (
          <BlockSection id="compliance">
            <BlockHeading block={compliance} />
            {compliance.body ? (
              <div
                className="vr-prose"
                style={{ marginTop: 16, maxWidth: 720 }}
                dangerouslySetInnerHTML={{ __html: localizeHtml(locale, compliance.body)! }}
              />
            ) : null}

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
                    {[t('spec.standard'), t('spec.scope'), t('spec.documentation')].map((column) => (
                      <th
                        key={column}
                        style={{
                          textAlign: 'left',
                          padding: '14px 18px',
                          font: "600 12px/1.4 'IBM Plex Mono', monospace",
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--page-muted)',
                          borderBottom: '1px solid var(--page-border)',
                        }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((certification, index) => (
                    <tr
                      key={certification.slug}
                      style={index % 2 === 1 ? { background: 'rgba(20,20,31,0.03)' } : undefined}
                    >
                      <td
                        style={{
                          padding: '14px 18px',
                          color: 'var(--page-fg)',
                          borderBottom: '1px solid rgba(20,20,31,0.08)',
                        }}
                      >
                        {certification.title}
                      </td>
                      <td
                        style={{
                          padding: '14px 18px',
                          color: 'var(--page-muted)',
                          borderBottom: '1px solid rgba(20,20,31,0.08)',
                        }}
                      >
                        {certification.shortNote ?? certification.scopeText}
                      </td>
                      <td
                        style={{
                          padding: '14px 18px',
                          color: 'var(--page-muted)',
                          borderBottom: '1px solid rgba(20,20,31,0.08)',
                        }}
                      >
                        {certification.documentationLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BlockSection>
        ) : null}

        {page.ctaHeadline ? (
          <PageCTA
            locale={locale}
            eyebrow={page.ctaEyebrow ?? ''}
            headline={page.ctaHeadline}
            subcopy={page.ctaSubcopy ?? ''}
          />
        ) : null}
      </PageShell>
    </>
  );
}
