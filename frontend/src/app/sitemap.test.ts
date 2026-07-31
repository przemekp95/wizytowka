import { describe, expect, it } from 'vitest';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('contains only canonical localized pages and omits the redirecting root', () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      'https://pietrzakprzemyslaw.pl/en',
      'https://pietrzakprzemyslaw.pl/pl',
    ]);
  });
});
