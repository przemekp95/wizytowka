'use client';
import { useRef, useState, type FormEvent } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const GQL_API = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

export default function ContactSection() {
  const [status, setStatus] = useState<Status>('idle');
  const [err, setErr] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current || status === 'sending') return;

    setStatus('sending');
    setErr('');

    try {
      const fd = new FormData(formRef.current);

      // honeypot
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
        hcaptchaToken: '', // ⬅️ zostawiamy placeholder, integracja później
      };

      if (!input.name || !input.email || !input.message) {
        throw new Error('Uzupełnij wszystkie pola.');
      }

      // GraphQL mutation
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
        throw new Error(j?.data?.sendContact?.error || j?.errors?.[0]?.message || 'Błąd wysyłki');
      }

      setStatus('sent');
      formRef.current.reset();
    } catch (e) {
      setStatus('error');
      setErr(e instanceof Error ? e.message : 'Nieznany błąd');
    } finally {
      setTimeout(() => setStatus('idle'), 1500);
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
          Imię i nazwisko
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className="w-full border rounded-lg px-3 py-2"
          suppressHydrationWarning
        />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          E-mail
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
          Wiadomość
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          maxLength={5000}
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
          disabled={status === 'sending'}
          className="inline-flex items-center px-4 py-3 rounded-xl font-semibold border"
        >
          {status === 'sending' ? 'Wysyłanie...' : 'Wyślij'}
        </button>
      </div>

      {status === 'error' && <p className="text-sm text-red-600">{err}</p>}
      {status === 'sent' && <p className="text-sm text-green-700">Wiadomość wysłana ✅</p>}
    </form>
  );
}
