import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 發布 → 失效（docs/cms.md「Publish → revalidate」）。
 *
 * <p>
 * `fn-admin` 在 publish / unpublish / 改 slug 之後打這一支，帶上受影響的 tag
 * （**兩個語系都要**），SSR 的下一次請求就會重新取資料。
 * 這是 API 唯一反向呼叫 web app 的路徑，必須守在共用密鑰之後。
 * </p>
 *
 * <p>
 * ⚠️ 密鑰比對用 header 而不是 query string —— query 會進存取記錄。
 * </p>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  // 沒設密鑰時**一律拒絕**。預設放行會讓任何人都能清空快取。
  if (!secret || req.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { tags?: string[] } | null;
  const tags = body?.tags?.filter((t) => typeof t === 'string' && t.length > 0) ?? [];

  if (tags.length === 0) {
    return NextResponse.json({ error: 'no tags supplied' }, { status: 400 });
  }

  for (const tag of tags) revalidateTag(tag);

  return NextResponse.json({ revalidated: tags, at: new Date().toISOString() });
}
