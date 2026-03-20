import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/chat', () => {
  const originalEnv = process.env.BACKEND_API_URL;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.BACKEND_API_URL = 'http://backend.test';
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    if (originalEnv === undefined) {
      delete process.env.BACKEND_API_URL;
    } else {
      process.env.BACKEND_API_URL = originalEnv;
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
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Cześć', sessionId: 'session-1' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://backend.test/api/chat/message',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
        headers: expect.objectContaining({ 'content-type': 'application/json' }),
        body: JSON.stringify({ message: 'Cześć', sessionId: 'session-1' }),
      })
    );
    expect(response.status).toBe(200);
    expect(body).toEqual({ response: 'OK', sessionId: 'session-123' });
  });
});
