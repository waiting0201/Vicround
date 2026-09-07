import { useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, IconButton, PageHeader, useToast } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import { useList, useReorder } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { missingCultures, optionLabel, rowTitle } from '@/lib/format';
import { CreateButton } from '@/components/ResourceList';
import { EntityDrawer } from '@/components/EntityDrawer';
import { StatusBadge } from '@/components/StatusBadge';

/**
 * 排序型清單：**順序本身就是內容**（導覽選單、FAQ 分類、里程碑）。
 *
 * <p>
 * 這一型不分頁也不排序欄位 —— 分頁會讓「把這一項移到第一個」變成跨頁操作，
 * 而依欄位排序會讓畫面上看到的順序不是前台的順序，兩者都會讓編輯者失去對結果的預期。
 * 改完按一次「儲存排序」整批送出，不是每移動一格就打一次 API。
 * </p>
 */
export function OrderedScreen({ resource }: { resource: ResourceDef }) {
  const { toast } = useToast();
  const [culture, setCulture] = useState<Culture>(CULTURES[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [order, setOrder] = useState<AdminRow[]>([]);
  const [dirty, setDirty] = useState(false);

  const query = useList(resource.type, { pageSize: 200 });
  const reorder = useReorder(resource.type);

  useEffect(() => {
    if (query.data) {
      setOrder(query.data.items);
      setDirty(false);
    }
  }, [query.data]);

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setDirty(true);
  }

  async function saveOrder() {
    await reorder.mutateAsync(order.map((row) => row.id));
    setDirty(false);
    toast({ title: '排序已儲存', description: '前台的顯示順序會跟著這一份。', variant: 'success' });
  }

  const badgeColumn = resource.columns.find((column) => column.type === 'badge');

  return (
    <>
      <PageHeader
        title={resource.label}
        description={resource.description}
        actions={
          <>
            <Button variant="secondary" loading={reorder.isPending} disabled={!dirty} onClick={saveOrder}>
              儲存排序
            </Button>
            <CreateButton label={resource.singular} onClick={() => setEditingId('new')} />
          </>
        }
      />

      <Card padding={false}>
        {query.isLoading ? (
          <p className="py-12 text-center text-sm text-[var(--fg-2)]">載入中…</p>
        ) : order.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--fg-2)]">還沒有{resource.label}。</p>
        ) : (
          <ol>
            {order.map((row, index) => {
              const missing = missingCultures(row, resource);
              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 border-b border-[var(--border-1)] px-4 py-3 last:border-0 hover:bg-[var(--surface-card-alt)]"
                >
                  <Icon name="grip-vertical" size={15} className="shrink-0 text-[var(--fg-3)]" />
                  <span className="w-6 shrink-0 text-xs tabular-nums text-[var(--fg-3)]">{index + 1}</span>

                  <button
                    type="button"
                    onClick={() => setEditingId(row.id)}
                    className="min-w-0 flex-1 text-left text-sm font-medium text-[var(--fg-1)] hover:underline"
                  >
                    {rowTitle(row, resource, culture)}
                  </button>

                  {badgeColumn && row[badgeColumn.name] ? (
                    <Badge tone="neutral">{optionLabel(badgeColumn.options, row[badgeColumn.name])}</Badge>
                  ) : null}

                  {resource.hasTranslations &&
                    CULTURES.map((item) => (
                      <Badge key={item.value} tone={missing.includes(item.value) ? 'warning' : 'success'}>
                        {item.short}
                      </Badge>
                    ))}

                  {resource.hasStatus && <StatusBadge status={row.status} />}

                  <span className="flex shrink-0 items-center gap-1">
                    <IconButton icon="chevron-up" label="上移" size="sm" disabled={index === 0} onClick={() => move(index, -1)} />
                    <IconButton
                      icon="chevron-down"
                      label="下移"
                      size="sm"
                      disabled={index === order.length - 1}
                      onClick={() => move(index, 1)}
                    />
                    <IconButton icon="pencil" label="編輯" size="sm" onClick={() => setEditingId(row.id)} />
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      {dirty && (
        <p className="mt-3 text-xs text-[var(--warning-500)]">
          順序改過了但還沒儲存 —— 離開這一頁會回到原本的順序。
        </p>
      )}

      {editingId && (
        <EntityDrawer
          resource={resource}
          id={editingId}
          culture={culture}
          onCultureChange={setCulture}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}
