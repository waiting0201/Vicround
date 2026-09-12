'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AccountGuard, Notice, type AccountGuardLabels } from '@/components/AccountGuard';
import { useAccount } from '@/components/AccountSession';
import {
  AccountError,
  changePassword,
  createDownloadLink,
  createSampleRequest,
  getSampleRequest,
  listDownloads,
  listSampleRequests,
  reorderSampleRequest,
  updateProfile,
  type MemberDownload,
  type MemberProfile,
  type SampleRequestDetail,
  type SampleRequestSummary,
} from '@/lib/account-client';

/**
 * 會員專區的四個畫面。
 *
 * <p>
 * 確認稿沒有這幾頁（只做到 `/member`），所以版型沿用會員專區殼層既有的 Tailwind 語彙，
 * 不自創第二套視覺。**資料一律在瀏覽器端取得**：Account API 是 `no-store` 且帶會員 JWT，
 * 不能進 Next.js 的 Data Cache（docs/cms-api.md）。
 * </p>
 */
type Common = { locale: string; guard: AccountGuardLabels };

/**
 * 四個畫面都是「載入 → 成功／失敗」，所以狀態機寫一次就好。
 *
 * <p>
 * <code>load</code> <b>必須是穩定的參考</b>（模組層函式，或呼叫端自己 `useCallback`），
 * 否則每次 render 都會重跑一趟。初始狀態就是 loading，所以 effect 裡不再設定一次。
 * </p>
 */
