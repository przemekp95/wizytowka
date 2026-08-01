import { NextRequest, NextResponse } from 'next/server';

const supportedLocales = new Set(['en', 'pl']);

function createContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https://wizytowka.s3.eu-north-1.amazonaws.com https://ppsolutions.com.pl https://krainakarpat.pl",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}'`,
    "connect-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const policy = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  const routeLocale = request.nextUrl.pathname.split('/')[1] ?? '';
  const locale = supportedLocales.has(routeLocale) ? routeLocale : 'en';

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-locale', locale);
  requestHeaders.set('content-security-policy', policy);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('content-security-policy', policy);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
