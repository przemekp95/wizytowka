'use client';

import { useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errText, setErrText] = useState("");
  const hcaptchaRef = useRef<HCaptcha>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    setErrText("");

    // zamiast wysyłać od razu → odpal captcha
    hcaptchaRef.current?.execute();
  };

  const handleVerify = async (token: string) => {
    try {
      // zbierz dane z formularza
      const form = document.querySelector("form") as HTMLFormElement;
      const fd = new FormData(form);

      const payload = {
        name: fd.get("name"),
        email: fd.get("email"),
        message: fd.get("message"),
        captchaToken: token,
      };

      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data?.error || "Email send failed");

      form.reset();
      hcaptchaRef.current?.resetCaptcha();
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err: unknown) {
  const msg = err instanceof Error ? err.message : "Unknown error";
  setStatus("error");
  setErrText(msg);
}

  };

  return (
    <form className="contact-card" onSubmit={handleSubmit} noValidate>
      {/* hCaptcha (invisible) */}
      <HCaptcha
        ref={hcaptchaRef}
        sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
        size="invisible"
        onVerify={handleVerify}
        onError={() => {
          setStatus("error");
          setErrText("Captcha error");
        }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="field-floating">
          <input id="name" name="name" type="text" placeholder="Imię i nazwisko" className="input-floating peer border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" required />
          <label htmlFor="name" className="label-floating"></label>
        </div>
        <div className="field-floating">
          <input id="email" name="email" type="email" placeholder="E-mail" className="input-floating peer border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" required />
          <label htmlFor="email" className="label-floating"></label>
        </div>
      </div>

      <div className="field-floating mt-6">
        <textarea id="message" name="message" placeholder="Wiadomość" rows={6} className="input-floating peer resize-none w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" required />
        <label htmlFor="message" className="label-floating"></label>
      </div>

      <div className="flex flex-col items-center">
        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-8 w-full sm:w-auto rounded-xl px-6 py-3 font-semibold text-white bg-black shadow-lg transition duration-200 hover:bg-slate-800 hover:scale-105 disabled:opacity-50"
        >
          {status === "sending" ? "Wysyłanie…" : "Wyślij wiadomość"}
        </button>

        <p className="mt-4 text-sm" aria-live="polite" role="status">
          {status === "sent" && <span className="text-green-600">✅ Wiadomość wysłana!</span>}
          {status === "error" && (
            <span className="text-red-600">
              ❌ Błąd – spróbuj ponownie.
              <span className="block text-xs opacity-70 mt-1">{errText}</span>
            </span>
          )}
        </p>
      </div>
    </form>
  );
}
