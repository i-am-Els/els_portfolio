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
