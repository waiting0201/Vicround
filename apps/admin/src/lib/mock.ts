import { CULTURES, type Culture } from './enums';
import { RESOURCES, type FieldDef, type ResourceDef } from './resources';

/**
 * **開發用的假 Admin API。**
 *
 * <p>
 * 後端（`fn-admin`）一行都還沒寫，而後台有 27 個畫面要驗版型。沒有這一層的話，
 * 每個畫面打開都只看得到「連線失敗」，等於做完也看不出做對沒有。所以在 `import.meta.env.DEV`
 * 下把 `fetch` 攔在 `lib/api.ts` 這一關，回一份記憶體資料；正式 build 一律走真的 API。
 * </p>
 *
 * <p>
 * ⚠️ 這裡的資料**只是形狀正確**，不是內容真相 —— 欄位取自 `lib/resources.ts`（也就是
 * docs/database.md）。真的 Admin API 上線後，把 `VITE_ADMIN_MOCK` 設成 `0`，
 * 或直接刪掉這支檔案與 `api.ts` 裡那一段 `if (MOCK)`。
 * </p>
 */

/** 開發模式預設開啟；設 `VITE_ADMIN_MOCK=0` 可強制打真的 API。 */
export const MOCK_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ADMIN_MOCK !== '0';

type Row = Record<string, unknown> & {
  id: string;
  translations: Partial<Record<Culture, Record<string, unknown>>>;
};

type Store = Map<string, Row[]>;

const store: Store = new Map();

/* -------------------------------------------------------------------------
 * 種子資料
 * ----------------------------------------------------------------------- */

/** 每個實體的示範名稱。取自確認稿的實際內容，讓畫面看起來像真的在用。 */
const SEED_NAMES: Record<string, string[]> = {
  categories: ['Optical Film', 'Textile & Foam', 'Acoustic', 'Anti-Glare Family', 'Privacy Filter Family'],
  products: [
    'AG Anti-Glare Film',
    'AR Anti-Reflective Film',
    'Privacy Screen Filter',
    'Anti-Fog Film',
    'Hard Coating Film',
    'VR-AC 110 Acoustic Mesh',
    'VR-AC 360-A Damping Foam',
    'FlexCore™ Bonding Textile',
  ],
  solutions: [
    'Consumer Electronics',
    'Automotive',
    'Smart Healthcare',
    'Renewable Energy',
    'E-Paper',
    'Sports & Eyewear',
    'Acoustic Solutions',
  ],
  articles: [
    'VicRound joins Touch Taiwan 2026',
    'New acoustic grade passes IP68 validation',
    'Why anti-glare and anti-reflective are not the same thing',
    'ISO 14001 recertification completed',
    'Optical film trends for automotive interiors',
  ],
  pages: ['Home', 'Products', 'Solutions', 'Technologies', 'About Us', 'Sustainability', 'Partnership', 'Resources', 'Contact', 'Privacy Policy', 'Member'],
  exhibitions: ['Touch Taiwan 2026', 'Automotive World Tokyo 2026', 'CES 2027'],
  'faq-categories': ['Products', 'Specification', 'Sampling', 'Compliance', 'Logistics', 'Partnership'],
  'faq-items': [
    'What is the difference between anti-glare and anti-reflective?',
    'Can you match a custom haze value?',
    'What is the minimum order quantity for samples?',
    'Do your materials comply with RoHS and REACH?',
  ],
  downloads: ['Optical Film spec sheet', 'Acoustic grade comparison', 'ISO 14001 certificate', 'EUDR compliance pack'],
  'article-tags': ['knowledge', 'activity'],
  authors: ['Ellen Chang', 'Ryan Wu'],
  certifications: ['ISO 9001', 'ISO 14001', 'RoHS', 'REACH', 'IATF 16949', 'IEC 60529 IP Rating'],
  milestones: ['Founding', 'First optical coating line', 'Acoustic material platform', 'Vietnam plant'],
  locations: ['Taipei Headquarters', 'Taoyuan Plant', 'Ho Chi Minh Sales Office'],
  testimonials: ['Consistent haze across three production lots.', 'They matched our die-cut tolerance on the first sample.'],
  'partner-brands': ['Brand A', 'Brand B', 'Brand C', 'Brand D'],
  'contact-channels': ['Sales & quotations', 'Technical support', 'Partnership'],
  'process-flows': ['Core processes', 'How optical film is made', 'Co-development', 'OEM / ODM', 'After you send an inquiry'],
  navigation: ['Products', 'Solutions', 'Technologies', 'About', 'Resources', 'Contact'],
  'site-settings': [
    'Seo:TitleTemplate',
    'Seo:DefaultDescription',
    'Organization:LegalName',
    'Organization:Phone',
    'Analytics:GtmId',
    'Revalidate:WebhookUrl',
    'Privacy:PolicyVersion',
  ],
  media: ['hero-optical-film.jpg', 'plant-taoyuan.jpg', 'iso-14001.pdf', 'acoustic-grade-chart.png'],
  users: ['系統管理員', '內容編輯'],
};

