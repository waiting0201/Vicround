import { Button } from './Button';
import { Icon } from './Icon';

/**
 * API 打不通時的畫面——**永遠要有 `重試`**，不能只是一句「發生錯誤」把編輯者
 * 晾在原地。`description` 放後端回的 RFC 7807 `detail`（docs/cms-api.md），
 * 不是把整個錯誤物件 stringify 出來給使用者看。
 */
export function ErrorState({
  title = '讀取失敗',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--danger-50)] text-[var(--danger-500)]">
        <Icon name="alert-triangle" size={20} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-[var(--fg-1)]">{title}</p>
        {description && <p className="max-w-sm text-sm text-[var(--fg-2)]">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          重試
        </Button>
      )}
    </div>
  );
}
