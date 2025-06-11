import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://eniolaolawale.com'),
  title: 'Eniola Olawale - Game Developer & Technical Artist',
  description: 'Portfolio showcasing game development and technical art projects by Eniola Olawale',
  keywords: ['game development', 'technical art', 'unreal engine', 'unity', '3D modeling', 'shaders', 'portfolio'],
  authors: [{ name: 'Eniola Olawale' }],
  creator: 'Eniola Olawale',
  openGraph: {
    title: 'Eniola Olawale - Game Developer & Technical Artist',
    description: 'Portfolio showcasing game development and technical art projects by Eniola Olawale',
    url: 'https://eniolaolawale.com',
    siteName: 'Eniola Olawale Portfolio',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Eniola Olawale Portfolio',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eniola Olawale - Game Developer & Technical Artist',
    description: 'Portfolio showcasing game development and technical art projects by Eniola Olawale',
    creator: '@eniolaolawale',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
    yahoo: 'your-yahoo-verification',
  },
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} bg-background text-foreground antialiased min-h-screen`}>
      <Navigation />
      {children}
    </div>
  );
} 