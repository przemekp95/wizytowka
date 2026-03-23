import type { Request } from 'express';
import { createHmac } from 'node:crypto';
import { resolveRequestTracker } from './trusted-client-ip';

function sign(secret: string, ip: string, timestamp: string): string {
  return createHmac('sha256', secret)
    .update(`${ip}:${timestamp}`)
    .digest('hex');
}

describe('resolveRequestTracker', () => {
  it('prefers a valid signed forwarded IP over req.ip', () => {
    const timestamp = Date.now().toString();
    const request = {
      ip: '10.0.0.5',
      header(name: string) {
        const headers: Record<string, string> = {
          'X-Forwarded-Client-Ip': '203.0.113.25',
          'X-Forwarded-Client-Timestamp': timestamp,
          'X-Forwarded-Client-Signature': sign(
            'proxy-secret',
            '203.0.113.25',
            timestamp,
          ),
        };

        return headers[name];
      },
    } as Request;

    expect(resolveRequestTracker(request, 'proxy-secret')).toBe('203.0.113.25');
  });

  it('falls back to req.ip when the signature is invalid', () => {
    const timestamp = Date.now().toString();
    const request = {
      ip: '198.51.100.18',
      header(name: string) {
        const headers: Record<string, string> = {
          'X-Forwarded-Client-Ip': '203.0.113.25',
          'X-Forwarded-Client-Timestamp': timestamp,
          'X-Forwarded-Client-Signature': 'invalid',
        };

        return headers[name];
      },
    } as Request;

    expect(resolveRequestTracker(request, 'proxy-secret')).toBe(
      '198.51.100.18',
    );
  });
});
