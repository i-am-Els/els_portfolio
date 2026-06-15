"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

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

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`*, project_categories(category_id, categories(id, slug))`)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(6);
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
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.project_categories?.some(pc => pc.categories?.slug === activeCategory));

  return (
    <section id="portfolio" className="bg-[#0d0d0d]">
      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* Section label */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <span className="section-label text-[#c8ff00]">01 / Selected Work</span>
          <span className="section-label text-white/30">{filteredProjects.length} Projects</span>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-3 mb-12">
          <button
            onClick={() => setActiveCategory('all')}
            className={`tag-pill transition-colors ${activeCategory === 'all' ? 'border-[#c8ff00] text-[#c8ff00]' : 'hover:border-white/50 hover:text-white'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`tag-pill transition-colors ${activeCategory === cat.slug ? 'border-[#c8ff00] text-[#c8ff00]' : 'hover:border-white/50 hover:text-white'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Projects — full-bleed image cards */}
        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="w-6 h-6 border border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project, index) => {
                  const categoryLabel = project.project_categories?.[0]?.categories?.slug?.replace(/-/g, ' ').toUpperCase() || 'PROJECT';
                  return (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Link href={`/portfolio/${project.slug}`} className="group block relative overflow-hidden" style={{ height: '420px' }}>
                        {/* Background image */}
                        {project.image_url ? (
                          <Image
                            src={project.image_url}
                            alt={project.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[#141414]" />
                        )}
                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

                        {/* Arrow icon top right */}
                        <div className="absolute top-4 right-4 w-9 h-9 border border-[#c8ff00] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[#c8ff00] text-sm">↗</span>
                        </div>

                        {/* Content bottom left */}
                        <div className="absolute bottom-0 left-0 p-8">
                          <span className="section-label text-[#c8ff00] block mb-2">{categoryLabel}</span>
                          <h3 className="text-3xl font-black text-white mb-3">{project.title}</h3>
                          <p className="text-white/50 text-sm max-w-lg mb-4 hidden group-hover:block">
                            {project.description.slice(0, 120)}{project.description.length > 120 ? '...' : ''}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, i) => (
                              <span key={i} className="tag-pill">{tech}</span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-64 border border-white/10">
                  <p className="text-white/30 text-sm tracking-widest uppercase">Coming Soon</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* View all */}
        {filteredProjects.length > 0 && (
          <div className="mt-12">
            <Link href="/portfolio" className="btn-ghost inline-flex items-center gap-3 text-xs">
              View All Projects
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}