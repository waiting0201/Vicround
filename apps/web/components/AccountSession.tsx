'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  restoreSession,
  signIn as apiSignIn,
  signOut as apiSignOut,
  type MemberProfile,
} from '@/lib/account-client';

/**
 * 會員工作階段。
 *
 * <p>
 * access token 活在記憶體裡，所以每次載入頁面都要用 httpOnly 的 refresh cookie
 * 重新換一顆——<code>status</code> 從 <code>loading</code> 開始，正是在等這一趟。
 * 會員專區的頁面應該在 <code>loading</code> 時顯示骨架，而不是先閃一下「請登入」。
 * </p>
 */
type SessionState =
  | { status: 'loading'; profile: null }
  | { status: 'authenticated'; profile: MemberProfile }
  | { status: 'anonymous'; profile: null };

type SessionValue = SessionState & {
  signIn: (email: string, password: string) => Promise<MemberProfile>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
};

const AccountContext = createContext<SessionValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading', profile: null });

  const load = useCallback(async () => {
    const profile = await restoreSession();

    setState(
      profile
        ? { status: 'authenticated', profile }
        : { status: 'anonymous', profile: null },
    );
  }, []);

  useEffect(() => {
    // 只在還活著時寫回狀態：使用者在這一趟 refresh 途中離開頁面是常態。
    let alive = true;

    restoreSession().then(
      (profile) => {
        if (!alive) return;
        setState(profile ? { status: 'authenticated', profile } : { status: 'anonymous', profile: null });
      },
      () => alive && setState({ status: 'anonymous', profile: null }),
    );

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ...state,
      signIn: async (email, password) => {
        await apiSignIn(email, password);
        const profile = await restoreSession();

        if (!profile) {
          throw new Error('登入後讀不到帳號資料。');
        }

        setState({ status: 'authenticated', profile });
        return profile;
      },
      signOut: async () => {
        await apiSignOut();
        setState({ status: 'anonymous', profile: null });
      },
      reload: load,
    }),
    [state, load],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): SessionValue {
  const value = useContext(AccountContext);

  if (!value) {
    throw new Error('useAccount 必須在 <AccountProvider> 內使用。');
  }

  return value;
}
