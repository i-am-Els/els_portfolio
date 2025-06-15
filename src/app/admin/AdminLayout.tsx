'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import type { Database } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
          return;
        }

        setUserEmail(session.user.email || null);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!session) {
            router.push('/admin/login');
          } else {
            setUserEmail(session.user.email || null);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [supabase, router, pathname]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin" className="text-xl font-bold text-gray-900 dark:text-white">
                  Portfolio Admin
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin"
                  className={`flex items-center px-4 py-2 text-sm ${
                    pathname === '/admin'
                      ? 'text-black font-semibold border-b-2 border-black'
                      : 'text-gray-500 hover:text-gray-900 font-medium'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/projects"
                  className={`flex items-center px-4 py-2 text-sm ${
                    pathname.startsWith('/admin/projects')
                      ? 'text-black font-semibold border-b-2 border-black'
                      : 'text-gray-500 hover:text-gray-900 font-medium'
                  }`}
                >
                  Projects
                </Link>
                <Link
                  href="/admin/categories"
                  className={`flex items-center px-4 py-2 text-sm ${
                    pathname.startsWith('/admin/categories')
                      ? 'text-black font-semibold border-b-2 border-black'
                      : 'text-gray-500 hover:text-gray-900 font-medium'
                  }`}
                >
                  Categories
                </Link>
                <Link
                  href="/admin/blog"
                  className={`flex items-center px-4 py-2 text-sm ${
                    pathname.startsWith('/admin/blog')
                      ? 'text-black font-semibold border-b-2 border-black'
                      : 'text-gray-500 hover:text-gray-900 font-medium'
                  }`}
                >
                  Blog
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Link
                  href="/admin/profile"
                  className="flex items-center hover:opacity-80 transition-opacity group relative"
                >
                  <UserCircleIcon className="h-7 w-7 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {userEmail}
                  </span>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Profile Settings
                  </div>
                </Link>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200 ml-4"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {children}
      </motion.main>
    </div>
  );
} 