const MEMBER_SEED = [
  { fullName: 'Chen Wei-Ting', companyName: 'Foxlink Optics', email: 'weiting.chen@foxlink-optics.com', status: 'pendingApproval', jobRole: 'engineeringRnd' },
  { fullName: 'Sarah Nakamura', companyName: 'Kyocera Display', email: 's.nakamura@kyocera-display.co.jp', status: 'approved', jobRole: 'procurement' },
  { fullName: 'Liu Chia-Hao', companyName: 'AUO', email: 'chiahao.liu@auo.com', status: 'pendingEmailVerification', jobRole: 'quality' },
  { fullName: 'Mark Reynolds', companyName: 'Corning Automotive', email: 'm.reynolds@corning-auto.com', status: 'approved', jobRole: 'productManagement' },
  { fullName: 'Anonymous Gmail', companyName: '—', email: 'someone@gmail.com', status: 'rejected', jobRole: 'other' },
  { fullName: 'Wu Pei-Chi', companyName: 'Pegatron', email: 'peichi.wu@pegatron.com', status: 'pendingApproval', jobRole: 'engineeringRnd' },
  { fullName: 'Daniel Oyelaran', companyName: 'Solaris Energy', email: 'd.oyelaran@solaris-energy.com', status: 'suspended', jobRole: 'procurement' },
];

const SAMPLE_SEED = [
  { status: 'submitted', shipToCompany: 'Foxlink Optics', memberName: 'Chen Wei-Ting', projectName: 'Anti-glare cover lens' },
  { status: 'underReview', shipToCompany: 'Kyocera Display', memberName: 'Sarah Nakamura', projectName: 'E-paper front film' },
  { status: 'approved', shipToCompany: 'AUO', memberName: 'Liu Chia-Hao', projectName: 'Privacy filter 14"' },
  { status: 'shipped', shipToCompany: 'Corning Automotive', memberName: 'Mark Reynolds', projectName: 'HUD combiner film' },
  { status: 'delivered', shipToCompany: 'Pegatron', memberName: 'Wu Pei-Chi', projectName: 'Acoustic mesh VR-AC 110' },
  { status: 'shipped', shipToCompany: 'Solaris Energy', memberName: 'Daniel Oyelaran', projectName: 'Backsheet foam' },
  { status: 'submitted', shipToCompany: 'Kyocera Display', memberName: 'Sarah Nakamura', projectName: 'Damping foam 360-A' },
];

const INQUIRY_SEED = [
  { name: 'Hsu Ming-Chieh', companyName: 'Innolux', type: 'technical', status: 'new', message: '請問 AG 系列的霧度可以做到 25% 嗎？我們的產品是 15.6 吋筆電上蓋。' },
  { name: 'Julia Bernard', companyName: 'Valeo', type: 'sales', status: 'inProgress', message: 'Looking for a quotation on anti-fog film for automotive camera housings, 20k pcs/month.' },
  { name: 'Kim Do-Yun', companyName: 'LG Innotek', type: 'sampleRequest', status: 'responded', message: 'Requesting a sample of VR-AC 360-A with 6mm port.' },
  { name: 'Marco Rossi', companyName: 'Pirelli Design', type: 'partnership', status: 'new', message: 'Interested in OEM cooperation for textile-backed acoustic panels.' },
  { name: 'spam bot', companyName: 'n/a', type: 'general', status: 'spam', message: 'CHEAP SEO SERVICE!!!' },
];

const DOMAIN_SEED = [
  { domain: 'gmail.com', rule: 'block', note: '個人信箱，不核發會員資格' },
  { domain: 'outlook.com', rule: 'block', note: '個人信箱' },
  { domain: 'auo.com', rule: 'autoApprove', note: '既有客戶' },
  { domain: 'pegatron.com', rule: 'autoApprove', note: '既有客戶' },
  { domain: 'valeo.com', rule: 'manualReview', note: '' },
];

