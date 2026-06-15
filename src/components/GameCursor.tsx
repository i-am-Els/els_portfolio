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
