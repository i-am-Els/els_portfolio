# Framer-Motion Animation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate the full portfolio site with a Precision/Kinetic base motion system, a game-developer crosshair cursor, and a reworked "Selected Works" layout (first card full-bleed, remaining cards in a 2×3 grid).

**Architecture:** Shared `src/lib/motion.ts` exports all animation variants; a thin `AnimatedSection` wrapper applies scroll-triggered reveals across sections; `GameCursor` mounts globally in `ClientLayout` and handles all cursor state. `Portfolio.tsx` is the only structural layout change.

**Tech Stack:** Next.js 14, framer-motion v11 (already installed), Tailwind CSS, TypeScript

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/motion.ts` | **Create** | All shared animation variants + easing constant |
| `src/components/AnimatedSection.tsx` | **Create** | `whileInView` scroll reveal wrapper |
| `src/components/GameCursor.tsx` | **Create** | Crosshair cursor with spring physics |
| `src/components/ClientLayout.tsx` | **Modify** | Mount `GameCursor` |
| `src/app/globals.css` | **Modify** | `.custom-cursor` rule hides OS cursor |
| `src/app/page.tsx` | **Modify** | Orchestrated hero entrance sequence |
| `src/components/Portfolio.tsx` | **Modify** | 2-col grid + stagger + button hover |
| `src/components/About.tsx` | **Modify** | `clipReveal` heading + stagger stats/skills |
| `src/components/Blog.tsx` | **Modify** | Stagger grid cards |
| `src/components/ContactFooter.tsx` | **Modify** | Stagger form fields |

---

## Task 1: Shared Motion Variants — `src/lib/motion.ts`

**Files:**
- Create: `src/lib/motion.ts`

- [ ] **Step 1.1: Create the file**

```typescript
// src/lib/motion.ts
import type { Variants } from 'framer-motion';

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** y: 32→0 + opacity reveal. Used on all below-fold sections. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** opacity only. Used on subtle elements (tagline, footer bar). */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

/**
 * Clip-reveal for headings. Wrap the text in an overflow-hidden div,
 * then apply this to the text element itself. Text slides up into view.
 */
export const clipReveal: Variants = {
  hidden: { y: '105%' },
  visible: { y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** scaleX 0→1 from left. Use transformOrigin="left" on the element. */
export const lineGrow: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: { scaleX: 1, originX: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * Stagger wrapper — apply to a parent motion.div.
 * Children should use any of the above variants with the same hidden/visible keys.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

/** Hero-level stagger — tighter delay for the above-fold sequence. */
export const heroContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0 },
  },
};
```

- [ ] **Step 1.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors appear they will be type import issues — confirm `framer-motion` types are installed (`@types` are bundled with the package).

- [ ] **Step 1.3: Commit**

```bash
git add src/lib/motion.ts
git commit -m "feat: add shared framer-motion variants"
```

---

## Task 2: AnimatedSection Wrapper — `src/components/AnimatedSection.tsx`

**Files:**
- Create: `src/components/AnimatedSection.tsx`

- [ ] **Step 2.1: Create the component**

```tsx
// src/components/AnimatedSection.tsx
'use client';

