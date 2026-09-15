import { ApiError } from './api';

/**
 * 把丟出來的東西翻成「畫面上要顯示的一句話」。
 *
 * <p>
 * 後台每一個寫入動作都可能失敗，而失敗有三種來源：前端驗證（`lib/draft.ts` 擋下來的，
 * 訊息貼在欄位上）、後端的業務錯誤（有 `code` 的 `ApiError`）、以及連線本身失敗
 * （`fetch` 丟 `TypeError`，連 HTTP 狀態碼都沒有）。後兩種如果只是讓 promise
 * rejected，畫面上**什麼都不會發生**——按鈕轉一下就恢復原狀，編輯者會以為存好了。
 * 這支的存在就是為了讓那兩種一定變成一則看得見的訊息。
 * </p>
 *
 * <p>
 * `title` 依 `code` 分類（<b>不比對 message 字串</b>，見 lib/api.ts 的 `ApiError`），
 * `description` 直接用後端給的那句話——那句話是中文、寫給人看的
 * （見 Api/Middleware/ExceptionMiddleware.cs），重寫一次只會離真正的原因更遠。
 * </p>
 */
export type ErrorNotice = { title: string; description?: string };

/** 錯誤碼 → 標題。值域見 Api/Common/ErrorCodes.cs。 */
const TITLE_BY_CODE: Record<string, string> = {
  VALIDATION_REQUIRED: '有欄位沒填',
  VALIDATION_FORMAT: '有欄位格式不對',
  VALIDATION_RANGE: '有欄位超出允許範圍',
  CONFLICT_DUPLICATE: '資料重複',
  CONFLICT_STATE: '這筆資料的狀態不允許這個動作',
  NOT_FOUND: '找不到這筆資料',
  FORBIDDEN: '權限不足',
  AUTH_TOKEN_INVALID: '登入已失效',
  UPLOAD_TYPE: '檔案格式不支援',
  UPLOAD_SIZE: '檔案太大',
  RATE_LIMITED: '操作太頻繁',
  INTERNAL: '伺服器發生錯誤',
};

/** 沒有 code 可依靠時的補充說明——這幾種狀況後端根本沒回話，訊息要自己給。 */
const NOT_FOUND_HINT = '可能已經被其他人刪掉了。回到列表重新整理看看。';
const UNAUTHORIZED_HINT = '請重新登入後再試一次。這次的變更還在畫面上，不會消失。';
const OFFLINE_HINT = '連不上伺服器。請確認網路後再存一次——這次的變更還在畫面上。';

export function describeError(error: unknown, fallbackTitle = '操作失敗'): ErrorNotice {
  if (error instanceof ApiError) {
    const title = (error.code && TITLE_BY_CODE[error.code]) ?? fallbackTitle;
    const description = error.message?.trim() || undefined;

    if (error.status === 404) return { title, description: description ?? NOT_FOUND_HINT };
    if (error.status === 401) return { title, description: UNAUTHORIZED_HINT };
    return { title, description };
  }

  // fetch 在斷線／CORS 失敗時丟的是 TypeError，沒有 status 也沒有 code。
  if (error instanceof TypeError) return { title: fallbackTitle, description: OFFLINE_HINT };

  return {
    title: fallbackTitle,
    description: error instanceof Error && error.message ? error.message : undefined,
  };
}
