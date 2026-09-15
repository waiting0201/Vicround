/**
 * 可以整段關掉的功能開關。
 *
 * <p>
 * 刻意用 `NEXT_PUBLIC_` 前綴、刻意**不加 `server-only`**：這一版部署在 Azure Static
 * Web Apps 上，沒有在管執行期的應用程式設定，環境變數只在 CI 的 build 步驟帶得進去
 * （`.github/workflows/web.yml`，與 `NEXT_PUBLIC_SITE_URL`／`NEXT_PUBLIC_MEDIA_BASE`
 * 同一套作法）。伺服器端的 `process.env.X` 是**執行期**才讀，SWA 上會讀成 undefined；
 * `NEXT_PUBLIC_` 的值則在 build 時就被內嵌，build 與執行期才會是同一個答案。
 * 開關的值不是機密。
 * </p>
 */

/**
 * 前台會員區（`/member/**`、`/account/**`、`/api/v1/account/**`）。
 *
 * <p>
 * **預設關閉**：沒設這個變數就是藏起來。程式碼全部留著，要開只要把 repo 變數
 * `MEMBERS_ENABLED` 設成 `true` 再重跑 web workflow——不必改程式。關閉時：
 * </p>
 * <ul>
 *   <li>Header 的會員鈕不渲染；`llms.txt` 不提會員區與樣品申請</li>
 *   <li>需要登入的下載改指向「聯絡我們索取」，不再導去登入頁</li>
 *   <li>`/member/**` 與 `/account/**` 共 11 條路由一律 404（各自的 layout 擋）</li>
 *   <li>會員 API 的同源代理 `/api/v1/account/**` 一律 404 —— 不擋這一層的話，
 *       頁面藏起來了，註冊與登入還是能靠直接打 API 完成</li>
 * </ul>
 *
 * <p>
 * ⚠️ 後端的 Account API <b>照常在跑</b>。這個開關關的是前台的入口與代理，不是
 * `fn-public` 上的端點；真的要連後端一起關，得在 Functions 那邊處理。
 * </p>
 */
export const MEMBERS_ENABLED = process.env.NEXT_PUBLIC_MEMBERS_ENABLED === 'true';