import { motion } from 'framer-motion';
import { fadeUp, EASE } from '@/lib/motion';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimatedSection({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2.3: Commit**

```bash
git add src/components/AnimatedSection.tsx
git commit -m "feat: add AnimatedSection scroll-reveal wrapper"
```

---

## Task 3: Game Crosshair Cursor — `src/components/GameCursor.tsx`

**Files:**
- Create: `src/components/GameCursor.tsx`

- [ ] **Step 3.1: Create the component**

```tsx
// src/components/GameCursor.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function GameCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 150, damping: 20, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 150, damping: 20, mass: 0.5 });

  useEffect(() => {
    // Only activate on devices with a fine pointer (mouse/trackpad, not touch)
    if (!window.matchMedia('(pointer: fine)').matches) return;

    setIsReady(true);
    document.body.classList.add('custom-cursor');

    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest('a, button, [data-cursor="hover"]')) setIsHovering(true);
    };

    const onOut = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest('a, button, [data-cursor="hover"]')) setIsHovering(false);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    return () => {
      document.body.classList.remove('custom-cursor');
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, [mx, my]);

  if (!isReady) return null;

  return (
    <>
      {/* Dot — snaps exactly to cursor */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none rounded-full bg-[#c8ff00]"
        style={{ width: 4, height: 4, left: mx, top: my, x: '-50%', y: '-50%' }}
        animate={{ scale: isHovering ? 0 : 1, opacity: isHovering ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />

      {/* Ring — trails with spring physics */}
      <motion.div
        className="fixed top-0 left-0 z-[9998] pointer-events-none border border-[rgba(200,255,0,0.6)]"
        style={{ left: sx, top: sy, x: '-50%', y: '-50%' }}
        animate={{
          width: isHovering ? 48 : 32,
          height: isHovering ? 48 : 32,
          rotate: isHovering ? 45 : 0,
          borderRadius: isHovering ? '0%' : '50%',
          borderColor: isHovering ? '#c8ff00' : 'rgba(200,255,0,0.6)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Crosshair — top line */}
        <span
          className="absolute left-1/2 bg-[rgba(200,255,0,0.5)]"
          style={{ width: 1, height: 8, top: -12, transform: 'translateX(-0.5px)' }}
        />
        {/* Crosshair — left line */}
        <span
          className="absolute top-1/2 bg-[rgba(200,255,0,0.5)]"
          style={{ height: 1, width: 8, left: -12, transform: 'translateY(-0.5px)' }}
        />
      </motion.div>
    </>
  );
}
```

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/components/GameCursor.tsx
git commit -m "feat: add GameCursor crosshair component"
```

---

## Task 4: Mount Cursor Globally

**Files:**
- Modify: `src/components/ClientLayout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 4.1: Update `ClientLayout.tsx` to include `GameCursor`**

Replace the entire file with:

```tsx
// src/components/ClientLayout.tsx
'use client';

import { AnimatePresence } from 'framer-motion';
import GameCursor from '@/components/GameCursor';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <GameCursor />
      <AnimatePresence mode="wait">
        <div className="flex-1">{children}</div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4.2: Wire `ClientLayout` into the root layout**

In `src/app/layout.tsx`, import `ClientLayout` and wrap `{children}`:

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: '%s | Eniola Olawale',
    default: 'Eniola Olawale - Game Developer & Artist',
  },
  description: 'Portfolio website of Eniola Olawale, showcasing game development and technical art projects.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/icon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Eniola Olawale - Game Developer & Artist',
    description: 'Portfolio website of Eniola Olawale, showcasing game development and art projects.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'Eniola Olawale',
    images: [{ url: '/seo-image.png', width: 1200, height: 630, alt: 'Eniola Olawale Portfolio' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eniola Olawale - Game Developer & Artist',
    description: 'Portfolio website of Eniola Olawale, showcasing game development and technical art projects.',
    images: ['/seo-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
```

- [ ] **Step 4.3: Add `.custom-cursor` rule to `src/app/globals.css`**

Add at the end of the file (after existing `.btn-ghost:hover` rule):

```css
/* Hide OS cursor when JS-powered custom cursor is active */
.custom-cursor,
.custom-cursor * {
  cursor: none !important;
}
```

- [ ] **Step 4.4: Start dev server and verify cursor appears**

```bash
npm run dev
```

Open http://localhost:3000. You should see:
- The OS cursor is hidden
- A small acid-green dot tracks the mouse exactly
- A 32px ring trails behind with spring lag
- Crosshair lines extend from the ring top and left
- Hovering any link or button: ring expands to 48px, rotates 45° into a diamond, dot disappears

- [ ] **Step 4.5: Commit**

```bash
git add src/components/ClientLayout.tsx src/app/globals.css src/app/layout.tsx
git commit -m "feat: mount GameCursor globally, hide OS cursor on fine-pointer devices"
```

---

## Task 5: Orchestrated Hero Sequence — `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 5.1: Replace the hero `motion` elements with an orchestrated sequence**

Replace the entire content section (lines 74–131, from `<div className="relative max-w-7xl...">` to its closing `</div>`) with:

```tsx
<div className="relative max-w-7xl mx-auto px-16 w-full">
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
        className="font-black leading-none text-white uppercase"
        style={{ fontSize: 'clamp(4rem, 14vw, 13rem)', letterSpacing: '-0.02em' }}
      >
        ENIOLA
      </motion.h1>
    </div>

    {/* "OLAWALE" — clip reveal */}
    <div className="overflow-hidden">
      <motion.h1
        variants={clipReveal}
        className="font-black leading-none text-outline uppercase"
        style={{ fontSize: 'clamp(4rem, 14vw, 13rem)', letterSpacing: '-0.02em' }}
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
```

- [ ] **Step 5.2: Update imports at the top of `src/app/page.tsx`**

Replace the existing import line:
```tsx
import { motion } from 'framer-motion';
```
with:
```tsx
import { motion } from 'framer-motion';
import { heroContainer, clipReveal, lineGrow, fadeUp, fadeIn } from '@/lib/motion';
```

- [ ] **Step 5.3: Verify in browser**

With `npm run dev` still running, reload http://localhost:3000. On page load you should see:
1. Year tagline fades in
2. "ENIOLA" rises up from below a clip boundary (not a simple fade — the text slides up into view)
3. "OLAWALE" follows 0.1s later
4. Divider line draws left-to-right
5. Bio and buttons fade up last

- [ ] **Step 5.4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: orchestrate hero entrance sequence with stagger and clip-reveal"
```

---

## Task 6: Portfolio Layout — `src/components/Portfolio.tsx`

**Files:**
- Modify: `src/components/Portfolio.tsx`

This is the most significant structural change. The current layout renders all projects in a vertical `space-y-4` stack. The new layout:
- `filteredProjects[0]` → existing full-bleed card (420px, unchanged design)
- `filteredProjects.slice(1)` → 2-column grid, each card 220px tall

- [ ] **Step 6.1: Update imports**

At the top of `src/components/Portfolio.tsx`, replace:
```tsx
import { motion, AnimatePresence } from 'framer-motion';
```
with:
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/motion';
```

- [ ] **Step 6.2: Replace the projects render block**

Find the block starting with `<div className="space-y-4">` (around line 112) and replace everything from that `<div>` through its closing `</div>` (including the `AnimatePresence` inside) with:

```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-60px' }}
>
  <AnimatePresence>
    {filteredProjects.length > 0 ? (
      <>
        {/* First card — full-bleed hero card, unchanged */}
        <motion.div
          key={filteredProjects[0].id}
          variants={fadeUp}
          layout
        >
          <Link
            href={`/portfolio/${filteredProjects[0].slug}`}
            className="group block relative overflow-hidden"
            style={{ height: '420px' }}
          >
            {filteredProjects[0].image_url ? (
              <Image
                src={filteredProjects[0].image_url}
                alt={filteredProjects[0].title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-[#141414]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
            <div className="absolute top-4 right-4 w-9 h-9 border border-[#c8ff00] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[#c8ff00] text-sm">↗</span>
            </div>
            <div className="absolute bottom-0 left-0 p-8">
              <span className="section-label text-[#c8ff00] block mb-2">
                {filteredProjects[0].project_categories?.[0]?.categories?.slug?.replace(/-/g, ' ').toUpperCase() || 'PROJECT'}
              </span>
              <h3 className="text-3xl font-black text-white mb-3">{filteredProjects[0].title}</h3>
              <p className="text-white/50 text-sm max-w-lg mb-4 hidden group-hover:block">
                {filteredProjects[0].description.slice(0, 120)}{filteredProjects[0].description.length > 120 ? '...' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {filteredProjects[0].technologies.map((tech, i) => (
                  <span key={i} className="tag-pill">{tech}</span>
                ))}
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Remaining cards — 2-column grid */}
        {filteredProjects.length > 1 && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            {filteredProjects.slice(1).map((project) => {
              const categoryLabel = project.project_categories?.[0]?.categories?.slug?.replace(/-/g, ' ').toUpperCase() || 'PROJECT';
              return (
                <motion.div key={project.id} variants={fadeUp} layout>
                  <Link
                    href={`/portfolio/${project.slug}`}
                    className="group block relative overflow-hidden"
                    style={{ height: '220px' }}
                  >
                    {project.image_url ? (
                      <Image
                        src={project.image_url}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#141414]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
                    <div className="absolute top-3 right-3 w-7 h-7 border border-[#c8ff00] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[#c8ff00] text-xs">↗</span>
                    </div>
                    <div className="absolute bottom-0 left-0 p-5">
                      <span className="section-label text-[#c8ff00] block mb-1">{categoryLabel}</span>
                      <h3 className="text-xl font-black text-white mb-2">{project.title}</h3>
                      <p className="text-white/50 text-xs max-w-xs mb-3 hidden group-hover:block">
                        {project.description.slice(0, 80)}{project.description.length > 80 ? '...' : ''}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </>
    ) : (
      <div className="flex items-center justify-center h-64 border border-white/10">
        <p className="text-white/30 text-sm tracking-widest uppercase">Coming Soon</p>
      </div>
    )}
  </AnimatePresence>
</motion.div>
```

- [ ] **Step 6.3: Update the "View All Projects" link to animate on hover**

First, add `motion.create` import at the top of `Portfolio.tsx` (add after the `Link` import):

```tsx
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const MotionLink = motion.create(Link);
```

Then find the `<div className="mt-12">` block (near the bottom of the component) and replace it with:

```tsx
{filteredProjects.length > 0 && (
  <div className="mt-12">
    <MotionLink
      href="/portfolio"
      className="inline-flex items-center gap-3 text-xs font-bold tracking-widest uppercase text-white border border-white/30 px-5 py-3"
      whileHover={{ backgroundColor: '#c8ff00', color: '#0d0d0d', borderColor: '#c8ff00' }}
      transition={{ duration: 0.25 }}
    >
      View All Projects
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </MotionLink>
  </div>
)}
```

- [ ] **Step 6.4: Verify in browser**

Reload http://localhost:3000 and scroll to " Selected Work":
- First project renders at full 420px height
- Remaining projects appear in a 2-column grid below at 220px
- Each card staggered in as you scroll into view
- Hover "View All Projects" → background fills acid green, text goes dark
- Category filter still works (clicking a category re-filters all cards)

- [ ] **Step 6.5: Commit**

```bash
git add src/components/Portfolio.tsx
git commit -m "feat: split Selected Works into hero card + 2-col grid, animate stagger + button hover"
```

---

## Task 7: Animate About Section — `src/components/About.tsx`

**Files:**
- Modify: `src/components/About.tsx`

- [ ] **Step 7.1: Update imports**

Replace:
```tsx
import { motion } from 'framer-motion';
```
with:
```tsx
import { motion } from 'framer-motion';
import { clipReveal, fadeUp, staggerContainer, lineGrow } from '@/lib/motion';
```

- [ ] **Step 7.2: Add section divider animation**

Find the section header `<div>` (currently a plain div with `border-b`):
```tsx
<div className="flex items-center gap-4 mb-16 border-b border-white/10 pb-4">
  <span className="section-label text-[#c8ff00]"> About</span>
</div>
```

Replace with:
```tsx
<div className="flex items-center gap-4 mb-16 pb-4 relative">
  <span className="section-label text-[#c8ff00]"> About</span>
  <motion.div
    className="absolute bottom-0 left-0 right-0 h-px bg-white/10"
    variants={lineGrow}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
  />
</div>
```

- [ ] **Step 7.3: Apply clip-reveal to the headline**

Find the `<h2>` inside the left column `motion.div`:
```tsx
<h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-8">
  Building worlds, pixel by pixel.
</h2>
```

Replace with:
```tsx
<div className="overflow-hidden mb-8">
  <motion.h2
    variants={clipReveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="text-5xl md:text-6xl font-black text-white leading-tight"
  >
    Building worlds, pixel by pixel.
  </motion.h2>
</div>
```

- [ ] **Step 7.4: Stagger the stats grid cells**

Replace the stats grid `motion.div` (the one with `className="grid grid-cols-2 divide-x divide-y..."`) with:

```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-60px' }}
  className="grid grid-cols-2 divide-x divide-y divide-white/10 border border-white/10"
>
  {defaultStats.map((stat, i) => (
    <motion.div key={i} variants={fadeUp} className="p-8">
      <div className="text-5xl font-black text-[#c8ff00] mb-2">{stat.value}</div>
      <div className="section-label text-white/40">{stat.label}</div>
    </motion.div>
  ))}
</motion.div>
```

- [ ] **Step 7.5: Stagger the skills row**

Replace the skills `motion.div` (the one with `className="mt-24 grid md:grid-cols-2 lg:grid-cols-4..."`) with:

```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-60px' }}
  className="mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-8"
>
  {aboutContent.skills.map((skill) => (
    <motion.div key={skill.title} variants={fadeUp} className="border-t border-white/10 pt-6">
      <h3 className="text-white font-bold mb-4">{skill.title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{skill.description}</p>
    </motion.div>
  ))}
</motion.div>
```

- [ ] **Step 7.6: Verify in browser**

Scroll to the About section. You should see:
- Section divider line draws left-to-right as section enters viewport
- Headline "Building worlds, pixel by pixel." rises up from a clip
- Stats grid cells stagger in (0.08s apart)
- Skills row stagger in below

- [ ] **Step 7.7: Commit**

```bash
git add src/components/About.tsx
git commit -m "feat: animate About section with clip-reveal and stagger"
```

---

## Task 8: Animate Blog Section — `src/components/Blog.tsx`

**Files:**
- Modify: `src/components/Blog.tsx`

- [ ] **Step 8.1: Update imports**

Replace:
```tsx
import { motion, AnimatePresence } from 'framer-motion';
```
with:
```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeUp, lineGrow } from '@/lib/motion';
```

- [ ] **Step 8.2: Add section divider animation**

Find the section header div:
```tsx
<div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
  <span className="section-label text-[#c8ff00]"> Writing</span>
  <Link href="/blog" className="section-label text-white/30 hover:text-white transition-colors">View All →</Link>
</div>
```

Replace with:
```tsx
<div className="flex items-center justify-between pb-4 mb-16 relative">
  <span className="section-label text-[#c8ff00]"> Writing</span>
  <Link href="/blog" className="section-label text-white/30 hover:text-white transition-colors">View All →</Link>
  <motion.div
    className="absolute bottom-0 left-0 right-0 h-px bg-white/10"
    variants={lineGrow}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
  />
</div>
```

- [ ] **Step 8.3: Wrap the posts grid with stagger**

Find the `<div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">` and replace it with a `motion.div`:

```tsx
<motion.div
  className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5"
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-60px' }}
>
```

Then for each post's `<motion.div>`, replace the existing `initial/animate/exit` props with just `variants={fadeUp}`:

```tsx
<motion.div
  key={post.id}
  layout
  variants={fadeUp}
  exit={{ opacity: 0 }}
  className="bg-[#0d0d0d] group"
>
```

- [ ] **Step 8.4: Verify in browser**

Scroll to the Writing section. Cards should stagger in from left-to-right as the section enters the viewport.

- [ ] **Step 8.5: Commit**

```bash
git add src/components/Blog.tsx
git commit -m "feat: animate Blog grid with stagger"
```

---

## Task 9: Animate Contact Footer — `src/components/ContactFooter.tsx`

**Files:**
- Modify: `src/components/ContactFooter.tsx`

- [ ] **Step 9.1: Update imports**

Add to the existing import line:
```tsx
import { motion } from 'framer-motion';
import { clipReveal, staggerContainer, fadeUp, fadeIn } from '@/lib/motion';
```

- [ ] **Step 9.2: Add clip-reveal to the heading**

Find:
```tsx
<h2 className="text-5xl font-black text-white leading-tight mb-6">
  Let's build something great.
</h2>
```

Replace with:
```tsx
<div className="overflow-hidden mb-6">
  <motion.h2
    variants={clipReveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    className="text-5xl font-black text-white leading-tight"
  >
    Let's build something great.
  </motion.h2>
</div>
```

- [ ] **Step 9.3: Stagger the form fields**

Find the `<form onSubmit={handleSubmit} className="space-y-5">` and wrap it:

```tsx
<motion.form
  onSubmit={handleSubmit}
  className="space-y-5"
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-40px' }}
>
```

Then wrap each field `<div>` in a `<motion.div variants={fadeUp}>`:

```tsx
<motion.div variants={fadeUp}>
  <label className="section-label text-white/30 block mb-2">Name</label>
  <input ... />
</motion.div>

<motion.div variants={fadeUp}>
  <label className="section-label text-white/30 block mb-2">Email</label>
  <input ... />
</motion.div>

<motion.div variants={fadeUp}>
  <label className="section-label text-white/30 block mb-2">Message</label>
  <textarea ... />
</motion.div>

<motion.div variants={fadeUp}>
  <button type="submit" ...>...</button>
</motion.div>
```

Close the form with `</motion.form>` instead of `</form>`.

- [ ] **Step 9.4: Stagger social icons**

Find the social icons `<div className="flex gap-3">` and replace with:

```tsx
<motion.div
  className="flex gap-3"
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
  {socialLinks.map(s => (
    <motion.a
      key={s.label}
      href={s.url!}
      target="_blank"
      rel="noopener noreferrer"
      variants={fadeIn}
      className="w-10 h-10 border border-white/15 flex items-center justify-center text-white/50 hover:border-[#c8ff00] hover:text-[#c8ff00] transition-colors"
      aria-label={s.label}
    >
      {s.icon}
    </motion.a>
  ))}
</motion.div>
```

- [ ] **Step 9.5: Verify in browser**

Scroll to the Contact section. You should see:
- "Let's build something great." rises up from clip
- Name → Email → Message → Send button each stagger in
- Social icons fade in staggered

- [ ] **Step 9.6: Commit**

```bash
git add src/components/ContactFooter.tsx
git commit -m "feat: animate ContactFooter with clip-reveal heading and staggered form fields"
```

---

## Task 10: Final Verification

- [ ] **Step 10.1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any type errors before proceeding.

- [ ] **Step 10.2: Smoke test the full home page**

With `npm run dev` running, open http://localhost:3000 and verify:

1. **Cursor** — crosshair dot + spring ring visible; OS cursor hidden; locked-on state on links/buttons
2. **Hero** — clip-reveal on name, divider draws, bottom row fades; sequence feels orchestrated
3. **Portfolio** — first project is full-bleed 420px; projects 2-6 in 2-col grid at 220px; stagger on scroll; "View All Projects" hover goes acid-green
4. **About** — divider line draws; headline clips up; stats stagger; skills stagger
5. **Writing** — divider draws; cards stagger left-to-right
6. **Contact** — heading clips; form fields stagger; social icons stagger

- [ ] **Step 10.3: Check mobile (no cursor)**

Resize browser to mobile width (375px) or open DevTools device emulator. Confirm:
- Custom cursor is NOT rendered (pointer: fine check gates it)
- OS cursor is visible
- All scroll animations still work

- [ ] **Step 10.4: Build check**

```bash
npm run build
```

Expected: build completes with no errors. Fix any build errors before the final commit.

- [ ] **Step 10.5: Final commit**

```bash
git add -A
git commit -m "feat: complete framer-motion animation system — cursor, hero, portfolio grid, section reveals"
```
