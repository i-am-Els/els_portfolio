import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio Project | Eniola Olawale',
  description: 'View my portfolio project details',
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 