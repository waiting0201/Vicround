import { uploadMedia } from './api';
import type { FieldDef, MediaContainer } from './resources';

/**
 * 選了、但還沒上傳的檔案。
 *
 * <p>
 * 檔案欄位選檔時**不上傳**，只把檔案與本機預覽網址放進表單的值裡；按下儲存時
 * `resolvePendingMedia` 才逐一上傳、換成後端配的 MediaAsset id，再送出表單。
 * 這樣選錯檔、換檔或放棄編輯，Blob 與 `MediaAssets` 都不會留下沒人用的檔案。
 * </p>
 *
 * <p>
 * 容器**在上傳當下才決定**（用同一列的其他欄位值算），不是選檔時：下載項目的容器跟著
 * 存取層級走，先選檔再改層級時，若沿用選檔當下的容器，客戶的合規文件就會進公開 CDN。
 * </p>
 */
export type PendingMedia = {
  kind: 'pending-media';
  file: File;
  /** `URL.createObjectURL` 的本機網址，給縮圖預覽用。 */
  previewUrl: string;
  container: FieldDef['container'];
  /** 上傳過就記住 id：存檔在後半段失敗時，再按一次儲存不會把同一個檔案傳第二次。 */
  uploadedId?: string;
};

export function createPendingMedia(file: File, container: FieldDef['container']): PendingMedia {
  return { kind: 'pending-media', file, previewUrl: URL.createObjectURL(file), container, uploadedId: undefined };
}

export function isPendingMedia(value: unknown): value is PendingMedia {
  return typeof value === 'object' && value !== null && (value as PendingMedia).kind === 'pending-media';
}

/** 換檔或清除時釋放上一個預覽網址；值若是既有的 id 就什麼都不做。 */
export function releasePendingMedia(value: unknown) {
  if (isPendingMedia(value)) URL.revokeObjectURL(value.previewUrl);
}

export function containerOf(container: FieldDef['container'], values: Record<string, unknown>): MediaContainer {
  return typeof container === 'function' ? container(values) : (container ?? 'public-media');
}

/**
 * 把一份表單值裡所有的待上傳檔案換成 MediaAsset id（深層走訪：子項、版塊項目都在裡面）。
 *
 * <p>
 * 逐一上傳而不是並行：後端對每個檔案都要寫一列，並行只是把失敗變得更難解讀。
 * 任何一個失敗就整個丟出去，存檔不會送出一份「一半是 id、一半是檔案」的表單。
 * </p>
 */
export async function resolvePendingMedia<T>(value: T): Promise<T> {
  return (await resolve(value, {})) as T;
}

async function resolve(value: unknown, siblings: Record<string, unknown>): Promise<unknown> {
  if (isPendingMedia(value)) {
    if (!value.uploadedId) {
      const row = await uploadMedia(value.file, containerOf(value.container, siblings));
      value.uploadedId = row.id;
    }
    return value.uploadedId;
  }

  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) out.push(await resolve(item, siblings));
    return out;
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = await resolve(item, value);
    return out;
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}