const REDIRECT_SEED = [
  { fromPath: '/application', toPath: '/en/solutions', statusCode: '301', isEnabled: true, notes: '舊站 Application 收斂為 Solutions' },
  { fromPath: '/store/anti-glare-film.html', toPath: '/en/products/optical-film/ag-anti-glare-film', statusCode: '301', isEnabled: true, notes: '舊站商品頁' },
  { fromPath: '/products-for-health-care.html', toPath: '/en/solutions/smart-healthcare', statusCode: '301', isEnabled: true, notes: '' },
  { fromPath: '/team-workplace.html', toPath: '/en/solutions/consumer-electronics', statusCode: '301', isEnabled: true, notes: '' },
  { fromPath: '/old-catalogue.pdf', toPath: '', statusCode: '410', isEnabled: true, notes: '型錄已下架，無替代' },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[™&]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/** 依欄位型別編一個看起來合理的值，讓表單不是一片空白。 */
function seedValue(field: FieldDef, index: number, name: string): unknown {
  if (field.options?.length) return field.options[index % field.options.length].value;
  switch (field.type) {
    case 'number':
      return field.name === 'year' ? 1998 + index * 6 : field.name === 'sortOrder' ? index * 10 : index + 1;
    case 'boolean':
      return index % 3 === 0;
    case 'date':
      return daysAgo(30 - index).slice(0, 10);
    case 'datetime':
      return daysAgo(30 - index);
    case 'email':
      return `contact${index + 1}@vicround.com`;
    case 'url':
      return 'https://example.com';
    case 'color':
      return ['#71d6e0', '#e7004b', '#cfcfcd'][index % 3];
    case 'icon':
      return ['layers', 'shield', 'waves'][index % 3];
    case 'slug':
      return slugify(name);
    case 'json':
      return '{ "limit": 6 }';
    case 'media':
    case 'reference':
    case 'multiReference':
      return null;
    default:
      return undefined;
  }
}

function seedRow(resource: ResourceDef, index: number, name: string): Row {
  const row: Row = { id: `${resource.type}-${index + 1}`, translations: {} };

  for (const field of resource.baseFields) {
    const value = seedValue(field, index, name);
    if (value !== undefined) row[field.name] = value;
  }

  if (resource.hasStatus) row.status = index === 0 ? 'draft' : index % 5 === 4 ? 'archived' : 'published';
  if (resource.hasSort) row.sortOrder = index * 10;
  row.createdAt = daysAgo(120 - index);
  row.updatedAt = daysAgo(index % 14);
  row.publishedAt = resource.hasStatus && row.status === 'published' ? daysAgo(index % 30) : null;

  for (const culture of CULTURES) {
    // 每三筆刻意缺一份繁中翻譯 —— 「翻譯缺漏」的標示與篩選要有東西可以測。
    if (culture.value === 'zh-Hant' && index % 3 === 2) continue;
    const translation: Record<string, unknown> = {};
    for (const field of resource.translationFields) {
      if (field.name === resource.titleField) {
        translation[field.name] = culture.value === 'en' ? name : `${name}（繁中待校稿）`;
        continue;
      }
      if (field.type === 'text' || field.type === 'textarea' || field.type === 'html') {
        translation[field.name] =
          culture.value === 'en' ? `${field.label} for ${name}` : `${name} 的${field.label}`;
      }
    }
    row.translations[culture.value] = translation;
  }

  return row;
}

function seedResource(resource: ResourceDef): Row[] {
  if (resource.type === 'members') {
    return MEMBER_SEED.map((member, index) => ({
      id: `members-${index + 1}`,
      translations: {},
      ...member,
      phone: '+886 2 1234 5678',
      countryCode: index % 2 === 0 ? 'TW' : 'JP',
      emailVerifiedAt: member.status === 'pendingEmailVerification' ? null : daysAgo(20 - index),
      approvedAt: member.status === 'approved' ? daysAgo(10 - index) : null,
      lastLoginAt: member.status === 'approved' ? daysAgo(index) : null,
      reviewNote: member.status === 'rejected' ? '非企業信箱，請以公司網域重新註冊。' : '',
      createdAt: daysAgo(30 - index * 3),
      updatedAt: daysAgo(index),
    }));
  }

  if (resource.type === 'sample-requests') {
    return SAMPLE_SEED.map((request, index) => ({
      id: `sample-requests-${index + 1}`,
      translations: {},
      ...request,
      requestNumber: `SR-2026-${String(index + 101).padStart(6, '0')}`,
      shipToName: request.memberName,
      shipToCity: ['Taipei', 'Kyoto', 'Hsinchu', 'Corning', 'Taoyuan', 'Lisbon', 'Kyoto'][index],
      shipToCountryCode: ['TW', 'JP', 'TW', 'US', 'TW', 'PT', 'JP'][index],
      submittedAt: daysAgo(20 - index * 2),
      reviewedAt: index >= 1 ? daysAgo(18 - index * 2) : null,
      approvedAt: index >= 2 ? daysAgo(15 - index * 2) : null,
      shippedAt: index >= 3 ? daysAgo(10 - index) : null,
      deliveredAt: index === 4 ? daysAgo(4) : null,
      carrier: index >= 3 ? 'DHL Express' : '',
      trackingNumber: index >= 3 ? `JD0140${index}00123456` : '',
      items: [
        { id: `${index}-1`, productNameSnapshot: 'AG Anti-Glare Film', gradeCode: 'AG16', quantity: 5, unit: 'sheets', requestedSpec: 'A4, 0.125mm' },
        { id: `${index}-2`, productNameSnapshot: 'VR-AC 360-A', gradeCode: 'VR-AC 360-A', quantity: 2, unit: 'pcs', requestedSpec: '±0.05mm die-cut, 6mm port' },
      ],
      createdAt: daysAgo(21 - index * 2),
      updatedAt: daysAgo(index),
    }));
  }

  if (resource.type === 'contact-inquiries') {
    return INQUIRY_SEED.map((inquiry, index) => ({
      id: `contact-inquiries-${index + 1}`,
      translations: {},
      ...inquiry,
      referenceNumber: `INQ-2026-${String(index + 431).padStart(6, '0')}`,
      email: `${slugify(inquiry.name)}@example.com`,
      phone: '+886 912 345 678',
      sourceUrl: '/en/contact',
      culture: index % 2 === 0 ? 'zh-Hant' : 'en',
      internalNote: '',
      respondedAt: inquiry.status === 'responded' ? daysAgo(2) : null,
      createdAt: daysAgo(index * 2),
      updatedAt: daysAgo(index),
    }));
  }

  if (resource.type === 'business-domains') {
    return DOMAIN_SEED.map((domain, index) => ({
      id: `business-domains-${index + 1}`,
      translations: {},
      ...domain,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(index),
    }));
  }

  if (resource.type === 'redirects') {
    return REDIRECT_SEED.map((redirect, index) => ({
      id: `redirects-${index + 1}`,
      translations: {},
      ...redirect,
      createdAt: daysAgo(90),
      updatedAt: daysAgo(index * 3),
    }));
  }

  const names = SEED_NAMES[resource.type] ?? Array.from({ length: 6 }, (_, i) => `${resource.singular} ${i + 1}`);
  return names.map((name, index) => seedRow(resource, index, name));
}

function ensure(type: string): Row[] {
  let rows = store.get(type);
  if (!rows) {
    const resource = RESOURCES.find((item) => item.type === type);
    rows = resource ? seedResource(resource) : [];
    store.set(type, rows);
  }
  return rows;
}

/* -------------------------------------------------------------------------
 * 假的路由器
 * ----------------------------------------------------------------------- */

const ME = {
  id: 'user-1',
  email: 'admin@vicround.com',
  displayName: '系統管理員（模擬）',
  roles: ['Admin', 'Editor'],
};

function matchText(row: Row, query: string): boolean {
  const haystack = [
    ...Object.values(row).filter((value) => typeof value === 'string'),
    ...Object.values(row.translations).flatMap((translation) =>
      Object.values(translation ?? {}).filter((value) => typeof value === 'string'),
    ),
  ].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function listOf(type: string, params: URLSearchParams) {
  let rows = [...ensure(type)];

  const search = params.get('search')?.trim();
  if (search) rows = rows.filter((row) => matchText(row, search));

  const missing = params.get('missingCulture');
  if (missing) rows = rows.filter((row) => !row.translations[missing as Culture]);

  for (const [key, value] of params) {
    if (['search', 'page', 'pageSize', 'missingCulture', 'culture', 'sort'].includes(key) || !value) continue;
    rows = rows.filter((row) => String(row[key] ?? '') === value);
  }

  const page = Number(params.get('page') ?? 1);
  const pageSize = Number(params.get('pageSize') ?? 20);
  const start = (page - 1) * pageSize;

  return { items: rows.slice(start, start + pageSize), page, pageSize, total: rows.length };
}

let nextId = 1000;

/** 假的上傳：不真的送檔案，只是把一筆 metadata 塞進媒體庫，讓畫面流程走得完。 */
export function mockUpload(file: File): Record<string, unknown> {
  const rows = ensure('media');
  const row: Row = {
    id: `media-new-${nextId++}`,
    translations: {},
    fileName: file.name,
    container: 'public-media',
    mimeType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size,
    type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
    isPrivate: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rows.unshift(row);
  return row;
}

/**
 * 把一次 `fetch` 對應成一個假回應。路徑形狀刻意與 docs/cms-api.md 的
 * Admin API 完全一致，換成真後端時 `api.ts` 以外不需要改任何一行。
 */
export async function mockFetch(path: string, init: RequestInit): Promise<Response> {
  await new Promise((resolve) => setTimeout(resolve, 180)); // 讓載入狀態看得見

  const [rawPath, rawQuery] = path.split('?');
  const params = new URLSearchParams(rawQuery ?? '');
  const segments = rawPath.split('/').filter(Boolean);
  const method = (init.method ?? 'GET').toUpperCase();
  const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

  // 回應包成與真後端相同的信封（docs/cms-api.md）——形狀不一致的假 API
  // 只會讓「換成真後端」那一天才發現前端解錯層。
  const json = (data: unknown, status = 200) =>
    new Response(
      status === 204
        ? null
        : JSON.stringify({
            success: status < 400,
            code: status < 400 ? null : 'MOCK_ERROR',
            data: status < 400 ? data : null,
            message: status < 400 ? 'Success' : String((data as { detail?: string })?.detail ?? 'error'),
            errors: [],
            timestamp: new Date().toISOString(),
          }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );

  if (segments[0] === 'auth') {
    if (segments[1] === 'me') return json(ME);
    if (segments[1] === 'logout') return json(null, 204);
    return json({ accessToken: 'mock-access-token' });
  }

  const [type, id, action, culture] = segments;
  const rows = ensure(type);

  if (method === 'GET' && !id) return json(listOf(type, params));

  if (method === 'GET' && id) {
    const row = rows.find((item) => item.id === id);
    return row ? json(row) : json({ title: '找不到資料', detail: '這筆資料不存在或已被刪除。' }, 404);
  }

  if (method === 'POST' && !id) {
    const row: Row = {
      id: `${type}-new-${nextId++}`,
      translations: {},
      status: 'draft',
      sortOrder: rows.length * 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };
    rows.unshift(row);
    return json(row, 201);
  }

  if (method === 'POST' && id && action === 'reorder') return json(null, 204);

  const index = rows.findIndex((item) => item.id === id);
  const row = index >= 0 ? rows[index] : undefined;

  if (method === 'PUT' && row && action === 'translations' && culture) {
    row.translations[culture as Culture] = { ...row.translations[culture as Culture], ...body };
    row.updatedAt = new Date().toISOString();
    return json(row);
  }

  if (method === 'PUT' && row) {
    Object.assign(row, body, { updatedAt: new Date().toISOString() });
    return json(row);
  }

  if (method === 'POST' && row) {
    const now = new Date().toISOString();
    switch (action) {
      case 'publish':
        row.status = 'published';
        row.publishedAt = now;
        break;
      case 'unpublish':
        row.status = 'draft';
        break;
      case 'approve':
        row.status = 'approved';
        row.approvedAt = now;
        break;
      case 'reject':
        row.status = 'rejected';
        row.reviewNote = body.reviewNote ?? row.reviewNote;
        break;
      case 'suspend':
        row.status = 'suspended';
        break;
      case 'reactivate':
        row.status = 'approved';
        break;
      default:
        break;
    }
    row.updatedAt = now;
    return json(row);
  }

  if (method === 'DELETE' && row) {
    if (row.status) row.status = 'archived';
    else rows.splice(index, 1);
    return json(null, 204);
  }

  return json({ title: '模擬 API 沒有這條路由', detail: `${method} ${path}` }, 404);
}
