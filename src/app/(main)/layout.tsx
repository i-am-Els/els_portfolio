import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ["latin"] });

// Get the base URL based on environment
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'Eniola Olawale - Game Developer & Technical Artist',
    template: '%s | Eniola Olawale'
  },
  description: 'Portfolio showcasing game development and technical art projects by Eniola Olawale. Specializing in Unreal Engine, Unity, 3D modeling, and shader development.',
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/logo.png',
      },
    ],
  },
  manifest: '/manifest.json',
  keywords: [
    'game development',
    'technical art',
    'unreal engine',
    'unity',
    '3D modeling',
    'shaders',
    'portfolio',
    'game artist',
    'technical artist',
    'game design',
    'visual effects',
    'VFX',
    'game programming'
  ],
  authors: [{ name: 'Eniola Olawale' }],
  creator: 'Eniola Olawale',
  publisher: 'Eniola Olawale',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Eniola Olawale - Game Developer & Technical Artist',
    description: 'Portfolio showcasing game development and technical art projects by Eniola Olawale. Specializing in Unreal Engine, Unity, 3D modeling, and shader development.',
    url: getBaseUrl(),
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
    description: 'Portfolio showcasing game development and technical art projects by Eniola Olawale. Specializing in Unreal Engine, Unity, 3D modeling, and shader development.',
    creator: '@eniolaolawale',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: process.env.NODE_ENV === 'production',
    follow: process.env.NODE_ENV === 'production',
    googleBot: {
      index: process.env.NODE_ENV === 'production',
      follow: process.env.NODE_ENV === 'production',
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
  alternates: {
    canonical: getBaseUrl(),
  },
  category: 'technology',
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