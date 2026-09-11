'use client';

import Link from 'next/link';
import { useAccount } from '@/components/AccountSession';
import type { MemberProfile, MemberStatus } from '@/lib/account-client';

/**
 * 會員專區每一頁的共同外層：先確定「是誰、在哪一關」，再把資料交給頁面。
 *
 * <p>
 * <b>未核准的會員仍然可以登入</b>（docs/cms-api.md），因為會員專區本來就要讓他們
 * 看到自己卡在哪一關。所以這裡分成三種結果：還在換 token（骨架）、沒登入（請登入）、
 * 已登入但未核准（狀態說明）。只有 <code>requireApproved</code> 的頁面才擋下最後一種。
 * </p>
 */
export function AccountGuard({
  locale,
  labels,
  requireApproved = false,
  children,
}: {
  locale: string;
  labels: AccountGuardLabels;
  requireApproved?: boolean;
  children: (profile: MemberProfile) => React.ReactNode;
}) {
  const { status, profile } = useAccount();

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">{labels.loading}</span>
        {[0, 1, 2].map((row) => (
          <span key={row} className="h-12 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (status === 'anonymous' || !profile) {
    return (
      <Notice title={labels.signInRequired} body={labels.signInBody}>
        <Link href={`/${locale}/member`} className="vr-btn">
          {labels.signIn}
        </Link>
      </Notice>
    );
  }

  if (requireApproved && profile.status !== 'approved') {
    return <Notice title={labels.statusTitles[profile.status]} body={labels.statusBodies[profile.status]} />;
  }

  return <>{children(profile)}</>;
}

export function Notice({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-white/12 bg-white/[0.03] p-8">
      <h2 className="text-xl font-medium">{title}</h2>
      {body && <p className="max-w-prose text-sm opacity-70">{body}</p>}
      {children}
    </div>
  );
}

export type AccountGuardLabels = {
  loading: string;
  signInRequired: string;
  signInBody: string;
  signIn: string;
  statusTitles: Record<MemberStatus, string>;
  statusBodies: Record<MemberStatus, string>;
};
