'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import type { Database } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

const navLinks = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/projects', label: 'Projects', exact: false },
  { href: '/admin/blog', label: 'Blog', exact: false },
  { href: '/admin/categories', label: 'Categories', exact: false },
  { href: '/admin/profile', label: 'Profile', exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const rawPathname = usePathname();
  const pathname = rawPathname ?? '';
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (pathname !== '/admin/login') router.push('/admin/login');
          return;
        }
        setUserEmail(session.user.email || null);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!session) router.push('/admin/login');
          else setUserEmail(session.user.email || null);
        });
        return () => subscription.unsubscribe();
      } catch {
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

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Wordmark */}
          <Link href="/admin" className="text-white font-black text-xs tracking-widest uppercase">
            ENIOLA.O <span className="text-[#c8ff00]">/ ADMIN</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-xs font-semibold tracking-widest uppercase transition-colors duration-200 ${
                  isActive(link.href, link.exact)
                    ? 'text-[#c8ff00] border-b border-[#c8ff00]'
                    : 'text-white/40 hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-xs text-white/30" style={{ fontFamily: 'var(--font-mono)' }}>
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold tracking-widest uppercase px-3 py-1.5 border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
              style={{ fontFamily: 'var(--font-mono), monospace' }}
            >
              Sign Out
            </button>
            {/* Mobile toggle */}
            <button
              className="md:hidden text-white/50 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 px-6 py-4 space-y-3 bg-[#0d0d0d]">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block text-xs font-semibold tracking-widest uppercase transition-colors ${
                  isActive(link.href, link.exact) ? 'text-[#c8ff00]' : 'text-white/40 hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-mono), monospace' }}
              >
                {link.label}
              </Link>
            ))}
            <p className="text-xs text-white/20 pt-2 border-t border-white/5" style={{ fontFamily: 'var(--font-mono)' }}>
              {userEmail}
            </p>
          </div>
        )}
      </nav>

      {/* View public site link */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-3 py-2 border border-white/10 text-white/30 hover:border-[#c8ff00] hover:text-[#c8ff00] transition-colors bg-[#0d0d0d]"
          style={{ fontFamily: 'var(--font-mono), monospace' }}
        >
          View Site
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
          </svg>
        </Link>
      </div>

      {/* Page content */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-6 pt-24 pb-16"
      >
        {children}
      </motion.main>
    </div>
  );
}