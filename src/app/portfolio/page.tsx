import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import PortfolioIndex from '@/components/PortfolioIndex';
import ContactFooter from '@/components/ContactFooter';
import { getAllProjects, getCategories, getProfile } from '@/lib/content';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Work',
  description: '3D art, game development and technical art projects by Eniola Olawale.',
  alternates: { canonical: '/portfolio' },
};

export default async function PortfolioPage() {
  const [projects, categories, profile] = await Promise.all([
    getAllProjects(),
    getCategories(),
    getProfile(),
  ]);

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />
      <PortfolioIndex projects={projects} categories={categories} />
      <ContactFooter profile={profile} />
    </main>
  );
}
