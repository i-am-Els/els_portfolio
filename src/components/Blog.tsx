"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeUp, lineGrow } from '@/lib/motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

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

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
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

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.blog_post_categories?.some(bpc => bpc.categories?.slug === activeCategory));

  return (
    <section id="blog" className="bg-[#0d0d0d] py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section label */}
        <div className="flex items-center justify-between pb-4 mb-16 relative">
          <span className="section-label text-[#c8ff00]"> Writing</span>
          <Link href="/blog" className="section-label text-white/30 hover:text-white transition-colors">View All →</Link>
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

        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="w-6 h-6 border border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <AnimatePresence>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    variants={fadeUp}
                    exit={{ opacity: 0 }}
                    className="bg-[#0d0d0d] group"
                  >
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="relative h-52 overflow-hidden">
                        {post.image_url ? (
                          <Image
                            src={getImageUrl(post.image_url)}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
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
                        <p className="text-white/40 text-sm leading-relaxed mb-4">
                          {post.excerpt}
                        </p>
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
          </motion.div>
        )}
      </div>
    </section>
  );
}