import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
    'Buduję nowoczesne aplikacje webowe (Next.js, Laravel, Node) i projektuję rozwiązania oparte na SQL, NoSQL oraz API (REST, GraphQL). Łączę wiedzę prawniczą z technologią.',
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
  metadataBase: new URL('https://przemyslawpietrzak.pl'),
  alternates: {
    canonical: 'https://przemyslawpietrzak.pl',
  },
  openGraph: {
    title: 'Przemysław Pietrzak - Next.js & PHP Web Developer',
    description:
      'Buduję nowoczesne aplikacje webowe (Next.js, Laravel, Node) i projektuję rozwiązania oparte na SQL, NoSQL oraz API (REST, GraphQL). Łączę wiedzę prawniczą z technologią.',
    url: 'https://przemyslawpietrzak.pl',
    siteName: 'Przemysław Pietrzak',
    locale: 'pl_PL',
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
      'Buduję nowoczesne aplikacje webowe (Next.js, Laravel, Node) i projektuję rozwiązania oparte na SQL, NoSQL oraz API (REST, GraphQL). Łączę wiedzę prawniczą z technologią.',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
