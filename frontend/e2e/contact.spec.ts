import { test, expect } from '@playwright/test';

test('wysyłanie formularza kontaktowego (onepager)', async ({ page }) => {
  await page.goto('/');

  const kontaktHeading = page.getByRole('heading', { name: /kontakt/i });
  if ((await kontaktHeading.count()) > 0) {
    await kontaktHeading.first().scrollIntoViewIfNeeded();
  } else {
    const anchor = page.locator('a[href="#kontakt"]');
    if ((await anchor.count()) > 0) await anchor.first().click();
  }

  await page.route('**/*graphql*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { createMessage: { id: '1' } } }),
    })
  );
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    })
  );

  const name = page.getByTestId('contact-name');
  const email = page.getByLabel(/E-?mail/i); // obsłuży "E-mail" i "Email"
  const message = page.getByTestId('contact-message');
  const submit = page.getByTestId('contact-submit');
  await expect(submit).toBeVisible();
  await expect(submit).toBeEnabled();

  await expect(name).toBeVisible();
  await expect(email).toBeVisible();
  await expect(message).toBeVisible();

  await name.fill('Jan');
  await email.fill('jan@test.com');
  await message.fill('To jest test E2E');
  await submit.click({ timeout: 120000, force: true });

  const _success = page.getByTestId('contact-success');
  await _success.waitFor({ state: 'visible', timeout: 60000 });
  await expect(_success).toBeVisible();
});
