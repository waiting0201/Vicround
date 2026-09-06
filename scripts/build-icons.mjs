/**
 * 產生 `apps/web/components/Icon.tsx` —— 把 mockup 用到的 Lucide 圖示內嵌成 SVG。
 *
 * <p>
 * mockup 透過設計系統的 Icon 元件從 CDN 取 `lucide-static`。正式站不這麼做：
 * 每顆圖示一次 request、CDN 掛掉就整排變空白（mockup 的 footer 社群圖示就出過這事，
 * Simple Icons 撤下 LinkedIn glyph 之後回 404）。這裡在建置期抓一次、內嵌進元件。
 * </p>
 *
 * <p>
 * 用法：`node scripts/build-icons.mjs`。要新增圖示就把名字加進 ICONS 再跑一次；
 * 名字必須是 lucide.dev 上的既有圖示 —— **不要自己畫**。
 * </p>
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = '0.469.0'; // 釘版本：圖示外形改版會讓畫面無聲變樣

/**
 * mockup 各頁實際用到的圖示（`grep 'Icon" name='` 掃出來的全集）。
 *
 * <p>
 * ⚠️ mockup 有一處用了 `layers-3` —— 那是**舊版 lucide 的名字**，在現行版本已併入
 * `layers`（抓 layers-3 會 404）。內容資料一律寫 `layers`，外形相同。
 * </p>
 */
const ICONS = [
  'align-center-horizontal', 'audio-waveform', 'book-open', 'car', 'check',
  'volume-2', 'settings-2',
  'circle-user-round', 'clipboard-check', 'cloud-fog', 'cloud-rain', 'download',
  'droplets', 'eye-off', 'factory', 'file-text', 'flame', 'flask-conical',
  'glasses', 'handshake', 'headphones', 'layers', 'leaf', 'lightbulb', 'mail',
  'map-pin', 'monitor', 'package', 'pen-line', 'phone', 'scale', 'scan-line',
  'scissors', 'search', 'shield', 'shield-check', 'sliders-horizontal',
  'smartphone', 'speaker', 'square-dashed', 'stethoscope', 'sun', 'target',
  'thermometer', 'truck', 'users', 'x',
];

/** SVG 的屬性名要轉成 JSX 的 camelCase，否則 React 會警告並丟掉該屬性。 */
const ATTR = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
};

const entries = [];

for (const name of ICONS) {
  const url = `https://cdn.jsdelivr.net/npm/lucide-static@${VERSION}/icons/${name}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: ${res.status} —— 確認 lucide.dev 上有這個名字`);

  const svg = await res.text();
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>[\s\S]*$/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/([a-z]+(?:-[a-z]+)+)=/g, (match, attr) => (ATTR[attr] ? `${ATTR[attr]}=` : match))
    .replace(/\s*\/>/g, ' />')
    .trim()
    .split('\n')
    .map((line) => `      ${line.trim()}`)
    .join('\n');

  entries.push(`  '${name}': (\n    <>\n${inner}\n    </>\n  ),`);
}

const file = `import type { ReactNode } from 'react';

/**
 * Lucide 圖示（MIT）。由 scripts/build-icons.mjs 內嵌產生 —— **不要手改這個檔**，
 * 要新增圖示請把名字加進那支腳本的 ICONS 再跑一次。
 *
 * <p>
 * mockup 是從 CDN 逐顆抓 lucide-static；內嵌之後少了 N 次請求，
 * 也不會在 CDN 出事時整排圖示變空白。版本釘在 ${VERSION}。
 * </p>
 */
const PATHS: Record<string, ReactNode> = {
${entries.join('\n')}
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName | string; size?: number }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
`;

writeFileSync(join(ROOT, 'apps/web/components/Icon.tsx'), file);
console.log(`wrote apps/web/components/Icon.tsx — ${ICONS.length} icons`);
