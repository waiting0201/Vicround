import { NextResponse } from 'next/server';

/**
 * 詢問表單的送出代理。
 *
 * <p>
 * 表單在瀏覽器送出，但 Content API 是另一個來源（正式環境是 Functions 的網域）。
 * 走這一支同源的 route handler，前台就不必開 CORS，`API_BASE` 也留在伺服器端。
 * </p>
 *
 * <p>
 * 限流是以 IP 為鍵的（docs/cms-api.md），所以必須把原始的 <code>X-Forwarded-For</code>
 * 帶過去 —— 否則後端看到的每一筆都來自同一台前台伺服器。
 * </p>
 */
const API_BASE = process.env.API_BASE ?? 'http://localhost:7071/api/v1';

export async function POST(request: Request) {
  const body = await request.text();

  const forwarded =
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '';

  const response = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(forwarded ? { 'X-Forwarded-For': forwarded } : {}),
    },
    body,
  });

  // 信封原樣回傳：前端一律以 code 分支（不比對 message 字串）。
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
