import { absoluteUrl, BRAND_LOGO_URL, LEGAL_NAME, SITE_NAME, SITE_URL, toAbsolute } from './site';
import type { Locale } from './locale';

/**
 * JSON-LD 結構化資料（docs/sitemap.md「JSON-LD structured data」）。
 *
 * <p>
 * **這是 GEO 的主要載體，不只是 SEO 的加分項。** AI 回答引擎讀的是這些機器可讀的事實
 * ——「這是型錄站不是電商」「這個規格值是 0.15mm」——而不是版面。FAQ、Exhibition、
 * SpecificationRow 之所以是強型別表而不是 content block，就是為了餵這裡（database.md §09）。
 * </p>
 *
 * <p>
 * 每一支都只做「資料 → schema.org 物件」的轉換，由頁面用 `<JsonLd>` 輸出。
 * 沒有資料時回 `null`，呼叫端不渲染 —— 空殼的結構化資料會被 Search Console 判為錯誤。
 * </p>
 */
type Json = Record<string, unknown>;

export function organizationSchema(locale: Locale, settings?: Json | null): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: LEGAL_NAME,
    url: absoluteUrl(locale),
    logo: BRAND_LOGO_URL,
    ...(settings ?? {}),
  };
}

export type OrganizationContactInput = {
  /** 總部據點（`Locations`）。地址、電話、座標與地圖連結都從這裡來。 */
  location?: {
    countryCode: string;
    city: string;
    addressLine: string | null;
    phone: string | null;
    email: string | null;
    latitude: number | null;
    longitude: number | null;
    mapUrl: string | null;
  } | null;
  /** 收件窗口（`ContactChannels`）→ `contactPoint`。 */
  channels?: { email: string; inquiryType: string; label: string | null }[];
};

/** 看起來像 email 才當 email 用 —— `ContactChannels.Email` 也被拿來放總機號碼。 */
function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

/**
 * Contact 頁的 Organization —— 首頁那一份加上實體地址。
 *
 * <p>
 * 跨頁面的 JSON-LD 不會自動依 `@id` 合併，所以這裡輸出完整的 Organization
 * 而不是只帶 `@id` 的補充節點；沒有據點資料時就退回首頁的那一份。
 * </p>
 */
export function organizationContactSchema(locale: Locale, input: OrganizationContactInput): Json {
  const { location, channels = [] } = input;

  const points = channels
    .filter((channel) => isEmail(channel.email))
    .map((channel) => ({
      '@type': 'ContactPoint',
      email: channel.email,
      contactType: channel.label ?? channel.inquiryType,
      ...(location ? { areaServed: location.countryCode } : {}),
      availableLanguage: ['en', 'zh-Hant'],
    }));

  return {
    ...organizationSchema(locale),
    ...(location
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(location.addressLine ? { streetAddress: location.addressLine } : {}),
            addressLocality: location.city,
            addressCountry: location.countryCode,
          },
          ...(location.phone ? { telephone: location.phone } : {}),
          ...(location.email && isEmail(location.email) ? { email: location.email } : {}),
          ...(location.latitude != null && location.longitude != null
            ? {
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: location.latitude,
                  longitude: location.longitude,
                },
              }
            : {}),
          ...(location.mapUrl ? { hasMap: location.mapUrl } : {}),
        }
      : {}),
    ...(points.length ? { contactPoint: points } : {}),
  };
}

export function webSiteSchema(locale: Locale): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: absoluteUrl(locale),
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: locale,
  };
}

export type BreadcrumbItem = { name: string; path: string };

/** 三層路由（products / solutions / resources）都要輸出。 */
export function breadcrumbSchema(locale: Locale, items: BreadcrumbItem[]): Json | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(locale, item.path),
    })),
  };
}

export type ProductSchemaInput = {
  name: string;
  slug: string;
  category?: { name: string } | null;
  description?: string | null;
  image?: string | null;
  code?: string | null;
  /** `SpecificationRows` → `additionalProperty`。這是規格能被 AI 正確引用的關鍵。 */
  specifications?: { label: string; value: string; note?: string | null }[];
  certifications?: { name: string }[];
};

export function productSchema(
  locale: Locale,
  path: string,
  product: ProductSchemaInput,
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: absoluteUrl(locale, path),
    ...(product.code ? { sku: product.code } : {}),
    ...(product.description ? { description: product.description } : {}),
    ...(product.image ? { image: toAbsolute(product.image) } : {}),
    ...(product.category ? { category: product.category.name } : {}),
    brand: { '@type': 'Brand', name: SITE_NAME },
    manufacturer: { '@id': `${SITE_URL}/#organization` },
    ...(product.specifications?.length
      ? {
          additionalProperty: product.specifications.map((row) => ({
            '@type': 'PropertyValue',
            name: row.label,
            value: row.value,
            ...(row.note ? { description: row.note } : {}),
          })),
        }
      : {}),
    ...(product.certifications?.length
      ? {
          hasCertification: product.certifications.map((c) => ({
            '@type': 'Certification',
            name: c.name,
          })),
        }
      : {}),
    /*
     * 刻意不輸出 `offers`：本站是 B2B 型錄，沒有價格也沒有結帳。
     * 補一個空的 offers 會讓搜尋引擎把它當商品頁，開始要求價格與庫存欄位。
     */
  };
}

export type ArticleSchemaInput = {
  title: string;
  summary?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: { name: string } | null;
};

export function articleSchema(locale: Locale, path: string, article: ArticleSchemaInput): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    url: absoluteUrl(locale, path),
    mainEntityOfPage: absoluteUrl(locale, path),
    ...(article.summary ? { description: article.summary } : {}),
    ...(article.image ? { image: toAbsolute(article.image) } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    author: article.author
      ? { '@type': 'Person', name: article.author.name }
      : { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: locale,
  };
}

export type EventSchemaInput = {
  name: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  boothNumber?: string | null;
  url?: string | null;
};

/** 展會（`Exhibitions`）。News 內頁若掛了展會就一併輸出。 */
export function eventSchema(event: EventSchemaInput): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.startDate,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(event.location ? { location: { '@type': 'Place', name: event.location } } : {}),
    ...(event.boothNumber ? { description: `Booth ${event.boothNumber}` } : {}),
    ...(event.url ? { url: event.url } : {}),
    organizer: { '@id': `${SITE_URL}/#organization` },
  };
}

export type FaqEntry = { question: string; answer: string };

/** `/resources/faq`。Sitemap-0819 明列 FAQ 需結構化標記以利 AI 引擎引用。 */
export function faqPageSchema(items: FaqEntry[]): Json | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
