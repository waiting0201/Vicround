import type { NextConfig } from 'next';

/**
 * ⚠️ 部署目標是 Azure Static Web Apps **Free** 方案的 Next.js hybrid（preview 功能）。
 * 這裡多數設定對應該平台的硬限制，改動前先讀 docs/azure-deployment.md。
 */
const nextConfig: NextConfig = {
  // SWA Free 單一環境上限 250MB。standalone 是必須，不是最佳化選項。
  output: 'standalone',

  // monorepo：tracing 根保留在 repo 根，否則 pnpm 的相依會落在追蹤範圍外，
  // 產物只留下指向 standalone 之外的符號連結（看起來變小，其實是空的）。
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,

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
