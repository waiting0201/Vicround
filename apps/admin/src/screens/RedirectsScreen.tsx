import { useState } from 'react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Drawer,
  Field,
  Icon,
  Input,
  PageHeader,
  Select,
  Switch,
  Table,
  Textarea,
  useToast,
  type TableColumn,
} from '@/ui';
import { CULTURES, REDIRECT_STATUS_OPTIONS } from '@/lib/enums';
import { useDeleteItem, useList, useSaveItem } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { formatDateTime } from '@/lib/format';

/**
 * 轉址表。
 *
 * <p>
 * 正常情況下 301 是**系統自動寫的**（改 slug 時同一個交易一起寫；刪除內容則寫 410）。這一頁是給
 * 人工補登用的：舊站遷移、行銷用的短網址、客戶手上印出去的舊 DM。所以畫面上要說清楚
 * 這件事，否則會有人以為改 slug 之後還得手動來這裡補一筆。
 * </p>
 *
 * <p>
 * **鏈與環在前端就先擋。** 後端也會擋，但錯誤訊息只能說「不合法」；前端手上有整份清單，
 * 可以直接算出最終目標並告訴編輯者「這會變成鏈，你要的其實是 /en/products/optical-film」。
 * 這是少數值得在前端重算一次業務規則的地方。
 * </p>
 */

function normalize(path: string): string {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) return '';
  const withoutTrailing = trimmed.length > 1 ? trimmed.replace(/\/+$/, '') : trimmed;
  return withoutTrailing.startsWith('/') ? withoutTrailing : `/${withoutTrailing}`;
}

/** 沿著現有的轉址一路走到底，回傳最終目標與是否成環。 */
function resolveChain(rows: AdminRow[], from: string): { final: string; cycle: boolean } {
  const map = new Map(rows.map((row) => [normalize(String(row.fromPath ?? '')), normalize(String(row.toPath ?? ''))]));
  const seen = new Set<string>([from]);
  let current = from;

  while (map.has(current)) {
    const next = map.get(current) ?? '';
    if (!next || seen.has(next)) return { final: current, cycle: seen.has(next) };
    seen.add(next);
    current = next;
  }
  return { final: current, cycle: false };
}

type Form = {
  fromPath: string;
  toPath: string;
  statusCode: string;
  targetCulture: string;
  isEnabled: boolean;
  notes: string;
};

const EMPTY: Form = { fromPath: '', toPath: '', statusCode: '301', targetCulture: '', isEnabled: true, notes: '' };

