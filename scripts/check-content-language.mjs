/**
 * 內容語言檢查。
 *
 * <p>
 * 兩件事：
 * 1. **不該出現的語言** —— 任何西里爾字母或韓文都是打字/輸入法誤植（本站只有英文與繁中）。
 *    這種錯誤在畫面上很難一眼看到，卻會直接印在客戶面前。
 * 2. **語言純度**（docs 的規則）—— `en` 欄位不得出現中日韓字元；`zh-Hant` 欄位不得
 *    出現連續的英文單字（品牌名、標準代號、型號屬正常，所以只在超過三個連續英文詞時才報）。
 * </p>
 *
 * 用法：`node scripts/check-content-language.mjs`
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = ['apps/web/content', 'apps/web/messages'];

const CYRILLIC = /[Ѐ-ӿ]/;
const HANGUL = /[가-힯]/;
const CJK = /[　-〿㐀-鿿＀-￯]/;

let problems = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|json)$/.test(entry)) continue;

    readFileSync(full, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        const where = `${full.replace(`${ROOT}/`, '')}:${index + 1}`;
        if (CYRILLIC.test(line) || HANGUL.test(line)) {
          console.error(`${where} 出現非本站語言的字元（西里爾／韓文），多半是輸入法誤植：\n  ${line.trim()}`);
          problems += 1;
        }
        // t('英文', '中文') 的第一個參數不該有 CJK
        const pair = line.match(/t\(\s*'((?:[^'\\]|\\.)*)'\s*,/);
        if (pair && CJK.test(pair[1])) {
          console.error(`${where} 英文欄位出現中文字元（語言純度）：\n  ${line.trim()}`);
          problems += 1;
        }
      });
  }
}

for (const target of TARGETS) walk(join(ROOT, target));

if (problems > 0) {
  console.error(`\n${problems} 處問題。`);
  process.exit(1);
}
console.log('內容語言檢查通過。');
