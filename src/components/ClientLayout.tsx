'use client';

import { AnimatePresence } from 'framer-motion';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatePresence mode="wait">
        <div className="flex-1">{children}</div>
      </AnimatePresence>
    </div>
  );
} 