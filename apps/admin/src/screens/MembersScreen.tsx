import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  Field,
  IconButton,
  PageHeader,
  Table,
  Tabs,
  Textarea,
  useToast,
  type TableColumn,
} from '@/ui';
import { MEMBER_JOB_ROLE_LABEL, type MemberStatus } from '@/lib/enums';
import { useAction, useList } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { formatDateTime, formatRelative } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';

/**
 * 會員審核佇列。
 *
 * <p>
 * 佇列語意：預設停在「待審核」，且**由舊到新**排序 —— 先來先審。後台其他清單都是
 * 最新在上面，這一頁刻意相反，因為這裡的問題不是「最近發生什麼」而是「誰等最久」。
 * </p>
 *
 * <p>
 * 列上直接給核准／拒絕兩顆按鈕：多數申請看公司網域就能決定，不必為了按一顆核准
 * 而先進詳情頁再退回來。需要看細節的才點進去。
 * </p>
 */

const TABS: { key: string; label: string; status?: MemberStatus }[] = [
  { key: 'pendingApproval', label: '待審核', status: 'pendingApproval' },
  { key: 'pendingEmailVerification', label: '待驗證信箱', status: 'pendingEmailVerification' },
  { key: 'approved', label: '已核准', status: 'approved' },
  { key: 'rejected', label: '已拒絕', status: 'rejected' },
  { key: 'suspended', label: '已停權', status: 'suspended' },
  { key: 'all', label: '全部' },
];

export function MembersScreen({ resource }: { resource: ResourceDef }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState(TABS[0].key);
  const [approving, setApproving] = useState<AdminRow | null>(null);
  const [rejecting, setRejecting] = useState<AdminRow | null>(null);
  const [note, setNote] = useState('');

  const status = TABS.find((item) => item.key === tab)?.status;
  const query = useList(resource.type, { pageSize: 50, status, sort: 'createdAt' });
  const pending = useList(resource.type, { pageSize: 1, status: 'pendingApproval' });
  const action = useAction(resource.type);

  async function run(row: AdminRow, name: string, data?: Record<string, unknown>) {
    try {
      await action.mutateAsync({ id: row.id, action: name, data });
      toast({
        title: name === 'approve' ? '已核准' : '已拒絕',
        description:
          name === 'approve'
            ? `${String(row.fullName ?? '對方')}現在可以下載限會員文件並送出樣品申請。`
            : '理由已記錄在這個帳號上。',
        variant: 'success',
      });
    } catch (error) {
      toast({ title: '動作沒有完成', description: (error as Error).message, variant: 'danger' });
    } finally {
      setApproving(null);
      setRejecting(null);
      setNote('');
    }
  }

  const columns: TableColumn<AdminRow>[] = [
    {
      key: 'fullName',
      header: '申請人',
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-[var(--fg-1)]">{String(row.fullName ?? '—')}</span>
          <span className="text-xs text-[var(--fg-3)]">{String(row.email ?? '')}</span>
        </span>
      ),
    },
    { key: 'companyName', header: '公司', width: '13rem', render: (row) => String(row.companyName ?? '—') },
    {
      key: 'jobRole',
      header: '職務',
      width: '9rem',
      render: (row) => (
        <span className="text-[var(--fg-2)]">
          {MEMBER_JOB_ROLE_LABEL[row.jobRole as keyof typeof MEMBER_JOB_ROLE_LABEL] ?? '—'}
        </span>
      ),
    },
    { key: 'status', header: '狀態', width: '8rem', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'createdAt',
      header: '等待時間',
      width: '8rem',
      render: (row) => (
        <span className="text-[var(--fg-2)]" title={formatDateTime(row.createdAt)}>
          {formatRelative(row.createdAt)}
        </span>
      ),
    },
    {
      key: '__actions',
      header: '',
      width: '6rem',
      align: 'right',
      render: (row) =>
        String(row.status) === 'pendingApproval' ? (
          <span
            className="flex justify-end gap-1"
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <IconButton icon="check" label="核准" size="sm" onClick={() => setApproving(row)} />
            <IconButton
              icon="x"
              label="拒絕"
              size="sm"
              className="hover:text-[var(--danger-500)]"
              onClick={() => setRejecting(row)}
            />
          </span>
        ) : null,
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
            item.key === 'pendingApproval' && pending.data?.total ? (
              <span className="flex items-center gap-1.5">
                待審核 <Badge tone="warning">{pending.data.total}</Badge>
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
        emptyTitle={status === 'pendingApproval' ? '沒有人在等審核' : '這個狀態下沒有會員'}
        emptyDescription={
          status === 'pendingApproval' ? '新的註冊通過信箱驗證後會出現在這裡。' : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(approving)}
        onClose={() => setApproving(null)}
        onConfirm={() => approving && run(approving, 'approve')}
        pending={action.isPending}
        title={`核准 ${String(approving?.fullName ?? '')}？`}
        description={`核准後這個帳號可以取得限會員文件的下載連結，並送出樣品申請。信箱網域：${String(approving?.email ?? '').split('@')[1] ?? ''}`}
        confirmLabel="核准"
      />

      <Dialog
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="拒絕這個申請？"
        description="請寫下原因。這段文字會留在帳號上，是日後回覆對方時唯一的依據。"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              disabled={note.trim().length === 0}
              loading={action.isPending}
              onClick={() => rejecting && run(rejecting, 'reject', { reviewNote: note })}
            >
              拒絕申請
            </Button>
          </>
        }
      >
        <Field label="拒絕理由" required>
          <Textarea
            value={note}
            rows={3}
            placeholder="例：請改用公司網域的信箱重新註冊。"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </Dialog>
    </>
  );
}
