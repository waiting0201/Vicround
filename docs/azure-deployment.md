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
（Flex Consumption 沒有插槽）、Front Door / WAF、自訂網域。

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
- **250 MB app-size cap.** ⚠️ 2026-09-08 實測：**自建 standalone 產物上傳（`skip_app_build`）
  會在部署最後停在 `Web app warm up timed out`**，且沒有其他診斷訊息——修好 pnpm 符號連結、
  攤平 monorepo 的巢狀結構、補上 `/.swa/health.html` 都無效。因此 build 交給 SWA 的 Oryx
  （`app_location: apps/web`），`next.config.ts` **不設** `output: 'standalone'`，
  而 `apps/web/package.json` 的相依必須自給自足（Oryx 只看得到那一層）。
  代價是產物大小要自己盯著。
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
  base URL, App Insights key, and the **Next.js `revalidateTag` secret** shared by `fn-admin`.
- Restrict SQL access via the firewall (allow Azure services + the Function App outbound IPs;
  private endpoint only once on a VNet-capable Functions plan). Connect with a least-privilege
  SQL login.

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
