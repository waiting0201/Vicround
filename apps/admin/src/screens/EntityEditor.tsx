import { useState } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router';
import { Button, ConfirmDialog, Icon, LoadingBlock, PageHeader, useToast } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import { useEntityDraft, useUnsavedGuard } from '@/lib/draft';
import { useItem } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { rowTitle } from '@/lib/format';
import { EntityForm, scrollToFirstFieldError } from '@/components/EntityForm';
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
    const result = await draft.save();
    if (!result.ok) {
      // 錯誤可能落在另一個語系分頁上：先切過去，Toast 說的「紅字」才真的看得到。
      // 後端擋下來的訊息另外留在表單上方（`draft.submitError`），Toast 飄走了還查得到。
      if (result.culture) setCulture(result.culture);
      scrollToFirstFieldError();
      toast({ ...result.notice, variant: 'danger' });
      return;
    }
    // 用畫面上剛存的值算標題（不是等下一次查詢回來）：新增時 query 的 row 還是
    // undefined，得等重新導向後才會有；用 draft 目前的內容才拿得到「剛存的是哪一筆」。
    const savedTitle = rowTitle({ ...draft.base, translations: draft.translations } as AdminRow, resource, culture);
    toast({ title: `已儲存「${savedTitle}」的變更`, variant: 'success' });
    if (isNew) navigate(`/${resource.type}/${result.id}`, { replace: true });
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
            {/* 還沒建立的那一筆不能說「所有變更都已儲存」—— 畫面上一個字都還沒進資料庫 */}
            {isNew && !draft.dirty ? '這筆還沒有建立' : draft.dirty ? '有尚未儲存的變更' : '所有變更都已儲存'}
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
