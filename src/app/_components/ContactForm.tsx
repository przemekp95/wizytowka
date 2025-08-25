// app/_components/ContactForm.tsx

'use client';

export default function ContactForm() {
  return (
    <form className="mt-8 grid gap-4" autoComplete="on" suppressHydrationWarning>
      <div>
        <label className="label">Imię</label>
        <input className="input" placeholder="Twoje imię" autoComplete="given-name" />
      </div>
      <div>
        <label className="label">E-mail</label>
        <input className="input" type="email" placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <label className="label">Wiadomość</label>
        <textarea className="textarea" rows={5} placeholder="Napisz wiadomość..." />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary">Wyślij</button>
        <a href="mailto:kontakt@twojadomena.pl" className="btn btn-ghost">E-mail</a>
      </div>
    </form>
  );
}
