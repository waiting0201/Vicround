import Link from 'next/link';
import type { Locale } from '@/lib/locale';
import { localeHref } from '@/lib/nav';
import type { BreadcrumbItem } from '@/lib/schema';

/**
 * 麵包屑。**要與同頁的 `BreadcrumbList` JSON-LD 用同一份 `items`**
 * —— 畫面與結構化資料不一致，比沒有結構化資料更糟。
 */
export function Breadcrumb({
  locale,
  items,
  label,
}: {
  locale: Locale;
  items: BreadcrumbItem[];
  label: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label={label}
      style={{
        font: "400 0.8125rem/1.4 'Geologica', 'GenYoGothic TW', sans-serif",
        color: 'var(--page-faint)',
      }}
    >
      <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, index) => (
          <li key={item.path} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {index > 0 && <span aria-hidden>/</span>}
            {index === items.length - 1 ? (
              <span aria-current="page" style={{ color: 'var(--page-fg)' }}>
                {item.name}
              </span>
            ) : (
              <Link href={localeHref(locale, item.path)} style={{ color: 'inherit' }}>
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
