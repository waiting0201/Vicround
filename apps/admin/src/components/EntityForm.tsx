import { Badge, Card, Icon, Tabs } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import { hasErrorsIn, type EntityDraft } from '@/lib/draft';
import type { FieldDef, ResourceDef } from '@/lib/resources';
import { FieldControl } from './FieldControl';

/** `en` / `zh-Hant` 這種代碼是給程式看的；畫面上一律顯示 `CULTURES` 裡配好的中文講法。 */
function cultureLabel(culture: string): string {
  return CULTURES.find((item) => item.value === culture)?.label ?? culture;
}

/**
 * 一筆內容的完整編輯表單：**上半部是不分語系的基底資料，下半部是 en / zh-Hant 分頁**。
 *
 * <p>
 * 這個上下切分不是排版偏好，是資料模型的形狀（docs/database.md §0.2）。把語系分頁擺在
 * 整個表單最外層會讓 slug、分類、排序這些 culture-neutral 的欄位看起來像「英文版的設定」，
 * 編輯者就會問「那中文版的 slug 呢」——問題出在版面，不是出在他。
 * </p>
 */

const SEO_FIELD_NAMES = new Set(['seoTitle', 'seoDescription', 'seoKeywords', 'ogImageMediaAssetId']);

export function EntityForm({
  resource,
  draft,
  culture,
  onCultureChange,
}: {
  resource: ResourceDef;
  draft: EntityDraft;
  culture: Culture;
  onCultureChange: (culture: Culture) => void;
}) {
  const contentFields = resource.translationFields.filter((field) => !SEO_FIELD_NAMES.has(field.name));
  const seoFields = resource.translationFields.filter((field) => SEO_FIELD_NAMES.has(field.name));

  return (
    <div className="flex flex-col gap-5">
      {resource.baseFields.length > 0 && (
        <Card title="基本資料" description="不分語系，兩個語系共用同一份。">
          <FieldGrid
            fields={resource.baseFields}
            values={draft.base}
            errorPrefix="base"
            errors={draft.errors}
            onChange={draft.setBase}
          />
        </Card>
      )}

      {resource.hasTranslations && resource.translationFields.length > 0 && (
        <Card
          title="內容"
          description="每個語系各存一份；沒有填的語系前台不會顯示，也不會宣告該語系的 hreflang。"
          padding={false}
        >
          <div className="px-5 pt-4">
            <Tabs
              value={culture}
              onValueChange={(value) => onCultureChange(value as Culture)}
              items={CULTURES.map((item) => ({
                key: item.value,
                label: item.label,
                // 錯誤優先於缺漏：缺漏可以先存著，錯誤會擋下存檔，要先被看到
                indicator: hasErrorsIn(draft.errors, item.value)
                  ? 'danger'
                  : isTranslationEmpty(draft, item.value, resource)
                    ? 'warning'
                    : 'none',
              }))}
            />
          </div>

          <div className="flex flex-col gap-5 p-5">
            {hasErrorsIn(draft.errors, culture) && (
              <p className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--danger-50)] px-3 py-2 text-xs text-[var(--danger-500)]" role="alert">
                <Icon name="circle-alert" size={14} />
                這個語系有欄位需要修正，見下方紅字。
              </p>
            )}

            {!hasErrorsIn(draft.errors, culture) && isTranslationEmpty(draft, culture, resource) && (
              <p className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--warning-50)] px-3 py-2 text-xs text-[var(--warning-500)]">
                <Icon name="alert-triangle" size={14} />
                這個語系還沒有內容。存檔後前台的{cultureLabel(culture)}版本會找不到這一筆。
              </p>
            )}

            <FieldGrid
              fields={contentFields}
              values={draft.translations[culture] ?? {}}
              errorPrefix={culture}
              errors={draft.errors}
              onChange={(name, value) => draft.setTranslation(culture, name, value)}
            />

            {resource.hasSeo && seoFields.length > 0 && (
              <div className="border-t border-[var(--border-1)] pt-5">
                <div className="mb-4 flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--fg-1)]">搜尋結果呈現</h4>
                  <Badge tone="neutral">{cultureLabel(culture)}</Badge>
                </div>
                <FieldGrid
                  fields={seoFields}
                  values={draft.translations[culture] ?? {}}
                  errorPrefix={culture}
                  errors={draft.errors}
                  onChange={(name, value) => draft.setTranslation(culture, name, value)}
                />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * 存檔被驗證擋下後，把畫面捲到第一個紅字上。
 *
 * <p>
 * 兩個 `requestAnimationFrame`：呼叫端通常同時切了語系分頁，要等 React 重繪完，
 * 新分頁裡的欄位才存在於 DOM。`block: 'center'` 而不是 `'start'` —— 編輯頁底部有固定
 * 動作列、頂部有 PageHeader，靠邊對齊會被蓋掉半截。
 * </p>
 */
export function scrollToFirstFieldError() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const target = document.querySelector('[data-field-error]');
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }),
  );
}

export function FieldGrid({
  fields,
  values,
  errors,
  errorPrefix,
  onChange,
  disabled,
}: {
  fields: FieldDef[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  errorPrefix: string;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
      {fields
        .filter((field) => !field.visibleWhen || field.visibleWhen(values))
        .map((field) => (
        <FieldControl
          key={field.name}
          field={field}
          value={values[field.name]}
          values={values}
          error={errors[`${errorPrefix}.${field.name}`] || undefined}
          disabled={disabled}
          onChange={(value) => onChange(field.name, value)}
        />
      ))}
    </div>
  );
}

/** 這個語系的必填欄位是不是全空 —— 分頁上的黃點與上方提示都看這個。 */
function isTranslationEmpty(draft: EntityDraft, culture: string, resource: ResourceDef): boolean {
  const values = draft.translations[culture] ?? {};
  const required = resource.translationFields.filter((field) => field.required);
  const checked = required.length ? required : resource.translationFields.slice(0, 1);
  return checked.every((field) => String(values[field.name] ?? '').trim() === '');
}
