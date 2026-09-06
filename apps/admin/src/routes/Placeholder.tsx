import { useParams } from 'react-router';
import type { MenuItem } from '@/lib/menu';

/**
 * 尚未實作的後台畫面。
 *
 * <p>
 * ⚠️ **這是鷹架。** 目的是讓側欄的每一項都有對應的路由（含 `/:id` 編輯頁），
 * 且把「這個畫面要打哪一支 API」寫在畫面上，而不是留在某個人的記憶裡。
 * 實作某一個畫面時，把它從 `App.tsx` 的自動路由裡換成真正的元件。
 * </p>
 */
export function Placeholder({ item, detail }: { item: MenuItem; detail?: boolean }) {
  const params = useParams();

  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">
        {item.label}
        {detail && params.id ? ` — ${params.id}` : ''}
      </h1>

      <div className="rounded-lg border border-dashed border-[var(--border-1)] p-6 text-sm text-[var(--fg-2)]">
        <p>
          待實作。資料來源：
          <code>
            {detail
              ? `GET /api/admin/${item.path}/{id}、PUT /api/admin/${item.path}/{id}、PUT …/translations/{culture}`
              : `GET /api/admin/${item.path}`}
          </code>
        </p>
        <p className="mt-2">
          雙語編輯採 en / zh-Hant 分頁，寫入各自的 *Translation 列；分頁上需標示翻譯缺漏。
        </p>
      </div>
    </section>
  );
}
