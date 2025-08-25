'use client';

import "@/styles/custom.scss"; // <- SCSS aktywne (zamień na "@/styles/custom.less" jeśli chcesz LESS)
import "@/styles/_mixins.scss"; 
import "@/styles/_variables.scss"; 
import { motion } from "framer-motion";


export default function OnePager() {
return (
<div className="min-h-screen bg-white text-slate-900">
{/* NAV */}
  <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/70 border-b">
    <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
      <a href="#home" className="brand text-xl tracking-tight">Przemysław Pietrzak</a>
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <a className="link" href="#portfolio">Portfolio</a>
        <a className="link" href="#about">O mnie</a>
        <a className="link" href="#contact">Kontakt</a>
      </div>
      <a href="#contact" className="btn btn-primary">Napisz do mnie</a>
    </nav>
  </header>


{/* HERO */}
  <section id="home" className="relative overflow-hidden">
    <div className="absolute inset-0 -z-10 gradient-surface" />
      <div className="mx-auto max-w-6xl px-4 py-24 sm:py-28 lg:py-32">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="heading-hero"
          >
          Prawnik & Developer
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-4 max-w-2xl text-lg text-slate-600"
          >
          Buduję nowoczesne aplikacje webowe (Next.js, Laravel) i systemy AI offline. Łączę warsztat prawniczy z technologią.
        </motion.p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
        <a href="#portfolio" className="btn btn-primary">Zobacz projekty</a>
        <a href="#contact" className="btn btn-ghost">Skontaktuj się</a>
        </div>
      </div>
  </section>


{/* PORTFOLIO */}
<section id="portfolio" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
  <h2 className="section-title">Portfolio</h2>
  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {[
      {
        title: "AI Offline Stack",
        desc: "Ollama + Whisper + WebUI; prywatne przetwarzanie lokalne.",
        tags: ["Docker", "LLM", "Whisper"],
        link: "#",
      },
      {
        title: "CASN Next.js",
        desc: "Migracja strony think-tanku z Laravel na Next.js 15 App Router.",
        tags: ["Next.js", "Prisma", "MySQL"],
        link: "#",
      },
      {
        title: "Panel Kancelarii",
        desc: "System do obsługi klientów kancelarii (sprawy, dokumenty, komunikacja).",
        tags: ["Laravel", "Livewire", "Docker"],
        link: "#",
      },
    ].map((p, i) => (
      <motion.a
        key={p.title}
        href={p.link}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, delay: i * 0.05 }}
        className="card group"
      >
        <div className="thumb">Podgląd</div>
        <h3 className="card-title group-hover:text-indigo-700">{p.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{p.desc}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.tags.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      </motion.a>
    ))}
  </div>
</section>



{/* ABOUT */}
<section id="about" className="bg-slate-50">
<div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 grid gap-10 lg:grid-cols-5 lg:items-center">
<div className="lg:col-span-2">
<div className="avatar" />
</div>
<div className="lg:col-span-3">
<h2 className="section-title">O mnie</h2>
<p className="mt-3 text-slate-700 leading-relaxed">
Jestem prawnikiem specjalizującym się w prawie UE i prawach człowieka oraz developerem budującym nowoczesne aplikacje webowe. Łączę analityczne podejście z inżynierią oprogramowania: Next.js, Laravel, Prisma, Docker oraz integracje z modelami AI.
</p>
<ul className="mt-6 grid gap-3 sm:grid-cols-2">
{["Next.js / React", "Laravel / PHP", "Prisma / SQL", "Docker / CI"].map((i) => (
<li key={i} className="bullet">{i}</li>
))}
</ul>
</div>
</div>
</section>


{/* CONTACT */}
<section id="contact" className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
<h2 className="section-title">Kontakt</h2>
<p className="mt-2 text-slate-600">Napisz wiadomość – odpowiem możliwie szybko.</p>
<form onSubmit={(e) => e.preventDefault()} className="mt-8 grid gap-4">
<div>
<label className="label">Imię</label>
<input className="input" placeholder="Twoje imię" />
</div>
<div>
<label className="label">E‑mail</label>
<input type="email" className="input" placeholder="you@example.com" />
</div>
<div>
<label className="label">Wiadomość</label>
<textarea rows={5} className="textarea" placeholder="Jak mogę pomóc?" />
</div>
<button className="btn btn-primary mt-2">Wyślij</button>
</form>
</section>


{/* FOOTER */}
<footer className="border-t">
<div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
<p>© {new Date().getFullYear()} Przemysław Pietrzak</p>
<div className="flex items-center gap-4">
<a className="link" href="#">GitHub</a>
<a className="link" href="#">LinkedIn</a>
<a className="link" href="#">E‑mail</a>
</div>
</div>
</footer>
</div>
);
}

/*
import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

*/