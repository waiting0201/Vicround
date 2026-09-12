'use client';

/**
 * 會員 API 的瀏覽器端 client。
 *
 * <p>
 * <b>access token 只放在模組變數（記憶體）</b>，不進 localStorage／sessionStorage：
 * 存進去等於把它交給任何一段跑在這個頁面上的 script。重新整理後 token 會消失，
 * 這是刻意的——靠 httpOnly 的 refresh cookie 換一顆新的，比留一顆在硬碟上安全。
 * </p>
 *
 * <p>
 * 所有請求都走同源的 <code>/api/v1/account/**</code>（`app/api/v1/account/[...path]`），
 * 路徑必須與後端 cookie 的 Path 一致，否則 refresh cookie 送不回去。
 * </p>
 */
const BASE = '/api/v1/account';

let accessToken: string | null = null;

/** 同時有多個請求撞到 401 時，只換一次 token。 */
let refreshing: Promise<string | null> | null = null;

export type MemberStatus =
  | 'pendingEmailVerification'
  | 'pendingApproval'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type MemberProfile = {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  jobRole: string;
  jobRoleOther: string | null;
  phone: string | null;
  countryCode: string | null;
  preferredCulture: string;
  status: MemberStatus;
  approvedAt: string | null;
  mustChangePassword: boolean;
};

/** 後端的錯誤信封（docs/cms-api.md）。前端一律以 `code` 分支，不比對 message 字串。 */
export class AccountError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AccountError';
  }
}

type Envelope<T> = { success: boolean; code: string | null; data: T; message: string };

async function unwrap<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: Envelope<T> | null = null;

  try {
    body = text ? (JSON.parse(text) as Envelope<T>) : null;
  } catch {
    // 代理層或平台回的非 JSON 錯誤（502 之類）落到下面統一處理。
  }

  if (!response.ok || body?.success === false) {
    throw new AccountError(
      body?.code ?? 'INTERNAL',
      body?.message ?? '連線發生問題，請稍後再試。',
      response.status,
    );
  }

  return body!.data;
}

async function post<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: payload === undefined ? {} : { 'Content-Type': 'application/json' },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });

  return unwrap<T>(response);
}

/**
 * 帶著 access token 打會員端點。**401 時自動換一次 token 再重試**——
 * access token 只有 15 分鐘，沒有這一層的話使用者填到一半表單就會被登出。
 */
export async function accountFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = async (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    return fetch(`${BASE}${path}`, { ...init, headers, credentials: 'same-origin' });
  };

  let response = await send(accessToken ?? (await ensureToken()));

  if (response.status === 401) {
    const renewed = await renew();
    if (!renewed) throw new AccountError('AUTH_TOKEN_INVALID', '請重新登入。', 401);
    response = await send(renewed);
  }

  return unwrap<T>(response);
}

/** 沒有 token 就先用 refresh cookie 換一顆；換不到回 null（代表沒登入）。 */
async function ensureToken(): Promise<string | null> {
  return accessToken ?? (await renew());
}

async function renew(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const token = await post<{ accessToken: string; expiresInSeconds: number }>('/refresh');
      accessToken = token.accessToken;
      return accessToken;
    } catch {
      accessToken = null;
      return null;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

export async function signIn(email: string, password: string): Promise<void> {
  const token = await post<{ accessToken: string }>('/login', { email, password });
  accessToken = token.accessToken;
}

export async function signOut(): Promise<void> {
  try {
    await post('/logout');
  } finally {
    accessToken = null;
  }
}

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  jobRole?: string;
  jobRoleOther?: string;
  phone?: string;
  consent: boolean;
  culture?: string;
};

export async function register(payload: RegisterPayload): Promise<{ status: string; message: string }> {
  return post('/register', payload);
}

export async function forgotPassword(email: string): Promise<null> {
  return post('/forgot-password', { email });
}

/**
 * 用信裡的一次性 token 驗證信箱。回傳的 `status` 是驗證後的帳號狀態
 * （網域規則是 AutoApprove 就直接 `approved`，否則 `pendingApproval`）。
 */
export async function verifyEmail(token: string): Promise<{ status: string; message: string }> {
  return post('/verify-email', { token });
}

