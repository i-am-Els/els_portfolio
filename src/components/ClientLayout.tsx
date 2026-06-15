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