function useRemote<T>(load: () => Promise<T>) {
  const [state, setState] = useState<
    { kind: 'loading' } | { kind: 'ready'; data: T } | { kind: 'error'; message: string }
  >({ kind: 'loading' });

  useEffect(() => {
    let alive = true;

    load().then(
      (data) => alive && setState({ kind: 'ready', data }),
      (error: unknown) =>
        alive &&
        setState({
          kind: 'error',
          message: error instanceof AccountError ? error.message : '載入失敗，請重新整理。',
        }),
    );

    return () => {
      alive = false;
    };
  }, [load]);

  return state;
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {[0, 1, 2].map((row) => (
        <span key={row} className="h-12 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <dt className="text-xs uppercase tracking-wide opacity-60">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

export function OverviewScreen({
  locale,
  guard,
  labels,
}: Common & {
  labels: {
    title: string; statusLabel: string; companyLabel: string; emailLabel: string;
    approvedLabel: string; statusNames: Record<string, string>; signOut: string;
  };
}) {
  const { signOut } = useAccount();

  return (
    <AccountGuard locale={locale} labels={guard}>
      {(profile: MemberProfile) => (
        <section className="flex flex-col gap-6">
          <h1 className="text-2xl font-medium">{labels.title}</h1>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label={labels.statusLabel} value={labels.statusNames[profile.status] ?? profile.status} />
            <Row label={labels.companyLabel} value={profile.companyName} />
            <Row label={labels.emailLabel} value={profile.email} />
            {profile.approvedAt && (
              <Row label={labels.approvedLabel} value={new Date(profile.approvedAt).toLocaleDateString(locale)} />
            )}
          </dl>

          {profile.status !== 'approved' && (
            <Notice title={guard.statusTitles[profile.status]} body={guard.statusBodies[profile.status]} />
          )}

          <button type="button" className="self-start text-sm underline opacity-70" onClick={() => void signOut()}>
            {labels.signOut}
          </button>
        </section>
      )}
    </AccountGuard>
  );
}

export function DownloadsScreen({
  locale,
  guard,
  labels,
}: Common & {
  labels: {
    title: string; empty: string; download: string; memberOnly: string;
    onRequest: string; version: string; validUntil: string; failed: string;
  };
}) {
  const state = useRemote<MemberDownload[]>(listDownloads);
  const [failed, setFailed] = useState<string | null>(null);

  /**
   * 連結是十分鐘後失效的一次性 SAS，所以**點下去才換**，而且不存進任何狀態——
   * 提早把整頁的連結換好，等於把一堆會過期的東西放進畫面裡。
   */
  async function open(slug: string) {
    setFailed(null);
    try {
      const link = await createDownloadLink(slug);
      window.location.assign(link.url);
    } catch {
      setFailed(labels.failed);
    }
  }

  return (
    <AccountGuard locale={locale} labels={guard}>
      {() => (
        <section className="flex flex-col gap-6">
          <h1 className="text-2xl font-medium">{labels.title}</h1>

          {state.kind === 'loading' && <Skeleton />}
          {state.kind === 'error' && <Notice title={state.message} />}
          {state.kind === 'ready' && state.data.length === 0 && <Notice title={labels.empty} />}
          {failed && <p className="text-sm text-[#ff8a8a]">{failed}</p>}

          {state.kind === 'ready' && state.data.length > 0 && (
            <ul className="flex flex-col gap-3">
              {state.data.map((file) => (
                <li
                  key={file.slug}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.title}</p>
                    <p className="mt-1 text-xs opacity-60">
                      {[
                        file.version ? `${labels.version} ${file.version}` : null,
                        file.validUntil
                          ? `${labels.validUntil} ${new Date(file.validUntil).toLocaleDateString(locale)}`
                          : null,
                        file.accessLevel === 'MemberOnly' ? labels.memberOnly : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>

                  {file.canDownload ? (
                    <button type="button" className="vr-btn" onClick={() => void open(file.slug)}>
                      {labels.download}
                    </button>
                  ) : (
                    <span className="text-xs opacity-60">{labels.onRequest}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AccountGuard>
  );
}

export function SampleRequestsScreen({
  locale,
  guard,
  labels,
  statusNames,
}: Common & {
  labels: { title: string; empty: string; submitted: string; items: string; create: string };
  statusNames: Record<string, string>;
}) {
  const state = useRemote<SampleRequestSummary[]>(listSampleRequests);

  return (
    <AccountGuard locale={locale} labels={guard}>
      {() => (
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-medium">{labels.title}</h1>
            {/* 空清單時這顆按鈕就是唯一的下一步，所以它跟標題並排，不藏在清單下面 */}
            <Link href={`/${locale}/account/sample-requests/new`} className="vr-btn">
              {labels.create}
            </Link>
          </div>

          {state.kind === 'loading' && <Skeleton />}
          {state.kind === 'error' && <Notice title={state.message} />}
          {state.kind === 'ready' && state.data.length === 0 && <Notice title={labels.empty} />}

          {state.kind === 'ready' && state.data.length > 0 && (
            <ul className="flex flex-col gap-3">
              {state.data.map((row) => (
                <li key={row.requestNumber} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/${locale}/account/sample-requests/${row.requestNumber}`}
                      className="font-mono text-sm underline"
                    >
                      {row.requestNumber}
                    </Link>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                      {statusNames[row.status] ?? row.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs opacity-60">
                    {row.submittedAt
                      ? `${labels.submitted} ${new Date(row.submittedAt).toLocaleDateString(locale)} · `
                      : ''}
                    {row.itemCount} {labels.items}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AccountGuard>
  );
}

export function SampleRequestDetailScreen({
  locale,
  guard,
  requestNumber,
  labels,
  statusNames,
}: Common & {
  requestNumber: string;
  labels: {
    tracking: string; reorder: string; reorderFailed: string; shipTo: string;
    itemsTitle: string; quantity: string; spec: string; back: string; notFound: string;
  };
  statusNames: Record<string, string>;
}) {
  const load = useCallback(() => getSampleRequest(requestNumber), [requestNumber]);
  const state = useRemote<SampleRequestDetail>(load);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  async function reorder() {
    setBusy(true);
    setFailed(null);
    try {
      const created = await reorderSampleRequest(requestNumber);
      window.location.assign(`/${locale}/account/sample-requests/${created.requestNumber}`);
    } catch (error) {
      setFailed(error instanceof AccountError ? error.message : labels.reorderFailed);
      setBusy(false);
    }
  }

  return (
    <AccountGuard locale={locale} labels={guard}>
      {() => (
        <section className="flex flex-col gap-6">
          <Link href={`/${locale}/account/sample-requests`} className="text-sm underline opacity-70">
            ← {labels.back}
          </Link>

          {state.kind === 'loading' && <Skeleton />}
          {state.kind === 'error' && <Notice title={labels.notFound} body={state.message} />}

          {state.kind === 'ready' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-mono text-2xl">{state.data.requestNumber}</h1>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  {statusNames[state.data.status] ?? state.data.status}
                </span>
              </div>

              {state.data.trackingNumber && (
                <p className="text-sm">
                  {labels.tracking}:{' '}
                  {state.data.trackingUrl ? (
                    <a href={state.data.trackingUrl} className="underline" rel="noreferrer noopener" target="_blank">
                      {state.data.trackingNumber}
                    </a>
                  ) : (
                    <span className="font-mono">{state.data.trackingNumber}</span>
                  )}
                </p>
              )}

              <div>
                <h2 className="mb-3 text-sm uppercase tracking-wide opacity-60">{labels.itemsTitle}</h2>
                <ul className="flex flex-col gap-2">
                  {state.data.items.map((item, index) => (
                    <li key={index} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                      <p className="font-medium">{item.productName}</p>
                      <p className="mt-1 text-xs opacity-60">
                        {labels.quantity}: {item.quantity} {item.unit}
                        {item.requestedSpec ? ` · ${labels.spec}: ${item.requestedSpec}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="mb-3 text-sm uppercase tracking-wide opacity-60">{labels.shipTo}</h2>
                <address className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm not-italic leading-relaxed">
                  {state.data.shipTo.name}
                  <br />
                  {state.data.shipTo.company}
                  <br />
                  {state.data.shipTo.addressLine1}
                  {state.data.shipTo.addressLine2 ? <>, {state.data.shipTo.addressLine2}</> : null}
                  <br />
                  {state.data.shipTo.city} {state.data.shipTo.postalCode} {state.data.shipTo.countryCode}
                </address>
              </div>

              {failed && <p className="text-sm text-[#ff8a8a]">{failed}</p>}

              <button type="button" className="vr-btn self-start" disabled={busy} onClick={() => void reorder()}>
                {labels.reorder}
              </button>
            </>
          )}
        </section>
      )}
    </AccountGuard>
  );
}

function Labelled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="opacity-70">{label}</span>
      {children}
      {hint && <span className="text-xs opacity-50">{hint}</span>}
    </label>
  );
}

export function ProfileScreen({
  locale,
  guard,
  labels,
  roleOptions,
}: Common & {
  labels: {
    title: string; name: string; company: string; role: string; phone: string;
    email: string; emailNote: string; save: string; saved: string; failed: string;
  };
  roleOptions: { value: string; label: string }[];
}) {
  const { reload } = useAccount();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <AccountGuard locale={locale} labels={guard}>
      {(profile: MemberProfile) => (
        <section className="flex flex-col gap-6">
          <h1 className="text-2xl font-medium">{labels.title}</h1>

          <form
            className="flex max-w-xl flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setBusy(true);
              setMessage(null);

              try {
                await updateProfile({
                  fullName: String(form.get('fullName') ?? ''),
                  companyName: String(form.get('companyName') ?? ''),
                  jobRole: String(form.get('jobRole') ?? ''),
                  phone: String(form.get('phone') ?? ''),
                });
                await reload();
                setMessage({ ok: true, text: labels.saved });
              } catch (error) {
                setMessage({
                  ok: false,
                  text: error instanceof AccountError ? error.message : labels.failed,
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            <Labelled label={labels.name}>
              <input name="fullName" defaultValue={profile.fullName} required className="vr-input" />
            </Labelled>
            <Labelled label={labels.company}>
              <input name="companyName" defaultValue={profile.companyName} required className="vr-input" />
            </Labelled>
            <Labelled label={labels.role}>
              <select name="jobRole" defaultValue={profile.jobRole} className="vr-input">
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label={labels.phone}>
              <input name="phone" defaultValue={profile.phone ?? ''} className="vr-input" />
            </Labelled>
            <Labelled label={labels.email} hint={labels.emailNote}>
              <input value={profile.email} readOnly disabled className="vr-input opacity-60" />
            </Labelled>

            {message && (
              <p className={message.ok ? 'text-sm text-[#8affb0]' : 'text-sm text-[#ff8a8a]'}>{message.text}</p>
            )}

            <button type="submit" className="vr-btn self-start" disabled={busy}>
              {labels.save}
            </button>
          </form>
        </section>
      )}
    </AccountGuard>
  );
}

export function PasswordScreen({
  locale,
  guard,
  labels,
}: Common & {
  labels: {
    title: string; lead: string; current: string; next: string; confirm: string;
    submit: string; saved: string; mismatch: string; failed: string;
  };
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <AccountGuard locale={locale} labels={guard}>
      {() => (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-medium">{labels.title}</h1>
            <p className="mt-2 max-w-prose text-sm opacity-70">{labels.lead}</p>
          </div>

          <form
            className="flex max-w-xl flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              const next = String(data.get('next') ?? '');

              setMessage(null);

              if (next !== String(data.get('confirm') ?? '')) {
                setMessage({ ok: false, text: labels.mismatch });
                return;
              }

              setBusy(true);

              try {
                await changePassword(String(data.get('current') ?? ''), next);
                // 密碼已經換掉，欄位裡的舊值留著沒有意義，也不該留在 DOM 裡。
                form.reset();
                setMessage({ ok: true, text: labels.saved });
              } catch (error) {
                setMessage({
                  ok: false,
                  text: error instanceof AccountError ? error.message : labels.failed,
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            <Labelled label={labels.current}>
              <input
                type="password"
                name="current"
                required
                autoComplete="current-password"
                className="vr-input"
              />
            </Labelled>
            <Labelled label={labels.next}>
              <input
                type="password"
                name="next"
                required
                minLength={12}
                autoComplete="new-password"
                className="vr-input"
              />
            </Labelled>
            <Labelled label={labels.confirm}>
              <input
                type="password"
                name="confirm"
                required
                minLength={12}
                autoComplete="new-password"
                className="vr-input"
              />
            </Labelled>

            {message && (
              <p className={message.ok ? 'text-sm text-[#8affb0]' : 'text-sm text-[#ff8a8a]'}>{message.text}</p>
            )}

            <button type="submit" className="vr-btn self-start" disabled={busy}>
              {labels.submit}
            </button>
          </form>
        </section>
      )}
    </AccountGuard>
  );
}

export type NewSampleLabels = {
  title: string; lead: string;
  projectTitle: string; projectName: string; targetApplication: string; memberNote: string;
  shipToTitle: string; shipToName: string; shipToCompany: string; shipToAddress1: string;
  shipToAddress2: string; shipToCity: string; shipToState: string; shipToPostalCode: string;
  shipToCountry: string; shipToPhone: string;
  itemsTitle: string; product: string; productAny: string; gradeCode: string;
  requestedSpec: string; quantity: string; unit: string;
  addItem: string; removeItem: string; submit: string; failed: string; prefill: string;
};

/**
 * 新增樣品申請。
 *
 * <p>
 * <b>只有 `approved` 的會員能送出</b>（後端的 `RequireApproved` 也擋一次），所以這一頁
 * 直接 `requireApproved` —— 讓還在審核中的人填完整張表才被拒絕，是最糟的一種設計。
 * </p>
 *
 * <p>
 * 產品選單來自公開的 Content API（由 server component 取好傳進來），**不是**會員端點：
 * 產品清單本來就公開，沒有理由讓它走 `no-store` 的那一條。
 * 「清單中沒有」送空 slug，後端允許品項不綁產品（自由填規格）。
 * </p>
 */
export function NewSampleRequestScreen({
  locale,
  guard,
  labels,
  products,
}: Common & {
  labels: NewSampleLabels;
  products: { slug: string; name: string }[];
}) {
  // 品項是唯一會增減的部分，所以只有它需要 state；其餘欄位交給 DOM 自己管。
  const [items, setItems] = useState([0]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  return (
    <AccountGuard locale={locale} labels={guard} requireApproved>
      {(profile: MemberProfile) => (
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-medium">{labels.title}</h1>
            <p className="mt-2 max-w-prose text-sm opacity-70">{labels.lead}</p>
          </div>

          <form
            className="flex flex-col gap-8"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);

              setFailed(null);
              setBusy(true);

              try {
                const created = await createSampleRequest({
                  shipToName: String(data.get('shipToName') ?? ''),
                  shipToCompany: String(data.get('shipToCompany') ?? ''),
                  shipToAddressLine1: String(data.get('shipToAddressLine1') ?? ''),
                  shipToAddressLine2: String(data.get('shipToAddressLine2') ?? '') || undefined,
                  shipToCity: String(data.get('shipToCity') ?? ''),
                  shipToState: String(data.get('shipToState') ?? '') || undefined,
                  shipToPostalCode: String(data.get('shipToPostalCode') ?? ''),
                  shipToCountryCode: String(data.get('shipToCountryCode') ?? ''),
                  shipToPhone: String(data.get('shipToPhone') ?? ''),
                  projectName: String(data.get('projectName') ?? '') || undefined,
                  targetApplication: String(data.get('targetApplication') ?? '') || undefined,
                  memberNote: String(data.get('memberNote') ?? '') || undefined,
                  items: items.map((row) => ({
                    productSlug: String(data.get(`product-${row}`) ?? '') || undefined,
                    gradeCode: String(data.get(`grade-${row}`) ?? '') || undefined,
                    requestedSpec: String(data.get(`spec-${row}`) ?? '') || undefined,
                    quantity: Number(data.get(`quantity-${row}`) ?? 1),
                    unit: String(data.get(`unit-${row}`) ?? '') || undefined,
                  })),
                });

                window.location.assign(`/${locale}/account/sample-requests/${created.requestNumber}`);
              } catch (error) {
                setFailed(error instanceof AccountError ? error.message : labels.failed);
                setBusy(false);
              }
            }}
          >
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-2 text-sm uppercase tracking-wide opacity-60">{labels.itemsTitle}</legend>

              {items.map((row, index) => (
                <div key={row} className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-2">
                  <Labelled label={labels.product}>
                    <select name={`product-${row}`} className="vr-input" defaultValue="">
                      <option value="">{labels.productAny}</option>
                      {products.map((product) => (
                        <option key={product.slug} value={product.slug}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </Labelled>
                  <Labelled label={labels.gradeCode}>
                    <input name={`grade-${row}`} className="vr-input" />
                  </Labelled>
                  <Labelled label={labels.requestedSpec}>
                    <input name={`spec-${row}`} className="vr-input" />
                  </Labelled>
                  <div className="grid grid-cols-2 gap-3">
                    <Labelled label={labels.quantity}>
                      <input
                        type="number"
                        name={`quantity-${row}`}
                        min={1}
                        defaultValue={1}
                        required
                        className="vr-input"
                      />
                    </Labelled>
                    <Labelled label={labels.unit}>
                      <input name={`unit-${row}`} className="vr-input" />
                    </Labelled>
                  </div>

                  {index > 0 && (
                    <button
                      type="button"
                      className="justify-self-start text-sm underline opacity-70"
                      onClick={() => setItems((current) => current.filter((id) => id !== row))}
                    >
                      {labels.removeItem}
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="self-start text-sm underline opacity-70"
                onClick={() => setItems((current) => [...current, (current.at(-1) ?? 0) + 1])}
              >
                {labels.addItem}
              </button>
            </fieldset>

            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-2 text-sm uppercase tracking-wide opacity-60">{labels.shipToTitle}</legend>

              {/* 收件人與公司預填會員自己的資料——九成的申請就是寄給他本人 */}
              <Labelled label={labels.shipToName}>
                <input name="shipToName" defaultValue={profile.fullName} required className="vr-input" />
              </Labelled>
              <Labelled label={labels.shipToCompany}>
                <input name="shipToCompany" defaultValue={profile.companyName} required className="vr-input" />
              </Labelled>
              <Labelled label={labels.shipToAddress1}>
                <input name="shipToAddressLine1" required autoComplete="address-line1" className="vr-input" />
              </Labelled>
              <Labelled label={labels.shipToAddress2}>
                <input name="shipToAddressLine2" autoComplete="address-line2" className="vr-input" />
              </Labelled>
              <Labelled label={labels.shipToCity}>
                <input name="shipToCity" required autoComplete="address-level2" className="vr-input" />
              </Labelled>
              <Labelled label={labels.shipToState}>
                <input name="shipToState" autoComplete="address-level1" className="vr-input" />
              </Labelled>
              <Labelled label={labels.shipToPostalCode}>
                <input name="shipToPostalCode" required autoComplete="postal-code" className="vr-input" />
              </Labelled>
              <Labelled label={labels.shipToCountry} hint={labels.prefill}>
                <input
                  name="shipToCountryCode"
                  defaultValue={profile.countryCode ?? ''}
                  required
                  maxLength={2}
                  autoComplete="country"
                  className="vr-input"
                />
              </Labelled>
              <Labelled label={labels.shipToPhone}>
                <input
                  name="shipToPhone"
                  defaultValue={profile.phone ?? ''}
                  required
                  autoComplete="tel"
                  className="vr-input"
                />
              </Labelled>
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-2 text-sm uppercase tracking-wide opacity-60">{labels.projectTitle}</legend>

              <Labelled label={labels.projectName}>
                <input name="projectName" className="vr-input" />
              </Labelled>
              <Labelled label={labels.targetApplication}>
                <input name="targetApplication" className="vr-input" />
              </Labelled>
              <Labelled label={labels.memberNote}>
                <textarea name="memberNote" rows={4} className="vr-input" />
              </Labelled>
            </fieldset>

            {failed && <p className="text-sm text-[#ff8a8a]">{failed}</p>}

            <button type="submit" className="vr-btn self-start" disabled={busy}>
              {labels.submit}
            </button>
          </form>
        </section>
      )}
    </AccountGuard>
  );
}
