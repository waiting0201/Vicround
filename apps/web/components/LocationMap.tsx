import type { CSSProperties } from 'react';
import type { Location } from '@/lib/content-api';
import type { Locale } from '@/lib/locale';

/**
 * 據點地圖 —— 以座標嵌入 Google 地圖，對應 mockup contact 頁 Locations 區的地圖版位。
 *
 * <p>
 * 座標與地圖連結一律來自 CMS 的 `Locations`（`latitude` / `longitude` / `mapUrl`），
 * 不寫死在程式裡；編輯者在後台改座標，這裡就跟著動。沒有座標的據點回傳 `null`，
 * 由呼叫端退回 `ImageSlot` 的虛線佔位框。
 * </p>
 *
 * <p>
 * `output=embed` 的內嵌網址不需要 API key，這是舊站 www.vicround.com/contact 用的同一組
 * 座標與縮放層級；日後若要換成付費的 Maps Embed API，只需要改這一支。
 * </p>
 */
const MAP_LOCALE: Record<Locale, string> = { en: 'en', 'zh-Hant': 'zh-TW' };

export function LocationMap({
  locale,
  location,
  ratio = '16 / 5',
  style,
}: {
  locale: Locale;
  location: Location;
  ratio?: string;
  style?: CSSProperties;
}) {
  if (location.latitude == null || location.longitude == null) {
    return null;
  }

  const query = `${location.latitude},${location.longitude}`;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&hl=${MAP_LOCALE[locale]}&output=embed`;
  const title = [location.name ?? location.city, location.addressLine].filter(Boolean).join(' — ');

  return (
    <div
      style={{
        aspectRatio: ratio,
        borderRadius: 22,
        overflow: 'hidden',
        border: '1px solid var(--page-border)',
        background: 'var(--page-raised)',
        ...style,
      }}
    >
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </div>
  );
}
