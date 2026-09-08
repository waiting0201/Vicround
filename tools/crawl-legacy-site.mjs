/**
 * 爬舊站 www.vicround.com，產出真實的網址清單供 301 對照使用。
 *
 * 為什麼要爬：舊站是 Weebly，**沒有 sitemap，而且對任何不存在的路徑都回 200 + 首頁**
 * （catch-all），所以既不能讀 sitemap 也不能用「打打看有沒有 404」來確認網址存在。
 * 唯一可靠的辨識法是比對 <title>——與首頁標題不同的才是真頁面。
 *
 * 匯出檔（reference/sbk/data）的 pages 區段只有 id 與 title、沒有網址，因此這份爬取
 * 結果是網址的主要來源；匯出檔的標題則用來補上沒有被連到的孤兒頁（見 LegacyImportSeeder）。
 *
 *   node tools/crawl-legacy-site.mjs [輸出路徑]
 *
 * 零相依。跑完把結果交給 `dotnet ... import-legacy` 寫進 Redirects。
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const HOST = 'www.vicround.com';
const BASE = `https://${HOST}`;
const MAX_PAGES = 400;
const DELAY_MS = 250;
const USER_AGENT = 'VicRound-migration-audit/1.0 (+site rebuild)';

const outPath = resolve(process.argv[2] ?? 'artifacts/legacy-urls.json');
const skip = /\.(jpg|jpeg|png|webp|gif|svg|pdf|zip|css|js|ico|mp4)(\?|$)/i;

const seen = new Set();
const pages = new Map();
const queue = ['/'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

while (queue.length > 0 && pages.size < MAX_PAGES) {
  const path = queue.shift();
  if (seen.has(path) || skip.test(path)) continue;
  seen.add(path);

  let html;
  try {
    const res = await fetch(new URL(path, BASE), { headers: { 'User-Agent': USER_AGENT } });
    html = await res.text();
  } catch (e) {
    console.error(`  ! ${path} ${e.message}`);
    continue;
  }

  pages.set(path, (/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '').trim());
  await sleep(DELAY_MS);

  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (/^(mailto:|tel:|#|javascript:)/.test(href)) continue;
    if (href.startsWith('http') && !href.includes(HOST)) continue;

    const p = new URL(href, BASE).pathname;
    if (p && !seen.has(p) && !skip.test(p)) queue.push(p);
  }
}

// 舊站對任何路徑都回首頁，因此 <title> 與首頁相同的即視為「不是真頁面」。
const homeTitle = pages.get('/') ?? '';
const real = Object.fromEntries(
  [...pages].filter(([path, title]) => path === '/' || title !== homeTitle),
);

await mkdir(dirname(outPath), { recursive: true });
await writeFile(
  outPath,
  JSON.stringify({ crawledAt: new Date().toISOString(), source: BASE, homeTitle, pages: real }, null, 2) + '\n',
);

console.log(`抓了 ${pages.size} 個路徑，其中 ${Object.keys(real).length} 個是真頁面`);
console.log(`→ ${outPath}`);
