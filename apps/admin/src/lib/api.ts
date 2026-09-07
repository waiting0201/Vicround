/**
 * Admin API（`fn-admin`，`/api/admin/**`）的 client。
 *
 * <p>
 * **Token 存放**：access token 只放在**記憶體**，refresh token 由後端寫成
 * httpOnly cookie（docs/cms.md「Rules」：絕不放 localStorage / 客戶端可讀的 JS）。
 * 重新整理後由 `POST /auth/refresh` 帶著 cookie 換一顆新的 access token ——
 * 所以 SPA 一樣能「維持登入」，而分頁裡沒有任何長期憑證可被偷。
 * </p>
 *
 * <p>
 * ⚠️ 這要求 `fn-admin` 的 `login` / `refresh` 以
 * `Set-Cookie: <name>=…; HttpOnly; Secure; SameSite=Strict; Path=/api/admin/auth`
 * 回應，且所有呼叫帶 `credentials: 'include'`。後台與 API 在 SWA 上同源
 * （`/admin` 與 `/api` 同一個網域），所以 cookie 成立。
 * </p>
 */
import { MOCK_ENABLED, mockFetch, mockUpload } from './mock';

const BASE = import.meta.env.VITE_ADMIN_API_BASE ?? '/api/admin';

let accessToken: string | null = null;

export const auth = {
  get access() {
    return accessToken;
  },
  set(token: string | null) {
    accessToken = token;
  },
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * 呼叫 Admin API。401 時**自動換一次 token 再重試**，還是失敗才丟出 ——
 * access token 只有 15 分鐘，不自動續期的話編輯者會在打字打到一半被登出。
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await send(path, init);

  if (res.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await refresh();
    if (refreshed) return unwrap<T>(await send(path, init));
  }

  return unwrap<T>(res);
}

function send(path: string, init: RequestInit) {
  // 後端尚未存在：開發時把整層 API 換成記憶體資料，讓 27 個畫面看得到東西（見 lib/mock.ts）
  if (MOCK_ENABLED) return mockFetch(path, init);

  return fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    // 錯誤格式是 RFC 7807 problem+json（docs/cms-api.md）
    const problem = (await res.json().catch(() => null)) as { title?: string; detail?: string } | null;
    throw new ApiError(res.status, problem?.detail ?? problem?.title ?? res.statusText);
  }

  return (await res.json()) as T;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiFetch<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  auth.set(data.accessToken);
}

export async function refresh(): Promise<boolean> {
  try {
    const data = await apiFetch<{ accessToken: string }>('/auth/refresh', { method: 'POST' });
    auth.set(data.accessToken);
    return true;
  } catch {
    auth.set(null);
    return false;
  }
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
  auth.set(null);
}

/**
 * 發布。後端會在同一個動作裡呼叫 Next.js 的 `revalidateTag` webhook
 * （兩個語系都要）——前端不需要、也不應該自己去打那一支。
 */
export function publish(type: string, id: string) {
  return apiFetch(`/${type}/${id}/publish`, { method: 'POST' });
}

/* -------------------------------------------------------------------------
 * 內容 CRUD
 *
 * 這幾支就是 docs/cms-api.md 的 Admin API 契約，逐條對應。畫面一律經過這裡，
 * 不要在元件裡自己拼路徑 —— 路徑拼錯只會在執行期炸開。
 * ----------------------------------------------------------------------- */

/** 所有集合端點都必須分頁（docs/cms-api.md「Pagination is mandatory」）。 */
export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number };

/** 後台看到的一筆資料：基底列 + 每語系一份翻譯。 */
export type AdminRow = Record<string, unknown> & {
  id: string;
  translations: Record<string, Record<string, unknown> | undefined>;
};

export type ListParams = Record<string, string | number | undefined | null>;

function queryString(params: ListParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function listItems(type: string, params: ListParams = {}) {
  return apiFetch<Paged<AdminRow>>(`/${type}${queryString(params)}`);
}

export function getItem(type: string, id: string) {
  return apiFetch<AdminRow>(`/${type}/${id}`);
}

export function createItem(type: string, data: Record<string, unknown>) {
  return apiFetch<AdminRow>(`/${type}`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateItem(type: string, id: string, data: Record<string, unknown>) {
  return apiFetch<AdminRow>(`/${type}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

/** 每個語系寫進自己的 `*Translation` 列，所以是獨立的一支端點。 */
export function saveTranslation(
  type: string,
  id: string,
  culture: string,
  data: Record<string, unknown>,
) {
  return apiFetch<AdminRow>(`/${type}/${id}/translations/${culture}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** 軟刪除／封存。後端會在同一個 transaction 內補上 301 或 410。 */
export function deleteItem(type: string, id: string) {
  return apiFetch<void>(`/${type}/${id}`, { method: 'DELETE' });
}

export function unpublish(type: string, id: string) {
  return apiFetch<AdminRow>(`/${type}/${id}/unpublish`, { method: 'POST' });
}

/** 批次排序：一次送整批，避免逐筆 PUT 造成中間狀態。 */
export function reorder(type: string, ids: string[]) {
  return apiFetch<void>(`/${type}/reorder`, { method: 'POST', body: JSON.stringify({ ids }) });
}

/** 非 CRUD 的動作端點（會員審核、樣品申請狀態…）。 */
export function runAction(
  type: string,
  id: string,
  action: string,
  data: Record<string, unknown> = {},
) {
  return apiFetch<AdminRow>(`/${type}/${id}/${action}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type CurrentUser = { id: string; email: string; displayName: string; roles: string[] };

export function fetchMe() {
  return apiFetch<CurrentUser>('/auth/me');
}

/**
 * 媒體上傳。這一支**不是** JSON —— multipart 的 boundary 必須讓瀏覽器自己產生，
 * 所以不能沿用 `apiFetch`（它會硬塞 `Content-Type: application/json`）。
 *
 * <p>
 * `container` 決定檔案的可見性：`public-media` 會有 CDN 網址，`member-documents`
 * 是私有的，只能透過 10 分鐘有效的 SAS 連結取得。選錯等於把限會員文件放上公開 CDN。
 * </p>
 */
export async function uploadMedia(
  file: File,
  container: 'public-media' | 'member-documents' = 'public-media',
): Promise<AdminRow> {
  if (MOCK_ENABLED) return mockUpload(file) as AdminRow;

  const form = new FormData();
  form.append('file', file);
  form.append('container', container);

  const res = await fetch(`${BASE}/media`, {
    method: 'POST',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as { detail?: string; title?: string } | null;
    throw new ApiError(res.status, problem?.detail ?? problem?.title ?? res.statusText);
  }
  return (await res.json()) as AdminRow;
}
