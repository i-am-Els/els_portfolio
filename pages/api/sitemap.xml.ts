import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://eniola-olawale-portfolio.vercel.app';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getAllBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('published', true);

  if (error) return [];
  return data || [];
}

async function getAllPortfolioProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('slug')
    .eq('published', true);

  if (error) return [];
  return data || [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const blogPosts = await getAllBlogPosts();
    const portfolioProjects = await getAllPortfolioProjects();

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/blog</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/portfolio</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <priority>0.8</priority>
  </url>
  ${blogPosts.map(post => `
  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <priority>0.7</priority>
  </url>
  `).join('')}
  ${portfolioProjects.map(project => `
  <url>
    <loc>${BASE_URL}/portfolio/${project.slug}</loc>
    <priority>0.7</priority>
  </url>
  `).join('')}
</urlset>
`);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
}

