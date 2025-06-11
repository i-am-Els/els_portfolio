import type { Metadata } from 'next';
import AdminLayout from './AdminLayout';

export const metadata: Metadata = {
  title: 'Portfolio Admin',
  description: 'Admin interface for managing portfolio content',
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AdminLayout>{children}</AdminLayout>
      </body>
    </html>
  );
} 