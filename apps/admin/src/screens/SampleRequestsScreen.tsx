import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge, Card, ConfirmDialog, Icon, LoadingBlock, PageHeader, Select, useToast } from '@/ui';
import {
  SAMPLE_REQUEST_BOARD_COLUMNS,
  SAMPLE_REQUEST_STATUS_LABEL,
  type SampleRequestStatus,
} from '@/lib/enums';
import { useAction, useList } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { formatRelative } from '@/lib/format';

/**
 * 樣品申請看板。
 *
 * <p>
 * 只常駐顯示「流程還在跑」的五個狀態欄。草稿、已拒絕、已取消不佔欄位 ——
 * 八欄的看板在 1280px 螢幕上每張卡片只剩下一行字，而那三個狀態並不是每天要盯的。
 * 要看的時候用上方的下拉切換。
 * </p>
 *
 * <p>
 * **卡片不能拖曳跨欄。** 狀態轉換有規則（審核中只能到已核准或已拒絕），拖曳會暗示
 * 「哪裡都能放」，然後在放下時才說不行。改成選單只列出合法的下一步，錯誤根本不會發生。
 * </p>
 */

/** 合法的下一步。來源是 docs/database.md §14.3 / §14.4 的狀態機。 */
const NEXT_STATUSES: Partial<Record<SampleRequestStatus, SampleRequestStatus[]>> = {
  submitted: ['underReview', 'rejected', 'cancelled'],
  underReview: ['approved', 'rejected'],
  approved: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};

type Scope = 'active' | 'all' | 'ended';

const SCOPES: { value: Scope; label: string; statuses: SampleRequestStatus[] }[] = [
  { value: 'active', label: '進行中', statuses: SAMPLE_REQUEST_BOARD_COLUMNS },
  {
    value: 'all',
    label: '全部',
    statuses: [...SAMPLE_REQUEST_BOARD_COLUMNS, 'draft', 'rejected', 'cancelled'],
  },
  { value: 'ended', label: '已中止', statuses: ['rejected', 'cancelled'] },
];

export function SampleRequestsScreen({ resource }: { resource: ResourceDef }) {
  const [scope, setScope] = useState<Scope>('active');
  const columns = SCOPES.find((item) => item.value === scope)?.statuses ?? [];
  const query = useList(resource.type, { pageSize: 200 });

  const rows = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title={resource.label}
        description={resource.description}
        actions={
          <Select
            aria-label="顯示範圍"
            value={scope}
            options={SCOPES.map(({ value, label }) => ({ value, label: `顯示：${label}` }))}
            onChange={(event) => setScope(event.target.value as Scope)}
            className="w-auto min-w-[10rem]"
          />
        }
      />

      {query.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((status) => (
            <BoardColumn
              key={status}
              resource={resource}
              status={status}
              rows={rows.filter((row) => String(row.status) === status)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function BoardColumn({
  resource,
  status,
  rows,
}: {
  resource: ResourceDef;
  status: SampleRequestStatus;
  rows: AdminRow[];
}) {
  return (
    <section className="flex w-72 shrink-0 flex-col gap-3">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-[var(--fg-1)]">{SAMPLE_REQUEST_STATUS_LABEL[status]}</h2>
        <Badge tone="neutral">{rows.length}</Badge>
      </header>

      <div className="flex min-h-24 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--surface-sunken)] p-2">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--fg-3)]">沒有單子</p>
        ) : (
          rows.map((row) => <RequestCard key={row.id} resource={resource} row={row} />)
        )}
      </div>
    </section>
  );
}

function RequestCard({ resource, row }: { resource: ResourceDef; row: AdminRow }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const action = useAction(resource.type);
  const [menuOpen, setMenuOpen] = useState(false);
  const [target, setTarget] = useState<SampleRequestStatus | null>(null);

  const status = String(row.status) as SampleRequestStatus;
  const nextOptions = NEXT_STATUSES[status] ?? [];
  const items = Array.isArray(row.items) ? row.items.length : 0;
  const missingTracking = status === 'shipped' && !row.trackingNumber;

  async function move() {
    if (!target) return;
    try {
      await action.mutateAsync({ id: row.id, action: 'status', data: { status: target } });
      toast({ title: `已改為「${SAMPLE_REQUEST_STATUS_LABEL[target]}」`, variant: 'success' });
    } catch (error) {
      toast({ title: '狀態沒有更新', description: (error as Error).message, variant: 'danger' });
    } finally {
      setTarget(null);
    }
  }

  return (
    <>
      <Card className="p-0" padding={false}>
        <div className="relative p-3">
          <button
            type="button"
            onClick={() => navigate(`/${resource.type}/${row.id}`)}
            className="block w-full text-left"
          >
            <p className="font-mono text-xs text-[var(--fg-2)]">{String(row.requestNumber ?? '')}</p>
            <p className="mt-1 truncate text-sm font-medium text-[var(--fg-1)]">
              {String(row.shipToCompany ?? row.memberName ?? '—')}
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--fg-2)]">{String(row.projectName ?? '')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="neutral">{items} 項</Badge>
              <span className="text-xs text-[var(--fg-3)]">{formatRelative(row.submittedAt)}</span>
              {missingTracking && <Badge tone="warning">未填運送資訊</Badge>}
            </div>
          </button>

          {nextOptions.length > 0 && (
            <div className="absolute right-2 top-2">
              <button
                type="button"
                aria-label="推進狀態"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--fg-3)] hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]"
              >
                <Icon name="more-horizontal" size={15} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-20 w-40 rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--surface-card)] p-1 shadow-[var(--shadow-md)]">
                  {nextOptions.map((next) => (
                    <button
                      key={next}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setTarget(next);
                      }}
                      className="block w-full rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-xs text-[var(--fg-1)] hover:bg-[var(--surface-card-alt)]"
                    >
                      改為「{SAMPLE_REQUEST_STATUS_LABEL[next]}」
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={move}
        pending={action.isPending}
        tone={target === 'rejected' || target === 'cancelled' ? 'danger' : 'default'}
        title={`把 ${String(row.requestNumber ?? '')} 改為「${target ? SAMPLE_REQUEST_STATUS_LABEL[target] : ''}」？`}
        description={
          target === 'shipped'
            ? '記得到詳情頁補上物流商與追蹤號碼，申請人會在會員專區看到它。'
            : target === 'rejected'
              ? '請到詳情頁補上拒絕理由，這段文字會回覆給申請人。'
              : '狀態變更會記錄在這張單的時間戳上。'
        }
        confirmLabel="更新狀態"
      />
    </>
  );
}
