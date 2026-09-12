import { useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import { Button, ConfirmDialog, Icon, LoadingBlock, PageHeader, useToast } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import { useEntityDraft, useUnsavedGuard } from '@/lib/draft';
import { useItem } from '@/lib/queries';
import type { ResourceDef } from '@/lib/resources';
import { rowTitle } from '@/lib/format';
import { EntityForm } from '@/components/EntityForm';
import { ChildCollection } from '@/components/ChildCollection';
import { RecordActions } from '@/components/RecordActions';

/**
 * 獨立編輯頁：基本資料 → 語系分頁 → 子項，底部是固定的動作列。
 *
 * <p>
 * 動作列固定在畫面底部而不是頁尾，是因為這些頁很長（產品頁光規格列就可能三十列）。
 * 儲存鈕跟著捲動走，編輯者才不用為了存檔捲到最下面 —— 而「忘記存」是後台最貴的錯誤。
 * </p>
 */
export function EntityEditor({ resource }: { resource: ResourceDef }) {
  const { id = 'new' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [culture, setCulture] = useState<Culture>(CULTURES[0].value);

  const isNew = id === 'new';
  const query = useItem(resource.type, isNew ? undefined : id);
  const row = query.data;
  const draft = useEntityDraft(resource, row);
  useUnsavedGuard(draft.dirty);

  /**
   * 站內換頁的攔截。`beforeunload` 只擋得住關分頁與重新整理 —— 實際上更常發生的是
   * 「改到一半按了側欄的別的項目」，那條路徑只有 data router 的 blocker 攔得住。
   */
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      draft.dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  const title = isNew ? `新增${resource.singular}` : row ? rowTitle(row, resource, culture) : '載入中…';
  const slugChanged = Boolean(row?.slug) && draft.base.slug !== row?.slug;

  async function save() {
    const saved = await draft.save();
    if (!saved) {
      toast({ title: '有欄位需要修正', description: '紅字標示的欄位填好後再存一次。', variant: 'danger' });
      return;
    }
    toast({ title: `已儲存${resource.singular}`, variant: 'success' });
    if (isNew) navigate(`/${resource.type}/${saved}`, { replace: true });
  }

  return (
    <div className="pb-24">
      <PageHeader
        title={title}
        description={isNew ? resource.description : undefined}
        breadcrumbs={[
          { label: resource.label, href: `/${resource.type}` },
          { label: isNew ? '新增' : '編輯' },
        ]}
        actions={
          <Button variant="ghost" icon={<Icon name="arrow-left" size={15} />} onClick={() => navigate(`/${resource.type}`)}>
            回到清單
          </Button>
        }
      />

      {!isNew && query.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="flex flex-col gap-5">
          {slugChanged && (
            <p className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--warning-500)] bg-[var(--warning-50)] px-4 py-3 text-sm text-[var(--warning-500)]">
              <Icon name="alert-triangle" size={15} className="mt-0.5 shrink-0" />
              <span>
                網址片段從 <code className="font-mono">{String(row?.slug)}</code> 改成{' '}
                <code className="font-mono">{String(draft.base.slug)}</code>。儲存時會自動建立一筆 301，
                舊網址不會變成 404，但外部連結與搜尋排名需要時間重新累積。
              </span>
            </p>
          )}

          <EntityForm resource={resource} draft={draft} culture={culture} onCultureChange={setCulture} />

          {resource.children?.map((child) => (
            <ChildCollection key={child.key} definition={child} draft={draft} culture={culture} />
          ))}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border-1)] bg-[var(--surface-card)] px-6 py-3 shadow-[var(--shadow-md)] lg:left-64">
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-[var(--fg-3)]">
            {draft.dirty ? '有尚未儲存的變更' : '所有變更都已儲存'}
          </span>
          {row && <RecordActions resource={resource} row={row} onDeleted={() => navigate(`/${resource.type}`)} />}
          <Button variant="secondary" onClick={draft.reset} disabled={!draft.dirty}>
            還原
          </Button>
          <Button variant="primary" loading={draft.saving} onClick={save}>
            儲存
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        tone="danger"
        title="離開這一頁？"
        description="有變更還沒儲存，離開就會丟掉。"
        confirmLabel="不儲存就離開"
        cancelLabel="留在這一頁"
      />
    </div>
  );
}
