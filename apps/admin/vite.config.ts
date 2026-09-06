import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * 後台是掛在公開站 `/admin` 底下的 SPA —— 同一個 SWA app，所以：
 * - `base` 必須是 `/admin/`（資產路徑會被寫死進 index.html）
 * - 產物直接進 web 的 `public/admin`，由 web 的 middleware rewrite 深層網址
 *
 * <p>
 * 打包體積計入 SWA Free 的 250MB 上限（與公開站共用），所以重量級套件
 * （富文字編輯器、拖拉排序）一律 lazy load，不要進 initial chunk。
 * </p>
 *
 * <p>
 * **後台完全不做 SEO**：它不在 Next.js 的路由樹裡，沒有 metadata、
 * 沒有 sitemap 條目，且被 robots.txt 與 index.html 的 noindex 雙重排除。
 * </p>
 */
export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: '../web/public/admin',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      // 開發時直接打本機 Function App，避免 CORS 與 cookie 的 SameSite 問題
      '/api': { target: 'http://localhost:7071', changeOrigin: true },
    },
  },
});
