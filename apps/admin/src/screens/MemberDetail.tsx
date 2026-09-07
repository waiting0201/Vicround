import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Card, ConfirmDialog, Dialog, Field, Icon, PageHeader, Textarea, useToast } from '@/ui';
import { MEMBER_JOB_ROLE_LABEL, MEMBER_STATUS_LABEL } from '@/lib/enums';
import { useAction, useItem } from '@/lib/queries';
import type { ResourceDef } from '@/lib/resources';
import { formatDateTime } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailRow, Timeline } from '@/components/Timeline';

/**
 * 單一會員的詳情。清單上按核准／拒絕就夠用的情況佔多數，會進到這一頁通常是因為
 * 「這個人到底是不是我們客戶」需要更多線索 —— 所以這一頁把註冊到現在的每個時間點
 * 都攤開，而不是只顯示目前狀態。
 */
export function MemberDetail({ resource }: { resource: ResourceDef }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const query = useItem(resource.type, id);
  const action = useAction(resource.type);
  const [confirming, setConfirming] = useState<'approve' | 'suspend' | 'reactivate' | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  const row = query.data;
  const status = String(row?.status ?? '');

  async function run(name: string, data?: Record<string, unknown>) {
    try {
      await action.mutateAsync({ id, action: name, data });
      toast({ title: '已更新這個帳號的狀態', variant: 'success' });
    } catch (error) {
      toast({ title: '動作沒有完成', description: (error as Error).message, variant: 'danger' });
    } finally {
      setConfirming(null);
      setRejecting(false);
    }
  }

  if (query.isLoading) return <p className="py-16 text-center text-sm text-[var(--fg-2)]">載入中…</p>;
  if (!row) return <p className="py-16 text-center text-sm text-[var(--fg-2)]">找不到這個會員。</p>;

  return (
    <>
      <PageHeader
        title={String(row.fullName ?? '會員')}
        description={String(row.email ?? '')}
        breadcrumbs={[{ label: resource.label, href: `/${resource.type}` }, { label: '會員資料' }]}
        actions={
          <>
            <Button variant="ghost" icon={<Icon name="arrow-left" size={15} />} onClick={() => navigate(`/${resource.type}`)}>
              回到佇列
            </Button>
            {status === 'pendingApproval' && (
              <>
                <Button variant="ghost" className="text-[var(--danger-500)]" onClick={() => setRejecting(true)}>
                  拒絕
                </Button>
                <Button variant="primary" icon={<Icon name="check" size={15} />} onClick={() => setConfirming('approve')}>
                  核准
                </Button>
              </>
            )}
            {status === 'approved' && (
              <Button variant="danger" onClick={() => setConfirming('suspend')}>
                停權
              </Button>
            )}
            {(status === 'suspended' || status === 'rejected') && (
              <Button variant="primary" onClick={() => setConfirming('reactivate')}>
                恢復為已核准
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card title="申請資料">
            <div className="flex flex-col gap-3">
              <DetailRow label="目前狀態">
                <StatusBadge status={row.status} />
              </DetailRow>
              <DetailRow label="公司">{String(row.companyName ?? '—')}</DetailRow>
              <DetailRow label="職務">
                {MEMBER_JOB_ROLE_LABEL[row.jobRole as keyof typeof MEMBER_JOB_ROLE_LABEL] ?? '—'}
                {row.jobRoleOther ? `（${String(row.jobRoleOther)}）` : ''}
              </DetailRow>
              <DetailRow label="電話">{String(row.phone ?? '—')}</DetailRow>
              <DetailRow label="國別">{String(row.countryCode ?? '—')}</DetailRow>
              <DetailRow label="信箱網域">
                <code className="font-mono text-xs">{String(row.email ?? '').split('@')[1] ?? '—'}</code>
              </DetailRow>
              <DetailRow label="最後登入">{formatDateTime(row.lastLoginAt)}</DetailRow>
            </div>
          </Card>

          {String(row.reviewNote ?? '') && (
            <Card title="審核備註">
              <p className="text-sm text-[var(--fg-2)]">{String(row.reviewNote)}</p>
            </Card>
          )}

          <p className="text-xs text-[var(--fg-3)]">
            只有「{MEMBER_STATUS_LABEL.approved}」的會員能取得限會員下載與送出樣品申請；
            其餘狀態在前台會收到 403 與目前狀態說明。
          </p>
        </div>

        <Card title="歷程" description="每個階段各存一個時間戳，沒有另建歷程表。">
          <Timeline
            steps={[
              { label: '註冊', at: row.createdAt },
              { label: '信箱驗證', at: row.emailVerifiedAt },
              { label: '核准', at: row.approvedAt },
              ...(status === 'rejected' ? [{ label: '拒絕', at: row.updatedAt, tone: 'danger' as const }] : []),
              ...(status === 'suspended' ? [{ label: '停權', at: row.updatedAt, tone: 'danger' as const }] : []),
            ]}
          />
        </Card>
      </div>

      <ConfirmDialog
        open={confirming === 'approve'}
        onClose={() => setConfirming(null)}
        onConfirm={() => run('approve')}
        pending={action.isPending}
        title="核准這個帳號？"
        description="核准後對方可以取得限會員文件的下載連結，並送出樣品申請。"
        confirmLabel="核准"
      />

      <ConfirmDialog
        open={confirming === 'suspend'}
        onClose={() => setConfirming(null)}
        onConfirm={() => run('suspend')}
        pending={action.isPending}
        tone="danger"
        title="停權這個帳號？"
        description="對方會立刻無法登入與下載，既有的樣品申請單不受影響。"
        confirmLabel="停權"
      />

      <ConfirmDialog
        open={confirming === 'reactivate'}
        onClose={() => setConfirming(null)}
        onConfirm={() => run('reactivate')}
        pending={action.isPending}
        title="恢復這個帳號？"
        description="狀態會回到已核准，對方可以重新登入使用會員功能。"
        confirmLabel="恢復"
      />

      <Dialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="拒絕這個申請？"
        description="請寫下原因。這段文字會留在帳號上，是日後回覆對方時唯一的依據。"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejecting(false)}>
              取消
            </Button>
            <Button
              variant="danger"
              disabled={note.trim().length === 0}
              loading={action.isPending}
              onClick={() => run('reject', { reviewNote: note })}
            >
              拒絕申請
            </Button>
          </>
        }
      >
        <Field label="拒絕理由" required>
          <Textarea value={note} rows={3} onChange={(event) => setNote(event.target.value)} />
        </Field>
      </Dialog>
    </>
  );
}
