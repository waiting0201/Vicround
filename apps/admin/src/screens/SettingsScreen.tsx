import { useEffect, useState } from 'react';
import { Badge, Button, Card, Field, Input, LoadingBlock, PageHeader, Switch, Tabs, Textarea, useToast } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import { useList, useSaveItem, useSaveTranslation } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';

/**
 * 站台設定。key-value 表，所以沒有「清單 → 編輯一筆」的流程 —— 整頁就是表單。
 *
 * <p>
 * 依 key 的前綴（`Seo:` / `Organization:` / `Analytics:`…）分區顯示。分區是從資料算出來的，
 * 不是寫死的清單：後端新增一個設定鍵，這裡自動長出來，不需要改前端。
 * </p>
 *
 * <p>
 * 分語系的設定（`IsLocalized`）另外有 en / zh-Hant 兩格 —— 例如 SEO 標題樣板，
 * 兩個語系的寫法本來就不同。
 * </p>
 */
export function SettingsScreen({ resource }: { resource: ResourceDef }) {
  const { toast } = useToast();
  const query = useList(resource.type, { pageSize: 200 });
  const save = useSaveItem(resource.type);
  const saveTranslation = useSaveTranslation(resource.type);

  const [culture, setCulture] = useState<Culture>(CULTURES[0].value);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const rows = query.data?.items ?? [];

  useEffect(() => {
    if (!query.data) return;
    const next: Record<string, unknown> = {};
    for (const row of query.data.items) {
      next[`${row.id}:base`] = row.value;
      for (const item of CULTURES) next[`${row.id}:${item.value}`] = row.translations?.[item.value]?.value;
    }
    setValues(next);
    setDirty(new Set());
  }, [query.data]);

  function set(key: string, value: unknown, id: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty((current) => new Set(current).add(id));
  }

  async function submit() {
    for (const row of rows) {
      if (!dirty.has(row.id)) continue;
      await save.mutateAsync({ id: row.id, data: { value: values[`${row.id}:base`] } });
      if (row.isLocalized) {
        for (const item of CULTURES) {
          await saveTranslation.mutateAsync({
            id: row.id,
            culture: item.value,
            data: { value: values[`${row.id}:${item.value}`] },
          });
        }
      }
    }
    setDirty(new Set());
    toast({ title: '設定已儲存', description: '影響 SEO 的設定會在下一次頁面請求生效。', variant: 'success' });
  }

  /** 分區是從 key 的前綴算出來的，不是寫死的清單。 */
  const groups = rows.reduce<Record<string, AdminRow[]>>((acc, row) => {
    const key = String(row.key ?? row.id);
    const group = key.includes(':') ? key.split(':')[0] : '其他';
    (acc[group] ??= []).push(row);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title={resource.label}
        description={resource.description}
        actions={
          <Button variant="primary" loading={save.isPending} disabled={dirty.size === 0} onClick={submit}>
            儲存變更{dirty.size > 0 ? `（${dirty.size}）` : ''}
          </Button>
        }
      />

      {query.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(groups).map(([group, items]) => (
            <Card key={group} title={GROUP_LABEL[group] ?? group}>
              <div className="flex flex-col gap-5">
                {items.map((row) => (
                  <SettingRow
                    key={row.id}
                    row={row}
                    culture={culture}
                    onCultureChange={setCulture}
                    values={values}
                    onChange={set}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

const GROUP_LABEL: Record<string, string> = {
  Seo: '搜尋引擎',
  Organization: '公司資訊（Organization 結構化資料）',
  Analytics: '分析工具',
  Revalidate: '發布後失效',
  Privacy: '隱私權',
};

function SettingRow({
  row,
  culture,
  onCultureChange,
  values,
  onChange,
}: {
  row: AdminRow;
  culture: Culture;
  onCultureChange: (culture: Culture) => void;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown, id: string) => void;
}) {
  const kind = String(row.valueKind ?? 'text');
  const localized = Boolean(row.isLocalized);
  const key = localized ? `${row.id}:${culture}` : `${row.id}:base`;
  const value = values[key];

  return (
    <div className="border-b border-[var(--border-1)] pb-5 last:border-0 last:pb-0">
      <div className="mb-2 flex items-center gap-2">
        <code className="font-mono text-xs text-[var(--fg-2)]">{String(row.key ?? row.id)}</code>
        {localized && <Badge tone="brand">分語系</Badge>}
      </div>

      {localized && (
        <Tabs
          className="mb-3"
          value={culture}
          onValueChange={(next) => onCultureChange(next as Culture)}
          items={CULTURES.map((item) => ({ key: item.value, label: item.label }))}
        />
      )}

      <Field label="值" hint={HINTS[String(row.key ?? '')]}>
        {kind === 'boolean' ? (
          <div className="pt-1">
            <Switch checked={value === true || value === 'true'} onCheckedChange={(next) => onChange(key, next, row.id)} />
          </div>
        ) : kind === 'html' || kind === 'json' ? (
          <Textarea
            value={String(value ?? '')}
            rows={4}
            className="font-mono text-xs"
            onChange={(event) => onChange(key, event.target.value, row.id)}
          />
        ) : (
          <Input
            value={String(value ?? '')}
            type={kind === 'number' ? 'number' : kind === 'url' ? 'url' : 'text'}
            onChange={(event) => onChange(key, event.target.value, row.id)}
          />
        )}
      </Field>
    </div>
  );
}

/** 少數幾個「填錯會壞掉」的設定，把後果寫在旁邊。 */
const HINTS: Record<string, string> = {
  'Seo:TitleTemplate': '用 {title} 代表頁面標題，例：{title} — VicRound。',
  'Revalidate:WebhookUrl': '發布後由後端呼叫這一支讓前台快取失效。改錯會導致前台一直顯示舊內容。',
  'Privacy:PolicyVersion': '改版號等於要求所有會員重新同意，不是排版修正就不要動。',
};