export function RedirectsScreen({ resource }: { resource: ResourceDef }) {
  const { toast } = useToast();
  const query = useList(resource.type, { pageSize: 200 });
  const save = useSaveItem(resource.type);
  const remove = useDeleteItem(resource.type);

  const [editing, setEditing] = useState<AdminRow | 'new' | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});

  const rows = query.data?.items ?? [];

  function open(row: AdminRow | 'new') {
    setEditing(row);
    setErrors({});
    setForm(
      row === 'new'
        ? EMPTY
        : {
            fromPath: String(row.fromPath ?? ''),
            toPath: String(row.toPath ?? ''),
            statusCode: String(row.statusCode ?? '301'),
            targetCulture: String(row.targetCulture ?? ''),
            isEnabled: row.isEnabled !== false,
            notes: String(row.notes ?? ''),
          },
    );
  }

  /** 回傳修正後的表單（鏈會被壓平），或 null 表示有錯不能存。 */
  function validate(): Form | null {
    const found: Partial<Record<keyof Form, string>> = {};
    const from = normalize(form.fromPath);
    const to = form.statusCode === '410' ? '' : normalize(form.toPath);

    if (!from) found.fromPath = '請填來源路徑。';
    if (form.statusCode !== '410' && !to) found.toPath = '除了 410 之外都必須有目標路徑。';
    if (from && to && from === to) found.toPath = '來源與目標相同，這會是一個永遠轉不到的網址。';

    const others = rows.filter((row) => editing === 'new' || row.id !== (editing as AdminRow)?.id);
    if (from && others.some((row) => normalize(String(row.fromPath ?? '')) === from)) {
      found.fromPath = '這個來源路徑已經有一筆轉址了。請改那一筆，不要新增第二筆。';
    }

    let finalTo = to;
    if (from && to) {
      const chain = resolveChain(others, to);
      if (chain.cycle || chain.final === from) {
        found.toPath = '這會讓轉址繞回自己，瀏覽器會判定為重新導向迴圈。';
      } else if (chain.final !== to) {
        // 鏈不是錯誤 —— 直接壓平成最終目標，並在存檔後說明做了什麼
        finalTo = chain.final;
      }
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return null;
    return { ...form, fromPath: from, toPath: finalTo };
  }

  async function submit() {
    const valid = validate();
    if (!valid) return;

    const flattened = valid.toPath !== normalize(form.toPath);
    await save.mutateAsync({
      id: editing === 'new' ? undefined : (editing as AdminRow).id,
      data: { ...valid, statusCode: Number(valid.statusCode) },
    });

    toast({
      title: '轉址已儲存',
      description: flattened
        ? `目標已自動改為最終網址 ${valid.toPath}，避免產生轉址鏈。`
        : undefined,
      variant: 'success',
    });
    setEditing(null);
  }

  const columns: TableColumn<AdminRow>[] = [
    {
      key: 'fromPath',
      header: '來源路徑',
      render: (row) => <code className="font-mono text-xs text-[var(--fg-1)]">{String(row.fromPath ?? '')}</code>,
    },
    {
      key: 'toPath',
      header: '目標路徑',
      render: (row) =>
        row.toPath ? (
          <code className="font-mono text-xs text-[var(--fg-2)]">{String(row.toPath)}</code>
        ) : (
          <span className="text-[var(--fg-3)]">（無替代內容）</span>
        ),
    },
    {
      key: 'statusCode',
      header: '狀態碼',
      width: '7rem',
      render: (row) => (
        <Badge tone={String(row.statusCode) === '410' ? 'danger' : 'neutral'}>{String(row.statusCode ?? '')}</Badge>
      ),
    },
    {
      key: 'isEnabled',
      header: '啟用',
      width: '5rem',
      render: (row) =>
        row.isEnabled !== false ? (
          <Icon name="check" size={15} className="text-[var(--success-500)]" />
        ) : (
          <span className="text-[var(--fg-3)]">—</span>
        ),
    },
    { key: 'notes', header: '備註', render: (row) => <span className="text-[var(--fg-2)]">{String(row.notes ?? '')}</span> },
    {
      key: 'updatedAt',
      header: '更新',
      width: '9rem',
      render: (row) => <span className="text-[var(--fg-2)]">{formatDateTime(row.updatedAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title={resource.label}
        description="改 slug 或封存內容時，系統會自動寫入轉址。這一頁是給舊站遷移、印刷品短網址這類需要人工補登的情況。"
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => open('new')}>
            新增轉址
          </Button>
        }
      />

      <Table
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        error={query.error ? (query.error as Error).message : null}
        onRetry={() => query.refetch()}
        onRowClick={open}
        emptyTitle="還沒有手動補登的轉址"
      />

      {editing && (
        <Drawer
          open
          onClose={() => setEditing(null)}
          width="520px"
          title={editing === 'new' ? '新增轉址' : '編輯轉址'}
          footer={
            <>
              {editing !== 'new' && (
                <Button
                  variant="danger"
                  className="mr-auto"
                  icon={<Icon name="trash-2" size={15} />}
                  loading={remove.isPending}
                  onClick={() => setConfirmingDelete(true)}
                >
                  刪除
                </Button>
              )}
              <Button variant="secondary" onClick={() => setEditing(null)}>
                取消
              </Button>
              <Button variant="primary" loading={save.isPending} onClick={submit}>
                儲存
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field
              label="來源路徑"
              required
              error={errors.fromPath}
              hint="會自動轉成小寫並去掉結尾斜線。含不含語系前綴都可以。"
            >
              <Input
                value={form.fromPath}
                placeholder="/store/anti-glare-film.html"
                className="font-mono"
                error={Boolean(errors.fromPath)}
                onChange={(event) => setForm({ ...form, fromPath: event.target.value })}
              />
            </Field>

            <Field label="狀態碼" hint="410 表示內容永久移除且沒有替代頁面。">
              <Select
                value={form.statusCode}
                options={REDIRECT_STATUS_OPTIONS}
                onChange={(event) => setForm({ ...form, statusCode: event.target.value })}
              />
            </Field>

            {form.statusCode !== '410' && (
              <Field label="目標路徑" required error={errors.toPath}>
                <Input
                  value={form.toPath}
                  placeholder="/en/products/optical-film"
                  className="font-mono"
                  error={Boolean(errors.toPath)}
                  onChange={(event) => setForm({ ...form, toPath: event.target.value })}
                />
              </Field>
            )}

            <Field label="目標語系" hint="來源路徑沒有 /en 或 /zh-Hant 前綴時，要指定轉去哪個語系。">
              <Select
                value={form.targetCulture}
                options={[
                  { value: '', label: '不指定（來源已含語系）' },
                  ...CULTURES.map((item) => ({ value: item.value, label: item.label })),
                ]}
                onChange={(event) => setForm({ ...form, targetCulture: event.target.value })}
              />
            </Field>

            <Field label="啟用">
              <div className="pt-1">
                <Switch checked={form.isEnabled} onCheckedChange={(value) => setForm({ ...form, isEnabled: value })} />
              </div>
            </Field>

            <Field label="備註" hint="寫下這筆是為了什麼而建，半年後的自己會需要。">
              <Textarea
                value={form.notes}
                rows={2}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>
          </div>
        </Drawer>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        pending={remove.isPending}
        tone="danger"
        title="刪除這筆轉址？"
        description="轉址會從資料庫永久移除，不能復原。原本會被導走的舊網址，之後會直接變成 404。"
        confirmLabel="刪除"
        onConfirm={async () => {
          try {
            await remove.mutateAsync((editing as AdminRow).id);
            toast({ title: '轉址已刪除', variant: 'success' });
            setEditing(null);
          } catch (error) {
            toast({ title: '刪除沒有完成', description: (error as Error).message, variant: 'danger' });
          } finally {
            setConfirmingDelete(false);
          }
        }}
      />
    </>
  );
}
