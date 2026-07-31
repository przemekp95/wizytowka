import { expect, test } from '@playwright/test';

const appBaseUrl = process.env.E2E_BASE_URL ?? '';

test('localized metadata and accessible chat controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${appBaseUrl}/en`);

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
