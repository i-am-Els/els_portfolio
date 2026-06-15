'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import About from '@/components/About';
import Portfolio from '@/components/Portfolio';
import Blog from '@/components/Blog';
import ContactFooter from '@/components/ContactFooter';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle dots effect matching Figma design
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const dots: { x: number; y: number; opacity: number; size: number }[] = [];
    for (let i = 0; i < 60; i++) {
      dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        opacity: Math.random() * 0.4 + 0.1,
        size: Math.random() * 2 + 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 255, 0, ${d.opacity})`;
        ctx.fill();
      });
    };
    draw();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 overflow-hidden">
        {/* Particle canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {/* Vertical label right */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <span className="section-label text-white/20 [writing-mode:vertical-rl] tracking-widest">ARTIST</span>
          <div className="w-px h-16 bg-white/10" />
        </div>

        {/* Vertical label left */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-16 bg-white/10" />
          <span className="section-label text-white/20 [writing-mode:vertical-rl] tracking-widest">SCROLL</span>
        </div>

        {/* Tag line */}
        <div className="relative max-w-7xl mx-auto px-16 w-full">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="section-label text-[#c8ff00] mb-6"
          >
            PORTFOLIO — <script>document.write(new Date().getFullYear());</script>
          </motion.p>

          {/* Giant name */}
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-black leading-none text-white uppercase"
              style={{ fontSize: 'clamp(4rem, 14vw, 13rem)', letterSpacing: '-0.02em' }}
            >
              ENIOLA
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="font-black leading-none text-outline uppercase"
              style={{ fontSize: 'clamp(4rem, 14vw, 13rem)', letterSpacing: '-0.02em' }}
            >
              OLAWALE
            </motion.h1>
          </div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="h-px bg-white/10 my-8 origin-left"
          />

          {/* Bottom row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8"
          >
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Crafting immersive worlds and interactive experiences — from core gameplay systems to hand-sculpted characters. Based in Nigeria, open to global opportunities.
            </p>
            <div className="flex gap-3">
              <a href="#portfolio" className="btn-acid text-xs">View Work</a>
              <a href="#contact" className="btn-ghost text-xs">Get in Touch</a>
            </div>
          </motion.div>
        </div>
      </section>

      <Portfolio />
      <About />
      <Blog />
      <ContactFooter />
    </main>
  );
}
