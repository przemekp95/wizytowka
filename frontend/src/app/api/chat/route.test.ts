import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/chat', () => {
  const originalEnv = process.env.BACKEND_API_URL;
  const originalSharedSecret = process.env.INTERNAL_PROXY_SHARED_SECRET;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.BACKEND_API_URL = 'http://backend.test';
    process.env.INTERNAL_PROXY_SHARED_SECRET = 'proxy-secret';
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
  });

  it('proxies the chat payload to the backend endpoint', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ response: 'OK', sessionId: 'session-123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.20, 10.0.0.1',
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
    expect(fetchHeaders.get('x-forwarded-client-ip')).toBe('203.0.113.20');
    expect(fetchHeaders.get('x-forwarded-client-timestamp')).toMatch(/^\d+$/);
    expect(fetchHeaders.get('x-forwarded-client-signature')).toMatch(/^[a-f0-9]{64}$/);
    expect(response.status).toBe(200);
    expect(body).toEqual({ response: 'OK', sessionId: 'session-123' });
  });
});
