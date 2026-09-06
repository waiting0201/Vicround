import type { Block } from '@/content/articles';
import type { LocalizedBlocks } from '@/lib/content';

/**
 * 文章內文渲染器 —— 逐項對照 `mockup/Rounded Design/article.dc.html` 的內文樣式。
 *
 * <p>
 * 內文以 block 陣列表達（段落、標題、表格、定義、引言、圖說、清單），
 * 形狀刻意貼近後台的 `ContentBlocks`。接上 CMS 後這一支改成吃 TipTap 的 HTML，
 * 但標題／表格／引言的視覺仍由這裡的 prose 樣式決定。
 * </p>
 */
const pStyle: React.CSSProperties = {
  margin: '20px 0 0',
  font: "400 1.0625rem/1.8 'Geologica', 'GenYoGothic TW', sans-serif",
  color: 'var(--page-muted)',
};

export function ArticleBody({ blocks }: { blocks: LocalizedBlocks<Block>[] }) {
  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 40 }}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <div key={block.id} id={block.id} style={{ scrollMarginTop: 104 }}>
                <h2
                  style={{
                    margin: 0,
                    font: "500 1.5rem/1.3 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  {block.text}
                </h2>
              </div>
            );

          case 'paragraph':
            return (
              <p key={index} style={{ ...pStyle, margin: 0 }}>
                {block.text}
              </p>
            );

          case 'table':
            return (
              <div
                key={index}
                style={{ overflowX: 'auto', border: '1px solid var(--page-border)', borderRadius: 22 }}
              >
                <table
                  style={{
                    width: '100%',
                    minWidth: 560,
                    borderCollapse: 'collapse',
                    font: "400 0.875rem/1.5 'IBM Plex Mono', monospace",
                  }}
                >
                  <thead>
                    <tr style={{ background: 'var(--page-raised)' }}>
                      {block.columns.map((column) => (
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
                    {block.rows.map((row, rowIndex) => (
                      <tr key={row[0]} style={rowIndex % 2 === 1 ? { background: 'rgba(20,20,31,0.03)' } : undefined}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cell}
                            style={{
                              padding: '14px 18px',
                              color: cellIndex === 0 ? 'var(--page-fg)' : 'var(--page-muted)',
                              borderBottom: '1px solid rgba(20,20,31,0.08)',
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'definitions':
            return (
              <dl key={index} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {block.items.map((item) => (
                  <div key={item.term} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <dt
                      style={{
                        font: "600 0.9375rem/1.6 'IBM Plex Mono', monospace",
                        color: 'var(--page-fg)',
                        minWidth: 92,
                      }}
                    >
                      {item.term}
                    </dt>
                    <dd
                      style={{
                        margin: 0,
                        flex: '1 1 320px',
                        font: "400 0.9375rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
                        color: 'var(--page-muted)',
                      }}
                    >
                      {item.text}
                    </dd>
                  </div>
                ))}
              </dl>
            );

          case 'callout':
            return (
              <p
                key={index}
                style={{
                  margin: 0,
                  padding: '20px 24px',
                  borderLeft: '3px solid #6436ef',
                  background: 'rgba(100,54,239,0.06)',
                  borderRadius: '0 14px 14px 0',
                  font: "500 1.0625rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
                  color: 'var(--page-fg)',
                }}
              >
                {block.text}
              </p>
            );

          case 'figure':
            return (
              <figure key={index} style={{ margin: 0 }}>
                <div
                  style={{
                    aspectRatio: '16 / 9',
                    borderRadius: 22,
                    border: '1px dashed var(--page-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      font: "500 12px/1.4 'IBM Plex Mono', monospace",
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--page-faint)',
                    }}
                  >
                    {block.label}
                  </span>
                </div>
                <figcaption
                  style={{
                    marginTop: 12,
                    font: "400 0.8125rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-faint)',
                  }}
                >
                  {block.caption}
                </figcaption>
              </figure>
            );

          case 'quote':
            return (
              <figure key={index} style={{ margin: 0 }}>
                <blockquote
                  style={{
                    margin: 0,
                    font: "400 1.25rem/1.6 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-fg)',
                  }}
                >
                  &ldquo;{block.text}&rdquo;
                </blockquote>
                <figcaption
                  style={{
                    marginTop: 12,
                    font: "500 0.875rem/1.5 'Geologica', 'GenYoGothic TW', sans-serif",
                    color: 'var(--page-faint)',
                  }}
                >
                  {block.author}
                </figcaption>
              </figure>
            );

          case 'list':
            return (
              <ul key={index} style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {block.items.map((item) => (
                  <li
                    key={item}
                    style={{
                      font: "400 1rem/1.7 'Geologica', 'GenYoGothic TW', sans-serif",
                      color: 'var(--page-muted)',
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
