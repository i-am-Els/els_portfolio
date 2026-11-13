'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { formatDate } from '@/utils/formatDate';
import type { BlogPost, Category } from '@/lib/content';

const ITEMS_PER_PAGE = 6;

/** Filterable, paginated post grid for /blog. Data is fetched by the page on the server. */
export default function BlogIndex({ posts, categories }: { posts: BlogPost[]; categories: Category[] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const getImageUrl = (path: string) => resolveMediaUrl(path);

  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.blog_post_categories?.some(bpc => bpc.categories?.slug === activeCategory));

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  return (
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
          className={`tag-pill transition-colors ${activeCategory === 'all' ? 'tag-pill-active' : 'hover:border-white/50 hover:text-white'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.slug)}
            className={`tag-pill transition-colors ${activeCategory === cat.slug ? 'tag-pill-active' : 'hover:border-white/50 hover:text-white'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Posts grid — 2 columns, no gaps */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeCategory + currentPage}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2"
        >
          {paginatedPosts.length > 0 ? (
            paginatedPosts.map((post, index) => (
              <div key={post.id} className="bg-[#0d0d0d] group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative h-72 overflow-hidden">
                    {post.image_url ? (
                      <Image src={getImageUrl(post.image_url)} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 bg-[#141414]" />
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="section-label text-white/30">
                        {formatDate(post.created_at, 'short')}
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
              </div>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center h-64">
              <p className="text-white/30 text-sm tracking-widest uppercase">Coming Soon</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className={`tag-pill transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/50 hover:text-white'}`}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`tag-pill transition-colors ${currentPage === page ? 'tag-pill-active' : 'hover:border-white/50 hover:text-white'}`}>{page}</button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className={`tag-pill transition-colors ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/50 hover:text-white'}`}>Next →</button>
        </div>
      )}
    </div>
  );
}