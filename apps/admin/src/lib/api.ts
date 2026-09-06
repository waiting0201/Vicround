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
