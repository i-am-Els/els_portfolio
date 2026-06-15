# Framer-Motion Animation System — Design Spec
**Date:** 2026-06-15  
**Status:** Approved

---

## Overview

Animate the full portfolio site using framer-motion into an awwwwards-calibre experience for a game developer. The motion system uses **Precision/Kinetic** (Option A) as the base — tight clip-mask reveals, staggered entrances, engineered timing — with **Organic/Magnetic** (Option B) moments placed systematically: a game-themed crosshair cursor and magnetic hover states on interactive elements.

No structural changes to routing, data fetching, or Supabase queries. All existing component layouts are preserved except the `Portfolio.tsx` "Selected Works" grid.

---

## 1. Motion System — `src/lib/motion.ts`

Single shared file exporting all animation variants. All components import from here; no inline variant definitions.

### Variants

| Name | Description | Timing |
|---|---|---|
| `fadeUp` | `y: 32→0, opacity: 0→1` | 0.6s, ease `[0.22,1,0.36,1]` |
| `clipReveal` | Child slides up from `overflow:hidden` parent | 0.7s, ease `[0.22,1,0.36,1]` |
| `staggerContainer` | Parent with `staggerChildren: 0.08s`, `delayChildren: 0.1s` | — |
| `lineGrow` | `scaleX: 0→1`, `transformOrigin: left` | 0.6s, ease `[0.22,1,0.36,1]` |
| `fadeIn` | `opacity: 0→1` only | 0.5s, ease `linear` |

### Standard easing

All variants use `[0.22, 1, 0.36, 1]` (expo-out feel) unless noted. No spring physics except the cursor follower.

---

## 2. `AnimatedSection` Wrapper — `src/components/AnimatedSection.tsx`

Thin `motion.div` wrapper used on every section below the hero:

```
whileInView={fadeUp}
viewport={{ once: true, margin: '-80px' }}
```

Eliminates repetitive motion props across `About`, `Blog`, `ContactFooter`.

---

## 3. Custom Cursor — `src/components/GameCursor.tsx`

Full-screen fixed overlay, `pointer-events: none`. Hidden on touch devices (`@media (hover: none)`).

### Elements
- **Dot** — 4px circle, `background: #c8ff00`, at exact mouse position (no lag)
- **Ring** — 32px circle, `border: 1px solid rgba(200,255,0,0.6)`, trails mouse via `useSpring({ stiffness: 150, damping: 20 })`
- **Crosshair lines** — two 1px lines (top and left) extending 8px beyond the ring via CSS `::before` / `::after`

### States

| State | Trigger | Ring | Dot |
|---|---|---|---|
| Default | Idle | 32px circle, 60% opacity | Visible |
| Locked-on | `mouseenter` on `a`, `button`, `[data-cursor="hover"]` | 48px, rotated 45° (diamond bracket), full opacity | Scale to 0 |

State transitions: framer-motion `animate` with `duration: 0.2s`.

### Mount point
Added to `src/components/ClientLayout.tsx` above all page content. `cursor: none` applied globally via `globals.css` only when `GameCursor` is mounted (JS-gated to avoid flash on SSR).

---

## 4. Hero Section — `src/app/page.tsx`

Enhance the existing framer-motion sequence into a fully orchestrated entrance using `staggerChildren` on a parent `motion.div`. Sequence:

1. **Tagline** `PORTFOLIO — {year}` — `fadeIn`, delay 0
2. **"ENIOLA"** — `clipReveal` (overflow hidden parent), delay 0.1s
3. **"OLAWALE"** — `clipReveal`, delay 0.2s
4. **Divider line** — `lineGrow`, delay 0.35s
5. **Bottom row** (bio + buttons) — `fadeUp`, delay 0.45s

The particle canvas animation is unchanged.

---

## 5. Portfolio Section — `src/components/Portfolio.tsx`

### Layout change

**Project `[0]`** — unchanged. Renders as the existing full-bleed card (`height: 420px`, stacked layout, full hover overlay).

**Projects `[1–5]`** — render into a `2-column CSS grid` below the hero card, `gap: 12px`. Each grid card:
- Height: `220px`
- Same design language: `Image` fill, gradient overlay, category label, title, arrow icon (top-right)
- Description revealed on hover (same `hidden group-hover:block` pattern)
- Tech pills hidden on grid cards (space constraint) — shown only on hover

If fewer than 6 projects are returned from Supabase, the grid fills naturally with no empty placeholders.

### Animations

- Hero card: `fadeUp`, delay `0`
- Grid cards: `staggerContainer` parent + `fadeUp` per card, stagger `0.08s`
- "View All Projects": `motion.a`, `whileHover={{ backgroundColor: '#c8ff00', color: '#0d0d0d', borderColor: '#c8ff00' }}`, `transition={{ duration: 0.25 }}`

### Category filter
No change to the filter logic. Category pills retain existing styles. Switching category triggers `AnimatePresence` re-render (already implemented).

---

## 6. About Section — `src/components/About.tsx`

- Headline `"Building worlds, pixel by pixel."` — wrapped in overflow-hidden parent, uses `clipReveal`
- Stats grid cells — `staggerContainer` + `fadeUp` per cell (4 cells, 0.08s stagger)
- Skills row — `staggerContainer` + `fadeUp` per skill block
- Section divider — `lineGrow` on the `border-b` line (render as `motion.div` with `scaleX`)

---

## 7. Blog Section — `src/components/Blog.tsx`

- 3-column grid: `staggerContainer` on the grid parent, `fadeUp` on each `motion.div` card
- Section header `lineGrow` on the border-b divider
- No change to fetching or filtering logic

---

## 8. ContactFooter — `src/components/ContactFooter.tsx`

- Heading `"Let's build something great."` — `clipReveal`
- Form fields — `staggerContainer` + `fadeUp`, stagger `0.05s` per field (name → email → message → button)
- Social icons — `staggerContainer` + `fadeIn`, stagger `0.06s`
- Footer bar — `fadeIn` on `whileInView`

---

## 9. Navigation — `src/components/Navigation.tsx`

No animation changes needed. Existing scroll-triggered `backdrop-blur` is already smooth. Nav links get `data-cursor="hover"` so the crosshair locks on without any other changes.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/motion.ts` | **New** — shared variants |
| `src/components/GameCursor.tsx` | **New** — crosshair cursor |
| `src/components/AnimatedSection.tsx` | **New** — scroll reveal wrapper |
| `src/components/ClientLayout.tsx` | Mount `GameCursor`, add `cursor: none` gate |
| `src/app/page.tsx` | Enhance hero sequence |
| `src/components/Portfolio.tsx` | Layout split + stagger animations + button hover |
| `src/components/About.tsx` | `clipReveal` + stagger |
| `src/components/Blog.tsx` | Stagger grid |
| `src/components/ContactFooter.tsx` | Stagger form |
| `src/app/globals.css` | Add `.cursor-none` class for JS gate |

---

## Out of Scope

- No changes to admin pages, blog post detail, or portfolio detail pages
- No new routes or data models
- No page-transition animations between routes (kept simple, existing `PageTransition.tsx` unchanged)
- No mobile gesture animations
