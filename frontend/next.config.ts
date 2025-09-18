import type { NextConfig } from 'next';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
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
};

export default nextConfig;
