/**
 * 把**客戶已確認**的設計系統從 mockup 同步進兩個 app。
 *
 * <p>
 * 真相來源是 `mockup/Rounded Design/_ds/<uuid>/`（Rounded Design 版，客戶 2026-09-02 拍板，
 * 2026-09-06 確認以它為準）。檔案**逐字複製、不做任何改寫** —— 客戶認的是這一份的視覺，
 * 任何「順手調整」都會讓實作與確認稿產生落差。
 * </p>
 *
 * <p>
 * ⚠️ **`design-system/tokens.css`（根目錄那一份）不是這一份。** 它是更早從 CIS Guide Book
 * 推導的 token（`--color-primary: #5e3de7`、淺色語意名），與這裡的 `--purple-500: #6436ef`、
 * `--fg-1` / `--surface-*` 是兩套命名與兩組色值。網站一律用 mockup 這一份；
 * 根目錄那份保留作為 CIS 溯源紀錄，不要拿去接程式。
 * </p>
 *
 * <p>
 * `mockup/` 在 .gitignore 裡（客戶素材只同步 NAS），所以這些 CSS 必須**複製**進 app 才進得了
 * 版控與 CI；產出的檔案帶「不要手改」標頭，改動一律回頭改 mockup 再跑一次這支。
 * </p>
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mockupDs = join(root, 'mockup/Rounded Design/_ds');
const [dsDir] = readdirSync(mockupDs).map((name) => join(mockupDs, name));

const HEADER = (from) =>
  `/* 由 scripts/sync-design-tokens.mjs 從 ${from} 逐字複製 —— 不要手改這一份。\n` +
  `   要改視覺請改 mockup 的原始檔並重跑 \`pnpm sync:tokens\`（客戶確認稿是那一份）。 */\n\n`;

const targets = ['apps/web/app/ds', 'apps/admin/src/ds'];

for (const target of targets) {
  const outDir = join(root, target);
  mkdirSync(join(outDir, 'tokens'), { recursive: true });

  // styles.css 只作為「官方匯入順序」的存證：兩個 app 的 globals/index.css 都是
  // **逐支** import tokens/*.css，因為 @import 被 inline 到檔案中段會被打包器丟掉。
  writeFileSync(
    join(outDir, 'styles.css'),
    HEADER('mockup/Rounded Design/_ds/<ds>/styles.css') + readFileSync(join(dsDir, 'styles.css'), 'utf8'),
  );

  for (const file of readdirSync(join(dsDir, 'tokens'))) {
    writeFileSync(
      join(outDir, 'tokens', file),
      HEADER(`mockup/Rounded Design/_ds/<ds>/tokens/${file}`) +
        readFileSync(join(dsDir, 'tokens', file), 'utf8'),
    );
  }
  console.log(`synced design system -> ${target}`);
}

/**
 * 品牌圖檔。**只搬網站本來就會公開露出的 logo**（wordmark 與 V mark）——
 * banner／產品照屬客戶素材，依 .gitignore 的政策不進 GitHub，上線時由 CMS 的 Blob 媒體庫供應。
 */
const logos = ['vicround-wordmark-white.png', 'vicround-mark-white.png', 'vicround-mark-purple.png'];
const brandDir = join(root, 'apps/web/public/brand');
mkdirSync(brandDir, { recursive: true });
for (const logo of logos) {
  copyFileSync(join(root, 'mockup/Rounded Design/assets', logo), join(brandDir, logo));
}
console.log(`copied ${logos.length} brand logos -> apps/web/public/brand`);

/**
 * 版位照片（hero / 產品 / banner）。
 *
 * <p>
 * 這些是**客戶素材**，依 .gitignore 的政策不進 GitHub —— 所以複製到
 * `apps/web/public/assets/`（同樣被 gitignore），只在本機與 NAS 上存在。
 * 沒有這些檔的環境（CI、正式建置）會落到 `ImageSlot` 的虛線佔位框，
 * 那正是 mockup 自己在沒有素材時的畫法。
 * </p>
 *
 * <p>
 * 正式站的圖片來自 CMS 的 Blob 媒體庫，不是 repo —— 這裡只是讓本機看到確認稿的樣子。
 * </p>
 */
const photoDir = join(root, 'apps/web/public/assets');
mkdirSync(photoDir, { recursive: true });
let photos = 0;
for (const file of readdirSync(join(root, 'mockup/Rounded Design/assets'))) {
  if (!/\.(jpg|jpeg|png|webp)$/i.test(file) || logos.includes(file)) continue;
  copyFileSync(join(root, 'mockup/Rounded Design/assets', file), join(photoDir, file));
  photos += 1;
}
console.log(`copied ${photos} mockup photos -> apps/web/public/assets (gitignored)`);
