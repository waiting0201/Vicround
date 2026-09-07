import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge, PageHeader, Table, Tabs, type TableColumn } from '@/ui';
import { INQUIRY_TYPE_LABEL, type InquiryStatus } from '@/lib/enums';
import { useList } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { formatDateTime, formatRelative } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';

/**
 * 詢問單收件匣。與會員審核同型（佇列），差別在狀態機不同：這裡是
 * 未處理 → 處理中 → 已回覆 → 已結案，外加「垃圾訊息」這個側出口。
 *
 * <p>
 * 預設停在「未處理」且由舊到新 —— 一張詢問單放三天沒回，對業務的傷害比
 * 「最新的長什麼樣」大得多。
 * </p>
 */

const TABS: { key: string; label: string; status?: InquiryStatus }[] = [
  { key: 'new', label: '未處理', status: 'new' },
  { key: 'inProgress', label: '處理中', status: 'inProgress' },
  { key: 'responded', label: '已回覆', status: 'responded' },
  { key: 'closed', label: '已結案', status: 'closed' },
  { key: 'spam', label: '垃圾訊息', status: 'spam' },
  { key: 'all', label: '全部' },
];

export function InquiriesScreen({ resource }: { resource: ResourceDef }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0].key);

  const status = TABS.find((item) => item.key === tab)?.status;
  const query = useList(resource.type, { pageSize: 50, status, sort: 'createdAt' });
  const unread = useList(resource.type, { pageSize: 1, status: 'new' });

  const columns: TableColumn<AdminRow>[] = [
    {
      key: 'referenceNumber',
      header: '編號',
      width: '11rem',
      render: (row) => <code className="font-mono text-xs text-[var(--fg-2)]">{String(row.referenceNumber ?? '')}</code>,
    },
    {
      key: 'name',
      header: '來自',
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-[var(--fg-1)]">{String(row.name ?? '—')}</span>
          <span className="text-xs text-[var(--fg-3)]">{String(row.companyName ?? '')}</span>
        </span>
      ),
    },
    {
      key: 'message',
      header: '內容',
      render: (row) => (
        <span className="line-clamp-1 text-[var(--fg-2)]">{String(row.message ?? '')}</span>
      ),
    },
    {
      key: 'type',
      header: '類型',
      width: '7rem',
      render: (row) => (
        <Badge tone="neutral">
          {INQUIRY_TYPE_LABEL[row.type as keyof typeof INQUIRY_TYPE_LABEL] ?? String(row.type ?? '')}
        </Badge>
      ),
    },
    { key: 'status', header: '狀態', width: '7rem', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'createdAt',
      header: '收到',
      width: '8rem',
      render: (row) => (
        <span className="text-[var(--fg-2)]" title={formatDateTime(row.createdAt)}>
          {formatRelative(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={resource.label} description={resource.description} />

      <Tabs
        className="mb-4"
        value={tab}
        onValueChange={setTab}
        items={TABS.map((item) => ({
          key: item.key,
          label:
            item.key === 'new' && unread.data?.total ? (
              <span className="flex items-center gap-1.5">
                未處理 <Badge tone="info">{unread.data.total}</Badge>
              </span>
            ) : (
              item.label
            ),
        }))}
      />

      <Table
        columns={columns}
        rows={query.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={query.isLoading}
        error={query.error ? (query.error as Error).message : null}
        onRetry={() => query.refetch()}
        onRowClick={(row) => navigate(`/${resource.type}/${row.id}`)}
        emptyTitle={status === 'new' ? '沒有待處理的詢問單' : '這個狀態下沒有詢問單'}
        emptyDescription={status === 'new' ? '聯絡頁與 Header 聯絡抽屜送出的表單都會落在這裡。' : undefined}
      />
    </>
  );
}
