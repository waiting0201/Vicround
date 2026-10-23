import { useNavigate } from 'react-router';
import { Card } from '@/ui';
import type { Culture } from '@/lib/enums';
import { resourceOf, type RelatedListDef } from '@/lib/resources';
import { ResourceList } from './ResourceList';

/**
 * 編輯頁最下面的「掛在這一筆身上的東西」（`ResourceDef.related`）。
 *
 * <p>
 * 只讀：關聯是在對方的表單上勾的，這裡若也能改，同一條關聯就有兩個入口、兩份未儲存的狀態。
 * 點一列直接進對方的編輯頁；這一頁有未儲存的變更時，`EntityEditor` 的 blocker 會先攔下來。
 * </p>
 */
export function RelatedList({
  definition,
  ownerId,
  culture,
}: {
  definition: RelatedListDef;
  ownerId: string;
  culture: Culture;
}) {
  const navigate = useNavigate();
  const target = resourceOf(definition.type);
  if (!target) return null;

  return (
    <Card title={definition.label} description={definition.description}>
      <ResourceList
        resource={target}
        culture={culture}
        baseParams={{ [definition.param]: ownerId }}
        onOpen={(row) => navigate(`/${target.type}/${row.id}`)}
        pageSize={10}
      />
    </Card>
  );
}
