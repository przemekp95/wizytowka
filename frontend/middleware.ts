import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const supportedLocales = new Set(['pl', 'en']);
const defaultLocale = 'en';

function getLocaleFromPathname(pathname: string): string {
  const maybeLocale = pathname.split('/')[1];

  return supportedLocales.has(maybeLocale) ? maybeLocale : defaultLocale;
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', getLocaleFromPathname(request.nextUrl.pathname));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
