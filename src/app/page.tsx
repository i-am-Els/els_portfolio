'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { heroContainer, clipReveal, lineGrow, fadeUp, fadeIn } from '@/lib/motion';
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

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    ctx.scale(dpr, dpr);
};

  resize();
  window.addEventListener("resize", resize);

  const particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
  }[] = [];

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    });
  }

  let raf: number;

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(191,255,0,${p.alpha})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  };

  draw();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}, []);

  return (
    <main className="min-h-screen bg-[#0d0d0d]">
      <Navigation />

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 overflow-hidden">
        {/* Particle canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        <div
  className="absolute inset-0 pointer-events-none opacity-[0.03]"
  style={{
    backgroundImage:
      "linear-gradient(rgba(191,255,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(191,255,0,1) 1px, transparent 1px)",
    backgroundSize: "80px 80px",
  }}
/>

        {/* Vertical label right */}
        <div className="absolute right-6 top-28 md:right-12 font-condensed text-xs tracking-[0.3em] text-white/40 rotate-90 origin-right">
          <span className="section-label text-white/20 [writing-mode:vertical-rl] tracking-widest">3D ARTIST & STORYTELLER</span>
          <div className="w-px h-16 bg-white/10" />
        </div>

        {/* Vertical label left */}
        <div className="absolute left-6 top-28 flex flex-col items-center gap-2">
          <div className="w-px h-16 bg-white/10" />
          <span className="section-label text-white/20 [writing-mode:vertical-rl] tracking-widest">SCROLL</span>
        </div>

        {/* Tag line */}
        <div className="relative z-10 max-w-[1200px] px-6 md:px-12 mx-auto w-full">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Tagline */}
            <motion.p
              variants={fadeIn}
              className="section-label text-[#c8ff00] mb-6"
            >
              PORTFOLIO — {new Date().getFullYear()}
            </motion.p>

            {/* "ENIOLA" — clip reveal */}
            <div className="overflow-hidden">
              <motion.h1
    variants={clipReveal}
    className="font-display leading-[0.9] tracking-tight text-white mb-2"
    style={{
        fontSize: "clamp(4rem,12vw,11rem)",
        fontWeight: 900,
    }}
>
    ENIOLA
</motion.h1>
            </div>

            {/* "OLAWALE" — clip reveal */}
            <div className="overflow-hidden">
              <motion.h1
    variants={clipReveal}
    className="font-display leading-[0.9] tracking-tight mb-10"
    style={{
        fontSize: "clamp(4rem,12vw,11rem)",
        fontWeight: 900,
        WebkitTextStroke: "1px rgba(237,237,237,0.3)",
        color: "transparent",
    }}
>
    OLAWALE
</motion.h1>
            </div>

            {/* Divider */}
            <motion.div
              variants={lineGrow}
              className="h-px bg-white/10 my-8"
            />

            {/* Bottom row */}
            <motion.div
              variants={fadeUp}
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
