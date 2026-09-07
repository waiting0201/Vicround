import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Icon, PageHeader, SearchInput, Select, Toolbar, ToolbarSpacer, useToast } from '@/ui';
import { CULTURES, MEDIA_TYPE_OPTIONS, type Culture } from '@/lib/enums';
import { uploadMedia } from '@/lib/api';
import { useList } from '@/lib/queries';
import type { ResourceDef } from '@/lib/resources';
import { formatBytes, formatDateTime } from '@/lib/format';
import { EntityDrawer } from '@/components/EntityDrawer';

/**
 * 媒體庫。
 *
 * <p>
 * 二進位檔案在 Blob Storage，資料庫只存位址。上傳時要選容器：公開檔案走 CDN，
 * 限會員文件走私有容器（只能用 SAS 連結取得）。這個選擇放在上傳按鈕旁邊而不是藏在
 * 進階設定裡 —— 選錯的後果是把客戶的合規文件放上公開網際網路。
 * </p>
 *
 * <p>
 * 縮圖網格而不是表格：找圖片時人是用看的，不是用讀檔名的。
 * </p>
 */
export function MediaScreen({ resource }: { resource: ResourceDef }) {
  const { toast } = useToast();
  const client = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [container, setContainer] = useState<'public-media' | 'member-documents'>('public-media');
  const [culture, setCulture] = useState<Culture>(CULTURES[0].value);
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const query = useList(resource.type, { pageSize: 60, search: search || undefined, type: type || undefined });

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) await uploadMedia(file, container);
      await client.invalidateQueries({ queryKey: ['media'] });
      toast({
        title: `已上傳 ${files.length} 個檔案`,
        description: container === 'member-documents' ? '存入私有容器，只有已核准會員能取得連結。' : undefined,
        variant: 'success',
      });
    } catch (error) {
      toast({ title: '上傳失敗', description: (error as Error).message, variant: 'danger' });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <>
      <PageHeader title={resource.label} description={resource.description} />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="搜尋檔名" className="w-full max-w-xs" />
        <Select
          aria-label="類型"
          value={type}
          options={[{ value: '', label: '全部類型' }, ...MEDIA_TYPE_OPTIONS]}
          onChange={(event) => setType(event.target.value)}
          className="w-auto min-w-[9rem]"
        />
        <ToolbarSpacer />
        <Select
          aria-label="上傳到哪個容器"
          value={container}
          options={[
            { value: 'public-media', label: '上傳到：公開容器' },
            { value: 'member-documents', label: '上傳到：限會員（私有）' },
          ]}
          onChange={(event) => setContainer(event.target.value as typeof container)}
          className="w-auto min-w-[13rem]"
        />
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => onFiles(event.target.files)}
        />
        <Button
          variant="primary"
          icon={<Icon name="upload" size={15} />}
          loading={uploading}
          onClick={() => fileInput.current?.click()}
        >
          上傳檔案
        </Button>
      </Toolbar>

      {query.isLoading ? (
        <p className="py-16 text-center text-sm text-[var(--fg-2)]">載入中…</p>
      ) : (query.data?.items.length ?? 0) === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-[var(--fg-2)]">
            {search ? '沒有符合的檔案。' : '媒體庫是空的。用右上角的按鈕上傳第一個檔案。'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {query.data?.items.map((item) => {
            const isPrivate = Boolean(item.isPrivate);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setOpenId(item.id)}
                className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-1)] bg-[var(--surface-card)] text-left transition-colors hover:border-[var(--border-2)]"
              >
                <span className="flex h-28 items-center justify-center bg-[var(--surface-card-alt)] text-[var(--fg-3)]">
                  <Icon name={String(item.type) === 'document' ? 'file-text' : 'image'} size={26} />
                </span>
                <span className="flex flex-col gap-1 p-3">
                  <span className="truncate text-sm font-medium text-[var(--fg-1)]">
                    {String(item.fileName ?? item.id)}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--fg-3)]">
                    {formatBytes(item.fileSizeBytes)}
                    <span>·</span>
                    {formatDateTime(item.createdAt)}
                  </span>
                  {isPrivate && <Badge tone="warning">私有</Badge>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {openId && (
        <EntityDrawer
          resource={resource}
          id={openId}
          culture={culture}
          onCultureChange={setCulture}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
