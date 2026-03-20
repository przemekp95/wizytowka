export const supportedLocales = ['pl', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];

const defaultLocale: Locale = 'en';

export function getLocaleFromPathname(pathname: string): Locale {
  const maybeLocale = pathname.split('/')[1];
  return supportedLocales.includes(maybeLocale as Locale) ? (maybeLocale as Locale) : defaultLocale;
}

export function buildLocaleRootHref(pathname: string): string {
  return `/${getLocaleFromPathname(pathname)}`;
}

export function buildLocalizedPath(pathname: string, targetLocale: Locale): string {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];

  if (supportedLocales.includes(maybeLocale as Locale)) {
    const rest = segments.slice(2).join('/');
    return rest ? `/${targetLocale}/${rest}` : `/${targetLocale}`;
  }

  const normalized = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  return normalized ? `/${targetLocale}/${normalized}` : `/${targetLocale}`;
}

export function buildLocalizedHashHref(pathname: string, hash: string): string {
  const locale = getLocaleFromPathname(pathname);
  const normalizedHash = hash.startsWith('#') ? hash : `#${hash}`;

  return `/${locale}${normalizedHash}`;
}
