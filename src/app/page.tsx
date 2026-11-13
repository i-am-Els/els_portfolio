import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import Blog from '@/components/Blog';
import ContactFooter from '@/components/ContactFooter';
import { getCategories, getLatestPost, getProfile, getRecentProjects } from '@/lib/content';

// Re-render in the background at most once a minute, so new content from the
// admin shows up without a redeploy.
export const revalidate = 60;

const HOME_PROJECT_COUNT = 7;

export default async function Home() {
  const [projects, categories, latestPost, profile] = await Promise.all([
    getRecentProjects(HOME_PROJECT_COUNT),
    getCategories(),
    getLatestPost(),
    getProfile(),
  ]);

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />
      <Hero />
      <Portfolio projects={projects} categories={categories} />
      <About />
      <Blog post={latestPost} />
      <ContactFooter profile={profile} />
    </main>
  );
}
