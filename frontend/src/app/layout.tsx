import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import ErrorBoundary from '../components/ErrorBoundary';
import { AOSInitializer } from '../components/AOSInitializer';
import { CustomCursor } from '../components/CustomCursor';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const supportedLocales = new Set(['pl', 'en']);
const defaultLocale = 'en';
const googleSiteVerification =
  process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

function resolveHtmlLocale(rawLocale: string | null): string {
  if (!rawLocale) {
    return defaultLocale;
  }

  return supportedLocales.has(rawLocale) ? rawLocale : defaultLocale;
}

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
        url: 'https://wizytowka.s3.eu-north-1.amazonaws.com/PP-2-JPG-01.webp',
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
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const htmlLang = resolveHtmlLocale(requestHeaders.get('x-locale'));

  return (
    <html lang={htmlLang} className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-gray-100`}
      >
        <AOSInitializer />
        <ErrorBoundary>{children}</ErrorBoundary>
        <CustomCursor />
      </body>
    </html>
  );
}
