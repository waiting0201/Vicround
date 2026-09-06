import { t, type Localized } from '@/lib/content';

/**
 * 認證明細 —— 逐筆取自 `mockup/Rounded Design/CertificationDialog.dc.html`。
 *
 * <p>
 * ⚠️ **暫代資料。** 正式站由 `GET /api/v1/certifications` 提供
 * （`Certifications` 表：發證機構、證號、效期、範疇、證書 PDF，見 docs/cms.md「永續」分區）。
 * mockup 裡多數欄位是「[Pending client input]」—— 客戶尚未提供證書清單，
 * 這裡照實保留，不要自己填值。
 * </p>
 */
export type Certification = {
  id: string;
  category: Localized;
  title: Localized;
  summary: Localized;
  issuer: Localized;
  validity: Localized;
  scope: Localized;
  sites: Localized;
  /** 整筆都還沒有內容，只是版位 —— 畫面上會顯示提示框。 */
  todo?: boolean;
};

const PENDING = t('[Pending client input]', '[待客戶提供]');

const COMPANY = t('Company / Factory Certification', '公司／工廠認證');
const SUSTAIN = t('Sustainability Certification', '永續認證');
const PRODUCT = t('Product Compliance', '產品法規符合');

export const CERTIFICATIONS: Certification[] = [
  {
    id: 'iso-14001',
    category: COMPANY,
    title: t('ISO 14001', 'ISO 14001'),
    summary: t(
      'Environmental management systems — the framework behind our waste, energy and emissions targets across every production site.',
      '環境管理系統 —— 我們在各生產據點推動廢棄物、能源與排放目標所依循的框架。',
    ),
    issuer: PENDING,
    validity: PENDING,
    scope: t('Environmental management system', '環境管理系統'),
    sites: PENDING,
  },
  {
    id: 'bsci',
    category: COMPANY,
    title: t('BSCI', 'BSCI'),
    summary: t(
      'Social and labour compliance auditing — working hours, wages, health and safety verified by third-party audit.',
      '社會責任與勞動條件稽核 —— 工時、薪資、健康與安全皆經第三方稽核查證。',
    ),
    issuer: PENDING,
    validity: PENDING,
    scope: t('Social & labour compliance auditing', '社會責任與勞動條件稽核'),
    sites: PENDING,
  },
  {
    id: 'iso-9001',
    category: COMPANY,
    title: PENDING,
    summary: t(
      'Reserved for company and factory level quality management certification, such as ISO 9001.',
      '保留給公司與工廠層級的品質管理認證（例如 ISO 9001）。',
    ),
    issuer: PENDING,
    validity: PENDING,
    scope: PENDING,
    sites: PENDING,
    todo: true,
  },
  {
    id: 'grs',
    category: SUSTAIN,
    title: t('GRS', 'GRS'),
    summary: t(
      'Global Recycled Standard — recycled content tracing from input material through to the finished part we ship.',
      '全球回收標準 —— 從投入原料到出貨成品的回收成分追溯。',
    ),
    issuer: PENDING,
    validity: PENDING,
    scope: t('Recycled content tracing', '回收成分追溯'),
    sites: PENDING,
  },
  {
    id: 'sustainability-todo',
    category: SUSTAIN,
    title: PENDING,
    summary: t(
      'Reserved for carbon footprint verification, EUDR readiness or other sustainability certification.',
      '保留給碳足跡查證、EUDR 合規或其他永續類認證。',
    ),
    issuer: PENDING,
    validity: PENDING,
    scope: PENDING,
    sites: PENDING,
    todo: true,
  },
  {
    id: 'iso-22196',
    category: PRODUCT,
    title: t('ISO 22196', 'ISO 22196'),
    summary: t(
      'Measurement of antibacterial activity on plastic and other non-porous surfaces — the test behind our antimicrobial film claims.',
      '塑膠與其他非多孔性表面的抗菌活性測定 —— 抗菌膜效能宣告所依據的測試。',
    ),
    issuer: PENDING,
    validity: t('Per test report', '依測試報告'),
    scope: t('Antibacterial activity on plastic surfaces', '塑膠表面抗菌活性'),
    sites: t('Product-level', '產品層級'),
  },
  {
    id: 'rohs',
    category: PRODUCT,
    title: t('RoHS', 'RoHS'),
    summary: t(
      'Restricted substances across all shipped material platforms.',
      '涵蓋所有出貨材料平台的限用物質管理。',
    ),
    issuer: t('Self-declaration', '自我宣告'),
    validity: t('Reviewed annually', '每年檢視'),
    scope: t('Restricted substances', '限用物質'),
    sites: t('All material platforms', '所有材料平台'),
  },
  {
    id: 'reach',
    category: PRODUCT,
    title: t('REACH / SVHC', 'REACH / SVHC'),
    summary: t(
      'Substance-of-very-high-concern screening and reporting on request.',
      '高度關切物質（SVHC）篩查，並可依需求出具報告。',
    ),
    issuer: t('Self-declaration', '自我宣告'),
    validity: t('Reviewed per SVHC list update', '隨 SVHC 清單更新檢視'),
    scope: t('SVHC screening and reporting', 'SVHC 篩查與報告'),
    sites: t('All material platforms', '所有材料平台'),
  },
  {
    id: 'iec-ip',
    category: PRODUCT,
    title: t('IEC / IP rating', 'IEC / IP 等級'),
    summary: t(
      'Acoustic mesh ingress protection, tested to the customer protocol.',
      '聲學網布的防塵防水等級，依客戶指定的測試規範進行測試。',
    ),
    issuer: t('Third-party test lab', '第三方測試實驗室'),
    validity: t('Per test report', '依測試報告'),
    scope: t('Ingress protection of acoustic mesh', '聲學網布防護等級'),
    sites: t('Acoustic platform', '聲學材料平台'),
  },
];
