import { NextResponse } from 'next/server';

/**
 * 會員 API 的同源代理。
 *
 * <p>
 * 與 `/api/admin/[...path]` 同一個理由：**refresh token 是 httpOnly + SameSite=Strict
 * 的 cookie**，跨網域送不出去，所以請求得從前台自己的網域轉出去。
 * </p>
 *
 * <p>
 * ⚠️ <b>路徑不能改。</b>後端把 cookie 的 <code>Path</code> 設成 <code>/api/v1/account</code>
 * （見 `AccountAuthHandler`），瀏覽器只會把 cookie 送回符合該路徑的請求。這支代理
 * 因此必須原樣坐落在 <code>/api/v1/account/**</code> ——搬到 <code>/api/account/**</code>
 * 之類的「比較短」的位置，登入會成功、但下一次 refresh 永遠拿不到 cookie。
 * </p>
 *
 * <p>
 * 這一層不做任何授權判斷：授權是 Account API 的職責。
 * </p>
 */
const API_BASE = process.env.API_BASE ?? 'http://localhost:7071/api/v1';

export const dynamic = 'force-dynamic';

async function proxy(request: Request, path: string[]): Promise<Response> {
  const url = new URL(request.url);
  const target = `${API_BASE}/account/${path.join('/')}${url.search}`;

  const headers = new Headers();
  for (const name of ['authorization', 'content-type', 'cookie', 'accept', 'accept-language']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

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
