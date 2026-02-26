import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import ContactSection from '@/app/_components/ContactForm';

const contactTranslations = {
  name: 'Imię i nazwisko',
  email: 'E-mail',
  message: 'Wiadomość',
  send: 'Wyślij',
  sending: 'Wysyłanie...',
  success: 'Wiadomość wysłana ✅',
  error: 'Wypełnij wszystkie pola.',
  sendError: 'Błąd wysyłania',
  unknownError: 'Nieznany błąd',
  placeholderName: 'Wpisz swoje pełne imię i nazwisko',
  placeholderEmail: 'Wprowadź swój adres e-mail',
  placeholderMessage: 'Napisz swoją wiadomość tutaj...',
};

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  fetchSpy = vi.spyOn(globalThis, 'fetch');
});

afterAll(() => {
  fetchSpy.mockRestore();
});

afterEach(() => {
  fetchSpy.mockReset();
});

describe('ContactSection', () => {
  it('keeps submit disabled for invalid form', async () => {
    render(<ContactSection locale="pl" translations={contactTranslations} />);

    const submitButton = screen.getByTestId('contact-submit');
    expect(submitButton).toBeDisabled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sukces wysyłki - pokazuje komunikat i czyści dane', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { sendContact: { ok: true, error: null } } }),
    } as Response);

    render(<ContactSection locale="pl" translations={contactTranslations} />);

    const nameInput = screen.getByTestId('contact-name');
    const emailInput = screen.getByTestId('contact-email');
    const messageInput = screen.getByTestId('contact-message');
    const submitButton = screen.getByTestId('contact-submit');

    await userEvent.type(nameInput, 'Jan Testowy');
    await userEvent.type(emailInput, 'jan@test.pl');
    await userEvent.type(messageInput, 'Treść wiadomości testowej');

    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    const successMsg = await screen.findByText(/Wiadomość wysłana/i);
    expect(successMsg).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
    expect(messageInput).toHaveValue('');
  });

  it('błąd wysyłki - renderuje komunikat błędu z backendu', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { sendContact: { ok: false, error: 'Błąd walidacji (GraphQL)' } },
      }),
    } as Response);

    render(<ContactSection locale="pl" translations={contactTranslations} />);

    const nameInput = screen.getByTestId('contact-name');
    const emailInput = screen.getByTestId('contact-email');
    const messageInput = screen.getByTestId('contact-message');
    const submitButton = screen.getByTestId('contact-submit');

    await userEvent.type(nameInput, 'Jan Testowy');
    await userEvent.type(emailInput, 'jan@test.pl');
    await userEvent.type(messageInput, 'To jest poprawna wiadomość testowa.');

    await waitFor(() => expect(submitButton).toBeEnabled());
    fireEvent.click(submitButton);

    const errorMsg = await screen.findByText(/Błąd walidacji \(GraphQL\)/i);
    expect(errorMsg).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
