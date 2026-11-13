import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ProjectDetail from '@/components/ProjectDetail';
import ContactFooter from '@/components/ContactFooter';
import type { GalleryImage } from '@/components/ProjectGallery';
import { getProfile, getProjectBySlug, getProjectGallery, getProjectSlugs } from '@/lib/content';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { plainText } from '@/utils/plainText';

// Published projects are pre-rendered at build; one published later is
// rendered on its first request. Both are then re-rendered at most once a minute.
export const revalidate = 60;

type Params = { params: { slug: string } };

export async function generateStaticParams() {
  const projects = await getProjectSlugs();
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) {
    return { title: 'Project Not Found', description: 'The requested project could not be found.' };
  }

  const description = plainText(project.description);
  const image = project.image_url ? resolveMediaUrl(project.image_url) : null;

  return {
    // The root layout's template appends " | Eniola Olawale".
    title: project.title,
    description,
    alternates: { canonical: `/portfolio/${project.slug}` },
    openGraph: {
      title: project.title,
      description,
      type: 'article',
      url: `/portfolio/${project.slug}`,
      publishedTime: project.created_at,
      modifiedTime: project.updated_at,
      images: image ? [{ url: image, width: 1200, height: 630, alt: project.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: Params) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const [rows, profile] = await Promise.all([getProjectGallery(project.id), getProfile()]);
  const gallery: GalleryImage[] = rows.flatMap((row) => {
    const url = resolveMediaUrl(row.image_url);
    return url ? [{ id: row.id, url, alt: row.alt }] : [];
  });

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />
      <ProjectDetail project={project} gallery={gallery} />
      <ContactFooter profile={profile} />
    </main>
  );
}
