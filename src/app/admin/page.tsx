'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProjects: number;
  totalBlogPosts: number;
  totalCategories: number;
  recentProjects: any[];
  recentBlogPosts: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalBlogPosts: 0,
    totalCategories: 0,
    recentProjects: [],
    recentBlogPosts: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching dashboard stats...');
        
        // Fetch total counts
        const { count: projectsCount, error: projectsError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });
        
        console.log('Projects count:', projectsCount, 'Error:', projectsError);

        const { count: blogCount, error: blogError } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true });
        
        console.log('Blog count:', blogCount, 'Error:', blogError);

        const { count: categoriesCount, error: categoriesError } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });
        
        console.log('Categories count:', categoriesCount, 'Error:', categoriesError);

        // Fetch recent items with more detailed logging
        const { data: recentProjects, error: recentProjectsError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        console.log('Recent projects query result:', {
          data: recentProjects,
          error: recentProjectsError,
          query: 'SELECT * FROM projects ORDER BY created_at DESC LIMIT 5'
        });

        const { data: recentBlogPosts, error: recentBlogPostsError } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        console.log('Recent blog posts query result:', {
          data: recentBlogPosts,
          error: recentBlogPostsError,
          query: 'SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT 5'
        });

        setStats({
          totalProjects: projectsCount || 0,
          totalBlogPosts: blogCount || 0,
          totalCategories: categoriesCount || 0,
          recentProjects: recentProjects || [],
          recentBlogPosts: recentBlogPosts || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-medium text-gray-900">Total Projects</h3>
          <p className="mt-2 text-3xl font-bold text-black">{stats.totalProjects}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-medium text-gray-900">Total Blog Posts</h3>
          <p className="mt-2 text-3xl font-bold text-black">{stats.totalBlogPosts}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-medium text-gray-900">Categories</h3>
          <p className="mt-2 text-3xl font-bold text-black">{stats.totalCategories}</p>
        </motion.div>
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
            <Link
              href="/admin/projects/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Project
            </Link>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {stats.recentProjects.map((project) => (
                <li key={project.id}>
                  <div className="px-4 py-4 flex items-center sm:px-6">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <div className="flex text-sm">
                          <p className="font-medium text-gray-900 truncate">{project.title}</p>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <p>
                              Created {new Date(project.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <Link
                        href={`/admin/projects/${project.id}/edit`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Blog Posts</h2>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Blog Post
            </Link>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {stats.recentBlogPosts.map((post) => (
                <li key={post.id}>
                  <div className="px-4 py-4 flex items-center sm:px-6">
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <div className="flex text-sm">
                          <p className="font-medium text-gray-900 truncate">{post.title}</p>
                        </div>
                        <div className="mt-2 flex">
                          <div className="flex items-center text-sm text-gray-500">
                            <p>
                              Created {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 