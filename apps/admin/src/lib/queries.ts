import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  createItem,
  deleteItem,
  fetchMe,
  getItem,
  listItems,
  publish,
  reorder,
  runAction,
  saveTranslation,
  unpublish,
  updateItem,
  type AdminRow,
  type ListParams,
  type Paged,
} from './api';

/**
 * 後台的資料存取 hook。
 *
 * <p>
 * 每個畫面自己 `useQuery` 會有兩個後果：快取鍵各寫各的（存檔後別的畫面不會更新），
 * 以及「存檔 → 失效哪些查詢」的規則散落各處。這裡把鍵的形狀與失效範圍收在一個地方 ——
 * 動到某個 type 的任何一筆，就讓那個 type 的所有查詢重抓。
 * </p>
 *
 * <p>
 * 後台看的是**當下**的資料（含草稿），所以 `staleTime` 是 0（見 `main.tsx`）。
 * 這不是效能疏忽，是刻意的：編輯者看到過期的發布狀態會做出錯誤判斷。
 * </p>
 */

export const keys = {
  list: (type: string, params: ListParams) => [type, 'list', params] as const,
  item: (type: string, id: string) => [type, 'item', id] as const,
  me: ['auth', 'me'] as const,
};

export function useList(
  type: string,
  params: ListParams = {},
  options?: Partial<UseQueryOptions<Paged<AdminRow>>>,
) {
  return useQuery<Paged<AdminRow>>({
    queryKey: keys.list(type, params),
    queryFn: () => listItems(type, params),
    ...options,
  });
}

export function useItem(type: string, id: string | undefined) {
  return useQuery<AdminRow>({
    queryKey: keys.item(type, id ?? ''),
    queryFn: () => getItem(type, id as string),
    enabled: Boolean(id) && id !== 'new',
  });
}

export function useCurrentUser() {
  return useQuery({ queryKey: keys.me, queryFn: fetchMe, staleTime: 5 * 60 * 1000 });
}

/** 動到一筆就讓整個 type 的查詢失效 —— 列表上的狀態欄與翻譯標記都要跟著變。 */
function useInvalidate(type: string) {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: [type] });
}

export function useSaveItem(type: string) {
  const invalidate = useInvalidate(type);
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Record<string, unknown> }) =>
      id && id !== 'new' ? updateItem(type, id, data) : createItem(type, data),
    onSuccess: invalidate,
  });
}

export function useSaveTranslation(type: string) {
  const invalidate = useInvalidate(type);
  return useMutation({
    mutationFn: ({ id, culture, data }: { id: string; culture: string; data: Record<string, unknown> }) =>
      saveTranslation(type, id, culture, data),
    onSuccess: invalidate,
  });
}

export function useDeleteItem(type: string) {
  const invalidate = useInvalidate(type);
  return useMutation({ mutationFn: (id: string) => deleteItem(type, id), onSuccess: invalidate });
}

/**
 * 發布／取消發布。後端會在同一個動作裡呼叫 Next.js 的 `revalidateTag`（兩個語系都要），
 * 所以前台會在下一次請求就看到新內容 —— 前端不需要、也不該自己去打那一支。
 */
export function usePublishItem(type: string) {
  const invalidate = useInvalidate(type);
  return useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'published' | 'draft' }) =>
      next === 'published' ? publish(type, id) : unpublish(type, id),
    onSuccess: invalidate,
  });
}

export function useReorder(type: string) {
  const invalidate = useInvalidate(type);
  return useMutation({ mutationFn: (ids: string[]) => reorder(type, ids), onSuccess: invalidate });
}

/** 會員審核、樣品申請狀態這類非 CRUD 的動作。 */
export function useAction(type: string) {
  const invalidate = useInvalidate(type);
  return useMutation({
    mutationFn: ({ id, action, data }: { id: string; action: string; data?: Record<string, unknown> }) =>
      runAction(type, id, action, data ?? {}),
    onSuccess: invalidate,
  });
}
