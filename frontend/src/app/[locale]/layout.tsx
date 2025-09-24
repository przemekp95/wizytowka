import { notFound } from 'next/navigation';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` parameter is valid
  if (!['pl', 'en'].includes(locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning={true}>
      <body className="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li...">
        <div id="i18n-provider" data-locale={locale}>
          {children}
        </div>
      </body>
    </html>
  );
}
