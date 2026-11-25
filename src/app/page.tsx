import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import Blog from '@/components/Blog';
import ContactFooter from '@/components/ContactFooter';
import { getCategories, getLatestPost, getProfile, getRecentProjects } from '@/lib/content';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL, SOCIAL_IMAGE } from '@/lib/site';

// Re-render in the background at most once a minute, so new content from the
// admin shows up without a redeploy.
export const revalidate = 60;

const HOME_PROJECT_COUNT = 7;

/** The description comes from Admin → Profile → "Home page preview description". */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const description = profile?.meta_description?.trim() || SITE_DESCRIPTION;

  return {
    description,
    alternates: { canonical: '/' },
    // A page's openGraph/twitter replace the root layout's, so every field is repeated here.
    openGraph: {
      title: SITE_TITLE,
      description,
      url: SITE_URL,
      siteName: 'Eniola Olawale',
      images: [SOCIAL_IMAGE],
      locale: 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: SITE_TITLE, description, images: [SOCIAL_IMAGE.url] },
  };
}

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
