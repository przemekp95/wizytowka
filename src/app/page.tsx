'use client';

import "@/styles/custom.scss";
import { motion } from "framer-motion";
import Header from "@/app/_components/Header";
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
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden">
              <Image
                src="/images/PP-2-JPG-01.webp"
                alt="Przemysław Pietrzak"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
     <div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
              >
                Next.js & PHP Web Developer
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
                <a href="#portfolio" className="btn btn-ghost border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500">Zobacz projekty</a>
                <a href="#contact" className="btn btn-ghost border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500">Skontaktuj się</a>
              </div>
            </div>


          </div>
        </section>

{/* PORTFOLIO */}
<section id="portfolio" className="py-20 md:py-28">
  <div className="mx-auto max-w-6xl px-4">
    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center">Portfolio</h2>

    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
      {// 1) Dane projektów – dodaj href
[
  {
    title: "CASN Laravel",
    href: "https://casn.przemyslaw-pietrzak.pl", // <— NOWE
    desc: "Stworzyłem aplikację webową w frameworku Laravel dla Centrum Analiz Służby Niepodległej. Wdrożyłem routing, responsywny front (Blade), deploy na hosting. (link prowadzi do zdjętej wersji strony)",
    tags: ["Laravel", "PHP", "Blade", "Github", "Bootstrap"],
    img: "/images/logo.jpg",
    isLogo: true,
    newTech: false,
  },
  {
    title: "CASN Next.js",
    href: "https://casn.pl",
    desc: "Migracja strony think-tanku z Laravel na Next.js 15 App Router.",
    tags: ["Next.js", "Prisma", "MySQL", "Typescript", "Markdown", "Github"],
    img: "/images/logo.jpg",
    isLogo: true,
    newTech: false,
  },
  {
    title: "Mazowieści",
    href: "https://mazowiesci.pl",
    desc:
      "Przeprowadziłem pełną migrację serwisu informacyjnego z WIX do WordPress. Zautomatyzowałem ekstrakcję artykułów z pomocą Python (Scrapy) i zaimportowałem treści do bazy danych WordPress. Stworzyłem niestandardowe skrypty PHP do integracji danych, wdrożyłem politykę optymalizacji SEO, przebudowałem menu i system tagów. Zoptymalizowałem szybkość strony i poprawiłem jej pozycję w Google.",
    tags: ["Python (Scrapy)", "WordPress", "PHP", "HTML", "CSS", "REST API", "SEO"],
    img: "/images/mazo.png",
    isLogo: true,
    newTech: false,
  },
  {
    title: "Strona Wizytówka",
    href: "https://przemyslaw-pietrzak.pl",
    desc: "One-pager w Next.js z Tailwind i Sass.",
    tags: ["Next.js", "Tailwind", "Sass"],
    img: "/images/PP-2-JPG-01.webp",
    isLogo: true,
    newTech: false,
  },
  {
    title: "Fundacja Służba Niepodległej",
    href: "https://sluzbaniepodleglej.pl",
    desc: "Administrowałem i rozwijałem stronę fundacji opartą na WordPress. Wdrażałem nowe podstrony, strategię treści SEO.",
    tags: ["WordPress", "PHP", "CSS", "HTML", "Google Search Console", "SEO"],
    img: "/images/logo-sluzba-niepodleglej.png",
    isLogo: true,
    newTech: false,
  },

      ].map((p) => {
  const imgClasses = p.isLogo ? "object-contain bg-white p-6" : "object-cover";
  return (
<article key={p.title} className="card group flex flex-col h-full text-center">
  {/* MEDIA: stała wysokość = równe karty */}
  <div className="relative overflow-hidden rounded-xl h-64 sm:h-72 lg:h-80">
    <Image
      src={p.img}
      alt={p.title}
      fill
      className={`${imgClasses} transition-transform duration-500 group-hover:scale-[1.02]`}
      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
    />
    {p.newTech && <span className="badge">Nowa technologia</span>}
  </div>

  {/* TYTUŁ */}
<h3 className="mt-4 text-lg font-bold">
  <a
    href={p.href}
    target="_blank"
    rel="noopener noreferrer"
    className="group/link underline-offset-4 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-sm"
  >
    {p.title}
  </a>
</h3>

  {/* OPIS */}
<p className="mt-2 text-sm text-slate-600">
  {p.desc}
</p>
  {/* TECHNOLOGIE */}
  <div className="mt-4">
    <div className="font-semibold text-slate-800">Technologie</div>
    <div className="mt-2 flex flex-wrap justify-center gap-2">
      {p.tags.map((t) => (
        <span key={t} className="chip">{t}</span>
      ))}
    </div>
  </div>
</article>


        );
      })}
    </div>
  </div>
</section>




        {/* ABOUT */}
<section id="about" className="bg-slate-50">
  <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 grid gap-10 lg:grid-cols-5 lg:items-center">
    
    {/* Avatar */}
    <div className="lg:col-span-2 flex justify-center">
      <Image
        src="/portfolio/ai-offline.jpg"   // ścieżka względem public/
        alt="Przemysław Pietrzak"
        width={240}                 // docelowa szerokość
        height={240}                // docelowa wysokość
        className="rounded-full shadow-lg object-cover"
        priority                    // szybsze ładowanie
      />
    </div>

    {/* Tekst */}
    <div className="lg:col-span-3">
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">O mnie</h2>
      <p className="mt-3 text-slate-700 leading-relaxed">
        Jestem developerem budującym nowoczesne aplikacje webowe. Łączę analityczne podejście
        z inżynierią oprogramowania: Next.js, Laravel, Prisma, Docker.
      </p>

      {/* Stack */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Stack technologiczny
        </h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {["Next.js / React", "Laravel / PHP", "Prisma / SQL", "Docker / CI"].map((tech) => (
            <li key={tech} className="bullet">{tech}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
</section>


        {/* CONTACT */}

<section id="contact" className="py-24 bg-gradient-to-b from-white to-slate-50">
  <div className="mx-auto max-w-6xl px-4">
    <h2 className="section-title text-center text-4xl md:text-5xl font-extrabold tracking-tight">Kontakt</h2>
    <p className="mt-2 text-center text-slate-600">Napisz wiadomość – odpowiem możliwie szybko.</p>

    <div className="mt-10 flex justify-center">
      <ContactForm />
    </div>
  </div>
</section>
      </main>

      {/* FOOTER */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Przemysław Pietrzak</p>
          <div className="flex items-center gap-4">
            <a className="link" href="https://github.com/przemekp95">GitHub</a>
            <a className="link" href="https://www.linkedin.com/in/przemyslaw-pietrzak/">LinkedIn</a>
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