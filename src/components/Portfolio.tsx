"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer, lineGrow } from '@/lib/motion';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

const MotionLink = motion.create(Link);

interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  project_url: string | null;
  github_url: string | null;
  technologies: string[];
  created_at: string;
  project_categories?: {
    category_id: string;
    categories?: { id: string; slug: string; name?: string };
  }[];
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number;
}

// Hero card: full width, tall
function HeroCard({ project }: { project: Project }) {
  const label = project.project_categories?.[0]?.categories?.slug?.replace(/-/g, ' ').toUpperCase() || 'PROJECT';
  return (
    <motion.div variants={fadeUp} layout>
      <Link
        href={`/portfolio/${project.slug}`}
        className="group block relative overflow-hidden w-full"
        style={{ height: '600px' }}
      >
        {project.image_url ? (
          <Image src={project.image_url} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-[#141414]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/5" />
        <div className="absolute top-6 right-6 w-9 h-9 border border-[#c8ff00] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-[#c8ff00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" /></svg>
        </div>
        <div className="absolute bottom-0 left-0 p-10">
          <span className="section-label text-[#c8ff00] block mb-2">{label}</span>
          <h3 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">{project.title}</h3>
          <p className="text-white/50 text-sm max-w-xl mb-5 hidden group-hover:block">
            {project.description.slice(0, 140)}{project.description.length > 140 ? '...' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech, i) => <span key={i} className="tag-pill">{tech}</span>)}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Grid card: half-width, shorter
function GridCard({ project }: { project: Project }) {
  const label = project.project_categories?.[0]?.categories?.slug?.replace(/-/g, ' ').toUpperCase() || 'PROJECT';
  return (
    <motion.div variants={fadeUp} layout>
      <Link
        href={`/portfolio/${project.slug}`}
        className="group block relative overflow-hidden"
        style={{ height: '380px' }}
      >
        {project.image_url ? (
          <Image src={project.image_url} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-[#141414]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/5" />
        <div className="absolute top-4 right-4 w-8 h-8 border border-[#c8ff00] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-3 h-3 text-[#c8ff00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" /></svg>
        </div>
        <div className="absolute bottom-0 left-0 p-7">
          <span className="section-label text-[#c8ff00] block mb-1">{label}</span>
          <h3 className="text-2xl font-black text-white mb-2">{project.title}</h3>
          <p className="text-white/50 text-xs max-w-xs mb-3 hidden group-hover:block">
            {project.description.slice(0, 90)}{project.description.length > 90 ? '...' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech, i) => <span key={i} className="tag-pill">{tech}</span>)}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => { fetchProjects(); fetchCategories(); }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, project_categories(category_id, categories(id, slug))`)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(7);
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('order_index', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.project_categories?.some(pc => pc.categories?.slug === activeCategory));

  const heroProject = filteredProjects[0];
  const gridProjects = filteredProjects.slice(1);

  // Pair grid projects into rows of 2
  const gridRows: Project[][] = [];
  for (let i = 0; i < gridProjects.length; i += 2) {
    gridRows.push(gridProjects.slice(i, i + 2));
  }

  return (
    <section id="portfolio" className="bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-6 py-32">

        {/* Section header */}
        <div className="flex items-center justify-between pb-4 mb-16 relative">
          <span className="section-label text-[#c8ff00]">Selected Work</span>
          <span className="section-label text-white/30">{filteredProjects.length} Projects</span>
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px bg-white/10"
            variants={lineGrow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-3 mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className={`tag-pill transition-colors ${activeCategory === 'all' ? 'tag-pill-active' : 'hover:border-white/50 hover:text-white'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`tag-pill transition-colors ${activeCategory === cat.slug ? 'tag-pill-active' : 'hover:border-white/50 hover:text-white'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="w-6 h-6 border border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="space-y-0"
          >
            <AnimatePresence>
              {filteredProjects.length > 0 ? (
                <>
                  {/* Hero card — full width */}
                  {heroProject && <HeroCard project={heroProject} />}

                  {/* Remaining — 2-column rows, each card taller */}
                  {gridRows.map((row, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-2 gap-0">
                      {row.map(project => (
                        <GridCard key={project.id} project={project} />
                      ))}
                      {/* Filler if odd number in row */}
                      {row.length === 1 && <div className="bg-[#0d0d0d]" />}
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex items-center justify-center h-64 border border-white/10">
                  <p className="text-white/30 text-sm tracking-widest uppercase">Coming Soon</p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* View All Projects */}
        {filteredProjects.length > 0 && (
          <div className="mt-12">
            <MotionLink
              href="/portfolio"
              className="inline-flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-white border border-white/30 px-5 py-3"
              whileHover={{ backgroundColor: '#c8ff00', color: '#0d0d0d', borderColor: '#c8ff00' }}
              transition={{ duration: 0.25 }}
            >
              View All Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </MotionLink>
          </div>
        )}
      </div>
    </section>
  );
}