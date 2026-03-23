import { timingSafeEqual, createHmac } from 'node:crypto';
import { isIP } from 'node:net';

import type { Request } from 'express';

const MAX_PROXY_SIGNATURE_AGE_MS = 5 * 60 * 1000;

function normalizeIp(value: string | undefined): string | undefined {
  const candidate = value?.split(',')[0]?.trim();

  if (!candidate || !isIP(candidate)) {
    return undefined;
  }

  return candidate;
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function createProxySignature(
  secret: string,
  clientIp: string,
  timestamp: string,
): string {
  return createHmac('sha256', secret)
    .update(`${clientIp}:${timestamp}`)
    .digest('hex');
}

function resolveTrustedForwardedIp(
  req: Request,
  sharedSecret: string | undefined,
): string | undefined {
  if (!sharedSecret) {
    return undefined;
  }

  const signedIp = normalizeIp(
    req.header('X-Forwarded-Client-Ip') ?? undefined,
  );
  const timestamp = req.header('X-Forwarded-Client-Timestamp')?.trim();
  const signature = req.header('X-Forwarded-Client-Signature')?.trim();

  if (!signedIp || !timestamp || !signature) {
    return undefined;
  }

  const parsedTimestamp = Number(timestamp);

  if (!Number.isFinite(parsedTimestamp)) {
    return undefined;
  }

  if (Math.abs(Date.now() - parsedTimestamp) > MAX_PROXY_SIGNATURE_AGE_MS) {
    return undefined;
  }

  const expectedSignature = createProxySignature(
    sharedSecret,
    signedIp,
    timestamp,
  );

  return safeEqual(expectedSignature, signature) ? signedIp : undefined;
}

export function resolveRequestTracker(
  req: Request,
  sharedSecret: string | undefined,
): string {
  return (
    resolveTrustedForwardedIp(req, sharedSecret) ??
    normalizeIp(req.ip) ??
    'unknown'
  );
}
