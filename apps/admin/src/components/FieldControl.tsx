import { useId, useRef } from 'react';
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
import { containerOf, createPendingMedia, isPendingMedia, releasePendingMedia } from '@/lib/pending-media';
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
  if (field.type === 'json' && !field.hint) {
    return '進階設定，用大括號包起來的格式（JSON）填寫；不確定怎麼寫的話請先洽工程團隊，格式錯了會存不進去。';
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
          value={value}
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
          placeholder="圖示名稱（英文，例：layers）"
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

/**
 * 檔案欄位。
 *
 * <p>
 * **沒有媒體庫可以挑**——檔案就在用到它的欄位上直接選，選完立刻綁在這一格。
 * 編輯者不必先去別的畫面把檔案準備好，也不會在挑一張標章圖時看到一整櫃跟手邊
 * 工作無關的檔案。
 * </p>
 *
 * <p>
 * **選檔時不上傳**：值先是一個 `PendingMedia`（檔案＋本機預覽），按下儲存才上傳並換成
 * MediaAsset id（`lib/pending-media.ts`）。選錯、換檔、放棄編輯都不會在 Blob 留下孤兒檔。
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
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  values?: Record<string, unknown>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  const pending = isPendingMedia(value) ? value : null;
  const assetId = !pending && typeof value === 'string' && value ? value : undefined;

  // 既有值只是一個 id，檔名與縮圖要跟後端要——編輯一筆舊資料時才看得出選的是哪個檔案。
  const { data: asset, isLoading } = useItem('media', assetId);

  const isPrivate = containerOf(field.container, values ?? {}) === 'member-documents';

  function pick(file: File | undefined) {
    if (!file) return;
    releasePendingMedia(value);
    onChange(createPendingMedia(file, field.container));
    // 清掉 input 的值，否則連續選同一個檔案不會觸發 change。
    if (fileInput.current) fileInput.current.value = '';
  }

  function clear() {
    releasePendingMedia(value);
    onChange(null);
  }

  const hasValue = Boolean(pending || assetId);
  const url = pending ? pending.previewUrl : typeof asset?.url === 'string' ? asset.url : undefined;
  const fileName = pending ? pending.file.name : typeof asset?.fileName === 'string' ? asset.fileName : undefined;
  const isImage = pending ? pending.file.type.startsWith('image/') : String(asset?.type ?? '') === 'image';
  const size = pending ? pending.file.size : typeof asset?.fileSizeBytes === 'number' ? asset.fileSizeBytes : undefined;

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInput}
        type="file"
        id={id}
        accept={field.accept}
        className="sr-only"
        disabled={readOnly}
        onChange={(event) => pick(event.target.files?.[0])}
      />

      <div className="flex items-center gap-3">
        {hasValue && (
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
            {hasValue ? (fileName ?? (isLoading ? '載入中…' : assetId)) : '尚未選擇檔案'}
          </p>
          {hasValue && (
            <p className="text-xs text-[var(--fg-3)]">
              {typeof size === 'number' && formatBytes(size)}
              {pending && !pending.uploadedId && (typeof size === 'number' ? '・' : '') + '儲存時上傳'}
            </p>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={readOnly}
          onClick={() => fileInput.current?.click()}
        >
          {hasValue ? '更換檔案' : '選擇檔案'}
        </Button>
        {hasValue && !readOnly && (
          <Button variant="ghost" size="sm" onClick={clear}>
            清除
          </Button>
        )}
      </div>

      {isPrivate && (
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
 * 與 `MediaControl` 同一個原則：直接選，存檔時才上傳。可一次選多個檔案，
 * 順序就是選取的順序，要換順序就移除再選一次——圖庫通常只有幾張，為它做拖曳排序
 * 不划算。值是 MediaAsset id 與 `PendingMedia` 混在一起的陣列。
 * </p>
 */
function MediaListControl({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
  values?: Record<string, unknown>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  const entries = Array.isArray(value) ? (value as unknown[]) : [];

  function pick(files: FileList | null) {
    if (!files?.length) return;
    const added = Array.from(files).map((file) => createPendingMedia(file, field.container));
    onChange([...entries, ...added]);
    if (fileInput.current) fileInput.current.value = '';
  }

  function remove(entry: unknown) {
    releasePendingMedia(entry);
    onChange(entries.filter((item) => item !== entry));
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInput}
        type="file"
        multiple
        accept={field.accept}
        className="sr-only"
        disabled={readOnly}
        onChange={(event) => pick(event.target.files)}
      />

      {entries.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {entries.map((entry, index) => (
            <MediaListItem
              key={isPendingMedia(entry) ? entry.previewUrl : String(entry) + index}
              entry={entry}
              readOnly={readOnly}
              onRemove={() => remove(entry)}
            />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={readOnly}
          onClick={() => fileInput.current?.click()}
        >
          {entries.length ? '再加檔案' : '選擇檔案'}
        </Button>
        {entries.length > 0 && (
          <span className="text-xs text-[var(--fg-3)]">
            {entries.length} 個檔案
            {entries.some((entry) => isPendingMedia(entry) && !entry.uploadedId) && '・新選的儲存時上傳'}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * 圖庫裡的一張。既有的只有 id，縮圖要去把網址讀回來，所以獨立成一個元件各自查詢；
 * 剛選的（`PendingMedia`）直接用本機預覽，虛線框標示「還沒上傳」。
 */
function MediaListItem({
  entry,
  onRemove,
  readOnly,
}: {
  entry: unknown;
  onRemove: () => void;
  readOnly?: boolean;
}) {
  const pending = isPendingMedia(entry) ? entry : null;
  const id = !pending && typeof entry === 'string' ? entry : undefined;
  const { data } = useItem('media', id);
  const url = pending ? pending.previewUrl : typeof data?.url === 'string' ? data.url : undefined;
  const fileName = pending ? pending.file.name : typeof data?.fileName === 'string' ? data.fileName : (id ?? '');

  return (
    <li className="relative">
      <span
        className={cx(
          'flex h-16 w-16 items-center justify-center overflow-hidden',
          'rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--surface-card-alt)]',
          pending && !pending.uploadedId && 'border-dashed',
        )}
        title={pending && !pending.uploadedId ? `${fileName}（儲存時上傳）` : fileName}
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
