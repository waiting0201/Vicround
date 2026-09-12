import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { login } from '@/lib/api';
import { MOCK_ENABLED } from '@/lib/mock';
import { HOME_PATH } from '@/lib/menu';
import { BrandMark } from '@/components/BrandMark';
import { Badge, Button, Card, Field, Icon, IconButton, Input } from '@/ui';

/**
 * 後台登入。
 *
 * <p>
 * 送出後 access token 只留在記憶體，refresh token 由後端寫成 httpOnly cookie
 * （見 `lib/api.ts`）。這一頁不碰 localStorage，也不把 token 放進網址。
 * </p>
 * <p>
 * 視覺上刻意跟 27 個工作畫面不同節奏：那些畫面要密度優先、一天被看幾十次；
 * 這一頁一天可能只看一次，值得花一點空間把品牌識別（`BrandMark`）與「這是哪個
 * 環境」講清楚——尤其後者，登入頁是編輯者「進入」某個環境的第一個畫面，如果
 * 測試環境的提示要等進了 Shell 才看到，使用者已經帶著錯誤的假設把整個工作階段
 * 走完了。
 * </p>
 */
export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      await login(String(form.get('username')), String(form.get('password')));
      navigate(`/${HOME_PATH}`, { replace: true });
    } catch (err) {
      // 不區分「帳號不存在」與「密碼錯誤」—— 那等於送出一份有效帳號清單
      setError(err instanceof Error ? '登入失敗，請確認帳號密碼。' : '登入失敗。');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-auth-backdrop flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <BrandMark size="lg" />
          <div>
            <p className="text-lg font-semibold text-[var(--fg-1)]" style={{ fontFamily: 'var(--font-display)' }}>
              VicRound CMS
            </p>
            <p className="mt-1 text-sm text-[var(--fg-2)]">盈絲實業內容管理後台</p>
          </div>
          {MOCK_ENABLED && (
            <Badge tone="warning" dot>
              測試環境（模擬資料）
            </Badge>
          )}
        </div>

        <Card elevation="md">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div>
              <h1 className="text-base font-semibold text-[var(--fg-1)]">登入</h1>
              <p className="mt-1 text-sm text-[var(--fg-2)]">請輸入你的管理帳號密碼</p>
            </div>

            <Field label="帳號" htmlFor="username" required>
              <Input
                id="username"
                name="username"
                type="text"
                required
                autoFocus
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
                placeholder="輸入使用者名稱"
              />
            </Field>

            <Field label="密碼" htmlFor="password" required>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="輸入密碼"
                  className="pr-10"
                />
                <IconButton
                  icon={showPassword ? 'eye-off' : 'eye'}
                  label={showPassword ? '隱藏密碼' : '顯示密碼'}
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword((value) => !value)}
                />
              </div>
            </Field>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--danger-50)] px-3 py-2.5 text-sm text-[var(--danger-500)]"
              >
                <Icon name="circle-alert" size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" loading={pending} className="w-full">
              {pending ? '登入中…' : '登入'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-[var(--fg-3)]">
          忘記密碼請聯絡系統管理員協助重設。
        </p>
      </div>
    </div>
  );
}
