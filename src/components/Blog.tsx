"use client";

import { motion } from 'framer-motion';
import { fadeUp, lineGrow } from '@/lib/motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

const MotionLink = motion.create(Link);

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

export default function Blog() {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => { fetchLatestPost(); }, []);

  const fetchLatestPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`*, blog_post_categories(category_id, categories(id, slug))`)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching latest post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  return (
    <section id="blog" className="bg-[#0d0d0d] py-32">
      <div className="max-w-7xl mx-auto px-6">

        {/* Section label — same pattern as Portfolio */}
        <div className="flex items-center justify-between pb-4 mb-16 relative">
          <span className="section-label text-[#c8ff00]">Latest Writing</span>
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px bg-white/10"
            variants={lineGrow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <div className="w-6 h-6 border border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : post ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {/* Single latest post — full-width card like hero project card */}
            <Link
              href={`/blog/${post.slug}`}
              className="group block relative overflow-hidden"
              style={{ height: '560px' }}
            >
              {post.image_url ? (
                <Image
                  src={getImageUrl(post.image_url)}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-[#141414]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/5" />

              {/* Arrow */}
              <div className="absolute top-6 right-6 w-9 h-9 border border-[#c8ff00] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-[#c8ff00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" /></svg>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 p-10">
                <div className="flex items-center gap-4 mb-3">
                  <span className="section-label text-[#c8ff00]">
                    {post.blog_post_categories?.[0]?.categories?.slug?.replace(/-/g, ' ').toUpperCase() || 'ARTICLE'}
                  </span>
                  <span className="section-label text-white/30">
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="section-label text-white/30">{post.read_time} min read</span>
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 max-w-3xl">
                  {post.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed max-w-xl mb-5 hidden group-hover:block">
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
        ) : (
          <div className="flex items-center justify-center h-64 border border-white/10">
            <p className="text-white/30 text-sm tracking-widest uppercase">Coming Soon</p>
          </div>
        )}

        {/* View More Blogs — identical style to View All Projects */}
        {post && (
          <div className="mt-12">
            <MotionLink
              href="/blog"
              className="inline-flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-white border border-white/30 px-5 py-3"
              whileHover={{ backgroundColor: '#c8ff00', color: '#0d0d0d', borderColor: '#c8ff00' }}
              transition={{ duration: 0.25 }}
            >
              View More Blogs
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