'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (!session) {
          if (pathname !== '/admin/login') {
            router.push('/admin/login');
          }
          setIsAuthenticated(false);
          setUserEmail(null);
        } else {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || null);
          
          if (pathname === '/admin/login') {
            router.push('/admin/projects');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (pathname !== '/admin/login' && mounted) {
          router.push('/admin/login');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        setUserEmail(session?.user?.email || null);
        if (pathname === '/admin/login') {
          router.push('/admin/projects');
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserEmail(null);
        router.push('/admin/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Always show the navigation bar during loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-bold text-gray-900">
                    Portfolio Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  // Don't render the admin layout on the login page
  if (pathname === '/admin/login') {
    return children;
  }

  // If not authenticated and not on login page, show loading state with navigation
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-bold text-gray-900">
                    Portfolio Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/admin/projects" className="text-2xl font-bold text-gray-900">
                  Portfolio Admin
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/admin/projects"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === '/admin/projects'
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Projects
                </Link>
                <Link
                  href="/admin/blog"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === '/admin/blog'
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Blog Posts
                </Link>
                <Link
                  href="/admin/categories"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    pathname === '/admin/categories'
                      ? 'text-black border-b-2 border-black'
                      : 'text-gray-500 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Categories
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userEmail && (
                <div className="flex items-center space-x-2">
                  <svg 
                    className="h-5 w-5 text-gray-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="text-sm text-gray-500">
                    {userEmail}
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
} 