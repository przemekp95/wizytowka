import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/contact', () => {
  const originalEnv = process.env.BACKEND_GRAPHQL_URL;
  const originalSharedSecret = process.env.INTERNAL_PROXY_SHARED_SECRET;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.BACKEND_GRAPHQL_URL = 'http://backend.test/graphql';
    process.env.INTERNAL_PROXY_SHARED_SECRET = 'proxy-secret';
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
  });

  it('proxies the raw GraphQL payload to the backend endpoint', async () => {
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
    expect(fetchHeaders.get('x-forwarded-client-ip')).toBe('198.51.100.40');
    expect(fetchHeaders.get('x-forwarded-client-timestamp')).toMatch(/^\d+$/);
    expect(fetchHeaders.get('x-forwarded-client-signature')).toMatch(/^[a-f0-9]{64}$/);
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { sendContact: { ok: true, error: null } } });
  });
});
