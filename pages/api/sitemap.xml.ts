import type { NextApiRequest, NextApiResponse } from 'next';
import { getPostSlugs, getProjectSlugs, type SlugEntry } from '@/lib/content';
import { SITE_URL } from '@/lib/site';

interface UrlEntry {
  path: string;
  priority: string;
  lastmod?: string;
}

const STATIC_PAGES: UrlEntry[] = [
  { path: '/', priority: '1.0' },
  { path: '/portfolio', priority: '0.8' },
  { path: '/blog', priority: '0.8' },
  { path: '/about', priority: '0.8' },
];

function toUrlEntries(prefix: string, entries: SlugEntry[]): UrlEntry[] {
  return entries.map((entry) => ({
    path: `${prefix}/${entry.slug}`,
    priority: '0.7',
    lastmod: new Date(entry.updated_at).toISOString(),
  }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderUrl({ path, priority, lastmod }: UrlEntry): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  let projects: SlugEntry[];
  let posts: SlugEntry[];
  try {
    [projects, posts] = await Promise.all([getProjectSlugs(), getPostSlugs()]);
  } catch (error) {
    // A sitemap missing every post and project is worse than none: fail loudly
    // so crawlers retry later instead of dropping the URLs.
    console.error('Sitemap generation failed:', error);
    res.status(500).send('Error generating sitemap');
    return;
  }

  const urls = [
    ...STATIC_PAGES,
    ...toUrlEntries('/portfolio', projects),
    ...toUrlEntries('/blog', posts),
  ];

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map(renderUrl),
      '</urlset>',
      '',
    ].join('\n'),
  );
}
