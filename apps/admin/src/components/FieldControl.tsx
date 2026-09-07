import { useId, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Field,
  Icon,
  Input,
  Select,
  Switch,
  Textarea,
  cx,
} from '@/ui';
import { CULTURES } from '@/lib/enums';
import { useList } from '@/lib/queries';
import { resourceOf, type FieldDef } from '@/lib/resources';
import { formatBytes, isValidSlug, rowTitle, toSlug } from '@/lib/format';

/**
 * 把一條欄位定義（`lib/resources.ts` 的 `FieldDef`）畫成一個輸入控制項。
 *
 * <p>
 * 27 個畫面共用一支渲染器的理由不是「省程式碼」，是**一致性**：slug 的即時驗證、
 * 字數上限的提示、必填星號、關聯選單的載入中狀態，只要在這裡做對一次，
 * 27 個畫面就都是對的。反過來說，某個欄位需要特別處理時，處理的是「型別」而不是
 * 「某一頁的某一格」。
 * </p>
 */

export type FieldControlProps = {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldControl({ field, value, onChange, error, disabled }: FieldControlProps) {
  const id = useId();
  const readOnly = disabled || field.readOnly;
  const text = value === null || value === undefined ? '' : String(value);

  const hint = buildHint(field, text);

  return (
    <Field
      label={field.label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={field.required}
      className={field.wide ? 'md:col-span-2' : undefined}
    >
      {renderControl({ id, field, value, text, onChange, error: Boolean(error), readOnly })}
    </Field>
  );
}

/** 字數上限這種資訊，只有快接近上限時才有用 —— 一直顯示會變成雜訊。 */
function buildHint(field: FieldDef, text: string): string | undefined {
  if (field.maxLength && text.length > field.maxLength * 0.8) {
    return `${text.length} / ${field.maxLength} 字`;
  }
  if (field.type === 'html' && !field.hint) {
    return '直接輸入 HTML；所見即所得編輯器尚未接上。';
  }
  return field.hint;
}

type ControlArgs = {
  id: string;
  field: FieldDef;
  value: unknown;
  text: string;
  onChange: (value: unknown) => void;
  error: boolean;
  readOnly?: boolean;
};

function renderControl({ id, field, value, text, onChange, error, readOnly }: ControlArgs) {
  switch (field.type) {
    case 'textarea':
    case 'html':
      return (
        <Textarea
          id={id}
          value={text}
          rows={field.rows ?? (field.type === 'html' ? 8 : 3)}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          disabled={readOnly}
          error={error}
          onChange={(event) => onChange(event.target.value)}
          className={field.type === 'html' ? 'font-mono text-xs' : undefined}
        />
      );

    case 'json':
      return (
        <Textarea
          id={id}
          value={text}
          rows={field.rows ?? 4}
          placeholder={field.placeholder ?? '{ }'}
          disabled={readOnly}
          error={error}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-xs"
        />
      );

    case 'select':
      return (
        <Select
          id={id}
          value={text}
          options={field.options ?? []}
          placeholder="請選擇"
          disabled={readOnly}
          error={error}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    case 'boolean':
      return (
        <div className="pt-1">
          <Switch id={id} checked={Boolean(value)} disabled={readOnly} onCheckedChange={onChange} />
        </div>
      );

    case 'slug':
      return <SlugControl id={id} value={text} onChange={onChange} error={error} readOnly={readOnly} />;

    case 'color':
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(text) ? text : '#6436ef'}
            disabled={readOnly}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 w-10 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-transparent"
            aria-label={`${field.label}（色票）`}
          />
          <Input
            id={id}
            value={text}
            placeholder="#6436ef"
            disabled={readOnly}
            error={error}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      );

    case 'media':
      return <MediaControl id={id} value={text} onChange={onChange} readOnly={readOnly} />;

    case 'reference':
      return (
        <ReferenceControl
          id={id}
          refType={field.refType}
          value={text}
          onChange={onChange}
          error={error}
          readOnly={readOnly}
        />
      );

    case 'multiReference':
      return (
        <MultiReferenceControl
          refType={field.refType}
          options={field.options}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
        />
      );

    case 'icon':
      return (
        <Input
          id={id}
          value={text}
          placeholder="lucide 圖示名稱，例：layers"
          disabled={readOnly}
          error={error}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    default:
      return (
        <Input
          id={id}
          type={inputType(field)}
          value={text}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          disabled={readOnly}
          error={error}
          onChange={(event) =>
            onChange(field.type === 'number' ? numberOrNull(event.target.value) : event.target.value)
          }
        />
      );
  }
}

function inputType(field: FieldDef): string {
  switch (field.type) {
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'datetime':
      return 'datetime-local';
    case 'email':
      return 'email';
    case 'url':
      return 'url';
    default:
      return 'text';
  }
}

function numberOrNull(value: string): number | null {
  return value === '' ? null : Number(value);
}

/**
 * slug 欄位。**不自動從標題產生** —— slug 是內容不是衍生值（見 docs/database.md §0.5），
 * 自動同步會讓編輯者改個錯字就默默換掉一個已被索引的網址。想從標題帶一份要按按鈕，
 * 而且只在還沒填時才給按。
 */
function SlugControl({
  id,
  value,
  onChange,
  error,
  readOnly,
}: {
  id: string;
  value: string;
  onChange: (value: unknown) => void;
  error: boolean;
  readOnly?: boolean;
}) {
  const invalid = value.length > 0 && !isValidSlug(value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-xs text-[var(--fg-3)]">/…/</span>
        <Input
          id={id}
          value={value}
          disabled={readOnly}
          error={error || invalid}
          placeholder="anti-glare-film"
          onChange={(event) => onChange(toSlug(event.target.value))}
          className="font-mono"
        />
      </div>
      {invalid && (
        <p className="flex items-center gap-1 text-xs text-[var(--warning-500)]">
          <Icon name="circle-alert" size={12} />
          只能使用小寫英文、數字與連字號。
        </p>
      )}
    </div>
  );
}

/** 媒體選擇：開一個對話框從媒體庫挑，而不是要編輯者手貼一串 URL。 */
function MediaControl({
  id,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  value: string;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useList('media', { pageSize: 40 }, { enabled: open });
  const selected = data?.items.find((item) => item.id === value);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          id={id}
          disabled={readOnly}
          onClick={() => setOpen(true)}
          className={cx(
            'flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-1)]',
            'bg-[var(--surface-card)] px-3 text-left text-sm text-[var(--fg-1)]',
            'hover:bg-[var(--surface-card-alt)] disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <Icon name="image" size={14} className="shrink-0 text-[var(--fg-3)]" />
          <span className="truncate">
            {value ? String(selected?.fileName ?? value) : '尚未選擇檔案'}
          </span>
        </button>
        {value && !readOnly && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            清除
          </Button>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="選擇媒體" width="640px">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-[var(--fg-2)]">載入中…</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 py-1 sm:grid-cols-4">
            {data?.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={cx(
                  'flex flex-col gap-1 rounded-[var(--radius-sm)] border p-2 text-left text-xs',
                  item.id === value
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border-1)] hover:bg-[var(--surface-card-alt)]',
                )}
              >
                <span className="flex h-16 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-card-alt)] text-[var(--fg-3)]">
                  <Icon name={String(item.type) === 'document' ? 'file-text' : 'image'} size={20} />
                </span>
                <span className="truncate text-[var(--fg-1)]">{String(item.fileName ?? item.id)}</span>
                <span className="text-[var(--fg-3)]">{formatBytes(item.fileSizeBytes)}</span>
              </button>
            ))}
          </div>
        )}
      </Dialog>
    </>
  );
}

