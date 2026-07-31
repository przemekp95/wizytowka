import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const appBaseUrl = process.env.E2E_BASE_URL ?? '';

test('localized metadata and accessible chat controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const response = await page.goto(`${appBaseUrl}/en`);
  const policy = response?.headers()['content-security-policy'];

  expect(policy).toContain("script-src 'self' 'nonce-");
  expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  await expect(page.locator('script[nonce]').first()).toBeAttached();

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://pietrzakprzemyslaw.pl/en'
  );
  await expect(page.locator('link[rel="alternate"][hreflang="pl"]')).toHaveAttribute(
    'href',
    'https://pietrzakprzemyslaw.pl/pl'
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    'href',
    'https://pietrzakprzemyslaw.pl/en'
  );
  await expect(page.locator('body')).not.toHaveClass(/custom-cursor-active/);

  const openChat = page.getByRole('button', { name: /open chat with ai assistant/i });
  await openChat.click();
  await expect(page.getByRole('dialog', { name: /ai assistant/i })).toBeVisible();
  await expect(page.getByRole('log')).toHaveAttribute('aria-live', 'polite');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(openChat).toBeFocused();
});

test('mobile navigation exposes its expanded state', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${appBaseUrl}/pl`);

  const menuButton = page.getByRole('button', { name: /toggle mobile menu/i });
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await menuButton.click();
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mobile-navigation')).toBeVisible();
});

test('localized desktop and mobile pages have no automated WCAG A/AA violations', async ({
  page,
}) => {
  for (const scenario of [
    { locale: 'en', width: 1440, height: 900 },
    { locale: 'pl', width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.goto(`${appBaseUrl}/${scenario.locale}`);

    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(scan.violations, `${scenario.locale} ${scenario.width}px`).toEqual([]);
  }
});
