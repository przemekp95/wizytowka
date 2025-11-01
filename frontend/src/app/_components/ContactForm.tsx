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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadContactTranslations = async () => {
      const locale = document.querySelector('#i18n-provider')?.getAttribute('data-locale') || 'pl';
      const contactTranslations = await loadTranslations(locale, 'contact');
      setTranslations(contactTranslations);
      setLoading(false);
    };

    loadContactTranslations();
  }, []);

  // render occurs immediately; no loading guard
  const t = (key: string) =>
    translations[key] ?? ({
      name: 'Imię i nazwisko',
      email: 'E-mail',
      message: 'Wiadomość',
      send: 'Wyślij',
      sending: 'Wysyłanie...',
      success: 'Wiadomość wysłana ✅',
      error: 'Uzupełnij wszystkie pola.',
      sendError: 'Błąd wysyłki',
      unknownError: 'Nieznany błąd'
    }[key] ?? key);

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
          {t('name')}
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          data-testid="contact-name"
          className="w-full border rounded-lg px-3 py-2"
          suppressHydrationWarning
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          {t('email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          className="w-full border rounded-lg px-3 py-2"
          suppressHydrationWarning
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="message">
          {t('message')}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          maxLength={5000}
          data-testid="contact-message"
          className="w-full border rounded-lg px-3 py-2 resize-none"
          suppressHydrationWarning
        />
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

      <div className="flex justify-center">
        <button
          type="submit"
          data-testid="contact-submit"
          disabled={status === 'sending'}
          className="inline-flex items-center px-4 py-3 rounded-xl font-semibold border"
        >
          {status === 'sending' ? t('sending') : t('send')}
        </button>
      </div>

      {status === 'error' && <p className="text-sm text-red-600">{err}</p>}
      {status === 'sent' && (
        <p data-testid="contact-success" className="text-sm text-green-700" aria-live="polite">{t('success')}</p>
      )}
    </form>
  );
}
