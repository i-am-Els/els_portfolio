import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import AboutProfile from '@/components/AboutProfile';
import ContactFooter from '@/components/ContactFooter';
import { getEducation, getExperiences, getProfile, getSkillGroups } from '@/lib/content';

export const revalidate = 60;

const SOCIAL_IMAGE = { url: '/seo-image.png', width: 1200, height: 630, alt: 'Eniola Olawale Portfolio' };

const FALLBACK_DESCRIPTION =
  'About Eniola Olawale, a 3D artist and game developer based in Nigeria: experience, skills, tools and education.';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const description = profile?.short_bio?.trim() || FALLBACK_DESCRIPTION;

  return {
    title: 'About',
    description,
    alternates: { canonical: '/about' },
    // A page's openGraph/twitter replace the root layout's, so the image is repeated here.
    openGraph: { title: 'About Eniola Olawale', description, url: '/about', type: 'profile', images: [SOCIAL_IMAGE] },
    twitter: { card: 'summary_large_image', title: 'About Eniola Olawale', description, images: [SOCIAL_IMAGE.url] },
  };
}

export default async function AboutPage() {
  const [profile, experiences, skills, education] = await Promise.all([
    getProfile(),
    getExperiences(),
    getSkillGroups(),
    getEducation(),
  ]);

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />
      <AboutProfile profile={profile} experiences={experiences} skills={skills} education={education} />
      <ContactFooter profile={profile} />
    </main>
  );
}
