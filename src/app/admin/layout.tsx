import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AdminLayout from './AdminLayout';

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
          <AdminLayout>{children}</AdminLayout>
        </div>
      </body>
    </html>
  );
}