"use client";

import { motion, AnimatePresence } from 'framer-motion';
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
    categories?: {
      id: string;
      slug: string;
    };
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
        .select(`
          *,
          blog_post_categories (
            category_id,
            categories (
              id,
              slug
            )
          )
        `)
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
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    // If the path is already an absolute URL, return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Otherwise, construct the absolute URL
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
  };

  const filteredPosts = activeCategory === 'all' 
    ? posts 
    : posts.filter(post => 
        post.blog_post_categories?.some(bpc => 
          bpc.categories?.slug === activeCategory
        )
      );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <section id="blog" className="py-16 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/blog-bg.jpg')" }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Latest Blog Posts</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Insights and tutorials on game development and technical art
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.slug
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <AnimatePresence>
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-[#f5f3f0]/95 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative h-64 overflow-hidden">
                      {post.image_url && (
                        <Image
                          src={getImageUrl(post.image_url)}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-500">{post.read_time} min read</span>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors duration-300">
                        {post.title}
                      </h3>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20 hover:bg-primary/20 transition-colors duration-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center min-h-[400px]">
                <p className="text-xl text-gray-600">Coming Soon</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* View All Button */}
        {filteredPosts.length > 0 && (
          <div className="text-center">
            <a
              href="/blog"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              View All Posts
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
} 