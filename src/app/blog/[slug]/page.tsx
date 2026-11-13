import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import BlogPostArticle from '@/components/BlogPostArticle';
import ContactFooter from '@/components/ContactFooter';
import { getPostBySlug, getPostSlugs, getProfile } from '@/lib/content';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { plainText } from '@/utils/plainText';

// Published posts are pre-rendered at build; one published later is rendered
// on its first request. Both are then re-rendered at most once a minute.
export const revalidate = 60;

type Params = { params: { slug: string } };

export async function generateStaticParams() {
  const posts = await getPostSlugs();
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return { title: 'Blog Post Not Found', description: 'The requested blog post could not be found.' };
  }

  const description = post.excerpt?.trim() || plainText(post.content);
  const image = post.image_url ? resolveMediaUrl(post.image_url) : null;

  return {
    // The root layout's template appends " | Eniola Olawale".
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: ['Eniola Olawale'],
      tags: post.tags,
      images: image ? [{ url: image, width: 1200, height: 630, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const [post, profile] = await Promise.all([getPostBySlug(params.slug), getProfile()]);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />
      <BlogPostArticle post={post} />
      <ContactFooter profile={profile} />
    </main>
  );
}
