import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CULTURES, type Culture } from './enums';
import { describeError, type ErrorNotice } from './errors';
import { isValidSlug } from './format';
import { useSaveItem, useSaveTranslation } from './queries';
import type { AdminRow } from './api';
import type { FieldDef, ResourceDef } from './resources';

/**
 * 編輯中的一筆資料。
 *
 * <p>
 * 為什麼不是一坨 `useState`：後台每一筆內容其實是**兩種東西**——culture-neutral 的基底列，
 * 與每個語系各一份的翻譯列，而它們寫入的是不同端點。把這件事藏在一個 hook 裡，
 * 畫面就只需要說「改這一格」，不必每次都想「這格要 PUT 到哪」。
 * </p>
 *
 * <p>
 * 另一個責任是**只送改過的東西**：沒有動過的語系不會被覆寫。若一律整包送出，
 * 兩個人同時各編一個語系時，後存的那個會把對方的翻譯回填成自己載入時的舊值。
 * </p>
 */

export type FieldErrors = Record<string, string>;

/**
 * 存檔的結果。**失敗一定帶著一則 `notice`**——驗證擋下與後端擋下都算失敗，
 * 呼叫端只要把它丟給 Toast 就好，不必分辨是哪一種，也就不會有「某一種失敗忘了顯示」。
 */
export type SaveOutcome =
  | { ok: true; id: string }
  | { ok: false; notice: ErrorNotice; culture?: Culture };

export type EntityDraft = {
  base: Record<string, unknown>;
  translations: Record<string, Record<string, unknown>>;
  errors: FieldErrors;
  dirty: boolean;
  saving: boolean;
  setBase: (name: string, value: unknown) => void;
  setTranslation: (culture: Culture, name: string, value: unknown) => void;
  /**
   * 清掉某個前綴底下的欄位錯誤。給**子項**用：子項的錯誤鍵綁在「第幾列」上
   * （`specifications.0.…`），刪掉一列或上下搬動之後，留著的訊息會貼到另一列去。
   */
  clearErrors: (prefix: string) => void;
  reset: () => void;
  /**
   * 後端擋下存檔時的訊息（重複的 slug、權限、斷線…）。**Toast 會飄走，這一則要留在畫面上**：
   * 存檔失敗是使用者接下來要處理的事，不是一則通知。欄位層級的錯誤在 `errors` 裡。
   */
  submitError: ErrorNotice | null;
  /** 存檔。成功回傳這筆的 id（新增時是後端配的），失敗回傳要顯示的訊息。 */
  save: () => Promise<SaveOutcome>;
};

/**
 * 錯誤的鍵＝`{前綴}.{欄位名}`，前綴就是這一格「住在哪裡」：
 * `base`、語系（`en`）、子項（`specifications.0`）、子項的語系（`specifications.0.en`）。
 * 畫面端（`FieldGrid` 的 `errorPrefix`）用同一套拼法，兩邊對得起來，訊息才貼得到那一格。
 */
function errorKey(prefix: string, name: string): string {
  return `${prefix}.${name}`;
}

