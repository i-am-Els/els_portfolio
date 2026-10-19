'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
}

/**
 * Stacked full-width gallery with a full-screen lightbox (ArtStation-style).
 *
 * Each image spans the full content column at its natural aspect ratio, one
 * per row, so renders and screenshots "pop" the way they do on an ArtStation
 * project page — no columns, no cropping, no competing tiles.
 *
 * A plain <img> (not next/image): the rows carry no intrinsic width/height,
 * and `fill` would force every shot into a pre-assigned ratio — a crop. The
 * files are already q87 WebP served off B2's CDN, so there is nothing for
 * the image optimizer to gain here either.
 *
 * The lightbox closes on Escape or a backdrop click, and the arrow keys walk
 * the set. Only rendered when there is something to show.
 */
export default function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = active !== null;

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (delta: number) => {
      setActive((current) => {
        if (current === null || images.length === 0) return current;
        return (current + delta + images.length) % images.length;
      });
    },
    [images.length]
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };

    document.addEventListener('keydown', onKeyDown);
    // Stop the page behind scrolling while the overlay is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close, step]);

  if (images.length === 0) return null;

  const current = active === null ? null : images[active];

  return (
    <section aria-label="Project gallery">
      <span className="section-label text-white/30 block mb-6">Gallery</span>

      <div className="flex flex-col gap-4 sm:gap-6">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Open image ${index + 1} of ${images.length}`}
            className="group relative block w-full overflow-hidden bg-white/[0.03] cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ff00]"
          >
            <img
              src={image.url}
              alt={image.alt || ''}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isOpen && current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 sm:p-8"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={current.alt || `Image ${active! + 1} of ${images.length}`}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close gallery"
              className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center text-white/60 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {images.length > 1 && (
              <>
                <NavButton
                  direction="left"
                  onClick={(event) => {
                    event.stopPropagation();
                    step(-1);
                  }}
                />
                <NavButton
                  direction="right"
                  onClick={(event) => {
                    event.stopPropagation();
                    step(1);
                  }}
                />
              </>
            )}

            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative h-[78vh] w-[92vw] max-w-6xl"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={current.url}
                alt={current.alt || ''}
                fill
                sizes="92vw"
                className="object-contain"
                priority
              />
            </motion.div>

            <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-1 px-6">
              <span className="text-white/40 text-xs">
                {active! + 1} / {images.length}
              </span>
              {current.alt && <span className="text-white/70 text-sm text-center">{current.alt}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function NavButton({
  direction,
  onClick,
}: {
  direction: 'left' | 'right';
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const isLeft = direction === 'left';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isLeft ? 'Previous image' : 'Next image'}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/50 transition-colors hover:text-white ${
        isLeft ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
      }`}
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={isLeft ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}
