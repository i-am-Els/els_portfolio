import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AdminLayout from './AdminLayout';
import { FlashMessageProvider } from '@/components/FlashMessage';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Portfolio Admin',
  description: 'Admin portal for managing portfolio content',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div id="admin-root">
          <FlashMessageProvider>
            <AdminLayout>{children}</AdminLayout>
          </FlashMessageProvider>
        </div>
      </body>
    </html>
  );
}