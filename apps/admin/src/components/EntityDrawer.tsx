import { Button, Drawer, Icon, LoadingBlock, useToast } from '@/ui';
import type { Culture } from '@/lib/enums';
import { useEntityDraft, useUnsavedGuard } from '@/lib/draft';
import { useItem } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { rowTitle } from '@/lib/format';
import { EntityForm, scrollToFirstFieldError } from './EntityForm';
import { RecordActions } from './RecordActions';

/**
 * 抽屜裡的單筆編輯。清單型與排序型畫面共用同一個 —— 這兩型畫面的差別在清單怎麼排，
 * 不在編輯長什麼樣子，編輯體驗分兩份只會慢慢長歪。
 */
export function EntityDrawer({
  resource,
  id,
  culture,
  onCultureChange,
  onClose,
}: {
  resource: ResourceDef;
  id: string;
  culture: Culture;
  onCultureChange: (culture: Culture) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const isNew = id === 'new';
  const query = useItem(resource.type, isNew ? undefined : id);
  const row = query.data;
  const draft = useEntityDraft(resource, row);
  useUnsavedGuard(draft.dirty);

  async function save() {
    const result = await draft.save();
    if (!result.ok) {
      // 抽屜比獨立編輯頁更容易漏看：欄位少、捲動短，錯誤若在另一個語系分頁就完全不在畫面上。
      if (result.culture) onCultureChange(result.culture);
      scrollToFirstFieldError();
      toast({ ...result.notice, variant: 'danger' });
      return;
    }
    // 同 EntityEditor：用畫面上剛存的值算標題，不是等下一次查詢回來。
    const savedTitle = rowTitle({ ...draft.base, translations: draft.translations } as AdminRow, resource, culture);
    toast({ title: `已儲存「${savedTitle}」的變更`, variant: 'success' });
    onClose();
  }

  return (
    <Drawer
      open
      onClose={onClose}
      width="560px"
      title={isNew ? `新增${resource.singular}` : row ? rowTitle(row, resource, culture) : '載入中…'}
      description={isNew ? resource.description : undefined}
      footer={
        <>
          {row && <RecordActions resource={resource} row={row} onDeleted={onClose} />}
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" loading={draft.saving} onClick={save}>
            儲存
          </Button>
        </>
      }
    >
      {!isNew && query.isLoading ? (
        <LoadingBlock className="py-8" />
      ) : (
        <div className="flex flex-col gap-5">
          {draft.submitError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--danger-500)] bg-[var(--danger-50)] px-4 py-3 text-sm text-[var(--danger-500)]"
            >
              <Icon name="circle-alert" size={15} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-medium">{draft.submitError.title}</span>
                {draft.submitError.description && <> —— {draft.submitError.description}</>}
              </span>
            </p>
          )}

          <EntityForm resource={resource} draft={draft} culture={culture} onCultureChange={onCultureChange} />
        </div>
      )}
    </Drawer>
  );
}
