import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/contact', () => {
  const originalEnv = process.env.BACKEND_GRAPHQL_URL;
  const originalSharedSecret = process.env.INTERNAL_PROXY_SHARED_SECRET;
  const originalClientIpHeader = process.env.INTERNAL_PROXY_CLIENT_IP_HEADER;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.BACKEND_GRAPHQL_URL = 'http://backend.test/graphql';
    process.env.INTERNAL_PROXY_SHARED_SECRET = 'proxy-secret';
    process.env.INTERNAL_PROXY_CLIENT_IP_HEADER = 'cf-connecting-ip';
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    if (originalEnv === undefined) {
      delete process.env.BACKEND_GRAPHQL_URL;
    } else {
      process.env.BACKEND_GRAPHQL_URL = originalEnv;
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

  it('proxies the raw GraphQL payload, signs only the trusted IP header, and preserves transport headers', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ data: { sendContact: { ok: true, error: null } } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'retry-after': '17',
          'x-ratelimit-limit': '30',
          'x-ratelimit-remaining': '12',
          'x-ratelimit-reset': '17',
          'x-request-id': 'backend-req-1',
        },
      })
    );

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '198.51.100.40, 10.0.0.1',
        'cf-connecting-ip': '198.51.100.41',
        'x-request-id': 'req-456',
      },
      body: JSON.stringify({
        query:
          'mutation SendContact($input: ContactMessageInput!) { sendContact(input: $input) { ok } }',
        variables: { input: { name: 'Jan', email: 'jan@example.com', message: 'Hej' } },
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://backend.test/graphql',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
        headers: expect.any(Headers),
        body: expect.stringContaining('sendContact'),
      })
    );
    const fetchHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;

    expect(fetchHeaders.get('content-type')).toBe('application/json');
    expect(fetchHeaders.get('x-request-id')).toBe('req-456');
    expect(fetchHeaders.get('x-forwarded-client-ip')).toBe('198.51.100.41');
    expect(fetchHeaders.get('x-forwarded-client-timestamp')).toMatch(/^\d+$/);
    expect(fetchHeaders.get('x-forwarded-client-signature')).toMatch(/^[a-f0-9]{64}$/);
    expect(response.status).toBe(200);
    expect(response.headers.get('retry-after')).toBe('17');
    expect(response.headers.get('x-ratelimit-limit')).toBe('30');
    expect(response.headers.get('x-ratelimit-remaining')).toBe('12');
    expect(response.headers.get('x-ratelimit-reset')).toBe('17');
    expect(response.headers.get('x-request-id')).toBe('backend-req-1');
    expect(body).toEqual({ data: { sendContact: { ok: true, error: null } } });
  });

  it('does not sign user-controlled forwarded headers when no trusted platform header is configured', async () => {
    delete process.env.INTERNAL_PROXY_CLIENT_IP_HEADER;

    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ data: { sendContact: { ok: true, error: null } } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '198.51.100.40, 10.0.0.1',
      },
      body: JSON.stringify({
        query:
          'mutation SendContact($input: ContactMessageInput!) { sendContact(input: $input) { ok } }',
        variables: { input: { name: 'Jan', email: 'jan@example.com', message: 'Hej' } },
      }),
    });

    await POST(request);

    const fetchHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;

    expect(fetchHeaders.get('x-forwarded-client-ip')).toBeNull();
    expect(fetchHeaders.get('x-forwarded-client-timestamp')).toBeNull();
    expect(fetchHeaders.get('x-forwarded-client-signature')).toBeNull();
  });

  it('rejects an oversized payload before contacting the backend', async () => {
    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'x'.repeat(20 * 1024) }),
    });

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      errors: [{ message: 'Request payload too large' }],
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects browser-simple content types instead of accepting cross-site forms', async () => {
    const response = await POST(
      new Request('http://localhost/api/contact', {
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
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ hello }' }),
      })
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      errors: [{ message: 'Backend service unavailable' }],
    });
  });
});
