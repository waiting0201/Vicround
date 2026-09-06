/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Admin API base。預設 `/api/admin`（與公開站同源，走 SWA 的 /api 代理）。 */
  readonly VITE_ADMIN_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
