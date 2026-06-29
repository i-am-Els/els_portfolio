'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ContactFooter from '@/components/ContactFooter';

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  project_url: string | null;
  github_url: string | null;
  technologies: string[];
  created_at: string;
  project_categories?: {
    category_id: string;
    categories?: { id: string; name: string; slug: string };
  }[];
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => { fetchProject(); }, [params.slug]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, project_categories(category_id, categories(id, name, slug))`)
        .eq('slug', params.slug)
        .eq('published', true)
        .single();
      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="w-6 h-6 border border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <p className="section-label text-white/30">Project not found</p>
    </div>
  );

  const categoryLabel = project.project_categories?.[0]?.categories?.name?.toUpperCase() || 'PROJECT';

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />

      {/* Full-bleed hero image */}
      {project.image_url && (
        <div className="relative w-full" style={{ height: '70vh', minHeight: '400px' }}>
          <Image
            src={getImageUrl(project.image_url)}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 pb-12">
            <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="section-label text-[#c8ff00] block mb-3">{categoryLabel}</span>
              <h1 className="text-5xl md:text-7xl font-black text-white leading-none">{project.title}</h1>
            </motion.div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="mb-16">
          <Link href="/portfolio" className="section-label text-white/30 hover:text-[#c8ff00] transition-colors inline-flex items-center gap-2">
            ← Back to Work
          </Link>
        </motion.div>

        {/* Title block — only shown when no hero image */}
        {!project.image_url && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 pb-12 border-b border-white/10">
            <span className="section-label text-[#c8ff00] block mb-3">{categoryLabel}</span>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none">{project.title}</h1>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-16 border-t border-white/10 pt-12">
          {/* Main: description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-2"
          >
            <span className="section-label text-white/30 block mb-6">Overview</span>
            <div
              className="prose prose-invert prose-sm max-w-none
                text-white/50 leading-relaxed
                [&_h2]:text-white [&_h2]:font-black [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3
                [&_h3]:text-white [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2
                [&_strong]:text-white/80
                [&_a]:text-[#c8ff00] [&_a]:no-underline [&_a:hover]:underline
                [&_ul]:text-white/50 [&_ol]:text-white/50
                [&_li]:mb-1"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-10"
          >
            <div className="border-t border-white/10 pt-6">
              <span className="section-label text-white/30 block mb-3">Date</span>
              <p className="text-white/50 text-sm">
                {new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <span className="section-label text-white/30 block mb-4">Technologies</span>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, i) => (
                  <span key={i} className="tag-pill">{tech}</span>
                ))}
              </div>
            </div>

            {(project.project_url || project.github_url) && (
              <div className="border-t border-white/10 pt-6 space-y-3">
                <span className="section-label text-white/30 block mb-4">Links</span>
                {project.project_url && (
                  <a href={project.project_url} target="_blank" rel="noopener noreferrer"
                    className="btn-acid flex items-center justify-center gap-2 text-xs w-full">
                    View Project Breakdown <svg className="w-3 h-3 text-[#c8ff00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" /></svg>

                  </a>
                )}
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                    className="btn-ghost flex items-center justify-center gap-2 text-xs w-full">
                    View on GitHub <svg className="w-3 h-3 text-[#c8ff00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" /></svg>

                  </a>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <ContactFooter />
    </main>
  );
}