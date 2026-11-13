import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import BlogIndex from '@/components/BlogIndex';
import ContactFooter from '@/components/ContactFooter';
import { getAllPosts, getCategories, getProfile } from '@/lib/content';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Project breakdowns and notes on 3D art, proceduralism and game development by Eniola Olawale.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage() {
  const [posts, categories, profile] = await Promise.all([
    getAllPosts(),
    getCategories(),
    getProfile(),
  ]);

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />
      <BlogIndex posts={posts} categories={categories} />
      <ContactFooter profile={profile} />
    </main>
  );
}