/** 指向另一個實體的單選。選項標題取自對方的翻譯列，所以會跟著對方改名。 */
function ReferenceControl({
  id,
  refType,
  value,
  onChange,
  error,
  readOnly,
}: {
  id: string;
  refType?: string;
  value: string;
  onChange: (value: unknown) => void;
  error: boolean;
  readOnly?: boolean;
}) {
  const resource = refType ? resourceOf(refType) : undefined;
  const { data, isLoading } = useList(refType ?? '', { pageSize: 100 }, { enabled: Boolean(refType) });

  const options = (data?.items ?? []).map((row) => ({
    value: row.id,
    label: resource ? rowTitle(row, resource, CULTURES[0].value) : row.id,
  }));

  return (
    <Select
      id={id}
      value={value}
      options={[{ value: '', label: '未指定' }, ...options]}
      disabled={readOnly || isLoading}
      error={error}
      onChange={(event) => onChange(event.target.value || null)}
    />
  );
}

/**
 * 多選關聯（產品 ↔ 產業、文章 ↔ 標籤…）。用可捲動的核取清單而不是 `<select multiple>`：
 * 原生多選在觸控與鍵盤上都難用，而且看不出目前選了幾個。
 */
function MultiReferenceControl({
  refType,
  options: staticOptions,
  value,
  onChange,
  readOnly,
}: {
  refType?: string;
  options?: { value: string; label: string }[];
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
}) {
  const resource = refType ? resourceOf(refType) : undefined;
  const { data, isLoading } = useList(
    refType ?? '',
    { pageSize: 100 },
    { enabled: Boolean(refType) && !staticOptions },
  );

  const options =
    staticOptions ??
    (data?.items ?? []).map((row) => ({
      value: row.id,
      label: resource ? rowTitle(row, resource, CULTURES[0].value) : row.id,
    }));

  const selected = Array.isArray(value) ? (value as string[]) : [];

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selected, id] : selected.filter((item) => item !== id));
  }

  if (isLoading) return <p className="text-xs text-[var(--fg-3)]">載入中…</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-40 overflow-y-auto rounded-[var(--radius-sm)] border border-[var(--border-1)] p-2">
        {options.length === 0 ? (
          <p className="px-1 py-2 text-xs text-[var(--fg-3)]">沒有可選項目。</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {options.map((option) => (
              <Checkbox
                key={option.value}
                id={`${refType}-${option.value}`}
                label={option.label}
                checked={selected.includes(option.value)}
                disabled={readOnly}
                onChange={(event) => toggle(option.value, event.target.checked)}
              />
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && <Badge tone="brand">已選 {selected.length} 項</Badge>}
    </div>
  );
}
