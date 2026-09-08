import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleView } from '@/components/ArticleView';
import { getArticle, getArticles } from '@/lib/content-api';
import { requireLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

/**
 * 產業洞察內頁 —— 版型對照 `mockup/Rounded Design/article.dc.html`（左側目錄）。
 *
 * <p>
 * ⚠️ **網址前綴由 `Articles.Type` 決定**（`/insights`）。編輯者改 Type 等同改網址，
 * 後端必須在同一 transaction 寫入 301（docs/sitemap.md）。因此這裡拿到的文章若前綴不符，
 * 一律 404 —— 同一篇文章不該有兩個可索引的網址。
 * </p>
 */
type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);
  const article = await getArticle(locale, slug);

  if (!article || !article.path.startsWith('/insights/')) return {};

  return pageMetadata({
    locale,
    path: article.path,
    title: article.seo?.title ?? article.title ?? '',
    description: article.seo?.description ?? article.excerpt ?? article.lead ?? undefined,
    type: 'article',
    publishedTime: article.publishedAt ?? undefined,
  });
}

export default async function Page({ params }: Params) {
  const { locale: rawLocale, slug } = await params;
  const locale = requireLocale(rawLocale);

  const article = await getArticle(locale, slug);
  if (!article || !article.path.startsWith('/insights/')) notFound();

  const more = await getArticles(locale, { type: 'insight', pageSize: 4 });
  const related = (more?.items ?? []).filter((item) => item.slug !== article.slug).slice(0, 3);

  return <ArticleView locale={locale} article={article} related={related} variant="toc" />;
}
