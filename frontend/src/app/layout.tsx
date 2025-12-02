import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from '../components/ErrorBoundary';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Przemysław Pietrzak - Next.js & PHP Web Developer',
  description:
    'I build modern web applications (Next.js, Laravel, Node) and design solutions based on SQL, NoSQL and API (REST, GraphQL). I combine legal knowledge with technology.',
  keywords:
    'Next.js, PHP, Laravel, Node.js, React, TypeScript, Web Developer, Full Stack Developer',
  authors: [{ name: 'Przemysław Pietrzak' }],
  creator: 'Przemysław Pietrzak',
  publisher: 'Przemysław Pietrzak',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pietrzakprzemyslaw.pl'),
  alternates: {
    canonical: 'https://pietrzakprzemyslaw.pl',
  },
  openGraph: {
    title: 'Przemysław Pietrzak - Next.js & PHP Web Developer',
    description:
      'I build modern web applications (Next.js, Laravel, Node) and design solutions based on SQL, NoSQL and API (REST, GraphQL). I combine legal knowledge with technology.',

    url: 'https://pietrzakprzemyslaw.pl',
    siteName: 'Przemyslaw Pietrzak - Developer Portfolio',
    images: [
      {
        url: '/images/ja.jpeg',
        width: 1200,
        height: 630,
        alt: 'Przemysław Pietrzak - Full Stack Web Developer',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['pl_PL'],
    type: 'website',
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
  twitter: {
    card: 'summary_large_image',
    title: 'Przemysław Pietrzak - Next.js & PHP Web Developer',
    description:
      'I build modern web applications (Next.js, Laravel, Node) and design solutions based on SQL, NoSQL and API (REST, GraphQL). I combine legal knowledge with technology.',
    creator: '@przemekp95',
  },
  verification: {
    google: 'google-site-verification-code',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
