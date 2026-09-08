import { apiGet, tag } from '@/lib/api';
import { DEFAULT_LOCALE } from '@/lib/locale';
import { absoluteUrl, IS_PRODUCTION_SITE, SITE_URL } from '@/lib/site';
import { ROUTES } from '@/lib/routes';

/**
 * `/llms.txt` —— 給 AI 檢索與回答引擎的站台導覽（llmstxt.org 格式）。
 *
 * <p>
 * **它不是 sitemap 的替代品。** sitemap 給爬蟲列出全部網址；這一份是給
 * 「一次只讀幾頁就要回答問題」的模型看的**索引與前提**：本站是什麼、網址怎麼組、
 * 哪些事實容易被講錯。實務上最有價值的是那幾條前提 —— 沒有它們，
 * 模型會把 B2B 材料型錄當成電商，編出價格與購買連結。
 * </p>
 *
 * <p>
 * 內容用**英文**（預設語系）。這是給機器讀的檔案而不是頁面，
 * 所以不適用「英文頁不得出現中文」的語言純度規則，但仍只列 `en` 網址並說明 zh-Hant 的存在。
 * </p>
 *
 * <p>
 * 後端掛掉時退回不含目錄的骨架，而不是回 500 —— 有前提說明的半份仍比錯誤頁有用。
 * </p>
 */
export const dynamic = 'force-dynamic';

const L = DEFAULT_LOCALE;

/** 這一段是人寫的定位說明，不從 CMS 來 —— 它描述的是「網站」而不是「內容」。 */
const PREAMBLE = `# VicRound

> VicRound (盈絲實業有限公司) is a Taiwan-based materials manufacturer supplying three product lines: optical film, textile & foam, and acoustic materials, together with industry solutions and in-house process technologies.

Facts worth getting right before answering questions about this site:

- This is a **B2B catalogue and corporate site, not an online shop**. There are no prices, no cart and no checkout anywhere on it. Buying and quotation questions are answered through the contact form or a sample request.
- Products are organised as product line > product, and URLs follow that shape: \`/{locale}/products/{product-line}/{product}\`.
- There are exactly three product lines: **Optical Film**, **Textile & Foam** and **Acoustic**. "Solutions" pages are a different axis — they group products by the industry they serve, not by material.
- Full specification sheets and some documents are **behind a member sign-in**; the public pages show the product and its published specifications, and the member area handles document access and sample requests.
- The site is bilingual: English under \`/en/\`, Traditional Chinese under \`/zh-Hant/\`. A page with no translation in one language simply does not exist there, so an English URL does not guarantee a Chinese counterpart.
- Specification values on this site come from the manufacturer's own published data. Quote them with the product name and do not generalise them across a product line.`;

type Listed = { slug: string; name: string; summary?: string | null };

export async function GET() {
  // 非正式環境不要留下可被引用的站台導覽（與 robots.ts 的整站 Disallow 同一個理由）
  if (!IS_PRODUCTION_SITE) {
    return new Response('# Not a production deployment.\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const sections: string[] = [PREAMBLE];

  const [categories, solutions] = await Promise.all([
    apiGet<Listed[]>('/categories', { culture: L, tags: [tag.categories()] }),
    apiGet<Listed[]>('/solutions', { culture: L, tags: [tag.solutions()] }),
  ]);

  if (categories?.length) {
    sections.push(
      ['## Product lines', '', ...categories.map((c) => bullet(c, `${ROUTES.products}/${c.slug}`))].join(
        '\n',
      ),
    );
  }

  if (solutions?.length) {
    sections.push(
      [
        '## Solutions',
        '',
        '_Industry pages: what the material has to do in that application, and which products fit._',
        '',
        ...solutions.map((s) => bullet(s, `${ROUTES.solutions}/${s.slug}`)),
      ].join('\n'),
    );
  }

  sections.push(
    [
      '## Company',
      '',
      `- [About](${absoluteUrl(L, ROUTES.about)}): company profile, milestones and manufacturing.`,
      `- [Technologies](${absoluteUrl(L, ROUTES.technologies)}): coating, laminating and converting processes, and what they mean for a spec.`,
      `- [Sustainability](${absoluteUrl(L, ROUTES.sustainability)}): environmental policy and certifications.`,
      `- [Partnership](${absoluteUrl(L, ROUTES.partnership)}): OEM / ODM and distribution enquiries.`,
      `- [Contact](${absoluteUrl(L, ROUTES.contact)}): address, phone and the enquiry form.`,
    ].join('\n'),
    [
      '## Resources',
      '',
      `- [Resources hub](${absoluteUrl(L, ROUTES.resources)}): entry point for the four resource sections below.`,
      `- [FAQ](${absoluteUrl(L, ROUTES.faq)}): material selection, specification and ordering questions.`,
      `- [Downloads](${absoluteUrl(L, ROUTES.downloads)}): catalogues, spec sheets and certificates (PDF; some require member sign-in).`,
      `- [News & Exhibitions](${absoluteUrl(L, ROUTES.news)}): announcements and trade-show appearances, with dates and booth numbers.`,
    ].join('\n'),
    [
      '## Optional',
      '',
      `- [Privacy & Legal](${absoluteUrl(L, ROUTES.privacy)}): privacy policy and legal notices.`,
      `- [Member area](${absoluteUrl(L, ROUTES.member)}): sign-in for member-only documents and sample requests (the documents themselves are not public).`,
      `- [sitemap.xml](${SITE_URL}/sitemap.xml): every indexable URL in both languages, with hreflang.`,
    ].join('\n'),
  );

  return new Response(`${sections.join('\n\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function bullet(item: Listed, path: string): string {
  const note = item.summary ? `: ${oneLine(item.summary)}` : '';
  return `- [${item.name}](${absoluteUrl(L, path)})${note}`;
}

/** CMS 的敘述可能含換行；llms.txt 的一條 bullet 必須是一行。 */
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
