import { createHmac } from 'node:crypto';

const DEFAULT_BACKEND_API_URL = 'http://localhost:4000';
const DEFAULT_BACKEND_GRAPHQL_URL = 'http://localhost:4000/graphql';

function resolveNormalizedUrl(value: string | undefined, fallback: string): string {
  return (value ?? fallback).replace(/\/+$/, '');
}

function resolveClientIp(headers: Headers): string | undefined {
  const candidates = [
    headers.get('x-forwarded-for'),
    headers.get('x-vercel-forwarded-for'),
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
  ];

  for (const candidate of candidates) {
    const ip = candidate?.split(',')[0]?.trim();

    if (ip) {
      return ip;
    }
  }

  return undefined;
}

function createProxySignature(secret: string, clientIp: string, timestamp: string): string {
  return createHmac('sha256', secret).update(`${clientIp}:${timestamp}`).digest('hex');
}

export function resolveBackendApiUrl(): string {
  return resolveNormalizedUrl(process.env.BACKEND_API_URL, DEFAULT_BACKEND_API_URL);
}

export function resolveBackendGraphqlUrl(): string {
  return resolveNormalizedUrl(process.env.BACKEND_GRAPHQL_URL, DEFAULT_BACKEND_GRAPHQL_URL);
}

export function createBackendProxyHeaders(request: Request): Headers {
  const headers = new Headers({
    'content-type': request.headers.get('content-type') ?? 'application/json',
    accept: request.headers.get('accept') ?? 'application/json',
  });
  const requestId = request.headers.get('x-request-id');

  if (requestId) {
    headers.set('x-request-id', requestId);
  }

  const sharedSecret = process.env.INTERNAL_PROXY_SHARED_SECRET;
  const clientIp = resolveClientIp(request.headers);

  if (sharedSecret && clientIp) {
    const timestamp = Date.now().toString();

    headers.set('x-forwarded-client-ip', clientIp);
    headers.set('x-forwarded-client-timestamp', timestamp);
    headers.set(
      'x-forwarded-client-signature',
      createProxySignature(sharedSecret, clientIp, timestamp)
    );
  }

  return headers;
}
