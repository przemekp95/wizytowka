import type { NextConfig } from 'next';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  trailingSlash: true,
  images: {
    domains: ['wizytowka.s3.eu-north-1.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
  },
  async rewrites() {
    // Dzięki temu w kodzie frontu wywołujesz po prostu /api/...
    return [{ source: '/api/:path*', destination: `${BACKEND}/api/:path*` }];
  },
  // (opcjonalnie) bezpieczniejsze nagłówki dla statyków
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  // Ensure static files are served correctly
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
};

export default nextConfig;
