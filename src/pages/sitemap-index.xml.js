import { getCollection } from 'astro:content';

const staticPages = [
  '/',
  '/about/',
  '/archives/',
  '/categories/',
  '/tags/',
  '/links/',
  '/moments/',
  '/photos/',
];

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

  const urls = [
    ...staticPages,
    ...posts.map((post) => `/blog/${encodeURIComponent(post.slug)}/`),
    ...categories.map((category) => `/categories/${encodeURIComponent(category)}/`),
    ...tags.map((tag) => `/tags/${encodeURIComponent(tag)}/`),
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
