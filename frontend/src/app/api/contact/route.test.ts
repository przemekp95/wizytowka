import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/contact', () => {
  const originalEnv = process.env.BACKEND_GRAPHQL_URL;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.BACKEND_GRAPHQL_URL = 'http://backend.test/graphql';
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    if (originalEnv === undefined) {
      delete process.env.BACKEND_GRAPHQL_URL;
    } else {
      process.env.BACKEND_GRAPHQL_URL = originalEnv;
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
      headers: { 'content-type': 'application/json' },
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
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
        body: expect.stringContaining('sendContact'),
      })
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { sendContact: { ok: true, error: null } } });
  });
});
