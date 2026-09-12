import { useState } from 'react';
import { Button, ConfirmDialog, Icon, useToast } from '@/ui';
import { useDeleteItem, usePublishItem } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';

/**
 * 發布／取消發布／刪除三顆按鈕。
 *
 * <p>
 * 三個動作都會改到**公開站看得到的東西**，所以三個都要先問一次，而且問題要具體：
 * 「確定嗎？」沒有資訊量，「這會讓 /en/products/ag 立刻從網站上消失」才有。
 * 刪除是**真的刪掉**（2026-09-12 起不再封存），救不回來，所以它是唯一一顆 `danger` 實心鈕，
 * 對話框也要把「不可復原」與「舊網址會變成 410」講明白。
 * </p>
 */
export function RecordActions({
  resource,
  row,
  onDeleted,
}: {
  resource: ResourceDef;
  row: AdminRow;
  onDeleted?: () => void;
}) {
  const { toast } = useToast();
  const publish = usePublishItem(resource.type);
  const remove = useDeleteItem(resource.type);
  const [confirming, setConfirming] = useState<'publish' | 'unpublish' | 'delete' | null>(null);

  const status = String(row.status ?? '');
  const isPublished = status === 'published';

  async function run() {
    try {
      if (confirming === 'delete') {
        await remove.mutateAsync(row.id);
        toast({ title: `已刪除這筆${resource.singular}`, description: '舊網址已寫成 410，不會變成 404。', variant: 'success' });
        onDeleted?.();
      } else if (confirming) {
        await publish.mutateAsync({ id: row.id, next: confirming === 'publish' ? 'published' : 'draft' });
        toast({
          title: confirming === 'publish' ? '已發布' : '已取消發布',
          description: '前台會在下一次請求就看到變更。',
          variant: 'success',
        });
      }
    } catch (error) {
      toast({ title: '動作沒有完成', description: (error as Error).message, variant: 'danger' });
    } finally {
      setConfirming(null);
    }
  }

  return (
    <>
      {resource.hasStatus && (
        <Button
          variant="secondary"
          icon={<Icon name={isPublished ? 'eye-off' : 'globe'} size={15} />}
          onClick={() => setConfirming(isPublished ? 'unpublish' : 'publish')}
        >
          {isPublished ? '取消發布' : '發布'}
        </Button>
      )}

      <Button
        variant="danger"
        icon={<Icon name="trash-2" size={15} />}
        onClick={() => setConfirming('delete')}
      >
        刪除
      </Button>

      <ConfirmDialog
        open={confirming === 'publish'}
        onClose={() => setConfirming(null)}
        onConfirm={run}
        pending={publish.isPending}
        title={`發布這筆${resource.singular}？`}
        description="發布後公開站立刻看得到，兩個語系的快取都會失效重抓。"
        confirmLabel="發布"
      />

      <ConfirmDialog
        open={confirming === 'unpublish'}
        onClose={() => setConfirming(null)}
        onConfirm={run}
        pending={publish.isPending}
        tone="danger"
        title={`取消發布這筆${resource.singular}？`}
        description="它會從公開站消失，網址會變成 404，但資料還在，可以再次發布。"
        confirmLabel="取消發布"
      />

      <ConfirmDialog
        open={confirming === 'delete'}
        onClose={() => setConfirming(null)}
        onConfirm={run}
        pending={remove.isPending}
        tone="danger"
        title={`刪除這筆${resource.singular}？`}
        description="資料會從資料庫永久移除，不能復原；原本的網址會寫成 410（永久移除），不會留下 404。若還有其他內容引用它，刪除會被擋下來。"
        confirmLabel="刪除"
      />
    </>
  );
}
