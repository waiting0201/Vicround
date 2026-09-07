import { Icon } from '@/ui';
import { formatDateTime } from '@/lib/format';

/**
 * 狀態歷程。
 *
 * <p>
 * 本專案不建歷程表 —— 每個階段各有一個時間戳欄位（docs/database.md §0.7）。
 * 所以這條時間軸不是查來的，是「哪些時間戳有值」直接畫出來的。少一個表，
 * 而畫面上該回答的問題（這張單什麼時候出貨的）一樣答得出來。
 * </p>
 */
export function Timeline({
  steps,
}: {
  steps: { label: string; at: unknown; note?: string; tone?: 'danger' }[];
}) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const done = Boolean(step.at);
        const isLast = index === steps.length - 1;

        return (
          <li key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={
                  done
                    ? step.tone === 'danger'
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger-500)] text-white'
                      : 'flex h-5 w-5 items-center justify-center rounded-full bg-[var(--success-500)] text-white'
                    : 'flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-[var(--border-2)] text-[var(--fg-3)]'
                }
              >
                {done && <Icon name={step.tone === 'danger' ? 'x' : 'check'} size={12} />}
              </span>
              {!isLast && (
                <span
                  className="w-px flex-1"
                  style={{ background: done ? 'var(--success-500)' : 'var(--border-1)' }}
                />
              )}
            </div>

            <div className={isLast ? 'pb-0' : 'pb-5'}>
              <p className={done ? 'text-sm font-medium text-[var(--fg-1)]' : 'text-sm text-[var(--fg-3)]'}>
                {step.label}
              </p>
              <p className="text-xs text-[var(--fg-2)]">{done ? formatDateTime(step.at) : '尚未發生'}</p>
              {step.note && <p className="mt-1 text-xs text-[var(--fg-2)]">{step.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** 詳情頁常見的「標籤 ／ 值」兩欄列。 */
export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-[var(--fg-2)]">{label}</span>
      <span className="text-right text-[var(--fg-1)]">{children}</span>
    </div>
  );
}
