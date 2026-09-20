import type { Metadata } from 'next';
import { Barlow_Condensed, Barlow, Space_Mono } from 'next/font/google';
import './globals.css';
import AdminLayout from './AdminLayout';
import { FlashMessageProvider } from '@/components/FlashMessage';

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
        <AdminCursor />
        <div id="admin-root">
          <FlashMessageProvider>
            <AdminLayout>{children}</AdminLayout>
          </FlashMessageProvider>
        </div>
      </body>
    </html>
  );
}

// Lime cursor dot that follows the mouse
function AdminCursor() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        var dot = document.createElement('div');
        dot.style.cssText = 'position:fixed;width:10px;height:10px;background:#c8ff00;border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:transform 0.08s ease;mix-blend-mode:difference;';
        document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(dot); });
        document.addEventListener('mousemove', function(e) {
          dot.style.left = e.clientX + 'px';
          dot.style.top = e.clientY + 'px';
        });
        document.addEventListener('mousedown', function() { dot.style.transform = 'translate(-50%,-50%) scale(1.6)'; });
        document.addEventListener('mouseup', function() { dot.style.transform = 'translate(-50%,-50%) scale(1)'; });
      })();
    ` }} />
  );
}