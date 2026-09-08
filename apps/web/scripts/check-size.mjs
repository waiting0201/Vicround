// SWA Free 方案單一環境上限 250MB，超出即部署失敗（docs/azure-deployment.md）。
// 在 build 當下就擋，不要等部署才發現。
//
// 全部環境合計上限 500MB，實務上只夠 prod 加一個預覽環境；逼近上限時會先從
// 預覽環境開始失敗，症狀看起來與 PR 本身無關。
import { execSync } from 'node:child_process';

const LIMIT_MB = 250;
const WARN_MB = 200;

const out = execSync('du -sm .next/standalone', { encoding: 'utf8' });
const mb = Number(out.trim().split(/\s+/)[0]);

if (Number.isNaN(mb)) {
  console.warn('[check-size] 無法量測產物大小，略過。');
  process.exit(0);
}

if (mb > LIMIT_MB) {
  console.error(`\n[check-size] ✗ standalone 產物 ${mb}MB，超過 SWA Free 的 ${LIMIT_MB}MB 上限。`);
  console.error('  部署會失敗。最大宗通常是 public/assets（版位照片）——');
  console.error('  正式站素材走 Blob Storage，設好 NEXT_PUBLIC_MEDIA_BASE 之後這裡會大幅下降。\n');
  process.exit(1);
}

if (mb > WARN_MB) {
  console.warn(`\n[check-size] ⚠ standalone 產物 ${mb}MB，已接近 ${LIMIT_MB}MB 上限。\n`);
} else {
  console.log(`[check-size] ✓ standalone 產物 ${mb}MB（上限 ${LIMIT_MB}MB）`);
}
