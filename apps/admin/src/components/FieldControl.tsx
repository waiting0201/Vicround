import { useId, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Field,
  Icon,
  Input,
  Select,
  Switch,
  Textarea,
  cx,
} from '@/ui';
import { CULTURES } from '@/lib/enums';
import { uploadMedia } from '@/lib/api';
import { useItem, useList } from '@/lib/queries';
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
  /** 同一筆表單的其他欄位值。`media` 欄位用它決定上傳容器（下載項目看存取層級）。 */
  values?: Record<string, unknown>;
};

export function FieldControl({ field, value, onChange, error, disabled, values }: FieldControlProps) {
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
      {renderControl({ id, field, value, text, onChange, error: Boolean(error), readOnly, values })}
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
  values?: Record<string, unknown>;
};

function renderControl({ id, field, value, text, onChange, error, readOnly, values }: ControlArgs) {
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
      return (
        <MediaControl
          id={id}
          field={field}
          value={text}
          onChange={onChange}
          readOnly={readOnly}
          values={values}
        />
      );

    case 'mediaList':
      return <MediaListControl field={field} value={value} onChange={onChange} readOnly={readOnly} values={values} />;

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
    case 'password':
      return 'password';
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
/**
 * 檔案欄位。
 *
 * <p>
 * **沒有媒體庫可以挑**——檔案就在用到它的欄位上直接上傳，傳完立刻綁在這一格。
 * 編輯者不必先去別的畫面把檔案準備好，也不會在挑一張標章圖時看到一整櫃跟手邊
 * 工作無關的檔案。
 * </p>
 *
 * <p>
 * 容器由欄位定義的 <c>container</c> 決定，<b>不在上傳時才問</b>：下載項目的檔案跟著
 * 存取層級走，其餘一律公開容器。選錯的後果是把客戶的合規文件放上公開 CDN，
 * 這種判斷不該每次上傳都重做一遍。
 * </p>
 */
function MediaControl({
  id,
  field,
  value,
  onChange,
  readOnly,
  values,
}: {
  id: string;
  field: FieldDef;
  value: string;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  values?: Record<string, unknown>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // 既有值只是一個 id，檔名與縮圖要跟後端要——編輯一筆舊資料時才看得出選的是哪個檔案。
  const { data: asset, isLoading } = useItem('media', value || undefined);

  const container =
    typeof field.container === 'function' ? field.container(values ?? {}) : (field.container ?? 'public-media');
  const isPrivate = container === 'member-documents';

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setFailed(null);
    try {
      const row = await uploadMedia(file, container);
      onChange(row.id);
    } catch (error) {
      setFailed((error as Error).message);
    } finally {
      setUploading(false);
      // 清掉 input 的值，否則連續選同一個檔案不會觸發 change。
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  const url = typeof asset?.url === 'string' ? asset.url : undefined;
  const fileName = typeof asset?.fileName === 'string' ? asset.fileName : undefined;
  const isImage = String(asset?.type ?? '') === 'image';

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInput}
        type="file"
        id={id}
        accept={field.accept}
        className="sr-only"
        disabled={readOnly || uploading}
        onChange={(event) => void upload(event.target.files?.[0])}
      />

      <div className="flex items-center gap-3">
        {value && (
          <span
            className={cx(
              'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden',
              'rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--surface-card-alt)]',
            )}
          >
            {isImage && url ? (
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon name={isImage ? 'image' : 'file-text'} size={18} className="text-[var(--fg-3)]" />
            )}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-[var(--fg-1)]">
            {uploading
              ? '上傳中…'
              : value
                ? (fileName ?? (isLoading ? '載入中…' : value))
                : '尚未上傳檔案'}
          </p>
          {value && !uploading && typeof asset?.fileSizeBytes === 'number' && (
            <p className="text-xs text-[var(--fg-3)]">{formatBytes(asset.fileSizeBytes)}</p>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={readOnly || uploading}
          onClick={() => fileInput.current?.click()}
        >
          {value ? '更換檔案' : '選擇檔案'}
        </Button>
        {value && !readOnly && !uploading && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
            清除
          </Button>
        )}
      </div>

      {failed && <p className="text-xs text-[var(--danger)]">上傳失敗：{failed}</p>}
      {isPrivate && !failed && (
        <p className="text-xs text-[var(--fg-3)]">
          這個檔案會存進私有容器，公開端只能經 SAS 連結取得。
        </p>
      )}
    </div>
  );
}

/**
 * 多檔案欄位（產品圖庫）。
 *
 * <p>
 * 與 `MediaControl` 同一個原則：直接上傳，不從既有檔案裡挑。可一次選多個檔案，
 * 順序就是上傳的順序，要換順序就移除再傳一次——圖庫通常只有幾張，為它做拖曳排序
 * 不划算。
 * </p>
 */
function MediaListControl({
  field,
  value,
  onChange,
  readOnly,
  values,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  values?: Record<string, unknown>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const ids = Array.isArray(value) ? (value as string[]) : [];
  const container =
    typeof field.container === 'function' ? field.container(values ?? {}) : (field.container ?? 'public-media');

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setFailed(null);
    try {
      const added: string[] = [];
      // 逐一上傳而不是並行：後端對每個檔案都要寫一列，並行只是把失敗變得更難解讀。
      for (const file of Array.from(files)) {
        const row = await uploadMedia(file, container);
        added.push(row.id);
      }
      onChange([...ids, ...added]);
    } catch (error) {
      setFailed((error as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInput}
        type="file"
        multiple
        accept={field.accept}
        className="sr-only"
        disabled={readOnly || uploading}
        onChange={(event) => void upload(event.target.files)}
      />

      {ids.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {ids.map((assetId) => (
            <MediaListItem
              key={assetId}
              id={assetId}
              readOnly={readOnly}
              onRemove={() => onChange(ids.filter((item) => item !== assetId))}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={readOnly || uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? '上傳中…' : ids.length ? '再加檔案' : '選擇檔案'}
        </Button>
        {ids.length > 0 && <span className="text-xs text-[var(--fg-3)]">{ids.length} 個檔案</span>}
      </div>

      {failed && <p className="text-xs text-[var(--danger)]">上傳失敗：{failed}</p>}
    </div>
  );
}

/** 圖庫裡的一張。縮圖要靠 id 去把網址讀回來，所以獨立成一個元件各自查詢。 */
function MediaListItem({
  id,
  onRemove,
  readOnly,
}: {
  id: string;
  onRemove: () => void;
  readOnly?: boolean;
}) {
  const { data } = useItem('media', id);
  const url = typeof data?.url === 'string' ? data.url : undefined;
  const fileName = typeof data?.fileName === 'string' ? data.fileName : id;

  return (
    <li className="relative">
      <span
        className={cx(
          'flex h-16 w-16 items-center justify-center overflow-hidden',
          'rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--surface-card-alt)]',
        )}
        title={fileName}
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon name="image" size={18} className="text-[var(--fg-3)]" />
        )}
      </span>
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`移除 ${fileName}`}
          className={cx(
            'absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full',
            'border border-[var(--border-1)] bg-[var(--surface-card)] text-[var(--fg-2)]',
            'hover:bg-[var(--surface-card-alt)] hover:text-[var(--fg-1)]',
          )}
        >
          <Icon name="x" size={11} />
        </button>
      )}
    </li>
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
