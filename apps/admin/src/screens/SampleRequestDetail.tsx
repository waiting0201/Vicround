import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Card, Field, Icon, Input, LoadingBlock, PageHeader, Textarea, useToast } from '@/ui';
import { SAMPLE_REQUEST_STATUS_LABEL, SAMPLE_REQUEST_TIMESTAMPS } from '@/lib/enums';
import { useItem, useSaveItem } from '@/lib/queries';
import type { ResourceDef } from '@/lib/resources';
import { formatDateTime } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailRow, Timeline } from '@/components/Timeline';

/**
 * 單張樣品申請。
 *
 * <p>
 * 品項是會員送出當下的**快照**（含名稱與型號），所以這一頁不能改 —— 產品後來改名或被
 * 封存，這張單記錄的仍該是當時申請的東西。後台能改的只有履行資訊：物流、拒絕理由、內部備註。
 * </p>
 */
export function SampleRequestDetail({ resource }: { resource: ResourceDef }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const query = useItem(resource.type, id);
  const save = useSaveItem(resource.type);

  const row = query.data;
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!row) return;
    setForm({
      carrier: String(row.carrier ?? ''),
      trackingNumber: String(row.trackingNumber ?? ''),
      trackingUrl: String(row.trackingUrl ?? ''),
      rejectionReason: String(row.rejectionReason ?? ''),
      internalNote: String(row.internalNote ?? ''),
      externalOrderNumber: String(row.externalOrderNumber ?? ''),
    });
  }, [row]);

  async function submit() {
    await save.mutateAsync({ id, data: form });
    toast({ title: '已更新這張申請單', variant: 'success' });
  }

  if (query.isLoading) return <LoadingBlock />;
  if (!row) return <p className="py-16 text-center text-sm text-[var(--fg-2)]">找不到這張申請單。</p>;

  const items = (Array.isArray(row.items) ? row.items : []) as Record<string, unknown>[];
  const status = String(row.status ?? '');

  return (
    <>
      <PageHeader
        title={String(row.requestNumber ?? '樣品申請')}
        description={`${String(row.memberName ?? '')}．${String(row.shipToCompany ?? '')}`}
        breadcrumbs={[{ label: resource.label, href: `/${resource.type}` }, { label: '申請單' }]}
        actions={
          <>
            <Button variant="ghost" icon={<Icon name="arrow-left" size={15} />} onClick={() => navigate(`/${resource.type}`)}>
              回到看板
            </Button>
            <Button variant="primary" loading={save.isPending} onClick={submit}>
              儲存
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card title="申請品項" description="送出當下的快照，後台不可修改。" padding={false}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-1)] bg-[var(--surface-card-alt)] text-xs uppercase text-[var(--fg-2)]">
                  <th className="px-4 py-2 text-left font-medium">品名</th>
                  <th className="px-4 py-2 text-left font-medium">型號</th>
                  <th className="px-4 py-2 text-left font-medium">規格</th>
                  <th className="px-4 py-2 text-right font-medium">數量</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[var(--fg-3)]">
                      這張單沒有品項。
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={index} className="border-b border-[var(--border-1)] last:border-0">
                      <td className="px-4 py-3 text-[var(--fg-1)]">{String(item.productNameSnapshot ?? '—')}</td>
                      <td className="px-4 py-3">
                        <code className="font-mono text-xs text-[var(--fg-2)]">{String(item.gradeCode ?? '—')}</code>
                      </td>
                      <td className="px-4 py-3 text-[var(--fg-2)]">{String(item.requestedSpec ?? '—')}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--fg-1)]">
                        {String(item.quantity ?? '')} {String(item.unit ?? '')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          <Card title="履行資訊" description="這裡填的物流資訊，申請人會在會員專區看到。">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
              <Field label="物流商">
                <Input value={form.carrier ?? ''} onChange={(event) => setForm({ ...form, carrier: event.target.value })} />
              </Field>
              <Field label="追蹤號碼">
                <Input
                  value={form.trackingNumber ?? ''}
                  onChange={(event) => setForm({ ...form, trackingNumber: event.target.value })}
                />
              </Field>
              <Field label="追蹤網址" className="md:col-span-2">
                <Input
                  value={form.trackingUrl ?? ''}
                  onChange={(event) => setForm({ ...form, trackingUrl: event.target.value })}
                />
              </Field>
              <Field label="ERP 單號" hint="預留給未來與 ERP 對接，現在可以留空。">
                <Input
                  value={form.externalOrderNumber ?? ''}
                  onChange={(event) => setForm({ ...form, externalOrderNumber: event.target.value })}
                />
              </Field>
              {status === 'rejected' && (
                <Field label="拒絕理由" required className="md:col-span-2">
                  <Textarea
                    value={form.rejectionReason ?? ''}
                    rows={2}
                    onChange={(event) => setForm({ ...form, rejectionReason: event.target.value })}
                  />
                </Field>
              )}
              <Field label="內部備註" hint="只有後台看得到。" className="md:col-span-2">
                <Textarea
                  value={form.internalNote ?? ''}
                  rows={3}
                  onChange={(event) => setForm({ ...form, internalNote: event.target.value })}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="收件資訊">
            <div className="flex flex-col gap-3">
              <DetailRow label="狀態">
                <StatusBadge status={row.status} />
              </DetailRow>
              <DetailRow label="收件人">{String(row.shipToName ?? '—')}</DetailRow>
              <DetailRow label="公司">{String(row.shipToCompany ?? '—')}</DetailRow>
              <DetailRow label="城市">{String(row.shipToCity ?? '—')}</DetailRow>
              <DetailRow label="國別">{String(row.shipToCountryCode ?? '—')}</DetailRow>
              <DetailRow label="專案">{String(row.projectName ?? '—')}</DetailRow>
              <DetailRow label="送出時間">{formatDateTime(row.submittedAt)}</DetailRow>
            </div>
          </Card>

          <Card title="歷程" description="每個階段一個時間戳，沒有另建歷程表。">
            <Timeline
              steps={SAMPLE_REQUEST_TIMESTAMPS.filter(
                (step) => row[step.field] || ['submitted', 'underReview', 'approved', 'shipped', 'delivered'].includes(step.status),
              ).map((step) => ({
                label: SAMPLE_REQUEST_STATUS_LABEL[step.status],
                at: row[step.field],
                tone: step.status === 'rejected' || step.status === 'cancelled' ? ('danger' as const) : undefined,
              }))}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
