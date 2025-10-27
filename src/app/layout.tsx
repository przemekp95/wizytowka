import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IT Business Card - Przemysław Pietrzak",
  description: "PHP & Next.js Web Developer specializing in modern web applications, Laravel, and offline AI systems.",
  keywords: "Next.js, PHP, Laravel, Web Developer, React, Prisma, Docker, AI, Web Applications",
  authors: [{ name: "Przemysław Pietrzak" }],
  creator: "Przemysław Pietrzak",
  publisher: "Przemysław Pietrzak",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    title: "IT Business Card - Przemysław Pietrzak",
    description: "PHP & Next.js Web Developer specializing in modern web applications, Laravel, and offline AI systems.",
    url: "https://przemyslaw-pietrzak.pl",
    siteName: "Przemysław Pietrzak Portfolio",
    images: [
      {
        url: "/images/PP-2-JPG-01.webp",
        width: 1200,
        height: 630,
        alt: "Przemysław Pietrzak - Web Developer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IT Business Card - Przemysław Pietrzak",
    description: "PHP & Next.js Web Developer specializing in modern web applications, Laravel, and offline AI systems.",
    images: ["/images/PP-2-JPG-01.webp"],
    creator: "@przemekp95",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
