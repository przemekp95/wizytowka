import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '@/app/_components/ContactForm';
import { vi } from 'vitest';

beforeAll(() => {
  // Podmiana fetch dla testów
  const g = globalThis as unknown as { fetch: ReturnType<typeof vi.fn> };
  g.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('walidacja pól - pokazuje błąd dla pustego formularza', async () => {
  render(<ContactForm />);
  const submitBtn = screen.getByRole('button', { name: /wyślij/i });
  fireEvent.click(submitBtn);
  const errorMsg = await screen.findByText(/uzupełnij wszystkie pola/i);
  expect(errorMsg).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});

test('sukces wysyłki - pokazuje komunikat i czyści dane', async () => {
  render(<ContactForm />);
  await userEvent.type(screen.getByLabelText(/Imię i nazwisko/i), 'Jan Testowy');
  await userEvent.type(screen.getByLabelText(/E-mail/i), 'jan@test.pl');
  await userEvent.type(screen.getByLabelText(/Wiadomość/i), 'Treść wiadomości testowej');

  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true }),
  });

  fireEvent.click(screen.getByRole('button', { name: /wyślij/i }));

  const successMsg = await screen.findByText(/Wiadomość wysłana/i);
  expect(successMsg).toBeInTheDocument();
  expect(screen.getByLabelText(/E-mail/i)).toHaveValue('');
});