/** 這個語系的分頁底下（含該語系的子項欄位）有沒有錯——分頁列要據此標紅點。 */
export function hasErrorsIn(errors: FieldErrors, culture: string): boolean {
  return Object.entries(errors).some(
    ([key, message]) => Boolean(message) && (key.startsWith(`${culture}.`) || key.includes(`.${culture}.`)),
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateFields(
  fields: FieldDef[],
  values: Record<string, unknown>,
  prefix: string,
  errors: FieldErrors,
) {
  for (const field of fields) {
    if (field.readOnly) continue;

    // 看不到的欄位不驗證。條件欄位（導覽的「網址／錨點」只在特定連結方式出現）若照驗，
    // 存檔會被一個**畫面上根本沒有**的必填擋下來，而 Toast 還在說「紅字標示的欄位」——
    // 紅字不存在，編輯者會卡在這裡，這是最貴的一種驗證錯誤。
    if (field.visibleWhen && !field.visibleWhen(values)) continue;

    const value = values[field.name];
    const text = value === null || value === undefined ? '' : String(value);

    if (field.required && text.trim() === '') {
      errors[errorKey(prefix, field.name)] = '這一欄必填。';
      continue;
    }
    if (field.type === 'slug' && text && !isValidSlug(text)) {
      errors[errorKey(prefix, field.name)] = 'slug 只能是小寫英文、數字與連字號。';
    }
    if (field.maxLength && text.length > field.maxLength) {
      errors[errorKey(prefix, field.name)] = `超過 ${field.maxLength} 字上限。`;
    }
    if (field.type === 'json' && text.trim()) {
      try {
        JSON.parse(text);
      } catch {
        errors[errorKey(prefix, field.name)] = 'JSON 格式不正確。';
      }
    }
    if (field.type === 'email' && text.trim() && !EMAIL.test(text.trim())) {
      errors[errorKey(prefix, field.name)] = '電子郵件格式不正確。';
    }
    // `url` 型別的欄位（官方網站、地圖連結、物流追蹤）一律是**站外**網址：少了 scheme
    // 的 `www.example.com` 會被瀏覽器當成相對路徑，連到 vicround.com/www.example.com。
    if (field.type === 'url' && text.trim() && !/^https?:\/\/.+/i.test(text.trim())) {
      errors[errorKey(prefix, field.name)] = '請填完整網址，需要以 http:// 或 https:// 開頭。';
    }
    if (field.type === 'color' && text.trim() && !/^#[0-9a-f]{6}$/i.test(text.trim())) {
      errors[errorKey(prefix, field.name)] = '色碼要寫成 #RRGGBB 六碼。';
    }
  }
}

/** 這個語系的翻譯列上有沒有寫過東西。全空＝「還沒翻」，不是「填錯了」。 */
function hasContent(values: Record<string, unknown> | undefined): boolean {
  return Object.values(values ?? {}).some((value) => String(value ?? '').trim() !== '');
}

/**
 * 驗證一組翻譯欄位（母體的，或某一列子項的）。
 *
 * <p>
 * 兩條規則：**有寫的語系要寫完整**（翻一半比沒翻難查——前台會顯示一個有標題沒內文的頁面）；
 * **至少要有一個語系是完整的**。後者原本沒有做，於是「兩個語系都空白」可以一路存進資料庫：
 * 列表上是一列「（未命名）」，前台兩個語系都拿不到這一筆，而存檔當下沒有任何訊息說不行。
 * </p>
 */
function validateTranslations(
  fields: FieldDef[],
  byCulture: Record<string, Record<string, unknown> | undefined>,
  prefixOf: (culture: string) => string,
  errors: FieldErrors,
) {
  const filled = CULTURES.filter((culture) => hasContent(byCulture[culture.value]));

  for (const culture of filled) {
    validateFields(fields, byCulture[culture.value] ?? {}, prefixOf(culture.value), errors);
  }

  // 一個語系都沒填：把必填的錯誤掛在預設語系上（分頁列會標紅點，呼叫端會切過去）
  if (filled.length === 0 && fields.some((field) => field.required)) {
    validateFields(fields, {}, prefixOf(CULTURES[0].value), errors);
  }
}

export function useEntityDraft(resource: ResourceDef, row?: AdminRow): EntityDraft {
  const [base, setBaseState] = useState<Record<string, unknown>>({});
  const [translations, setTranslations] = useState<Record<string, Record<string, unknown>>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<ErrorNotice | null>(null);
  const [dirty, setDirty] = useState(false);
  const touchedCultures = useRef(new Set<string>());
  /** 這一輪已經被後端建立起來的 id（新增時存到一半失敗才用得到，見 `save`）。 */
  const createdId = useRef<string | undefined>(undefined);

  const saveItem = useSaveItem(resource.type);
  const saveTranslation = useSaveTranslation(resource.type);

  /** 載入的那一筆換人時整個重置 —— 抽屜連開兩筆卻沿用上一筆的暫存值是很容易犯的錯。 */
  const load = useCallback(() => {
    const nextTranslations: Record<string, Record<string, unknown>> = {};
    for (const culture of CULTURES) {
      nextTranslations[culture.value] = { ...(row?.translations?.[culture.value] ?? {}) };
    }
    const { translations: _ignored, ...rest } = row ?? ({} as AdminRow);
    setBaseState({ ...rest });
    setTranslations(nextTranslations);
    setErrors({});
    setSubmitError(null);
    setDirty(false);
    touchedCultures.current = new Set();
    createdId.current = row?.id;
  }, [row]);

  useEffect(load, [load]);

  const setBase = useCallback((name: string, value: unknown) => {
    setBaseState((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [errorKey('base', name)]: '' }));
    setSubmitError(null);
    setDirty(true);
  }, []);

  const setTranslation = useCallback((culture: Culture, name: string, value: unknown) => {
    setTranslations((current) => ({
      ...current,
      [culture]: { ...current[culture], [name]: value },
    }));
    setErrors((current) => ({ ...current, [errorKey(culture, name)]: '' }));
    setSubmitError(null);
    touchedCultures.current.add(culture);
    setDirty(true);
  }, []);

  const clearErrors = useCallback((prefix: string) => {
    setErrors((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([key]) => key !== prefix && !key.startsWith(prefix)),
      );
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, []);

  const save = useCallback(async (): Promise<SaveOutcome> => {
    const found: FieldErrors = {};
    validateFields(resource.baseFields, base, 'base', found);

    if (resource.hasTranslations) {
      validateTranslations(resource.translationFields, translations, (culture) => culture, found);
    }

    // 子項（規格列、版塊、製程步驟）跟著母體一起送出，所以也要跟著母體一起驗——
    // 少驗這一段，缺漏會一路送到後端，回來的是一句沒有指到任何一格的 400。
    for (const child of resource.children ?? []) {
      const items = Array.isArray(base[child.key]) ? (base[child.key] as Record<string, unknown>[]) : [];
      items.forEach((item, index) => {
        validateFields(child.baseFields, item, `${child.key}.${index}`, found);
        validateTranslations(
          child.translationFields,
          (item.translations ?? {}) as Record<string, Record<string, unknown>>,
          (culture) => `${child.key}.${index}.${culture}`,
          found,
        );
      });
    }

    const actual = Object.fromEntries(Object.entries(found).filter(([, message]) => message));
    if (Object.keys(actual).length > 0) {
      setErrors(actual);
      setSubmitError(null);
      return {
        ok: false,
        notice: { title: '有欄位需要修正', description: '紅字標示的欄位填好後再存一次。' },
        // 錯誤可能落在**沒有被打開的那一個語系分頁**上。把分頁一起帶回去，呼叫端才切得過去；
        // 不然畫面上一片正常，Toast 卻說有紅字。
        culture: CULTURES.find((item) => hasErrorsIn(actual, item.value))?.value,
      };
    }

    setErrors({});
    setSubmitError(null);

    try {
      // 新增時若「基底列存好了、翻譯列失敗」，這一筆其實已經在資料庫裡了。記住後端配的 id，
      // 再按一次儲存才會是 PUT 同一筆，而不是 POST 出第二筆（然後撞 slug 唯一鍵）。
      const knownId = row?.id ?? createdId.current;
      const saved = await saveItem.mutateAsync({ id: knownId, data: base });
      const id = saved?.id ?? knownId;
      if (!id) throw new Error('後端沒有回傳這筆資料的 id。');
      if (!row?.id) createdId.current = id;

      for (const culture of touchedCultures.current) {
        await saveTranslation.mutateAsync({ id, culture, data: translations[culture] ?? {} });
      }

      touchedCultures.current = new Set();
      setDirty(false);
      return { ok: true, id };
    } catch (error) {
      const notice = describeError(error, '儲存失敗');
      setSubmitError(notice);
      return { ok: false, notice };
    }
  }, [base, translations, resource, row?.id, saveItem, saveTranslation]);

  return useMemo(
    () => ({
      base,
      translations,
      errors,
      submitError,
      dirty,
      saving: saveItem.isPending || saveTranslation.isPending,
      setBase,
      setTranslation,
      clearErrors,
      reset: load,
      save,
    }),
    [
      base,
      translations,
      errors,
      submitError,
      dirty,
      saveItem.isPending,
      saveTranslation.isPending,
      setBase,
      setTranslation,
      clearErrors,
      load,
      save,
    ],
  );
}

/**
 * 離開前攔截未存的變更。
 *
 * <p>
 * 只掛瀏覽器的 `beforeunload`（關分頁／重新整理）。SPA 內部的換頁攔截交給畫面自己
 * 用確認對話框處理 —— react-router 的 blocker 在巢狀路由下行為不好預測，
 * 而「按了取消卻已經跳走」比沒有攔截更糟。
 * </p>
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}
