// 把 `next build`（output: 'standalone'）的產物整理成 SWA 收得下的形狀。
//
// 兩件事：
// 1. 把 `.next/static` 與 `public/` 複製進 standalone —— Next 不會自己放。少了它們，
//    部署後 CSS、字型、圖片與整個 /admin 全部 404，而 build 與部署都顯示成功。
// 2. 壓平 pnpm workspace 造成的兩層巢狀。SWA 找的入口是 `.next/standalone/server.js`；
//    在 workspace 下 Next 會把它放到 `.next/standalone/apps/web/server.js`，SWA 找不到
//    入口，會一路跑到最後才回「Web app warm up timed out」，沒有其他診斷訊息。
//
// ⚠️ CI 必須以 NPM_CONFIG_NODE_LINKER=hoisted 安裝：SWA 的打包器不跟隨符號連結，
//    而 pnpm 預設的 node_modules 幾乎全是連結。本機保留 pnpm 的嚴格佈局（才擋得住
//    phantom dependency），只有 CI 改成 hoisted。
//
// ⚠️ 不要改用 `outputFileTracingRoot` 來避開巢狀，原因見 next.config.ts。
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const standalone = path.join(root, '.next', 'standalone');
const nested = path.join(standalone, 'apps', 'web');

if (!existsSync(standalone)) {
  console.error('[pack-standalone] 找不到 .next/standalone —— next.config.ts 是否還設著 output: standalone？');
  process.exit(1);
}

// workspace 下才有巢狀；單一專案建置時 server.js 本來就在根。
const appDir = existsSync(nested) ? nested : standalone;

cpSync(path.join(root, '.next', 'static'), path.join(appDir, '.next', 'static'), { recursive: true });

// 版位素材上了 Blob 之後就不要再打包一份 —— 這是 250MB 額度真正省下來的地方。
// 沒設 NEXT_PUBLIC_MEDIA_BASE（本機 build）時照舊整包複製，行為不變。
const publicSrc = path.join(root, 'public');
const assetsDir = path.join(publicSrc, 'assets');
const onBlob = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? '').trim() !== '';

cpSync(publicSrc, path.join(appDir, 'public'), {
  recursive: true,
  filter: (src) => !(onBlob && (src === assetsDir || src.startsWith(assetsDir + path.sep))),
});

if (onBlob) {
  console.log('[pack-standalone] 素材走 Blob，public/assets 未打包');
}

if (appDir !== standalone) {
  // node_modules 已經在 standalone 根（tracing 從 repo 根複製進來的實體檔案），
  // 這裡只把 app 自己的檔案往上搬，不要動它 —— 動了就是 MODULE_NOT_FOUND。
  cpSync(appDir, standalone, { recursive: true });
  rmSync(path.join(standalone, 'apps'), { recursive: true, force: true });
}

if (!existsSync(path.join(standalone, 'server.js'))) {
  console.error('[pack-standalone] 壓平後仍找不到 server.js —— SWA 會以 warm up timeout 失敗。');
  process.exit(1);
}

console.log('[pack-standalone] ✓ standalone 已就緒（server.js 在根目錄）');
