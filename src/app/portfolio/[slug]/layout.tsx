import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Details',
  description: 'View detailed information about this project',
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
} 