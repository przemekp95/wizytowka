import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeAll, afterEach, describe, it, expect } from 'vitest';
import ContactSection from '@/app/_components/ContactForm';

beforeAll(() => {
  vi.spyOn(globalThis, 'fetch');
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('ContactSection', () => {
  it('walidacja pól - pokazuje błąd dla pustego formularza', async () => {
    render(<ContactSection />);
    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }));
    const errorMsg = await screen.findByText(/uzupełnij wszystkie pola/i);
    expect(errorMsg).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sukces wysyłki - pokazuje komunikat i czyści dane', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { sendContact: { ok: true, error: null } } }),
    });

    render(<ContactSection />);
    await userEvent.type(screen.getByLabelText(/Imię i nazwisko/i), 'Jan Testowy');
    await userEvent.type(screen.getByLabelText(/E-mail/i), 'jan@test.pl');
    await userEvent.type(screen.getByLabelText(/Wiadomość/i), 'Treść wiadomości testowej');

    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }));

    const successMsg = await screen.findByText(/Wiadomość wysłana/i);
    expect(successMsg).toBeInTheDocument();

    expect(screen.getByLabelText(/Imię i nazwisko/i)).toHaveValue('');
    expect(screen.getByLabelText(/E-mail/i)).toHaveValue('');
    expect(screen.getByLabelText(/Wiadomość/i)).toHaveValue('');
  });

  it('błąd wysyłki - renderuje komunikat błędu z backendu', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { sendContact: { ok: false, error: 'Błąd walidacji (GraphQL)' } },
      }),
    });

    render(<ContactSection />);
    await userEvent.type(screen.getByLabelText(/Imię i nazwisko/i), 'A'); 
    await userEvent.type(screen.getByLabelText(/E-mail/i), 'x@x.pl');
    await userEvent.type(screen.getByLabelText(/Wiadomość/i), 'krótka');

    fireEvent.click(screen.getByRole('button', { name: /wyślij/i }));

    const errorMsg = await screen.findByText(/Błąd walidacji \(GraphQL\)/i);
    expect(errorMsg).toBeInTheDocument();
  });
});
