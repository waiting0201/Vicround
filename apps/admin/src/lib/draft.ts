import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CULTURES, type Culture } from './enums';
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

export type EntityDraft = {
  base: Record<string, unknown>;
  translations: Record<string, Record<string, unknown>>;
  errors: FieldErrors;
  dirty: boolean;
  saving: boolean;
  setBase: (name: string, value: unknown) => void;
  setTranslation: (culture: Culture, name: string, value: unknown) => void;
  reset: () => void;
  /** 存檔。成功回傳這筆的 id（新增時是後端配的），驗證失敗回傳 null。 */
  save: () => Promise<string | null>;
};

function errorKey(scope: 'base' | Culture, name: string): string {
  return `${scope}.${name}`;
}

function validateFields(
  fields: FieldDef[],
  values: Record<string, unknown>,
  scope: 'base' | Culture,
  errors: FieldErrors,
) {
  for (const field of fields) {
    if (field.readOnly) continue;
    const value = values[field.name];
    const text = value === null || value === undefined ? '' : String(value);

    if (field.required && text.trim() === '') {
      errors[errorKey(scope, field.name)] = '這一欄必填。';
      continue;
    }
    if (field.type === 'slug' && text && !isValidSlug(text)) {
      errors[errorKey(scope, field.name)] = 'slug 只能是小寫英文、數字與連字號。';
    }
    if (field.maxLength && text.length > field.maxLength) {
      errors[errorKey(scope, field.name)] = `超過 ${field.maxLength} 字上限。`;
    }
    if (field.type === 'json' && text.trim()) {
      try {
        JSON.parse(text);
      } catch {
        errors[errorKey(scope, field.name)] = 'JSON 格式不正確。';
      }
    }
  }
}

export function useEntityDraft(resource: ResourceDef, row?: AdminRow): EntityDraft {
  const [base, setBaseState] = useState<Record<string, unknown>>({});
  const [translations, setTranslations] = useState<Record<string, Record<string, unknown>>>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [dirty, setDirty] = useState(false);
  const touchedCultures = useRef(new Set<string>());

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
    setDirty(false);
    touchedCultures.current = new Set();
  }, [row]);

  useEffect(load, [load]);

  const setBase = useCallback((name: string, value: unknown) => {
    setBaseState((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [errorKey('base', name)]: '' }));
    setDirty(true);
  }, []);

  const setTranslation = useCallback((culture: Culture, name: string, value: unknown) => {
    setTranslations((current) => ({
      ...current,
      [culture]: { ...current[culture], [name]: value },
    }));
    setErrors((current) => ({ ...current, [errorKey(culture, name)]: '' }));
    touchedCultures.current.add(culture);
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    const found: FieldErrors = {};
    validateFields(resource.baseFields, base, 'base', found);

    // 只驗證「有內容」的語系：翻譯缺漏是允許的狀態（列表上會標示），不是錯誤。
    for (const culture of CULTURES) {
      const values = translations[culture.value] ?? {};
      const hasAnything = Object.values(values).some((value) => String(value ?? '').trim() !== '');
      if (hasAnything) validateFields(resource.translationFields, values, culture.value, found);
    }

    const actual = Object.fromEntries(Object.entries(found).filter(([, message]) => message));
    if (Object.keys(actual).length > 0) {
      setErrors(actual);
      return null;
    }

    const saved = await saveItem.mutateAsync({ id: row?.id, data: base });
    const id = saved?.id ?? row?.id;
    if (!id) return null;

    for (const culture of touchedCultures.current) {
      await saveTranslation.mutateAsync({ id, culture, data: translations[culture] ?? {} });
    }

    touchedCultures.current = new Set();
    setDirty(false);
    return id;
  }, [base, translations, resource, row?.id, saveItem, saveTranslation]);

  return useMemo(
    () => ({
      base,
      translations,
      errors,
      dirty,
      saving: saveItem.isPending || saveTranslation.isPending,
      setBase,
      setTranslation,
      reset: load,
      save,
    }),
    [base, translations, errors, dirty, saveItem.isPending, saveTranslation.isPending, setBase, setTranslation, load, save],
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
