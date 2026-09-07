import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import type { ResourceDef } from '@/lib/resources';
import { CreateButton, ResourceList } from '@/components/ResourceList';

/**
 * 「清單 ＋ 獨立編輯頁」型畫面的清單那一半。
 *
 * <p>
 * 欄位多、還帶子項（規格列、版塊、步驟）的實體用這一型：產品、產品線、解決方案、文章、
 * 頁面、下載、認證、展會、FAQ 題目、製程流程。這些內容編輯者一次會待很久，塞進 480px
 * 的抽屜只會逼他一直捲動。
 * </p>
 */
export function EditorScreen({ resource }: { resource: ResourceDef }) {
  const navigate = useNavigate();
  const [culture, setCulture] = useState<Culture>(CULTURES[0].value);

  const create = <CreateButton label={resource.singular} onClick={() => navigate(`/${resource.type}/new`)} />;

  return (
    <>
      <PageHeader title={resource.label} description={resource.description} actions={create} />
      <ResourceList
        resource={resource}
        culture={culture}
        onOpen={(row) => navigate(`/${resource.type}/${row.id}`)}
        actions={create}
      />
      {/* 語系切換只影響清單顯示哪個語系的標題；編輯頁自己有語系分頁。 */}
      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--fg-3)]">
        <span>清單顯示語系：</span>
        {CULTURES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setCulture(item.value)}
            className={
              item.value === culture
                ? 'rounded-[var(--radius-pill)] bg-[var(--brand-soft)] px-2 py-0.5 text-[var(--brand-strong)]'
                : 'rounded-[var(--radius-pill)] px-2 py-0.5 hover:text-[var(--fg-2)]'
            }
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
