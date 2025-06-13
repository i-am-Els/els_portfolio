'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getRecentProjects, getRecentBlogPosts } from '@/data/home-content';
import Navigation from '@/components/Navigation';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import Blog from '@/components/Blog';
import ContactFooter from '@/components/ContactFooter';

interface Project {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  project_url: string | null;
  github_url: string | null;
  technologies: string[];
  created_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export default function Home() {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentBlogPosts, setRecentBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projects, posts] = await Promise.all([
          getRecentProjects(),
          getRecentBlogPosts()
        ]);
        setRecentProjects(projects);
        setRecentBlogPosts(posts);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f3f0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <img
              src="/hero-bg.jpg"
              alt="Hero Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
          </div>
        </div>
        <div className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-gray-900"
          >
            Technical Artist & Game Developer
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8"
          >
            Creating immersive experiences through technical art and game development
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center gap-4"
          >
            <a
              href="#portfolio"
              className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
            >
              View Projects
            </a>
            <a
              href="#blog"
              className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-300"
            >
              Read Blog
            </a>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <About />

      {/* Portfolio Section */}
      <Portfolio />

      {/* Blog Section */}
      <Blog />

      {/* Contact Footer */}
      <ContactFooter />
    </main>
  );
}
