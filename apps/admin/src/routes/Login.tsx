import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { login } from '@/lib/api';
import { HOME_PATH } from '@/lib/menu';

/**
 * 後台登入。
 *
 * <p>
 * 送出後 access token 只留在記憶體，refresh token 由後端寫成 httpOnly cookie
 * （見 `lib/api.ts`）。這一頁不碰 localStorage，也不把 token 放進網址。
 * </p>
 */
export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      await login(String(form.get('email')), String(form.get('password')));
      navigate(`/${HOME_PATH}`, { replace: true });
    } catch (err) {
      // 不區分「帳號不存在」與「密碼錯誤」—— 那等於送出一份有效帳號清單
      setError(err instanceof Error ? '登入失敗，請確認帳號密碼。' : '登入失敗。');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-[var(--border-1)] bg-[var(--surface-card)] p-6"
      >
        <h1 className="text-lg font-semibold">VicRound CMS</h1>

        <label className="flex flex-col gap-1 text-sm">
          電子郵件
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="rounded border border-[var(--border-1)] px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          密碼
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded border border-[var(--border-1)] px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-[var(--danger-500)]">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-[var(--brand)] px-3 py-2 text-[var(--fg-on-brand)] disabled:opacity-60"
        >
          {pending ? '登入中…' : '登入'}
        </button>
      </form>
    </div>
  );
}
