import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

describe('frontend security middleware', () => {
  it('uses a per-request script nonce instead of unsafe-inline', () => {
    const response = middleware(new NextRequest('https://example.test/en'));
    const policy = response.headers.get('content-security-policy');

    expect(policy).toContain("script-src 'self' 'nonce-");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it.each(['en', 'pl'])('forwards the %s route locale to the root layout', (locale) => {
    const response = middleware(new NextRequest(`https://example.test/${locale}`));

    expect(response.headers.get('x-middleware-request-x-locale')).toBe(locale);
  });
});
