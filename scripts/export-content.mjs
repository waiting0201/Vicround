/**
 * 把 `apps/web/content/*.ts` 的暫代文案倒成一份 JSON，供後端的 `import-content`
 * 寫進資料庫（docs/database.md §18.1 的 C 層）。
 *
 * 為什麼是腳本而不是把文案手抄進 C#：`content/` 是客戶確認稿的逐字轉錄，3700 多行、
 * 1282 組雙語字串。手抄一定會抄錯，而且 mockup 之後有更動就對不上。從真檔案讀，
 * 匯入結果與前台現在顯示的內容必然一致。
 *
 * 這支腳本是**一次性**的：`content/` 在接上 Content API 後刪除，本檔一併刪除。
 *
 *   node scripts/export-content.mjs [輸出路徑]
 *
 * 不需要任何額外套件 —— Node 24 原生剝除 TS 型別，只補一個 `@/` 別名的解析 hook。
 */
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = join(repoRoot, 'apps', 'web');
const contentDir = join(webRoot, 'content');

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) {
      return { url: pathToFileURL(join(webRoot, specifier.slice(2) + '.ts')).href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const outPath = process.argv[2] ?? join(repoRoot, 'artifacts', 'content-export.json');

const files = (await readdir(contentDir)).filter((f) => f.endsWith('.ts')).sort();
const content = {};
let namedExports = 0;

for (const file of files) {
  const module = await import(pathToFileURL(join(contentDir, file)).href);
  const key = file.replace(/\.ts$/, '');
  const exported = Object.fromEntries(Object.entries(module).filter(([name]) => name !== 'default'));
  content[key] = exported;
  namedExports += Object.keys(exported).length;
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'apps/web/content',
  note: '英文逐字取自 mockup/Rounded Design/（客戶確認稿）；繁中為暫譯，待客戶校稿。',
  files: files.length,
  content,
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');

const json = JSON.stringify(content);
const localized = (json.match(/"zh-Hant":/g) ?? []).length;
console.log(`匯出 ${files.length} 個檔案、${namedExports} 個具名 export、${localized} 組雙語字串`);
console.log(`→ ${outPath}`);
