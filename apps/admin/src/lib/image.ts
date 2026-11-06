/**
 * 圖片欄位的建議尺寸，以及選檔當下的縮圖＋轉 WebP。
 *
 * <p>
 * 前台關掉了 Next.js 的圖片優化（`apps/web/next.config.ts`：SWA Free 的頻寬額度），
 * 圖片一律由 Blob/CDN **原檔直供**——所以「上傳什麼，訪客就下載什麼」。手機拍的 6000px、
 * 8MB JPG 直接放進 banner，整頁就慢下來。這裡在瀏覽器端把它縮到版位需要的寬度、
 * 轉成 WebP 再上傳，後端與 Functions 不必帶任何影像處理的原生相依。
 * </p>
 *
 * <p>
 * 不轉的格式：SVG（向量，轉了反而失真變大）、GIF（可能是動圖）、AVIF（本來就比 WebP 小）、
 * 非圖片（PDF）。瀏覽器編不出 WebP（`toBlob` 退回 PNG）或轉完反而更大時，保留原檔。
 * </p>
 */

/** 圖片欄位的版位規格。只有寬 ＝ 比例不拘（例如產品圖用 contain 完整顯示）。 */
export type ImageSpec = {
  /** 建議寬度，也是自動縮圖的上限。 */
  width: number;
  /** 有給就表示版位會以這個比例裁切（cover）。 */
  height?: number;
};

/** 沒有規格的圖片欄位，縮圖上限一律用這個寬度。 */
const FALLBACK_MAX_WIDTH = 2400;
const WEBP_QUALITY = 0.85;
const CONVERTIBLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/bmp']);

export const IMAGE_SPECS = {
  /** 內頁頁首橫幅：全寬 16:3（`PageBanner`）。 */
  banner: { width: 2400, height: 450 },
  /** 首頁主視覺：全寬 8:3。 */
  homeHero: { width: 2400, height: 900 },
  /** 文章／展會封面：全寬 21:9（`ArticleView`）。 */
  articleHero: { width: 2100, height: 900 },
  /** 產品主圖與圖庫：以 contain 完整顯示，比例不拘。 */
  product: { width: 1600 },
  /** 案例實品照：卡片裡是縮圖，點開看原圖，海報字要看得清楚。 */
  caseStudy: { width: 1600 },
  /** 合作品牌 Logo 牆：5:2，cover 裁切、黑底。 */
  partnerLogo: { width: 500, height: 200 },
  /** 認證標章、下載縮圖。 */
  badge: { width: 600, height: 600 },
  /** 人物頭像。 */
  avatar: { width: 400, height: 400 },
  /** 其他一般內容圖（沿革、據點、流程步驟）。 */
  content: { width: 1600 },
} satisfies Record<string, ImageSpec>;

function ratioOf({ width, height }: Required<ImageSpec>): string {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const d = gcd(width, height);
  return `${width / d}:${height / d}`;
}

/** 欄位下方的說明文字。 */
export function describeImageSpec(spec: ImageSpec | undefined): string {
  const size = !spec
    ? undefined
    : spec.height
      ? `建議尺寸 ${spec.width} × ${spec.height} px（${ratioOf(spec as Required<ImageSpec>)}，超出比例的部分會被裁掉）`
      : `建議寬度 ${spec.width} px，比例不拘`;
  const format = 'JPG／PNG 選檔後會自動縮圖並轉成 WebP；透明底請用 PNG，SVG、GIF 以原檔上傳。';
  return [size, format].filter(Boolean).join('。');
}

export type PreparedImage = {
  file: File;
  /** 有轉檔時的原檔大小，給畫面顯示「原檔 x MB」。 */
  originalSize?: number;
};

/**
 * 縮到 `spec.width` 以內並轉成 WebP。不適用或沒有比較好時原樣回傳。
 *
 * <p>
 * 只縮不放大；有指定比例的版位也**不在這裡裁切**——裁哪裡是編輯的判斷，前台用 cover
 * 置中裁，建議尺寸寫在欄位說明上。
 * </p>
 */
export async function prepareImage(file: File, spec: ImageSpec | undefined): Promise<PreparedImage> {
  if (!CONVERTIBLE.has(file.type)) return { file };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return { file };
  }

  try {
    const maxWidth = spec?.width ?? FALLBACK_MAX_WIDTH;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    // 已經是 WebP 又不必縮，重編只會掉畫質。
    if (file.type === 'image/webp' && scale === 1) return { file };

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return { file };
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
    // 不支援 WebP 編碼的瀏覽器會默默改給 PNG——那就不如原檔。
    if (!blob || blob.type !== 'image/webp') return { file };
    if (scale === 1 && blob.size >= file.size) return { file };

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return { file: new File([blob], name, { type: 'image/webp' }), originalSize: file.size };
  } finally {
    bitmap.close();
  }
}
