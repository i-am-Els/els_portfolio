import type { Metadata } from 'next';
import { Barlow_Condensed, Barlow, Space_Mono } from 'next/font/google';
import './globals.css';
import AdminLayout from './AdminLayout';
import { FlashMessageProvider } from '@/components/FlashMessage';
import GameCursor from '@/components/GameCursor';

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-display',
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-body',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Portfolio Admin',
  description: 'Admin portal for managing portfolio content',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${barlow.variable} ${spaceMono.variable}`}>
      <body style={{ fontFamily: 'var(--font-body), Helvetica Neue, sans-serif' }}>
        <GameCursor />
        <div id="admin-root">
          <FlashMessageProvider>
            <AdminLayout>{children}</AdminLayout>
          </FlashMessageProvider>
        </div>
      </body>
    </html>
  );
}