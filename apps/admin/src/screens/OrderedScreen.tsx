import { useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, IconButton, LoadingBlock, PageHeader, useToast } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import { useList, useReorder } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { missingCultures, optionLabel, rowTitle } from '@/lib/format';
import { describeError } from '@/lib/errors';
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

  /**
   * `useSaveItem`／`useSaveTranslation` 存檔成功會 invalidate 整個 type 的查詢
   * （`lib/queries.ts` 的註解：「動到某個 type 的任何一筆，就讓那個 type 的所有查詢重抓」）——
   * 包括這一頁自己的 `useList`。如果編輯者剛排好順序（`dirty === true`）還沒按「儲存排序」，
   * 就先開抽屜改了某一列的文字並存檔，這個 effect 若照舊用新資料整包覆蓋 `order`，
   * 手動排好的順序會被悄悄丟掉，而畫面上完全沒有提示發生了什麼事。
   *
   * <p>
   * 所以 `dirty` 時**不整批換掉**，只用新資料更新既有列的內容（標題、狀態這些
   * 抽屜可能改到的欄位），順序與已經刪除的列維持使用者當下排的那一份。
   * </p>
   */
  useEffect(() => {
    if (!query.data) return;
    setOrder((current) => {
      if (!dirty) return query.data.items;
      const byId = new Map(query.data.items.map((row) => [row.id, row]));
      return current.filter((row) => byId.has(row.id)).map((row) => byId.get(row.id)!);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      await reorder.mutateAsync(order.map((row) => row.id));
    } catch (error) {
      // 失敗時**不清掉 dirty**：畫面上的順序還是使用者排的那一份，再按一次就重送。
      toast({ ...describeError(error, '排序沒有存起來'), variant: 'danger' });
      return;
    }
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
          <LoadingBlock className="py-12" />
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
