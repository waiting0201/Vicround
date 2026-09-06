/**
 * JSON-LD 輸出。物件由 `lib/schema.ts` 產生，這裡只負責寫進 `<script>`。
 *
 * <p>
 * `null` 直接不渲染 —— 空殼的結構化資料會被 Search Console 判為錯誤，
 * 沒有比錯的好。
 * </p>
 */
export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      // 內容來自我們自己組的物件，不是使用者輸入；仍轉義 `<` 以防內容欄位夾帶標籤
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
