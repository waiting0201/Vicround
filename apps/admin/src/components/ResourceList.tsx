import { useMemo, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Icon,
  Pagination,
  SearchInput,
  Select,
  Table,
  Toolbar,
  type TableColumn,
} from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import { useList } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ColumnDef, ResourceDef } from '@/lib/resources';
import { formatBytes, formatDate, formatDateTime, formatRelative, missingCultures, optionLabel, rowTitle } from '@/lib/format';
import { StatusBadge } from './StatusBadge';

/**
 * 清單畫面共用的骨架：工具列（搜尋／篩選／缺翻譯／新增）＋ 表格 ＋ 分頁。
 *
 * <p>
 * 27 個畫面裡有 20 幾個是「一張表格加幾個篩選」。它們如果各寫一份，搜尋框的 debounce、
 * 分頁的邊界、空狀態的文案就會有 20 幾種版本。這裡把差異收斂成三個參數：
 * 要顯示哪些欄（`resource.columns`）、點一列要做什麼（`onOpen`）、空狀態要給什麼出口
 * （`actions`——**只用在空狀態**：「新增{實體}」的常駐位置是 `PageHeader` 的動作區，
 * 工具列再放一顆會變成同一頁上下相隔 100px 的兩顆同名主要按鈕）。
 * </p>
 */

export type ResourceListProps = {
  resource: ResourceDef;
  culture: Culture;
  onOpen?: (row: AdminRow) => void;
  actions?: ReactNode;
  /** 額外欄位（例如列尾的操作鈕）。 */
  extraColumns?: TableColumn<AdminRow>[];
  /** 固定帶上的查詢條件，例如看板只看某個狀態。 */
  baseParams?: Record<string, string | number | undefined>;
  pageSize?: number;
};

export function ResourceList({
  resource,
  culture,
  onOpen,
  actions,
  extraColumns = [],
  baseParams,
  pageSize = 20,
}: ResourceListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [missingOnly, setMissingOnly] = useState<Culture | ''>('');

  const params = {
    ...baseParams,
    page,
    pageSize,
    search: search || undefined,
    missingCulture: missingOnly || undefined,
    ...filters,
  };

  const query = useList(resource.type, params);

  const columns = useMemo<TableColumn<AdminRow>[]>(() => {
    const base = resource.columns.map((column) => toTableColumn(column, resource, culture));
    if (resource.hasTranslations) base.push(translationColumn(resource));
    return [...base, ...extraColumns];
  }, [resource, culture, extraColumns]);

  function setFilter(name: string, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={`搜尋${resource.label}`}
          className="w-full max-w-xs"
        />

        {resource.filters?.map((filter) => (
          <Select
            key={filter.name}
            aria-label={filter.label}
            value={filters[filter.name] ?? ''}
            options={[{ value: '', label: `全部${filter.label}` }, ...filter.options]}
            onChange={(event) => setFilter(filter.name, event.target.value)}
            className="w-auto min-w-[10rem]"
          />
        ))}

        {resource.hasTranslations && (
          <Select
            aria-label="翻譯缺漏"
            value={missingOnly}
            options={[
              { value: '', label: '不限翻譯狀態' },
              ...CULTURES.map((item) => ({ value: item.value, label: `缺 ${item.short}` })),
            ]}
            onChange={(event) => {
              setMissingOnly(event.target.value as Culture | '');
              setPage(1);
            }}
            className="w-auto min-w-[10rem]"
          />
        )}

      </Toolbar>

      <Table
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        error={query.error ? (query.error as Error).message : null}
        onRetry={() => query.refetch()}
        onRowClick={onOpen}
        emptyTitle={search || missingOnly ? '沒有符合條件的資料' : `還沒有${resource.label}`}
        emptyDescription={
          search || missingOnly ? '換個關鍵字或清掉篩選再試一次。' : resource.description
        }
        emptyAction={actions}
      />

      {query.data && query.data.total > pageSize && (
        <Pagination
          page={query.data.page}
          pageSize={query.data.pageSize}
          total={query.data.total}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

/** 資料字典的欄位定義 → 表格欄位。顯示規則集中在這裡，不散在各畫面。 */
function toTableColumn(column: ColumnDef, resource: ResourceDef, culture: Culture): TableColumn<AdminRow> {
  return {
    key: column.name,
    header: column.label,
    width: column.width,
    align: column.align === 'end' ? 'right' : 'left',
    render: (row) => {
      const value = column.fromTranslation ? row.translations?.[culture]?.[column.name] : row[column.name];

      if (column.name === resource.titleField && column.fromTranslation) {
        return (
          <span className="font-medium text-[var(--fg-1)]">{rowTitle(row, resource, culture)}</span>
        );
      }

      switch (column.type) {
        case 'status':
          return <StatusBadge status={value} />;
        case 'badge':
          return value ? <Badge tone="neutral">{optionLabel(column.options, value)}</Badge> : <Muted />;
        case 'boolean':
          return value ? (
            <Icon name="check" size={15} className="text-[var(--success-500)]" />
          ) : (
            <Muted />
          );
        case 'date':
          return <span className="text-[var(--fg-2)]">{formatDate(value)}</span>;
        case 'datetime':
          return (
            <span className="text-[var(--fg-2)]" title={formatDateTime(value)}>
              {formatRelative(value)}
            </span>
          );
        case 'number':
          return <span className="tabular-nums text-[var(--fg-2)]">{column.name === 'fileSizeBytes' ? formatBytes(value) : String(value ?? '—')}</span>;
        case 'code':
          return value ? <code className="font-mono text-xs text-[var(--fg-2)]">{String(value)}</code> : <Muted />;
        case 'thumb':
          return (
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-card-alt)] text-[var(--fg-3)]">
              <Icon name="image" size={14} />
            </span>
          );
        default:
          if (Array.isArray(value)) return <span className="text-[var(--fg-2)]">{value.join('、')}</span>;
          return value ? <span className="text-[var(--fg-2)]">{String(value)}</span> : <Muted />;
      }
    },
  };
}

/**
 * 翻譯狀態欄。**每個雙語實體的清單都有這一欄**——「哪幾筆還沒有中文」是這個後台
 * 每天都要回答的問題，藏在編輯頁裡等於沒有答案。
 */
function translationColumn(resource: ResourceDef): TableColumn<AdminRow> {
  return {
    key: '__translations',
    header: '語系',
    width: '7rem',
    render: (row) => {
      const missing = missingCultures(row, resource);
      return (
        <span className="flex items-center gap-1">
          {CULTURES.map((item) => (
            <Badge key={item.value} tone={missing.includes(item.value) ? 'warning' : 'success'}>
              {item.short}
            </Badge>
          ))}
        </span>
      );
    },
  };
}

function Muted() {
  return <span className="text-[var(--fg-3)]">—</span>;
}

/** 清單右上角的「新增」鈕，形狀固定：主要按鈕 + 加號。 */
export function CreateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={onClick}>
      新增{label}
    </Button>
  );
}
