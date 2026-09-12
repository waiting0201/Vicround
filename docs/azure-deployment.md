# Azure Deployment

## 已建立的資源（2026-09-08）

一個資源群組 **`VicRoundUS`**（West US 2），命名比照姊妹專案 `NTIUS`：

| 資源 | 名稱 | 方案 | 位址 |
| --- | --- | --- | --- |
| Function App | `func-vicround-prod` | Flex Consumption FC1、Linux、.NET 10 isolated | `https://func-vicround-prod.azurewebsites.net/api` |
| Static Web Apps | `stapp-vicround-prod` | **Free** | `https://green-desert-0eeb2ce1e.3.azurestaticapps.net` |
| SQL Database | `vicround-sql-prod` / `VicRound` | Basic（5 DTU / 2GB） | 防火牆只開「允許 Azure 服務」 |
| Storage | `stvicroundprod` | StorageV2 LRS | 容器 `public-media`（公開讀）、`member-documents`（私有） |
| Application Insights | `ai-vicround-prod` | 隨用隨付 | Functions 遙測 |

**尚未建立**（刻意）：Key Vault（密鑰放 Function App 應用程式設定）、staging 環境與部署插槽
（Flex Consumption 沒有插槽）、Front Door / WAF。

**自訂網域**：SWA 已綁預覽網域 `vicround.4webdemo.com`（2026-09-11，狀態 Ready），
DNS 代管在 Cloudflare 且開啟 proxy——見下方「CDN 在 SWA 前面時」。正式網域
`www.vicround.com` 尚未綁定，repo variable `SITE_URL` 也還停在 SWA 預設網域，
因此 canonical 與 `sitemap.xml` 目前仍指向 `green-desert-…azurestaticapps.net`。

**部署身分**：Entra 應用程式 `github-vicround-deploy` + GitHub OIDC 同盟認證，
對 `VicRoundUS` 有 Contributor。GitHub 端只存 `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` /
`AZURE_SUBSCRIPTION_ID` 三個非機密值，**沒有任何長期憑證**；SWA 的部署 token 與
DB 連線字串都在流程中現拿現用。

⚠️ GitHub 現在送的 OIDC subject 是「不可變識別碼」格式
（`repo:<owner>@<ownerId>/<repo>@<repoId>:...`），與傳統的 `owner/repo` 不同——
兩種都要建同盟認證，否則會得到 `AADSTS700213`。

## Resources

| Component | Azure service | Notes |
| --- | --- | --- |
| Public site + admin (Next.js, SSR) | **Static Web Apps — Free plan (hybrid Next.js)** | runs SSR on SWA's managed Node backend; locale-prefixed routes `/{en,zh-Hant}/...`; **built-in global CDN + free managed TLS** |
| CMS API (.NET 10, Azure Functions) | **Function App (Linux, isolated)** | `fn-public` + `fn-admin`; deployment slots `staging` + `production` |
| Database | **Azure SQL Database** | General Purpose; geo-backup |
| Media | **Blob Storage** (public read container) | served via direct Blob URL at launch; add Azure CDN later if needed |
| Secrets | **Key Vault** | DB connection, **JWT signing key**, email creds, revalidate secret |
| Monitoring | **Application Insights** + Log Analytics | Functions + Next.js; alerts on errors/latency |
| Identity (admin) | **self-built JWT** in the Admin API (`Users`/`Roles` in SQL) | no Entra ID dependency |
| Edge / WAF (later) | **Azure Front Door** | deferred — adds WAF, SLA, advanced cache purge once traffic/security warrant |

**SWA Free + Next.js hybrid SSR — verified against Microsoft Learn (`deploy-nextjs-hybrid`,
updated 2026-01):**

- **SSR works on Free.** A managed backend that runs SSR is provided automatically for every
  hybrid Next.js deployment on **all plans**, Free included.
- ⚠️ **Hybrid Next.js support is in _Preview_** — no GA SLA, behavior may change. This is the
  main risk to weigh for a production site; if unacceptable, go **SWA Standard** or host Next.js
  on **App Service / Container Apps** (non-preview).
- **250 MB app-size cap.** 因此 `next.config.ts` 設 `output: 'standalone'`，CI 自建產物後以
  `skip_app_build: true` 上傳（`app_location: apps/web`）。產物由
  `apps/web/scripts/pack-standalone.mjs` 收尾，`check-size.mjs` 在 build 當下擋 250MB。

  ⚠️ **2026-09-08 踩坑（結論已修正）。** 自建 standalone 一開始三次都停在
  `Web app warm up timed out`，當時誤判成「SWA 只吃 Oryx 建的產物」而改走 Oryx。
  對照姊妹專案 NTI／EuniceMed 後，真正的原因是產物形狀，共三件事：

  1. pnpm workspace 下 Next 會把入口放在 `.next/standalone/apps/web/server.js`，
     而 SWA 找的是根目錄的 `server.js` —— 找不到入口就是 warm up timeout，沒有其他訊息。
  2. `.next/static` 與 `public/` Next **不會**自己放進 standalone。少了它們，
     部署會顯示成功而 CSS、字型與整個 `/admin` 全部 404。
  3. 壓平巢狀時只能搬 app 自己的檔案；`node_modules` 已經在 standalone 根，一起搬會變成
     `Cannot find module 'styled-jsx/package.json'`（第一次修時就是這樣壞的）。

  另外 CI 必須以 `NPM_CONFIG_NODE_LINKER=hoisted` 安裝 —— SWA 的打包器不跟隨符號連結。
  **不要**改用 `outputFileTracingRoot` 來避開巢狀：那會讓相依變成指向 standalone 之外的
  符號連結，體積下降看起來像優化，SWA 打包時卻以 `Could not find file .../node_modules/react`
  失敗（見 `apps/web/next.config.ts` 的註解）。
