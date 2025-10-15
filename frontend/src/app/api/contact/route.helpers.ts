const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minut
const RATE_LIMIT_MAX = 5;

type RateInfo = { count: number; firstRequest: number };
const requests = new Map<string, RateInfo>();

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function rateLimit(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry) {
    requests.set(ip, { count: 1, firstRequest: now });
    return { ok: true };
  }

  if (now - entry.firstRequest > RATE_LIMIT_WINDOW) {
    requests.set(ip, { count: 1, firstRequest: now });
    return { ok: true };
  }

  if (entry.count < RATE_LIMIT_MAX) {
    entry.count++;
    return { ok: true };
  }

  const retryAfter = RATE_LIMIT_WINDOW - (now - entry.firstRequest);
  return { ok: false, retryAfter };
}
