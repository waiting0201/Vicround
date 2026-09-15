/**
 * 後台關聯欄位的對照檢查。
 *
 * <p>
 * 後台畫面的欄位定義在 `apps/admin/src/lib/resources.ts`，但**真的把值寫進連結表**的是
 * `Api/Services/Admin/AdminResources.cs` 的 `Links` / `Children` 登記。兩邊都要有，
 * 少一邊不會有任何錯誤訊息 —— 編輯者照樣勾選、照樣按儲存、照樣看到「已儲存」，
 * 資料卻被靜默丟掉。2026-09-15 就是這樣漏掉兩個：產品圖庫存不進去、後台新增的
 * 編輯者一個角色都沒有（權限預設拒絕，那個帳號登入後每一支端點都是 403）。
 * </p>
 *
 * 用法：`node scripts/check-admin-links.mjs`
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const admin = readFileSync(join(ROOT, 'apps/admin/src/lib/resources.ts'), 'utf8');
const api = readFileSync(join(ROOT, 'Api/Services/Admin/AdminResources.cs'), 'utf8');

/** 後台畫面上「一存就該寫進連結表」的欄位型別。子項集合另外抓（見下面的 `key:`）。 */
const JOIN_TYPES = ['multiReference', 'mediaList'];

/** 前端：`type: 'xxx'` 起一段，到下一個 `type:` 為止。 */
const front = new Map();

for (const block of admin.split(/\n(?=  type: ')/)) {
  const slug = block.match(/^ {2}type: '([a-z-]+)'/)?.[1];
  if (!slug) continue;

  const fields = new Set();

  for (const type of JOIN_TYPES) {
    // 欄位定義可能寫成一行，也可能跨行，因此只抓「name 與 type 同在一段大括號內」。
    for (const match of block.matchAll(new RegExp(`name: '(\\w+)',[^{}]*?type: '${type}'`, 'g'))) {
      fields.add(match[1]);
    }
  }

  // 子項集合（規格列、版塊、製程步驟）在資料字典裡是 `children: [{ key: '…' }]`。
  for (const child of block.matchAll(/^ {6}key: '(\w+)'/gm)) fields.add(child[1]);

  if (fields.size > 0) front.set(slug, fields);
}

/** 後端：`new("slug", typeof(X)` 起一段，到下一個同層 `new(` 或登記表結尾為止。 */
const back = new Map();

for (const match of api.matchAll(/new\("([a-z-]+)", typeof\((\w+)\)(.*?)(?=\n {8}new\("|\n {4}\];)/gs)) {
  const [, slug, , body] = match;
  const registered = new Set();

  // Links 與 Children 的差別在參數，不在欄位名——這裡只關心「這個欄位有沒有被登記」。
  for (const entry of body.matchAll(/new\("(\w+)", typeof\(/g)) registered.add(entry[1]);

  back.set(slug, registered);
}

let problems = 0;

for (const [slug, fields] of front) {
  const registered = back.get(slug) ?? new Set();
  const missing = [...fields].filter((field) => !registered.has(field));

  if (missing.length > 0) {
    problems += missing.length;
    console.error(
      `✗ ${slug}：畫面有 ${missing.join('、')}，但 AdminResources.cs 沒有對應的 Links／Children 登記。`,
    );
  }
}

if (problems > 0) {
  console.error(
    `\n共 ${problems} 個欄位存不進去。` +
      '在 Api/Services/Admin/AdminResources.cs 的該單元補上 Links（連結表）或 Children（子表）登記。',
  );
  process.exit(1);
}

console.log(`後台關聯欄位檢查通過（${front.size} 個單元）。`);
