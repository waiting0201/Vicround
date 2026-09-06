import { t, type Localized } from '@/lib/content';

/**
 * 七個產業解決方案的名稱 —— 取自 `mockup/Rounded Design/Header.dc.html` 的 mega menu
 * 與各 `solution-*.dc.html` 的標題。各頁完整內容見 `content/solution-pages.ts`。
 *
 * <p>
 * 之所以把「名稱」單獨抽出來：產品線頁的「Where it is used」與首頁的產業卡都只需要名稱，
 * 不必把整份解決方案內容拉進那些頁面的 bundle。接上 `GET /api/v1/solutions` 後刪除。
 * </p>
 */
export const SOLUTION_NAMES: Record<string, Localized> = {
  'consumer-electronics': t('Consumer Electronics', '消費性電子'),
  automotive: t('Automotive', '車用'),
  'smart-healthcare': t('Smart Healthcare', '智慧醫療'),
  'renewable-energy': t('Renewable Energy', '再生能源'),
  'acoustic-solutions': t('Acoustic Solutions', '聲學解決方案'),
  'e-paper': t('E-Paper', '電子紙'),
  'sports-eyewear': t('Sports Eye-Wear', '運動眼鏡'),
};
