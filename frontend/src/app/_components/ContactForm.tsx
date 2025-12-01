'use client';
import { useRef, useState, type FormEvent, useEffect } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const GQL_API = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

// Internal function for loading translations
async function loadTranslations(locale: string, section: string) {
  try {
    const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
    const sectionData = messages[section] || {};
    return sectionData;
  } catch {
    return {};
  }
}

export default function ContactSection() {
  const [status, setStatus] = useState<Status>('idle');
  const [err, setErr] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadContactTranslations = async () => {
      const locale = document.querySelector('#i18n-provider')?.getAttribute('data-locale') || 'pl';
      const contactTranslations = await loadTranslations(locale, 'contact');
      setTranslations(contactTranslations);
    };

    loadContactTranslations();
  }, []);

  // render occurs immediately; no loading guard
  const t = (key: string) =>
    translations[key] ??
    {
      name: 'Imię i nazwisko',
      email: 'E-mail',
      message: 'Wiadomość',
      send: 'Wyślij',
      sending: 'Wysyłanie...',
      success: 'Wiadomość wysłana ✅',
      error: 'Uzupełnij wszystkie pola.',
      sendError: 'Błąd wysyłki',
      unknownError: 'Nieznany błąd',
    }[key] ??
    key;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current || status === 'sending') return;

    setStatus('sending');
    setErr('');

    try {
      const fd = new FormData(formRef.current);

      const website = String(fd.get('website') ?? '');
      if (website.trim() !== '') {
        setStatus('sent');
        formRef.current.reset();
        return;
      }

      const input = {
        name: String(fd.get('name') ?? '').trim(),
        email: String(fd.get('email') ?? '').trim(),
        message: String(fd.get('message') ?? '').trim(),
        hcaptchaToken: '',
      };

      if (!input.name || !input.email || !input.message) {
        throw new Error(t('error'));
      }

      const query = `
        mutation SendContact($input: ContactMessageInput!) {
          sendContact(input: $input) {
            ok
            error
          }
        }
      `;

      const r = await fetch(GQL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { input } }),
        cache: 'no-store',
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok || j?.errors || j?.data?.sendContact?.ok === false) {
        throw new Error(j?.data?.sendContact?.error || j?.errors?.[0]?.message || t('sendError'));
      }

      setStatus('sent');
      formRef.current.reset();
    } catch (e) {
      setStatus('error');
      setErr(e instanceof Error ? e.message : t('unknownError'));
    } finally {
      // Keep status visible for tests; do not auto-hide
    }
  };

  return (
    <form
      ref={formRef}
      className="w-full max-w-xl space-y-4"
      onSubmit={onSubmit}
      noValidate
      aria-busy={status === 'sending'}
      suppressHydrationWarning
    >
      <div>
        <label className="block text-sm font-medium" htmlFor="name">
          {t('name')}{' '}
          <span className="text-red-500" aria-label="wymagane">
            *
          </span>
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="given-name"
          aria-describedby="name-error"
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          suppressHydrationWarning
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          {t('email')}{' '}
          <span className="text-red-500" aria-label="wymagane">
            *
          </span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          aria-describedby="email-error"
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          suppressHydrationWarning
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="message">
          {t('message')}{' '}
          <span className="text-red-500" aria-label="wymagane">
            *
          </span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          maxLength={5000}
          aria-describedby="message-error"
          data-testid="contact-message"
          className="w-full border rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          suppressHydrationWarning
        />
        <p id="message-char-count" className="text-xs text-gray-500 mt-1" aria-live="polite">
          Maksymalnie 5000 znaków
        </p>
      </div>

      {/* honeypot */}
      <input
        type="text"
        name="website"
        className="hidden"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        suppressHydrationWarning
      />

      <div className="flex justify-center" role="group" aria-labelledby="submit-section">
        <span id="submit-section" className="sr-only">
          Akcje formularza
        </span>
        <button
          type="submit"
          data-testid="contact-submit"
          disabled={status === 'sending'}
          aria-describedby={status === 'sending' ? 'submit-description' : undefined}
          className="inline-flex items-center px-4 py-3 rounded-xl font-semibold border focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
        >
          {status === 'sending' ? t('sending') : t('send')}
        </button>
      </div>

      {status === 'sending' && (
        <p
          id="submit-description"
          className="text-sm text-gray-600 text-center"
          aria-live="assertive"
        >
          Wysyłanie wiadomości...
        </p>
      )}

      {/* Status announcements */}
      <div aria-live="polite" aria-atomic="true" role="status">
        {status === 'error' && (
          <div role="alert" aria-describedby="error-description" className="text-center">
            <p id="error-description" className="text-sm text-red-600">
              {err}
            </p>
          </div>
        )}
        {status === 'sent' && (
          <div role="alert" aria-describedby="success-description" className="text-center">
            <p
              id="success-description"
              data-testid="contact-success"
              className="text-sm text-green-700"
            >
              {t('success')}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
