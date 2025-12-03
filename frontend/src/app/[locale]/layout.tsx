import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  const isPolish = locale === 'pl';

  return {
    title: isPolish
      ? "Przemysław Pietrzak - Full Stack Developer | Next.js, PHP, AI"
      : "IT Business Card - Przemysław Pietrzak",
    description: isPolish
      ? "Full Stack Web Developer specjalizujący się w nowoczesnych aplikacjach webowych (Next.js, Laravel, Node) oraz rozwiązaniach opartych na AI."
      : "PHP & Next.js Web Developer specializing in modern web applications, Laravel, and offline AI systems.",
    keywords: isPolish
      ? "Przemysław Pietrzak, Full Stack Developer, Next.js, React, TypeScript, PHP, Laravel, Node.js, AI, Web Applications, Portfolio"
      : "Next.js, PHP, Laravel, Web Developer, React, Prisma, Docker, AI, Web Applications, Przemysław Pietrzak",
    authors: [{ name: "Przemysław Pietrzak" }],
    creator: "Przemysław Pietrzak",
    publisher: "Przemysław Pietrzak",
    robots: "index, follow",
    viewport: "width=device-width, initial-scale=1",
    openGraph: {
      title: isPolish
        ? "Przemysław Pietrzak - Full Stack Developer"
        : "IT Business Card - Przemysław Pietrzak",
      description: isPolish
        ? "Full Stack Web Developer specjalizujący się w nowoczesnych aplikacjach webowych (Next.js, Laravel, Node) oraz rozwiązaniach opartych na AI."
        : "PHP & Next.js Web Developer specializing in modern web applications, Laravel, and offline AI systems.",
      url: `https://pietrzakprzemyslaw.pl/${locale}`,
      siteName: isPolish ? "Portfolio Przemysława Pietrzaka" : "Przemysław Pietrzak Portfolio",
      images: [
        {
          url: "/images/PP-2-JPG-01.webp",
          width: 1200,
          height: 630,
          alt: isPolish
            ? "Przemysław Pietrzak - Web Developer"
            : "Przemysław Pietrzak - Web Developer",
        },
      ],
      locale: isPolish ? "pl_PL" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: isPolish
        ? "Przemysław Pietrzak - Full Stack Developer"
        : "IT Business Card - Przemysław Pietrzak",
      description: isPolish
        ? "Full Stack Web Developer specjalizujący się w nowoczesnych aplikacjach webowych (Next.js, Laravel, Node) oraz rozwiązaniach opartych na AI."
        : "PHP & Next.js Web Developer specializing in modern web applications, Laravel, and offline AI systems.",
      images: ["/images/PP-2-JPG-01.webp"],
      creator: "@przemekp95",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!['pl', 'en'].includes(locale)) {
    notFound();
  }

  return (
    <div id="i18n-provider" data-locale={locale} lang={locale}>
      {children}
    </div>
  );
}