/** 重寄驗證信。<b>不論 Email 是否存在都回 202</b>，前端據此顯示同一句話。 */
export async function resendVerification(email: string): Promise<null> {
  return post('/resend-verification', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<null> {
  return post('/reset-password', { token, newPassword });
}

/**
 * 已登入時改密碼。走 `accountFetch` 而不是 `post`——這一支需要 access token。
 * 成功後後端會輪替 SecurityStamp 並撤銷其他裝置的 refresh token，
 * 但**目前這個分頁的 access token 仍然有效**，不必重新登入。
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<null> {
  return accountFetch<null>('/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function getProfile(): Promise<MemberProfile> {
  return accountFetch<MemberProfile>('/me');
}

export async function updateProfile(payload: Partial<MemberProfile>): Promise<MemberProfile> {
  return accountFetch<MemberProfile>('/me', { method: 'PUT', body: JSON.stringify(payload) });
}

export type MemberDownload = {
  slug: string;
  title: string;
  description: string | null;
  kind: string;
  accessLevel: string;
  version: string | null;
  documentDate: string | null;
  validUntil: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  canDownload: boolean;
};

export async function listDownloads(): Promise<MemberDownload[]> {
  return accountFetch<MemberDownload[]>('/downloads');
}

/** 換一個十分鐘後失效的下載連結。不要快取回傳值。 */
export async function createDownloadLink(slug: string): Promise<{ url: string; expiresAt: string }> {
  return accountFetch(`/downloads/${encodeURIComponent(slug)}/link`, { method: 'POST' });
}

export type SampleRequestSummary = {
  requestNumber: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  itemCount: number;
};

export type SampleRequestItem = {
  productSlug: string | null;
  productName: string;
  gradeCode: string | null;
  requestedSpec: string | null;
  quantity: number;
  unit: string;
  shippedQuantity: number | null;
};

export type SampleRequestDetail = SampleRequestSummary & {
  approvedAt: string | null;
  deliveredAt: string | null;
  rejectionReason: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  projectName: string | null;
  targetApplication: string | null;
  memberNote: string | null;
  shipTo: {
    name: string;
    company: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    countryCode: string;
    phone: string;
  };
  items: SampleRequestItem[];
};

/** 新增樣品申請的輸入。欄位名對齊後端的 `SampleRequestCreateRequest`。 */
export type SampleRequestCreateInput = {
  shipToName: string;
  shipToCompany: string;
  shipToAddressLine1: string;
  shipToAddressLine2?: string;
  shipToCity: string;
  shipToState?: string;
  shipToPostalCode: string;
  shipToCountryCode: string;
  shipToPhone: string;
  projectName?: string;
  targetApplication?: string;
  memberNote?: string;
  items: {
    /** 留空代表「清單中沒有」——後端允許品項不綁產品，只填規格。 */
    productSlug?: string;
    gradeCode?: string;
    requestedSpec?: string;
    quantity: number;
    unit?: string;
  }[];
};

/**
 * 送出一張新的樣品申請。**只有 `approved` 的會員送得出去**，其餘狀態後端回 403
 * 並附上目前狀態（docs/cms-api.md）。
 */
export async function createSampleRequest(input: SampleRequestCreateInput): Promise<SampleRequestDetail> {
  return accountFetch<SampleRequestDetail>('/sample-requests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listSampleRequests(): Promise<SampleRequestSummary[]> {
  return accountFetch<SampleRequestSummary[]>('/sample-requests');
}

export async function getSampleRequest(requestNumber: string): Promise<SampleRequestDetail> {
  return accountFetch<SampleRequestDetail>(`/sample-requests/${encodeURIComponent(requestNumber)}`);
}

export async function reorderSampleRequest(requestNumber: string): Promise<SampleRequestDetail> {
  return accountFetch(`/sample-requests/${encodeURIComponent(requestNumber)}/reorder`, { method: 'POST' });
}

/** 頁面掛載時用：有 refresh cookie 就換 token 並取回個人資料，沒有就回 null。 */
export async function restoreSession(): Promise<MemberProfile | null> {
  const token = await renew();
  if (!token) return null;

  try {
    return await getProfile();
  } catch {
    return null;
  }
}
