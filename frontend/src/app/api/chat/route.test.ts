import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/chat', () => {
  const originalEnv = process.env.BACKEND_API_URL;
  const originalSharedSecret = process.env.INTERNAL_PROXY_SHARED_SECRET;
  const originalClientIpHeader = process.env.INTERNAL_PROXY_CLIENT_IP_HEADER;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.BACKEND_API_URL = 'http://backend.test';
    process.env.INTERNAL_PROXY_SHARED_SECRET = 'proxy-secret';
    process.env.INTERNAL_PROXY_CLIENT_IP_HEADER = 'x-vercel-forwarded-for';
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    if (originalEnv === undefined) {
      delete process.env.BACKEND_API_URL;
    } else {
      process.env.BACKEND_API_URL = originalEnv;
    }

    if (originalSharedSecret === undefined) {
      delete process.env.INTERNAL_PROXY_SHARED_SECRET;
    } else {
      process.env.INTERNAL_PROXY_SHARED_SECRET = originalSharedSecret;
    }

    if (originalClientIpHeader === undefined) {
      delete process.env.INTERNAL_PROXY_CLIENT_IP_HEADER;
    } else {
      process.env.INTERNAL_PROXY_CLIENT_IP_HEADER = originalClientIpHeader;
    }
  });

  it('proxies the chat payload to the backend endpoint and preserves rate-limit headers', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ response: 'OK', sessionId: 'session-123' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-ratelimit-limit': '20',
          'x-ratelimit-remaining': '19',
          'x-ratelimit-reset': '60',
        },
      })
    );

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.20, 10.0.0.1',
        'x-vercel-forwarded-for': '203.0.113.25',
        'x-request-id': 'req-123',
      },
      body: JSON.stringify({ message: 'Cześć', sessionId: 'session-1' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://backend.test/api/chat/message',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
        headers: expect.any(Headers),
        body: JSON.stringify({ message: 'Cześć', sessionId: 'session-1' }),
      })
    );
    const fetchHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;

    expect(fetchHeaders.get('content-type')).toBe('application/json');
    expect(fetchHeaders.get('x-request-id')).toBe('req-123');
    expect(fetchHeaders.get('x-forwarded-client-ip')).toBe('203.0.113.25');
    expect(fetchHeaders.get('x-forwarded-client-timestamp')).toMatch(/^\d+$/);
    expect(fetchHeaders.get('x-forwarded-client-signature')).toMatch(/^[a-f0-9]{64}$/);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-ratelimit-limit')).toBe('20');
    expect(response.headers.get('x-ratelimit-remaining')).toBe('19');
    expect(response.headers.get('x-ratelimit-reset')).toBe('60');
    expect(body).toEqual({ response: 'OK', sessionId: 'session-123' });
  });

  it('rejects an oversized payload before contacting the backend', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'x'.repeat(20 * 1024) }),
      })
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: 'Request payload too large',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects browser-simple content types instead of accepting cross-site forms', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{}',
      })
    );

    expect(response.status).toBe(415);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not expose backend connection details when proxying fails', async () => {
    fetchSpy.mockRejectedValue(new Error('connect ECONNREFUSED backend.internal.example:4000'));

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Hej' }),
      })
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Backend service unavailable' });
  });
});
