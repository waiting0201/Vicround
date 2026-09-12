import { useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, IconButton, LoadingBlock, PageHeader, Tabs, useToast } from '@/ui';
import {
  CULTURES,
  LINK_TARGET_TYPE_LABEL,
  NAVIGATION_LOCATION_OPTIONS,
  type Culture,
} from '@/lib/enums';
import { useList, useReorder } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { missingCultures, rowTitle } from '@/lib/format';
import { EntityDrawer } from '@/components/EntityDrawer';

/**
 * 導覽選單。
 *
 * <p>
 * 五個位置（Header／Footer／法律連結／社群／熱門搜尋）各自是**獨立的排序空間**，
 * 所以用分頁切開；同一份清單混在一起排序，只會讓人把 Footer 的項目移到 Header 的中間。
 * </p>
 *
 * <p>
 * 用手刻的縮排清單而不是表格：表格是平的，畫不出「Optical Film 掛在 Products 底下」。
 * 上移／下移只在同一層內移動 —— 換層級請在編輯抽屜裡改「上層項目」，那是有意識的決定，
 * 不該用方向鍵不小心做到。
 * </p>
 */
export function NavigationScreen({ resource }: { resource: ResourceDef }) {
  const { toast } = useToast();
  const [location, setLocation] = useState<string>(NAVIGATION_LOCATION_OPTIONS[0].value);
  const [culture, setCulture] = useState<Culture>(CULTURES[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [items, setItems] = useState<AdminRow[]>([]);
  const [dirty, setDirty] = useState(false);

  const query = useList(resource.type, { location, pageSize: 200 });
  const reorder = useReorder(resource.type);

  useEffect(() => {
    if (query.data) {
      setItems(query.data.items);
      setDirty(false);
    }
  }, [query.data]);

  const roots = items.filter((item) => !item.parentId);
  const childrenOf = (id: string) => items.filter((item) => item.parentId === id);

  /** 只在同一個 parent 底下換位置；跨層級要去抽屜改「上層項目」。 */
  function move(row: AdminRow, delta: number) {
    const siblings = items.filter((item) => (item.parentId ?? null) === (row.parentId ?? null));
    const index = siblings.findIndex((item) => item.id === row.id);
    const target = index + delta;
    if (target < 0 || target >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    let cursor = 0;
    setItems(
      items.map((item) =>
        (item.parentId ?? null) === (row.parentId ?? null) ? reordered[cursor++] : item,
      ),
    );
    setDirty(true);
  }

  async function saveOrder() {
    const flat: string[] = [];
    for (const root of roots) {
      flat.push(root.id);
      for (const child of childrenOf(root.id)) flat.push(child.id);
    }
    await reorder.mutateAsync(flat);
    setDirty(false);
    toast({ title: '選單順序已儲存', description: '前台的 Header 與 Footer 會依這份順序顯示。', variant: 'success' });
  }

  function renderRow(row: AdminRow, depth: number) {
    const missing = missingCultures(row, resource);

    return (
      <li key={row.id}>
        <div
          className="flex items-center gap-3 border-b border-[var(--border-1)] px-4 py-2.5 hover:bg-[var(--surface-card-alt)]"
          style={{ paddingLeft: 16 + depth * 20 }}
        >
          <Icon
            name={depth > 0 ? 'chevron-right' : 'grip-vertical'}
            size={14}
            className="shrink-0 text-[var(--fg-3)]"
          />

          <button
            type="button"
            onClick={() => setEditingId(row.id)}
            className="min-w-0 flex-1 text-left text-sm font-medium text-[var(--fg-1)] hover:underline"
          >
            {rowTitle(row, resource, culture)}
          </button>

          <Badge tone="neutral">
            {LINK_TARGET_TYPE_LABEL[row.linkType as keyof typeof LINK_TARGET_TYPE_LABEL] ?? '未設定'}
          </Badge>

          {CULTURES.map((item) => (
            <Badge key={item.value} tone={missing.includes(item.value) ? 'warning' : 'success'}>
              {item.short}
            </Badge>
          ))}

          <span className="flex shrink-0 items-center gap-1">
            <IconButton icon="chevron-up" label="上移" size="sm" onClick={() => move(row, -1)} />
            <IconButton icon="chevron-down" label="下移" size="sm" onClick={() => move(row, 1)} />
            <IconButton icon="pencil" label="編輯" size="sm" onClick={() => setEditingId(row.id)} />
          </span>
        </div>

        {childrenOf(row.id).length > 0 && <ul>{childrenOf(row.id).map((child) => renderRow(child, depth + 1))}</ul>}
      </li>
    );
  }

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
            <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => setEditingId('new')}>
              新增項目
            </Button>
          </>
        }
      />

      <Tabs
        className="mb-4"
        value={location}
        onValueChange={setLocation}
        items={NAVIGATION_LOCATION_OPTIONS.map((option) => ({ key: option.value, label: option.label }))}
      />

      <Card padding={false}>
        {query.isLoading ? (
          <LoadingBlock className="py-12" />
        ) : roots.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--fg-2)]">這個位置還沒有選單項目。</p>
        ) : (
          <ul>{roots.map((row) => renderRow(row, 0))}</ul>
        )}
      </Card>

      {dirty && (
        <p className="mt-3 text-xs text-[var(--warning-500)]">順序改過了但還沒儲存 —— 離開這一頁會回到原本的順序。</p>
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
