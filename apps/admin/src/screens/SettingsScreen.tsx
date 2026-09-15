import { useEffect, useState } from 'react';
import { Badge, Button, Card, Field, Input, LoadingBlock, PageHeader, Switch, Tabs, Textarea, useToast } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import { useList, useSaveItem, useSaveTranslation } from '@/lib/queries';
import type { AdminRow } from '@/lib/api';
import type { ResourceDef } from '@/lib/resources';
import { describeError } from '@/lib/errors';

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

  /*
   * 後端新增一個設定鍵、這裡卻沒有對應文案時，畫面只會默默退回顯示那行 key ——
   * 跟先前 HINTS 的鍵寫錯時一模一樣的症狀，而且不會有任何人發現。開發時吵出來。
   */
  if (import.meta.env.DEV) {
    const missing = rows
      .map((row) => String(row.key ?? row.id))
      .filter((key) => !SETTING_COPY[key]);
    if (missing.length > 0) {
      console.warn(`[settings] 這些設定鍵沒有中文名稱與說明：${missing.join('、')}`);
    }
  }

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

  /**
   * 這一頁是**一次送出好幾列**（每一列各是一支 PUT），所以失敗要處理得比別的畫面細：
   * 存壞的那一列之後就停手，已經存進去的從 dirty 拿掉、沒存到的留著。
   * 全部一起清掉的話，畫面會顯示「所有變更都已儲存」，但其中一列其實沒進資料庫。
   */
  async function submit() {
    const pending = rows.filter((row) => dirty.has(row.id));
    const saved = new Set<string>();

    for (const row of pending) {
      try {
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
        saved.add(row.id);
      } catch (error) {
        const notice = describeError(error, '設定沒有存完');
        setDirty(new Set(pending.filter((item) => !saved.has(item.id)).map((item) => item.id)));
        toast({
          ...notice,
          title: `${notice.title}（卡在「${String(row.key ?? row.id)}」）`,
          variant: 'danger',
        });
        return;
      }
    }

    setDirty(new Set());
    toast({ title: '設定已儲存', description: '影響 SEO 的設定會在下一次頁面請求生效。', variant: 'success' });
  }

  /** 分區是從 key 的前綴算出來的（`seo.titleTemplate` → `seo`），不是寫死的清單。 */
  const groups = rows.reduce<Record<string, AdminRow[]>>((acc, row) => {
    const key = String(row.key ?? row.id);
    const group = key.includes('.') ? key.split('.')[0] : '其他';
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
            <Card
              key={group}
              title={GROUP_META[group]?.label ?? group}
              description={GROUP_META[group]?.description}
            >
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

/**
 * key 前綴 → 分區標題與一句說明。**要與 `SiteSettings` 實際的 key 一致**（database.md §13）。
 *
 * <p>
 * 說明是寫給客戶端的編輯者看的：這一頁的每一格都是整站共用的設定，改下去影響的
 * 不是某一頁而是全站，所以每一區先講「這區是管什麼的」，再讓人看下面的欄位。
 * </p>
 */
const GROUP_META: Record<string, { label: string; description: string }> = {
  seo: {
    label: '搜尋引擎',
    description: '決定這個網站在 Google 搜尋結果與社群分享時長什麼樣子。',
  },
  org: {
    label: '公司資訊',
    description: '提供給搜尋引擎的公司基本資料，會影響 Google 右側的公司資訊卡片。',
  },
  analytics: { label: '分析工具', description: '流量統計用的追蹤碼。留空就完全不載入。' },
  revalidate: {
    label: '發布後更新',
    description: '技術設定。內容發布後，系統靠它通知前台換掉舊畫面。',
  },
  privacy: { label: '隱私權', description: '隱私權政策的版本控制。' },
  site: { label: '站台', description: '系統寄信時需要用到的網站正式網址。' },
  mail: { label: '寄信', description: '交易信件的寄送設定。' },
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

  const settingKey = String(row.key ?? row.id);
  const copy = SETTING_COPY[settingKey];

  return (
    <div className="border-b border-[var(--border-1)] pb-5 last:border-0 last:pb-0">
      {/*
        以前這裡只有一行 key（`seo.titleTemplate`）跟一個叫「值」的格子——對工程師夠用，
        對客戶端的編輯者等於沒有說明。改成中文名稱當主標，key 退成旁邊的小字：
        要對照文件或問問題時還找得到它，但它不再是使用者第一眼看到的東西。
      */}
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-[var(--fg-1)]">{copy?.label ?? settingKey}</span>
        {copy && <code className="font-mono text-xs text-[var(--fg-3)]">{settingKey}</code>}
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

      <Field label={localized ? `${CULTURES.find((item) => item.value === culture)?.label ?? culture} 的內容` : '值'} hint={copy?.hint}>
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

/**
 * 每個設定鍵的中文名稱與說明。
 *
 * <p>
 * ⚠️ **鍵要與 `SeedData.SiteSettings` 逐字一致**（`seo.titleTemplate` 這種小寫加點的寫法）。
 * 這裡曾經寫成 `Seo:TitleTemplate`，結果所有說明一句都沒顯示過——畫面上只剩一行
 * 程式碼般的 key 和一個叫「值」的空格子，編輯者根本無從判斷該填什麼。
 * 下面的 DEV 檢查就是為了不要再發生一次。
 * </p>
 *
 * <p>
 * 寫法依 `docs/admin-ui.md §8`：講**填錯會發生什麼**，不要只講欄位叫什麼。
 * </p>
 */
const SETTING_COPY: Record<string, { label: string; hint: string }> = {
  'seo.titleTemplate': {
    label: '瀏覽器分頁與搜尋結果的標題格式',
    hint: '{page} 會換成每一頁自己的標題。填「{page} | VicRound」的話，產品頁就會顯示成「Anti-Glare | VicRound」。兩個語系分開填。',
  },
  'seo.defaultDescription': {
    label: '搜尋結果的預設說明文字',
    hint: '頁面自己沒填 SEO 描述時，Google 就顯示這一段。寫成一句完整的話，80–160 個字元最理想。',
  },
  'seo.defaultOgImageUrl': {
    label: '分享到社群時的預設縮圖',
    hint: '把網址貼到 LINE、Facebook、LinkedIn 時跳出來的那張圖。建議 1200×630。頁面自己有設圖的話以該頁為準。',
  },
  'org.legalName': {
    label: '公司正式名稱',
    hint: '請填公司登記的全名（英文欄位填英文全名）。這是給搜尋引擎看的，不是網站上顯示的名稱。',
  },
  'org.foundingYear': {
    label: '成立年份',
    hint: '四位數西元年，例：1998。',
  },
  'org.logoUrl': {
    label: '公司 Logo 網址',
    hint: '給搜尋引擎用的 Logo，不是網站頁首那一張。填完整網址（https:// 開頭），方形去背 PNG 最保險。',
  },
  'analytics.gtmId': {
    label: 'Google 代碼管理工具（GTM）ID',
    hint: '格式是 GTM-XXXXXXX。填了才會開始收集流量數據；留空的話追蹤碼完全不會載入。',
  },
  'revalidate.webhookUrl': {
    label: '發布後通知前台的網址',
    hint: '⚠️ 技術設定，沒有把握就不要動。內容發布後系統靠它通知前台換掉舊畫面；填錯會讓前台一直顯示舊內容，而且不會有任何錯誤訊息。',
  },
  'site.baseUrl': {
    label: '網站正式網址',
    hint: '⚠️ 留空的話，驗證信、重設密碼信、審核結果通知一律不會寄出——信裡的連結需要完整網址，系統寧可不寄也不寄出連到錯誤位置的信。例：https://www.vicround.com',
  },
  'privacy.policyVersion': {
    label: '隱私權政策版本',
    hint: '⚠️ 改了版號等於要求所有會員重新同意一次。修錯字、調排版不要動這一格。',
  },
};
