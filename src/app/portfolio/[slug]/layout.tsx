import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { resolveMediaUrl } from '@/utils/mediaUrl';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies });

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single();

  if (!project) {
    return {
      title: 'Project Not Found',
      description: 'The requested project could not be found.',
    };
  }

  return {
    title: `${project.title} | Eniola Olawale's Portfolio`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: 'article',
      publishedTime: project.created_at,
      images: project.image_url ? [
        {
          url: resolveMediaUrl(project.image_url),
          width: 1200,
          height: 630,
          alt: project.title,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description,
      images: project.image_url ? [resolveMediaUrl(project.image_url)] : undefined,
    },
  };
}

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
