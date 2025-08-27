"use client";
import { useRef, useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactSection() {
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current || status === "sending") return;

    setStatus("sending");
    setErr("");

    try {
      const fd = new FormData(formRef.current);

      // honeypot
      const website = String(fd.get("website") ?? "");
      if (website.trim() !== "") {
        setStatus("sent");
        formRef.current.reset();
        return;
      }

      const payload = {
        name: String(fd.get("name") ?? "").trim(),
        email: String(fd.get("email") ?? "").trim(),
        message: String(fd.get("message") ?? "").trim(),
        website: "",
      };

      if (!payload.name || !payload.email || !payload.message) {
        throw new Error("Uzupełnij wszystkie pola.");
      }

      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.ok === false) {
        throw new Error(j?.error || "Błąd wysyłki");
      }

      setStatus("sent");
      formRef.current.reset();
    } catch (e) {
      setStatus("error");
      setErr(e instanceof Error ? e.message : "Nieznany błąd");
    } finally {
      setTimeout(() => setStatus("idle"), 1500);
    }
  };

  return (
    <form
      ref={formRef}
      className="w-full max-w-xl space-y-4"
      onSubmit={onSubmit}
      action="/api/contact"   // fallback gdy JS się nie załaduje
      method="POST"
      noValidate
      aria-busy={status === "sending"}
    >
      <div>
        <label className="block text-sm font-medium">Imię i nazwisko</label>
        <input
          name="name"
          required
          autoComplete="name"
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">E-mail</label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Wiadomość</label>
        <textarea
          name="message"
          rows={5}
          required
          maxLength={5000}
          className="w-full border rounded-lg px-3 py-2 resize-none"
        />
      </div>

      {/* honeypot (ukryte pole dla botów) */}
      <input
        type="text"
        name="website"
        className="hidden"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
      />

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center px-4 py-3 rounded-xl font-semibold border"
      >
        {status === "sending" ? "Wysyłanie..." : "Wyślij"}
      </button>

      {status === "error" && <p className="text-sm text-red-600">{err}</p>}
      {status === "sent" && <p className="text-sm text-green-700">Wiadomość wysłana ✅</p>}
    </form>
  );
}
