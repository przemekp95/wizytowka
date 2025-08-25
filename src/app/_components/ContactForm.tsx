'use client';

import { useEffect, useRef, useState } from 'react';

type HCaptchaSize = 'invisible' | 'normal' | 'compact';
type HCaptchaTheme = 'light' | 'dark';
type HCaptchaRenderOptions = {
  sitekey: string;
  size?: HCaptchaSize;
  theme?: HCaptchaTheme;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
};

declare global {
  interface Window {
    hcaptcha?: {
      render: (el: string | HTMLElement, opts: HCaptchaRenderOptions) => number;
      execute: (id?: number) => void;
      reset: (id?: number) => void;
    };
  }
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

const CAPTCHA_ENABLED = process.env.NEXT_PUBLIC_CAPTCHA_ENABLED === '1';
const SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY!; // używane tylko gdy CAPTCHA_ENABLED

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [err, setErr] = useState('');
  const widgetIdRef = useRef<number | null>(null);
  const resolverRef = useRef<((t: string) => void) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(!CAPTCHA_ENABLED); // jeśli captcha off → od razu "ready"

  // Ładuj skrypt hCaptcha tylko gdy włączona
  useEffect(() => {
    if (!CAPTCHA_ENABLED) return;
    if (window.hcaptcha) {
      setScriptReady(true);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://js.hcaptcha.com/1/api.js?hl=pl';
    s.async = true;
    s.defer = true;
    s.onload = () => setScriptReady(true);
    document.head.appendChild(s);
  }, []);

  // Renderuj widget tylko gdy włączona
  useEffect(() => {
    if (!CAPTCHA_ENABLED) return;
    if (!scriptReady || !containerRef.current || !window.hcaptcha) return;
    if (widgetIdRef.current !== null) return;
    widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
      sitekey: SITEKEY,
      size: 'invisible',
      callback: (token: string) => {
        resolverRef.current?.(token);
        resolverRef.current = null;
      },
      'error-callback': () => {
        setErr('Captcha error');
        setStatus('error');
      },
    });
  }, [scriptReady]);

  function getCaptchaToken(): Promise<string | null> {
    if (!CAPTCHA_ENABLED) return Promise.resolve(null);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (window.hcaptcha && widgetIdRef.current !== null) {
        window.hcaptcha.execute(widgetIdRef.current);
      }
    });
  }

const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const form = e.currentTarget; // <— ZŁAPIEMY REFERENCJĘ NA STARcie
  setStatus('sending');
  setErr('');

  try {
    const fd = new FormData(form);
    const token = await getCaptchaToken();

    const r = await fetch('/contact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        message: fd.get('message'),
        ...(CAPTCHA_ENABLED ? { captchaToken: token } : {}),
        website: '',
      }),
    });

    const data: { ok?: boolean; error?: string } = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || 'Send failed');

    setStatus('sent');
    form.reset(); // <— UŻYWAMY ZŁAPANEJ REFERENCJI
    if (CAPTCHA_ENABLED && window.hcaptcha && widgetIdRef.current !== null) {
      window.hcaptcha.reset(widgetIdRef.current);
    }
    setTimeout(() => setStatus('idle'), 4000);
  } catch (er: unknown) {
    setErr(er instanceof Error ? er.message : 'Błąd');
    setStatus('error');
  }
};


  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Kontener dla hCaptcha tylko gdy włączona */}
      {CAPTCHA_ENABLED && <div ref={containerRef} className="hidden" />}

      {/* honeypot */}
      <div className="hidden">
        <input type="text" name="website" autoComplete="off" />
      </div>

      <input name="name" required placeholder="Imię i nazwisko" className="w-full border rounded px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500" />
      <input name="email" type="email" required placeholder="E-mail" className="w-full border rounded px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500" />
      <textarea name="message" required placeholder="Wiadomość" className="w-full border rounded px-3 py-2 h-32 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500" />

<div className="text-center mt-6">

      <button
        type="submit"
        disabled={status === 'sending' || !scriptReady}
        className="btn btn-ghost border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
      >
        {status === 'sending' ? 'Wysyłanie…' : 'Wyślij'}
      </button>
</div>

      {status === 'error' && <p className="text-red-600">{err}</p>}
      {status === 'sent' && <p className="text-green-600">Wiadomość wysłana!</p>}
    </form>
  );
}
