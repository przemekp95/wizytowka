import { isValidEmail, rateLimit } from '../route';

describe('isValidEmail', () => {
  it('true dla poprawnych adresów', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@sub.domain.pl')).toBe(true);
  });
  it('false dla niepoprawnych', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('plainaddress')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('user@@double.at')).toBe(false);

    expect(isValidEmail(123 as any)).toBe(false);
  });
});

describe('rateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.now());
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it('blokuje >5 wywołań w oknie czasu', () => {
    const ip = '203.0.113.7';
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(ip).ok).toBe(true);
    }
    const sixth = rateLimit(ip);
    expect(sixth.ok).toBe(false);
    expect(sixth.retryAfter).toBeGreaterThan(0);
    jest.advanceTimersByTime(10 * 60 * 1000 + 1000);
    expect(rateLimit(ip).ok).toBe(true);
  });
});
