import { Button, Icon, IconButton } from '@/ui';
import type { Culture } from '@/lib/enums';
import type { EntityDraft } from '@/lib/draft';
import type { ChildItemLayout } from '@/lib/resources';
import { FieldGrid } from './EntityForm';

type Item = Record<string, unknown> & {
  id?: string | number;
  translations?: Record<string, Record<string, unknown>>;
};

/**
 * 版塊底下的項目：卡片、數字、標籤（`ContentBlockItems`）。
 *
 * <p>
 * 版塊本身結構固定，項目不是——產品線的數字可以三個也可以四個，前台的格線會跟著數量排。
 * 所以這裡給新增、刪除與上下移。項目跟著版塊、版塊跟著母體一起送出（理由同 ChildCollection），
 * 後端把這一組整個換掉。
 * </p>
 */
export function BlockItemList({
  layout,
  items,
  culture,
  draft,
  errorPrefix,
  onChange,
}: {
  layout: NonNullable<ChildItemLayout['items']>;
  items: Item[];
  culture: Culture;
  draft: EntityDraft;
  errorPrefix: string;
  onChange: (next: Item[]) => void;
}) {
  /** 錯誤鍵綁在位置上，改結構就整組清掉（同 ChildCollection.reshape）。 */
  function reshape(next: Item[]) {
    draft.clearErrors(`${errorPrefix}.`);
    onChange(next);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    reshape(next);
  }

  function setBase(index: number, name: string, value: unknown) {
    onChange(items.map((item, position) => (position === index ? { ...item, [name]: value } : item)));
  }

  function setTranslation(index: number, name: string, value: unknown) {
    onChange(
      items.map((item, position) =>
        position === index
          ? { ...item, translations: { ...item.translations, [culture]: { ...item.translations?.[culture], [name]: value } } }
          : item,
      ),
    );
  }

  return (
    <div className="border-t border-[var(--border-1)] pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--fg-1)]">
          {layout.label}（{items.length}）
        </span>
        <Button
          size="sm"
          icon={<Icon name="plus" size={14} />}
          onClick={() => reshape([...items, { id: `new-${Date.now()}`, translations: {} }])}
        >
          新增一{layout.noun}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-2 text-center text-xs text-[var(--fg-2)]">還沒有{layout.label}，前台這一段會是空的。</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li
              key={String(item.id ?? index)}
              className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--surface-card)] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--fg-2)]">第 {index + 1} {layout.noun}</span>
                <span className="flex items-center gap-1">
                  <IconButton icon="chevron-up" label="上移" size="sm" onClick={() => move(index, -1)} disabled={index === 0} />
                  <IconButton
                    icon="chevron-down"
                    label="下移"
                    size="sm"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                  />
                  <IconButton
                    icon="trash-2"
                    label={`刪除這${layout.noun}`}
                    size="sm"
                    className="hover:text-[var(--danger-500)]"
                    onClick={() => reshape(items.filter((_, position) => position !== index))}
                  />
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {layout.baseFields.length > 0 && (
                  <FieldGrid
                    fields={layout.baseFields}
                    values={item}
                    errors={draft.errors}
                    errorPrefix={`${errorPrefix}.${index}`}
                    onChange={(name, value) => setBase(index, name, value)}
                  />
                )}
                {layout.translationFields.length > 0 && (
                  <FieldGrid
                    fields={layout.translationFields}
                    values={item.translations?.[culture] ?? {}}
                    errors={draft.errors}
                    errorPrefix={`${errorPrefix}.${index}.${culture}`}
                    onChange={(name, value) => setTranslation(index, name, value)}
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
