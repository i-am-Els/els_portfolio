/**
 * Server-side reads of the public portfolio content.
 *
 * Pages call these from server components so their HTML ships with the content
 * already in it (crawlers, link-preview bots and readers without JavaScript see
 * the same page as everyone else). Client components receive the results as
 * props and only handle filtering and animation.
 *
 * The client is cookie-free on purpose: reading `cookies()` makes a route
 * dynamic, which would disable the time-based caching (ISR) the public pages
 * rely on. Everything read here is allowed for the anon role by RLS.
 *
 * Error policy: a failed query throws. During a background revalidation Next.js
 * then keeps serving the last good page instead of caching an empty one; during
 * a build it fails the build instead of deploying a site with no projects.
 * A row that simply does not exist is `null`, so pages can return a 404.
 */
import { createClient, type PostgrestError } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface Category extends CategoryRef {
  description: string | null;
  parent_id: string | null;
  order_index: number;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  project_url: string | null;
  github_url: string | null;
  technologies: string[];
  order_index: number;
  created_at: string;
  updated_at: string;
  project_categories?: { category_id: string; categories?: CategoryRef | null }[];
}

export interface ProjectImage {
  id: string;
  image_url: string;
  alt: string | null;
  order_index: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  read_time: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  blog_post_categories?: { category_id: string; categories?: CategoryRef | null }[];
}

export interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  short_bio: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  github_url: string | null;
  artstation_url: string | null;
  linkedin_url: string | null;
  twitter_url?: string | null;
  image_url?: string | null;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
  skills: string[];
  order_index: number;
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
  order_index: number;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  order_index: number;
}

export interface SlugEntry {
  slug: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.');
  }
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/** Unwrap a Supabase result, turning an error into a thrown, labelled one. */
function unwrap<T>(what: string, result: { data: T | null; error: PostgrestError | null }): T | null {
  if (result.error) {
    throw new Error(`Supabase: failed to read ${what}: ${result.error.message}`);
  }
  return result.data;
}

const PROJECT_SELECT = '*, project_categories(category_id, categories(id, name, slug))';
const POST_SELECT = '*, blog_post_categories(category_id, categories(id, name, slug))';

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

/** Newest published projects first (home page). */
export async function getRecentProjects(limit: number): Promise<Project[]> {
  const result = await publicClient()
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return unwrap<Project[]>('recent projects', result) ?? [];
}

/** Every published project in curated order (portfolio index). */
export async function getAllProjects(): Promise<Project[]> {
  const result = await publicClient()
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('published', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });
  return unwrap<Project[]>('projects', result) ?? [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const result = await publicClient()
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return unwrap<Project>(`project "${slug}"`, result);
}

/**
 * Gallery shots for a project.
 *
 * Unlike the other reads this one does not throw: a project page without its
 * gallery is still worth serving, so the failure is logged and the page shows
 * the project without the gallery.
 */
export async function getProjectGallery(projectId: string): Promise<ProjectImage[]> {
  const { data, error } = await publicClient()
    .from('project_images')
    .select('id, image_url, alt, order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });
  if (error) {
    console.error(`Supabase: failed to read gallery for project ${projectId}:`, error.message);
    return [];
  }
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export async function getAllPosts(): Promise<BlogPost[]> {
  const result = await publicClient()
    .from('blog_posts')
    .select(POST_SELECT)
    .eq('published', true)
    .order('created_at', { ascending: false });
  return unwrap<BlogPost[]>('blog posts', result) ?? [];
}

export async function getLatestPost(): Promise<BlogPost | null> {
  const result = await publicClient()
    .from('blog_posts')
    .select(POST_SELECT)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return unwrap<BlogPost>('latest blog post', result);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await publicClient()
    .from('blog_posts')
    .select(POST_SELECT)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return unwrap<BlogPost>(`blog post "${slug}"`, result);
}

// ---------------------------------------------------------------------------
// Categories, profile, About page
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  const result = await publicClient()
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });
  return unwrap<Category[]>('categories', result) ?? [];
}

export async function getProfile(): Promise<Profile | null> {
  const result = await publicClient().from('profile').select('*').limit(1).maybeSingle();
  return unwrap<Profile>('profile', result);
}

export async function getExperiences(): Promise<Experience[]> {
  const result = await publicClient()
    .from('experiences')
    .select('*')
    .order('order_index', { ascending: true });
  return unwrap<Experience[]>('experiences', result) ?? [];
}

export async function getSkillGroups(): Promise<SkillGroup[]> {
  const result = await publicClient()
    .from('skills')
    .select('*')
    .order('order_index', { ascending: true });
  return unwrap<SkillGroup[]>('skills', result) ?? [];
}

export async function getEducation(): Promise<Education[]> {
  const result = await publicClient()
    .from('education')
    .select('*')
    .order('order_index', { ascending: true });
  return unwrap<Education[]>('education', result) ?? [];
}

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------

async function getPublishedSlugs(table: 'projects' | 'blog_posts'): Promise<SlugEntry[]> {
  const result = await publicClient().from(table).select('slug, updated_at').eq('published', true);
  return unwrap<SlugEntry[]>(`${table} slugs`, result) ?? [];
}

/** Published project slugs, for the sitemap and for pre-rendering /portfolio/[slug]. */
export const getProjectSlugs = () => getPublishedSlugs('projects');

/** Published post slugs, for the sitemap and for pre-rendering /blog/[slug]. */
export const getPostSlugs = () => getPublishedSlugs('blog_posts');
