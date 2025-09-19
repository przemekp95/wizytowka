import { test, expect } from '@playwright/test';

test('wysyłanie formularza kontaktowego (onepager)', async ({ page }) => {
  // Onepager → startujemy z /
  await page.goto('/');

  // Spróbuj przewinąć do sekcji "Kontakt"
  const kontaktHeading = page.getByRole('heading', { name: /kontakt/i });
  if ((await kontaktHeading.count()) > 0) {
    await kontaktHeading.first().scrollIntoViewIfNeeded();
  } else {
    const anchor = page.locator('a[href="#kontakt"]');
    if ((await anchor.count()) > 0) await anchor.first().click();
  }

  // Zmockuj backend (GraphQL i/lub Next API), żeby UI mógł pokazać sukces
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

  // Pola po etykietach z Twojego DOM
  const name = page.getByLabel(/Imię i nazwisko/i);
  const email = page.getByLabel(/E-?mail/i); // obsłuży "E-mail" i "Email"
  const message = page.getByLabel(/Wiadomość/i);
  const submit = page.getByRole('button', { name: /Wyślij/i });

  await expect(name).toBeVisible();
  await expect(email).toBeVisible();
  await expect(message).toBeVisible();

  await name.fill('Jan');
  await email.fill('jan@test.com');
  await message.fill('To jest test E2E');
  await submit.click();

  // Dopasuj do realnego komunikatu w UI, jeśli inny
  await expect(page.getByText(/Wiadomość wysłana/i)).toBeVisible();
});
