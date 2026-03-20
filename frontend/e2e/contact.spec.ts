import { test, expect } from '@playwright/test';

test('wysyłanie formularza kontaktowego (onepager)', async ({ page }) => {
  await page.route('**/api/contact', async (route) => {
    const payload = route.request().postDataJSON() as {
      query?: string;
      variables?: { input?: { name?: string; email?: string; message?: string } };
    };

    expect(route.request().url()).toContain('/api/contact');
    expect(payload.query).toContain('sendContact');
    expect(payload.variables?.input).toMatchObject({
      name: 'Jan',
      email: 'jan@test.com',
      message: 'To jest test E2E',
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { sendContact: { ok: true, error: null } } }),
    });
  });

  await page.goto('/en');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.getByText(/Portfolio is temporarily unavailable/i)).toBeVisible();

  const name = page.getByTestId('contact-name');
  const email = page.getByTestId('contact-email');
  const message = page.getByTestId('contact-message');
  const submit = page.getByTestId('contact-submit');
  await expect(submit).toBeVisible();

  await expect(name).toBeVisible();
  await expect(email).toBeVisible();
  await expect(message).toBeVisible();

  await name.fill('Jan');
  await email.fill('jan@test.com');
  await message.fill('To jest test E2E');
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText(/Message sent/i)).toBeVisible();
});
