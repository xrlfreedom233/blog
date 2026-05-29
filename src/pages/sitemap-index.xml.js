import { getCollection } from 'astro:content';

const staticPages = [
  '/',
  '/about/',
  '/archives/',
  '/categories/',
  '/tags/',
  '/links/',
];

const PAGE_SIZE = 8;

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(site, path) {
  return new URL(path, site).href;
}

export async function GET(context) {
  const site = context.site ?? new URL('https://blog.xrlfreedom.top');
  const posts = await getCollection('blog');

  const categories = [
    ...new Set(posts.flatMap((post) => post.data.categories ?? [])),
  ];
  const tags = [
    ...new Set(posts.flatMap((post) => post.data.tags ?? [])),
  ];
  const homePageCount = Math.ceil(posts.length / PAGE_SIZE);
  const homePagination = Array.from(
    { length: Math.max(homePageCount - 1, 0) },
    (_, index) => `/page/${index + 2}/`
  );
  const categoryPagination = categories.flatMap((category) => {
    const count = posts.filter((post) => post.data.categories?.includes(category)).length;
    const pageCount = Math.ceil(count / PAGE_SIZE);
    return Array.from(
      { length: Math.max(pageCount - 1, 0) },
      (_, index) => `/categories/${encodeURIComponent(category)}/${index + 2}/`
    );
  });
  const tagPagination = tags.flatMap((tag) => {
    const count = posts.filter((post) => post.data.tags?.includes(tag)).length;
    const pageCount = Math.ceil(count / PAGE_SIZE);
    return Array.from(
      { length: Math.max(pageCount - 1, 0) },
      (_, index) => `/tags/${encodeURIComponent(tag)}/${index + 2}/`
    );
  });

  const urls = [
    ...staticPages,
    ...homePagination,
    ...posts.map((post) => `/blog/${encodeURIComponent(post.slug)}/`),
    ...categories.map((category) => `/categories/${encodeURIComponent(category)}/`),
    ...categoryPagination,
    ...tags.map((tag) => `/tags/${encodeURIComponent(tag)}/`),
    ...tagPagination,
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((path) => `  <url><loc>${escapeXml(toAbsoluteUrl(site, path))}</loc></url>`)
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
