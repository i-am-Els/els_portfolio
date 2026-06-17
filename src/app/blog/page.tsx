'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ContactFooter from '@/components/ContactFooter';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const ITEMS_PER_PAGE = 6;

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  published: boolean;
  read_time: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  blog_post_categories?: {
    category_id: string;
    categories?: { id: string; slug: string };
  }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  order_index: number;
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`*, blog_post_categories(category_id, categories(id, slug))`)
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
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

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.blog_post_categories?.some(bpc => bpc.categories?.slug === activeCategory));

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
          <span className="section-label text-[#c8ff00]"> Writing</span>
          <span className="section-label text-white/30">{filteredPosts.length} Posts</span>
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

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
          <AnimatePresence>
            {paginatedPosts.length > 0 ? (
              paginatedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="bg-[#0d0d0d] group"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative h-52 overflow-hidden">
                      {post.image_url ? (
                        <Image src={getImageUrl(post.image_url)} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-[#141414]" />
                      )}
                    </div>
                    <div className="p-6 border-t border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="section-label text-white/30">
                          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="section-label text-white/30">{post.read_time} min</span>
                      </div>
                      <h3 className="text-lg font-black text-white mb-2 group-hover:text-[#c8ff00] transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-white/40 text-sm leading-relaxed mb-4">{post.excerpt}</p>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <span key={tag} className="tag-pill">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
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
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className={`tag-pill transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/50 hover:text-white'}`}>← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`tag-pill transition-colors ${currentPage === page ? 'border-[#c8ff00] text-[#c8ff00]' : 'hover:border-white/50 hover:text-white'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className={`tag-pill transition-colors ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/50 hover:text-white'}`}>Next →</button>
          </div>
        )}
      </div>

      <ContactFooter />
    </main>
  );
}