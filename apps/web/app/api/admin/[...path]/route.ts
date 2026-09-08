import { NextResponse } from 'next/server';

/**
 * 後台 API 的同源代理。
 *
 * <p>
 * 後台 SPA 掛在 `/admin`，Admin API 則在 Function App 上（另一個網域）。
 * **refresh token 是 httpOnly + SameSite=Strict 的 cookie**，跨網域根本送不出去
 * （docs/cms.md 明講「前後端同源是這個做法成立的前提」）——所以請求走這一支轉出去，
 * 瀏覽器眼中一切都在同一個網域。
 * </p>
 *
 * <p>
 * 這裡**不做任何授權判斷**：授權是 Admin API 的職責（AppRouter 的權限表）。
 * 這一層只負責原樣轉送，包括 Authorization、Cookie 與回應的 Set-Cookie。
 * </p>
 */
const API_BASE = process.env.API_BASE ?? 'http://localhost:7071/api/v1';

/** Content API 與 Admin API 同一個 host，差在路徑前綴。 */
const ADMIN_BASE = API_BASE.replace(/\/v1$/, '/admin');

export const dynamic = 'force-dynamic';

async function proxy(request: Request, path: string[]): Promise<Response> {
  const url = new URL(request.url);
  const target = `${ADMIN_BASE}/${path.join('/')}${url.search}`;

  const headers = new Headers();
  for (const name of ['authorization', 'content-type', 'cookie', 'accept']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  // 限流以 IP 為鍵，因此原始來源要帶過去，否則後端看到的都是同一台前台伺服器。
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) headers.set('x-forwarded-for', forwarded);

  const method = request.method;
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  const response = await fetch(target, { method, headers, body, cache: 'no-store', redirect: 'manual' });

  const out = new NextResponse(response.body, {
    status: response.status,
    headers: { 'Cache-Control': 'no-store' },
  });

  const contentType = response.headers.get('content-type');
  if (contentType) out.headers.set('content-type', contentType);

  // 登入與換發 token 都靠這個標頭；漏掉它後台就永遠停在登入頁。
  for (const cookie of response.headers.getSetCookie()) {
    out.headers.append('set-cookie', cookie);
  }

  return out;
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: Context) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: Request, context: Context) {
  return proxy(request, (await context.params).path);
}

export async function PUT(request: Request, context: Context) {
  return proxy(request, (await context.params).path);
}

export async function PATCH(request: Request, context: Context) {
  return proxy(request, (await context.params).path);
}

export async function DELETE(request: Request, context: Context) {
  return proxy(request, (await context.params).path);
}
