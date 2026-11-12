import type { NextConfig } from 'next';

/**
 * ⚠️ 部署目標是 Azure Static Web Apps **Free** 方案的 Next.js hybrid（preview 功能）。
 * 這裡多數設定對應該平台的硬限制，改動前先讀 docs/azure-deployment.md。
 */
const nextConfig: NextConfig = {
  /**
   * SWA Free 單一環境上限 250MB —— standalone 是必須，不是最佳化選項。
   * 產物由 `scripts/pack-standalone.mjs` 收尾（見 package.json 的 postbuild）：
   * 補上 `.next/static` 與 `public/`，並壓平 pnpm workspace 造成的兩層巢狀。
   */
  output: 'standalone',

  /**
   * ⚠️ **不要**把 `outputFileTracingRoot` 釘在這個 app 上來避開巢狀。
   *
   * 那樣產物確實會變平坦（`.next/standalone/server.js`），但 pnpm 的相依都躺在
   * workspace 根的 `.pnpm` store 裡 —— tracing 根縮小之後那些檔案落在範圍外，
   * Next 只會留下**指向 standalone 之外的符號連結**。體積大幅下降看起來像優化，
   * 其實是空的，SWA 打包時會以 `Could not find file .../node_modules/react` 失敗。
   *
   * 正確做法是保留 repo 根當 tracing 根（相依會真的被複製進來），再由 postbuild
   * 把巢狀那兩層壓平。壓平時只搬 app 自己的檔案，`node_modules` 留在 standalone 根 ——
   * 連 node_modules 一起搬會變成 `Cannot find module 'styled-jsx/package.json'`。
   */

  images: {
    /**
     * 關閉 Next.js 的圖片優化：SWA 的 managed backend 代為縮圖會讓每個位元組
     * 都計入 Free 方案 100GB/月頻寬。圖片一律由 Blob/CDN 直供，尺寸在上傳時產生。
     */
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '*.blob.core.windows.net' },
      { protocol: 'http', hostname: '127.0.0.1', port: '10000' },
    ],
  },

  /**
   * 安全標頭由此輸出 —— launch 階段沒有 Front Door，沒有別的地方可以加。
   */
  async headers() {
    return [
      {
        /**
         * ⚠️ 內容頁的 HTML **不可以**讓 CDN 自己留著。
         *
         * 這些頁面是預先產生的，Next 預設會送出 `s-maxage=31536000`；SWA 內建的
         * 邊緣快取照單全收，於是發布後 `revalidateTag` 明明成功（Next 這一側已經是
         * 新內容），訪客拿到的卻是邊緣上那份舊 HTML，最長一年，而且沒有任何錯誤訊息。
         * 改成每次都回源確認：Next 自己的快取仍在，回源很便宜。
         *
         * Next 只在回應還沒有 Cache-Control 時才補上預設值，所以這裡先設就會生效。
         */
        source: '/:locale(en|zh-Hant)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  /**
   * 語系前綴與 DB 驅動的 301 一律在 middleware.ts 處理，這裡刻意不設 redirects/rewrites。
   * 若日後要加，source 必須排除 `.swa` 開頭 —— SWA 以 /.swa/health.html 驗證部署，
   * 被攔下會直接判定部署失敗。
   */
};

export default nextConfig;
