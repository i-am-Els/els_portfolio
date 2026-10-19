'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ContactFooter from '@/components/ContactFooter';
import ProjectGallery, { type GalleryImage } from '@/components/ProjectGallery';
import { resolveHtmlImages, resolveMediaUrl } from '@/utils/mediaUrl';

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
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // The About widget ships collapsed: the gallery is the page, the write-up is
  // one click away.
  const [showAbout, setShowAbout] = useState(false);
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
      await fetchGallery(data.id);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * A failed gallery read must not take the whole project page down — a project
   * with no gallery images is still worth showing, and the table only exists
   * once the project_images migration has been applied.
   */
  const fetchGallery = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_images')
      .select('id, image_url, alt, order_index')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching project gallery:', error);
      return;
    }

    setGallery(
      (data || []).flatMap((row) => {
        const url = resolveMediaUrl(row.image_url);
        return url ? [{ id: row.id, url, alt: row.alt }] : [];
      })
    );
  };

  const getImageUrl = (path: string) => resolveMediaUrl(path);

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

  /** A project without gallery images just ends after the meta strip. */
  const hasGallery = gallery.length > 0;

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
            <div className="max-w-[1500px] mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="section-label text-[#c8ff00] block mb-3">{categoryLabel}</span>
              <h1 className="text-5xl md:text-7xl font-black text-white leading-none">{project.title}</h1>
            </motion.div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1500px] mx-auto px-6 pt-12 pb-24">
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

        {/*
          About ships as a collapsed preview: the first few lines with a fade
          and an overlaid Read-more pill. Expanding animates the same container
          to its natural height, so the write-up never pushes the gallery out
          of the way until the reader asks for it.
        */}
        {project.description && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-t border-white/10 pt-12"
          >
            <span className="section-label text-white/30 block mb-6">About</span>

            <div className="relative">
              <motion.div
                initial={false}
                animate={{ height: showAbout ? 'auto' : '7rem' }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div
                  className="prose prose-invert prose-sm max-w-none
                    text-white/50 leading-relaxed
                    [&_h2]:text-white [&_h2]:font-black [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3
                    [&_h3]:text-white [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2
                    [&_strong]:text-white/80
                    [&_a]:text-[#c8ff00] [&_a]:no-underline [&_a:hover]:underline
                    [&_ul]:text-white/50 [&_ol]:text-white/50
                    [&_li]:mb-1
                    [&_img]:rounded-lg [&_img]:my-6"
                  dangerouslySetInnerHTML={{ __html: resolveHtmlImages(project.description) }}
                />
              </motion.div>

              {!showAbout && (
                <>
                  {/* Fade so the clipped text reads as a preview, not a bug */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/85 to-transparent" />
                  {/* The overlaid expand button */}
                  <button
                    type="button"
                    onClick={() => setShowAbout(true)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-[#c8ff00]/40 bg-[#0d0d0d]/85 px-5 py-2 text-[11px] tracking-[0.25em] text-[#c8ff00] backdrop-blur-sm transition-colors hover:bg-[#c8ff00] hover:text-[#0d0d0d]"
                  >
                    READ MORE
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {showAbout && (
              <button
                type="button"
                onClick={() => setShowAbout(false)}
                className="mt-6 inline-flex items-center gap-2 text-[11px] tracking-[0.25em] text-white/40 transition-colors hover:text-[#c8ff00]"
              >
                SHOW LESS
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
          </motion.section>
        )}

        {/* Meta strip — date, stack and links in one compact row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 flex flex-col gap-8 border-t border-white/10 pt-8 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <span className="section-label text-white/30 block mb-3">Date</span>
            <p className="text-white/50 text-sm">
              {new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="sm:flex-1 sm:px-10">
            <span className="section-label text-white/30 block mb-4">Technologies</span>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, i) => (
                <span key={i} className="tag-pill">{tech}</span>
              ))}
            </div>
          </div>

          {(project.project_url || project.github_url) && (
            <div className="space-y-3 sm:min-w-[220px]">
              <span className="section-label text-white/30 block mb-4">Links</span>
              {project.project_url && (
                <a href={project.project_url} target="_blank" rel="noopener noreferrer"
                  className="btn-acid flex items-center justify-center gap-2 text-xs w-full">
                  View Project Breakdown <svg className="w-3 h-3 text-[#1a1a1a]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" /></svg>
                </a>
              )}
              {project.github_url && (
                <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                  className="btn-ghost flex items-center justify-center gap-2 text-xs w-full">
                  View on GitHub <svg className="w-3 h-3 text-[#1a1a1a]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" /></svg>
                </a>
              )}
            </div>
          )}
        </motion.section>

        {/* Gallery — full-width stacked shots, one per row, uncropped */}
        {hasGallery && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-16"
          >
            <ProjectGallery images={gallery} />
          </motion.section>
        )}
      </div>

      <ContactFooter />
    </main>
  );
}