'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ContactFooter from '@/components/ContactFooter';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  order_index: number;
  project_categories?: {
    category_id: string;
    categories?: { id: string; slug: string };
  }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  order_index: number;
}

const ITEMS_PER_PAGE = 6;

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('order_index', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredProjects = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.project_categories?.some(pc => pc.categories?.slug === activeCategory));

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-white/40 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-12">
          <span className="section-label text-[#c8ff00]"> Selected Work</span>
          <span className="section-label text-white/30">{filteredProjects.length} Projects</span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-12">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`tag-pill transition-colors ${activeCategory === 'all' ? 'border-[#c8ff00] text-[#c8ff00]' : 'hover:border-white/50 hover:text-white'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`tag-pill transition-colors ${activeCategory === cat.slug ? 'border-[#c8ff00] text-[#c8ff00]' : 'hover:border-white/50 hover:text-white'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid — 2 col with full-bleed images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
          <AnimatePresence>
            {paginatedProjects.length > 0 ? (
              paginatedProjects.map((project, index) => {
                const categoryLabel = project.project_categories?.[0]?.categories?.slug?.replace(/-/g, ' ').toUpperCase() || 'PROJECT';
                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="bg-[#0d0d0d]"
                  >
                    <Link href={`/portfolio/${project.slug}`} className="group block relative overflow-hidden" style={{ height: '380px' }}>
                      {project.image_url ? (
                        <Image src={project.image_url} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-[#141414]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                      <div className="absolute top-4 right-4 w-9 h-9 border border-[#c8ff00] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-[#c8ff00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" /></svg>
                      </div>

                      <div className="absolute bottom-0 left-0 p-6">
                        <span className="section-label text-[#c8ff00] block mb-1">{categoryLabel}</span>
                        <h3 className="text-2xl font-black text-white mb-3">{project.title}</h3>
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
              <div className="col-span-full flex items-center justify-center h-64">
                <p className="text-white/30 text-sm tracking-widest uppercase">Coming Soon</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`tag-pill transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/50 hover:text-white'}`}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`tag-pill transition-colors ${currentPage === page ? 'border-[#c8ff00] text-[#c8ff00]' : 'hover:border-white/50 hover:text-white'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`tag-pill transition-colors ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/50 hover:text-white'}`}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <ContactFooter />
    </main>
  );
}