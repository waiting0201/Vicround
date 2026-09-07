import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, Card, Field, Icon, PageHeader, Select, Textarea, useToast } from '@/ui';
import { INQUIRY_STATUS_OPTIONS, INQUIRY_TYPE_LABEL } from '@/lib/enums';
import { useItem, useList, useSaveItem } from '@/lib/queries';
import type { ResourceDef } from '@/lib/resources';
import { formatDateTime, rowTitle } from '@/lib/format';
import { resourceOf } from '@/lib/resources';
import { StatusBadge } from '@/components/StatusBadge';
import { DetailRow } from '@/components/Timeline';

/**
 * 單張詢問單。這一頁能做的事只有三件：看內容、改狀態、留內部備註 ——
 * 詢問單的內容是對方送出的，後台不改它（改了就對不上寄給對方的回信）。
 */
export function InquiryDetail({ resource }: { resource: ResourceDef }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const query = useItem(resource.type, id);
  const save = useSaveItem(resource.type);
  const channels = useList('contact-channels', { pageSize: 50 });
  const channelResource = resourceOf('contact-channels');

  const row = query.data;
  const [status, setStatus] = useState('');
  const [channelId, setChannelId] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!row) return;
    setStatus(String(row.status ?? ''));
    setChannelId(String(row.assignedChannelId ?? ''));
    setNote(String(row.internalNote ?? ''));
  }, [row]);

  async function submit() {
    await save.mutateAsync({
      id,
      data: { status, assignedChannelId: channelId || null, internalNote: note },
    });
    toast({ title: '已更新這張詢問單', variant: 'success' });
  }

  if (query.isLoading) return <p className="py-16 text-center text-sm text-[var(--fg-2)]">載入中…</p>;
  if (!row) return <p className="py-16 text-center text-sm text-[var(--fg-2)]">找不到這張詢問單。</p>;

  const dirty =
    status !== String(row.status ?? '') ||
    channelId !== String(row.assignedChannelId ?? '') ||
    note !== String(row.internalNote ?? '');

  return (
    <>
      <PageHeader
        title={String(row.referenceNumber ?? '詢問單')}
        description={`${String(row.name ?? '')}．${String(row.companyName ?? '')}`}
        breadcrumbs={[{ label: resource.label, href: `/${resource.type}` }, { label: '詢問單' }]}
        actions={
          <>
            <Button variant="ghost" icon={<Icon name="arrow-left" size={15} />} onClick={() => navigate(`/${resource.type}`)}>
              回到收件匣
            </Button>
            <Button
              variant="secondary"
              icon={<Icon name="external-link" size={15} />}
              onClick={() => window.open(`mailto:${String(row.email ?? '')}`, '_blank')}
            >
              回信
            </Button>
            <Button variant="primary" loading={save.isPending} disabled={!dirty} onClick={submit}>
              儲存
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card title="訊息內容">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--fg-1)]">
              {String(row.message ?? '（沒有訊息內容）')}
            </p>
            {Boolean(row.targetSpec) && (
              <div className="mt-4 border-t border-[var(--border-1)] pt-4">
                <p className="mb-1 text-xs font-medium text-[var(--fg-2)]">目標規格</p>
                <p className="whitespace-pre-wrap text-sm text-[var(--fg-1)]">{String(row.targetSpec)}</p>
              </div>
            )}
          </Card>

          <Card title="處理">
            <div className="flex flex-col gap-4">
              <Field label="狀態">
                <Select value={status} options={INQUIRY_STATUS_OPTIONS} onChange={(event) => setStatus(event.target.value)} />
              </Field>
              <Field label="分派窗口" hint="決定這張單由哪個信箱負責回覆。">
                <Select
                  value={channelId}
                  options={[
                    { value: '', label: '未分派' },
                    ...(channels.data?.items ?? []).map((item) => ({
                      value: item.id,
                      label: channelResource ? rowTitle(item, channelResource, 'en') : item.id,
                    })),
                  ]}
                  onChange={(event) => setChannelId(event.target.value)}
                />
              </Field>
              <Field label="內部備註" hint="只有後台看得到，不會出現在給對方的回信裡。">
                <Textarea value={note} rows={4} onChange={(event) => setNote(event.target.value)} />
              </Field>
            </div>
          </Card>
        </div>

        <Card title="來源">
          <div className="flex flex-col gap-3">
            <DetailRow label="狀態">
              <StatusBadge status={row.status} />
            </DetailRow>
            <DetailRow label="類型">
              {INQUIRY_TYPE_LABEL[row.type as keyof typeof INQUIRY_TYPE_LABEL] ?? '—'}
            </DetailRow>
            <DetailRow label="電子郵件">
              <a className="text-[var(--brand)] hover:underline" href={`mailto:${String(row.email ?? '')}`}>
                {String(row.email ?? '—')}
              </a>
            </DetailRow>
            <DetailRow label="電話">{String(row.phone ?? '—')}</DetailRow>
            <DetailRow label="送出頁面">
              <code className="font-mono text-xs">{String(row.sourceUrl ?? '—')}</code>
            </DetailRow>
            <DetailRow label="語系">{String(row.culture ?? '—')}</DetailRow>
            <DetailRow label="收到時間">{formatDateTime(row.createdAt)}</DetailRow>
            <DetailRow label="回覆時間">{formatDateTime(row.respondedAt)}</DetailRow>
          </div>
        </Card>
      </div>
    </>
  );
}
