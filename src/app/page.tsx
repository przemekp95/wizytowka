'use client';

import "@/styles/custom.scss";
import { motion } from "framer-motion";
import Header from "@/app/_components/Header";
import "@/styles/custom.scss";
import Image from "next/image";



import dynamic from "next/dynamic";
const ContactForm = dynamic(() => import("@/app/_components/ContactForm"), { ssr: false });


export default function OnePager() {
  return (
    <>
      {/* NAV */}
      <Header />



      <main className="pt-14 bg-white text-slate-900">
        {/* HERO */}
        <section id="home" className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white">
          <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-2xl bg-indigo-200/60 blur-xl" />
          <div className="absolute -top-8 -right-8 h-28 w-28 rounded-2xl bg-fuchsia-200/60 blur-xl" />
          <div className="mx-auto max-w-6xl px-4 py-24 md:py-32 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
              >
                Prawnik & Web Developer
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="mt-5 max-w-prose text-lg text-slate-600"
              >
                Buduję nowoczesne aplikacje webowe (Next.js, Laravel) i systemy AI offline. Łączę warsztat prawniczy z technologią.
              </motion.p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#portfolio" className="btn btn-primary">Zobacz projekty</a>
                <a href="#contact" className="btn btn-ghost">Skontaktuj się</a>
              </div>
            </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
              <Image
                src="/images/ja.jpeg"
                alt="Przemysław Pietrzak"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>
          </div>
        </section>
        {/* PORTFOLIO */}
        <section id="portfolio" className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="section-title">Portfolio</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28 grid gap-10 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-2">
              <div className="avatar" />
            </div>
            <div className="lg:col-span-3">
              <h2 className="section-title">O mnie</h2>
              <p className="mt-4 text-slate-700 leading-7">
                Jestem prawnikiem specjalizującym się w prawie UE i prawach człowieka oraz developerem budującym nowoczesne aplikacje webowe. 
                Łączę analityczne podejście z inżynierią oprogramowania: Next.js, Laravel, Prisma, Docker oraz integracje z modelami AI.
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
                {["Next.js / React", "Laravel / PHP", "Prisma / SQL", "Docker / CI"].map((i) => (
                  <li key={i} className="bullet">{i}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CONTACT */}

        <section id="contact" className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="section-title">Kontakt</h2>
            <ContactForm />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Przemysław Pietrzak</p>
          <div className="flex items-center gap-4">
            <a className="link" href="#">GitHub</a>
            <a className="link" href="#">LinkedIn</a>
            <a className="link" href="#">E-mail</a>
          </div>
        </div>
      </footer>

    </>
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