import type { MetadataRoute } from 'next';

const defaultBaseUrl = 'https://pietrzakprzemyslaw.pl';
const localizedPaths = ['', '/en', '/pl'];

function resolveBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  const baseUrl = configuredBaseUrl?.trim() || defaultBaseUrl;

  return baseUrl.replace(/\/+$/, '');
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveBaseUrl();
  const lastModified = new Date();

  return localizedPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.9,
  }));
}
