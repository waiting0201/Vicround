import { useState } from 'react';
import { PageHeader } from '@/ui';
import { CULTURES, type Culture } from '@/lib/enums';
import type { ResourceDef } from '@/lib/resources';
import { CreateButton, ResourceList } from '@/components/ResourceList';
import { EntityDrawer } from '@/components/EntityDrawer';

/**
 * 「清單 ＋ 右側抽屜編輯」型畫面。
 *
 * <p>
 * 用在欄位不多、編輯者常常要連續改好幾筆的實體（據點、客戶見證、合作品牌、轉址…）。
 * 抽屜比獨立編輯頁好的地方在於**不離開清單**：改完一筆關掉抽屜，游標還在原來那一列，
 * 可以接著改下一筆。欄位一多就不適合，那些改用 `EditorScreen`（獨立編輯頁）。
 * </p>
 */
export function CollectionScreen({ resource }: { resource: ResourceDef }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [culture, setCulture] = useState<Culture>(CULTURES[0].value);

  return (
    <>
      <PageHeader
        title={resource.label}
        description={resource.description}
        actions={<CreateButton label={resource.singular} onClick={() => setEditingId('new')} />}
      />

      <ResourceList
        resource={resource}
        culture={culture}
        onOpen={(row) => setEditingId(row.id)}
        actions={<CreateButton label={resource.singular} onClick={() => setEditingId('new')} />}
      />

      {editingId && (
        <EntityDrawer
          resource={resource}
          id={editingId}
          culture={culture}
          onCultureChange={setCulture}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}
