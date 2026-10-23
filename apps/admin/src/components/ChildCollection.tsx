import { Badge, Button, Card, Icon, IconButton } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import type { EntityDraft } from '@/lib/draft';
import type { ChildCollectionDef } from '@/lib/resources';
import { BlockItemList } from './BlockItemList';
import { FieldGrid } from './EntityForm';

/** `en` / `zh-Hant` 這種代碼是給程式看的；畫面上一律顯示配好的中文講法。 */
function cultureLabel(culture: string): string {
  return CULTURES.find((item) => item.value === culture)?.label ?? culture;
}

/**
 * 子項編輯器：規格列、版塊、製程步驟這種「附屬於一筆內容、順序有意義」的東西。
 *
 * <p>
 * 子項**跟著母體一起送出**（存在基底 payload 的一個陣列欄位裡），不另外打 API。
 * 理由是這些子項沒有獨立的生命週期——一條規格列離開它的產品沒有意義，而分開送出會
 * 讓「改了三列規格但母體存檔失敗」變成一種可能發生的狀態。
 * </p>
 *
 * <p>
 * `fixed` 的集合（版塊）結構已定版：不給新增、刪除、排序，只改既有項目的內容。
 * </p>
 *
 * <p>
 * 子項也有自己的翻譯列，這裡跟著母體目前選的語系走；換語系時上方分頁一切，
 * 下面的子項就一起換，不會出現母體是中文、規格列還停在英文的畫面。
 * </p>
 */

type ChildItem = Record<string, unknown> & {
  id?: string;
  translations?: Record<string, Record<string, unknown>>;
};

export function ChildCollection({
  definition,
  draft,
  culture,
}: {
  definition: ChildCollectionDef;
  draft: EntityDraft;
  culture: Culture;
}) {
  const items = (Array.isArray(draft.base[definition.key]) ? draft.base[definition.key] : []) as ChildItem[];

  function update(next: ChildItem[]) {
    draft.setBase(definition.key, next);
  }

  /**
   * 子項的錯誤鍵是 `{key}.{index}.{欄位}`（見 lib/draft.ts），**綁在列的位置上**。
   * 刪掉一列或上下搬動之後，留著的訊息會貼到另一列去 —— 改結構就把整組清掉，
   * 由下一次存檔重新算。改單一格的值則只清那一格。
   */
  function reshape(next: ChildItem[]) {
    draft.clearErrors(`${definition.key}.`);
    update(next);
  }

  function add() {
    update([...items, { id: `new-${Date.now()}`, translations: {} }]);
  }

  function remove(index: number) {
    reshape(items.filter((_, position) => position !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    reshape(next);
  }

  function setItemBase(index: number, name: string, value: unknown) {
    draft.clearErrors(`${definition.key}.${index}.${name}`);
    update(items.map((item, position) => (position === index ? { ...item, [name]: value } : item)));
  }

  function setItemTranslation(index: number, name: string, value: unknown) {
    draft.clearErrors(`${definition.key}.${index}.${culture}.${name}`);
    update(
      items.map((item, position) =>
        position === index
          ? {
              ...item,
              translations: {
                ...item.translations,
                [culture]: { ...item.translations?.[culture], [name]: value },
              },
            }
          : item,
      ),
    );
  }

  return (
    <Card
      title={definition.label}
      description={definition.description}
      actions={
        definition.fixed ? undefined : (
          <Button size="sm" icon={<Icon name="plus" size={14} />} onClick={add}>
            新增一列
          </Button>
        )
      }
    >
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--fg-2)]">
          {definition.fixed ? `這一頁沒有${definition.label}。` : `還沒有${definition.label}。按右上角新增一列。`}
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {items.map((item, index) => {
            // 固定頁面的版塊各有各的用途：換成它在前台的位置與前台真的讀的欄位
            const layout = definition.itemLayout?.(draft.base, item) ?? null;
            const baseFields = layout?.baseFields ?? definition.baseFields;
            const translationFields = layout?.translationFields ?? definition.translationFields;

            return (
              <li
                key={String(item.id ?? index)}
                className="rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--surface-card-alt)] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {!definition.fixed && <Icon name="grip-vertical" size={14} className="text-[var(--fg-3)]" />}
                    {layout ? (
                      <span className="text-sm font-medium text-[var(--fg-1)]">{layout.label}</span>
                    ) : (
                      <Badge tone="neutral">
                        第 {index + 1} {definition.fixed ? '塊' : '列'}
                      </Badge>
                    )}
                  </span>
                  {!definition.fixed && (
                    <span className="flex items-center gap-1">
                      <IconButton icon="chevron-up" label="上移" size="sm" onClick={() => move(index, -1)} disabled={index === 0} />
                      <IconButton
                        icon="chevron-down"
                        label="下移"
                        size="sm"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                      />
                      <IconButton icon="trash-2" label="刪除這一列" size="sm" className="hover:text-[var(--danger-500)]" onClick={() => remove(index)} />
                    </span>
                  )}
                </div>

                {layout?.note && <p className="mb-3 text-xs text-[var(--fg-2)]">{layout.note}</p>}

                {layout && baseFields.length === 0 && translationFields.length === 0 && !layout.items ? (
                  <p className="text-xs text-[var(--fg-3)]">前台不會顯示這個版塊的文字，這裡沒有需要修改的欄位。</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {baseFields.length > 0 && (
                      <FieldGrid
                        fields={baseFields}
                        values={item}
                        errors={draft.errors}
                        errorPrefix={`${definition.key}.${index}`}
                        onChange={(name, value) => setItemBase(index, name, value)}
                      />
                    )}
                    {translationFields.length > 0 && (
                      <div className={baseFields.length > 0 ? 'border-t border-[var(--border-1)] pt-4' : undefined}>
                        <p className="mb-3 text-xs text-[var(--fg-2)]">
                          以下欄位屬於<span className="font-medium text-[var(--fg-1)]">{cultureLabel(culture)}</span>，
                          切換上方語系分頁可編輯另一個語系。
                        </p>
                        <FieldGrid
                          fields={translationFields}
                          values={item.translations?.[culture] ?? {}}
                          errors={draft.errors}
                          errorPrefix={`${definition.key}.${index}.${culture}`}
                          onChange={(name, value) => setItemTranslation(index, name, value)}
                        />
                      </div>
                    )}
                    {layout?.items && (
                      <BlockItemList
                        layout={layout.items}
                        items={Array.isArray(item.items) ? item.items : []}
                        culture={culture}
                        draft={draft}
                        errorPrefix={`${definition.key}.${index}.items`}
                        onChange={(next) => setItemBase(index, 'items', next)}
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