- **Linked backends (SWA-integrated Azure Functions/App Service) need Standard + ≥S1** — we do
  **not** use that feature. The Next.js SSR server calls the Functions API directly over HTTPS,
  so Free is sufficient.
- Other Free limits: no SLA, ~100 GB/month bandwidth, up to 2 custom domains, no
  private endpoints/WAF. ISR *image* caching is unsupported (we use SSR + `revalidateTag`, so
  this doesn't bite).

**Function hosting plan:** start on **Flex Consumption** (scales to zero, cheapest). Move
`fn-admin` to **Premium** later only if cold starts on the editor experience or VNet/private-
endpoint access to SQL become necessary.

Group everything in one resource group per environment (`rg-vicround-prod`,
`rg-vicround-stg`). Prefer infrastructure-as-code (Bicep) checked into `infra/`.

## Environments

`dev` (local) → `staging` → `production`. Staging mirrors prod and is the place to validate
migrations and content imports before go-live. Production deploys via **slot swap** (deploy to
`staging` slot, warm up, swap) for zero-downtime.

## CI/CD

GitHub Actions (or Azure DevOps). Two pipelines:

- **API (Functions)** — `dotnet build` → `dotnet test` → `func`/`dotnet publish` → deploy to
  Function App `staging` slot → run `dotnet ef database update` against the target DB → swap to
  production.
- **Web (Next.js)** — `npm ci` → `npm run lint` → `npm test` → `npm run build` → deploy to
  **Static Web Apps** (Azure SWA deploy action / Oryx build).

Migrations run as an explicit, gated pipeline step (never auto-run on Function startup in
prod). After a deploy that changes templates, trigger a `revalidateTag` sweep / redeploy so new
markup is served.

## Configuration & secrets

- No secrets in source, `appsettings.json`, or `local.settings.json`. The Function App reads
  from **Key Vault references**; pipelines use OIDC federated credentials (no stored publish
  profiles).
- Per-environment settings: DB connection (Key Vault), **JWT signing key + issuer/audience**
  (Key Vault), allowed CORS origins (the Next.js site domain only), `Culture` defaults, Blob
  base URL, App Insights key, the **Next.js `revalidateTag` secret** shared by `fn-admin`,
  and the **SMTP 設定**（下一節）。
- Restrict SQL access via the firewall (allow Azure services + the Function App outbound IPs;
  private endpoint only once on a VNet-capable Functions plan). Connect with a least-privilege
  SQL login.

## 寄信（會員信與詢問單通知）

驗證信、重設密碼信、詢問單的窗口通知與客戶回執都走 **SMTP**
（`Api/Services/IEmailSender.cs`）。押在 SMTP 而不是 Communication Services 的 SDK，是因為
ACS Email 本身就提供 SMTP relay，SendGrid、M365 與客戶自己的郵件主機也都是 SMTP ——
一套實作涵蓋所有候選管道，也不必為了寄兩種信多背一個 Azure SDK 相依。

| 設定鍵 | 說明 |
| --- | --- |
| `Mail:Host` | SMTP 主機。**與 `Mail:From` 兩者缺一就不寄信**（記一筆 Warning，不擋流程） |
| `Mail:Port` | 預設 `587` |
| `Mail:User` / `Mail:Password` | 留空則匿名寄送（內網 relay 的常見設定）。密碼放 Key Vault |
| `Mail:From` / `Mail:FromName` | 寄件位址與顯示名稱（預設 `VicRound`） |
| `Mail:UseStartTls` | 預設 `true`，設 `false` 才關掉 |

另外需要 **`SiteSettings` 的 `site.baseUrl`**（後台可改，設定檔的 `Site:BaseUrl` 是備援）：
信裡的連結是絕對網址，沒有它就**不寄**並把連結寫進遙測——寧可不寄，也不要寄出一封
連結是壞的信。正式網域換成 `www.vicround.com` 那天，改這一列即可，不必重新部署。

寄信失敗永不讓業務動作失敗：帳號已經建好、詢問單已經落庫，失敗只記 Error。

**本機驗證**（不需要真的郵件主機）：起一個收件槽（任何 SMTP sink 皆可），在
`Api/local.settings.json` 設 `Mail:Host=localhost`、`Mail:Port=1025`、`Mail:UseStartTls=false`、
`Mail:From`、`Site:BaseUrl=http://localhost:3000`，就能把註冊 → 驗證 → 忘記密碼 → 重設
整條流程走完。

## 前台的 build-time 變數（GitHub repo variables）

`web.yml` 會把兩個 repo variable **內嵌進建置產物**，所以改了變數必須重跑 workflow 才生效。

| Variable | 用途 | 沒設定時的行為 |
| --- | --- | --- |
| `SITE_URL` | canonical、`hreflang`、`sitemap.xml`、`llms.txt` 的絕對網址 | 退回 SWA 預設網域，且 `app/robots.ts` 判定為非正式站 → 整站 `Disallow: /` |
| `MEDIA_BASE` | 版位素材（banner、產品照）的根位址 | 空字串 → 圖片輸出相對路徑 `/assets/...` |

⚠️ **`MEDIA_BASE` 是三處綁在一起的開關**，只改一邊就是整站版位圖 404：

1. [page-assets.ts](../apps/web/lib/page-assets.ts) 用它組出圖片網址（`{MEDIA_BASE}/assets/xxx.jpg`）；
2. [pack-standalone.mjs](../apps/web/scripts/pack-standalone.mjs) 在它**有值**時把 `public/assets`
   排除在產物外（250MB 額度不花在圖片上）；
3. `apps/web/public/assets/` 本來就不進版控（客戶素材，見 `.gitignore`），
   因此 CI 的 checkout **從來就沒有**這些檔案。

→ 正式環境沒有「不設 `MEDIA_BASE`」這個選項：素材必須先進 `public-media` 的 `assets/`
前綴，再設這個變數。兩者缺一，首頁 hero、22 個內頁 banner 與產品照全部 404
（2026-09-11 實際踩到——變數從未設定，而檔案不在版控，兩邊同時落空）。

```bash
az storage blob upload-batch --account-name stvicroundprod --auth-mode login \
  --destination public-media --destination-path assets \
  --source apps/web/public/assets --pattern "*.jpg" \
  --content-cache-control "public, max-age=31536000, immutable" --overwrite

gh variable set MEDIA_BASE --body "https://stvicroundprod.blob.core.windows.net/public-media"
gh workflow run web.yml --ref master          # build-time 變數，必須重新 build
```

驗證：`curl -o /dev/null -w '%{http_code}' https://<站台>/assets/banner-brand.jpg` 應為 200。
回 404 而 `/brand/*.png`、`/fonts/*.woff2` 正常，就是這一節描述的故障。

## CDN 在 SWA 前面時（Cloudflare）

自訂網域若代管在 Cloudflare 並開啟 proxy，**有些回應不再由本站決定**，排查時要先排除：

- **Scrape Shield → Email Address Obfuscation** 會把頁面裡的 email 改寫成
  `[email protected]` + `__cf_email__` 解碼腳本。爬蟲與無 JS 環境看到的就是那串佔位字。
- **Managed robots.txt** 會蓋掉 `app/robots.ts` 產生的內容。這會與「非正式站整站
  `Disallow: /`」的策略直接衝突：Cloudflare 那份是 `Allow: /`。
  → 因此 `lib/seo.ts` 在 `IS_PRODUCTION_SITE` 為 false 時**一律輸出 meta `noindex`**：
  robots.txt 可能根本不是我們回的，但 meta 標籤在頁面裡，CDN 蓋不掉。判準綁在
  `SITE_URL` 上，正式網域上線那天自己失效。
- 兩者疊加時最危險的組合是：CDN 網域開放索引，但頁面的 canonical 仍指向
  `SITE_URL` 設定的另一個網域——等於把權重導向一個被 robots 封鎖的位址。

## Scaling & resilience

- Functions scale automatically; public pages are SSR but their upstream data is tag-cached in
  Next.js, so the API is hit on cache miss / after a publish `revalidateTag` — load stays
  modest. SWA's built-in CDN serves visitors.
- Azure SQL: start General Purpose, scale DTU/vCore as needed; geo-redundant backups.
- Health-check function wired to platform probes; App Insights availability tests on key
  public URLs in **both locales**.
- The SWA CDN + Next.js Data Cache are the first line of defense — ensure the publish-time
  **`revalidateTag`** (both locales) fires so editors see changes promptly while anonymous
  traffic stays on cached HTML.

## Go-live checklist

- [ ] DNS `www.vicround.com` → SWA custom domain; SWA-managed TLS validated; apex redirect set.
- [ ] Every legacy `*.html` / `/store/*` URL 301s to its `/{locale}/...` equivalent (verify
      against the legacy sitemap — see [sitemap.md](sitemap.md)); `/` redirects to default locale.
- [ ] Content + redirect seeder run against prod DB; spot-check both locales (`/en`, `/zh-Hant`).
- [ ] `sitemap.xml` lists both locale URLs with `hreflang`; `robots.txt` correct; Admin + draft
      routes disallowed.
- [ ] Submit new sitemap to Search Console; monitor 404s/redirects post-launch.
