import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

const DEFAULT_BACKEND_API_URL = 'http://localhost:4000';
const DEFAULT_BACKEND_GRAPHQL_URL = 'http://localhost:4000/graphql';
const DEFAULT_PROXY_BODY_LIMIT_BYTES = 16 * 1024;
const TRUSTED_CLIENT_IP_HEADERS = new Set(['cf-connecting-ip', 'x-vercel-forwarded-for']);
const PASSTHROUGH_RESPONSE_HEADERS = [
  'cache-control',
  'content-type',
  'retry-after',
  'vary',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'x-request-id',
] as const;

function resolveNormalizedUrl(value: string | undefined, fallback: string): string {
  return (value ?? fallback).replace(/\/+$/, '');
}

function resolveTrustedClientIpHeader(): string | undefined {
  const configuredHeader = process.env.INTERNAL_PROXY_CLIENT_IP_HEADER?.trim().toLowerCase();

  if (!configuredHeader || !TRUSTED_CLIENT_IP_HEADERS.has(configuredHeader)) {
    return undefined;
  }

  return configuredHeader;
}

function normalizeIp(value: string | undefined): string | undefined {
  const ip = value?.split(',')[0]?.trim();

  if (!ip || !isIP(ip)) {
    return undefined;
  }

  return ip;
}

function resolveClientIp(headers: Headers): string | undefined {
  const trustedHeader = resolveTrustedClientIpHeader();

  if (!trustedHeader) {
    return undefined;
  }

  return normalizeIp(headers.get(trustedHeader) ?? undefined);
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

export function createBackendProxyResponseHeaders(headers: Headers): Headers {
  const proxiedHeaders = new Headers();

  for (const headerName of PASSTHROUGH_RESPONSE_HEADERS) {
    const value = headers.get(headerName);

    if (value) {
      proxiedHeaders.set(headerName, value);
    }
  }

  return proxiedHeaders;
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

export class ProxyPayloadTooLargeError extends Error {
  constructor() {
    super('Request payload too large');
    this.name = 'ProxyPayloadTooLargeError';
  }
}

export function isJsonRequest(request: Request): boolean {
  return /^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i.test(
    request.headers.get('content-type')?.trim() ?? ''
  );
}

export async function readBoundedRequestText(
  request: Request,
  limitBytes = DEFAULT_PROXY_BODY_LIMIT_BYTES
): Promise<string> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (Number.isFinite(declaredBytes) && declaredBytes > limitBytes) {
      throw new ProxyPayloadTooLargeError();
    }
  }

  if (!request.body) {
    return '';
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return text + decoder.decode();
    }

    totalBytes += value.byteLength;
    if (totalBytes > limitBytes) {
      await reader.cancel();
      throw new ProxyPayloadTooLargeError();
    }

    text += decoder.decode(value, { stream: true });
  }
}
