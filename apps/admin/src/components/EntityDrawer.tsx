import { Button, Drawer, useToast } from '@/ui';
import type { Culture } from '@/lib/enums';
import { useEntityDraft, useUnsavedGuard } from '@/lib/draft';
import { useItem } from '@/lib/queries';
import type { ResourceDef } from '@/lib/resources';
import { rowTitle } from '@/lib/format';
import { EntityForm } from './EntityForm';
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
    const saved = await draft.save();
    if (!saved) {
      toast({ title: '有欄位需要修正', description: '紅字標示的欄位填好後再存一次。', variant: 'danger' });
      return;
    }
    toast({ title: `已儲存${resource.singular}`, variant: 'success' });
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
        <p className="py-8 text-center text-sm text-[var(--fg-2)]">載入中…</p>
      ) : (
        <EntityForm resource={resource} draft={draft} culture={culture} onCultureChange={onCultureChange} />
      )}
    </Drawer>
  );
}
