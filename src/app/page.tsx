'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import Blog from '@/components/Blog';
import ContactFooter from '@/components/ContactFooter';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Portfolio />
      <Blog />
      <ContactFooter />
    </main>
  );
}
